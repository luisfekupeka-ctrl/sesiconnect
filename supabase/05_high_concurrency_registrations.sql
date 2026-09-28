-- Create high-concurrency event registrations schema

CREATE TABLE IF NOT EXISTS public.sesi_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    total_capacity INT NOT NULL,
    available_seats INT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevents available seats from dropping below 0 mathematically
    CONSTRAINT check_available_seats_non_negative CHECK (available_seats >= 0),
    CONSTRAINT check_available_seats_limit CHECK (available_seats <= total_capacity)
);

CREATE TABLE IF NOT EXISTS public.sesi_event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.sesi_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'confirmed',
    idempotency_key UUID NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevents double registration for the same event and user
    CONSTRAINT unique_event_user_registration UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.sesi_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesi_event_registrations ENABLE ROW LEVEL SECURITY;

-- Policies for events
CREATE POLICY "Events are viewable by everyone" ON public.sesi_events
    FOR SELECT USING (true);

-- Allow super_admin to manage events
CREATE POLICY "Admins can insert events" ON public.sesi_events
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );
CREATE POLICY "Admins can update events" ON public.sesi_events
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );
CREATE POLICY "Admins can delete events" ON public.sesi_events
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Policies for registrations
CREATE POLICY "Users can view their own registrations" ON public.sesi_event_registrations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all registrations" ON public.sesi_event_registrations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- RPC for atomic registration (High Concurrency)
CREATE OR REPLACE FUNCTION public.realizar_inscricao(
    p_event_id UUID,
    p_user_id UUID,
    p_idempotency_key UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- executes with privileges of the creator
AS $$
DECLARE
    v_available_seats INT;
    v_status VARCHAR;
BEGIN
    -- 1. Check idempotency first (if already processed, return success immediately to avoid error on retry)
    IF EXISTS (SELECT 1 FROM public.sesi_event_registrations WHERE idempotency_key = p_idempotency_key) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Inscrição já realizada anteriormente com esta chave.');
    END IF;

    -- 2. Lock the event row for update to prevent concurrent race conditions
    -- This means if 100 requests hit this simultaneously, they will be queued at the DB level here
    SELECT available_seats, status INTO v_available_seats, v_status
    FROM public.sesi_events
    WHERE id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Evento não encontrado.');
    END IF;

    IF v_status != 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Evento não está aberto para inscrições.');
    END IF;

    IF v_available_seats <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Vagas esgotadas.');
    END IF;

    -- 3. Check if user is already registered to avoid unique constraint violation error throwing ungracefully
    IF EXISTS (SELECT 1 FROM public.sesi_event_registrations WHERE event_id = p_event_id AND user_id = p_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuário já inscrito neste evento.');
    END IF;

    -- 4. Decrement seats
    UPDATE public.sesi_events
    SET available_seats = available_seats - 1
    WHERE id = p_event_id;

    -- 5. Insert registration
    INSERT INTO public.sesi_event_registrations (event_id, user_id, idempotency_key)
    VALUES (p_event_id, p_user_id, p_idempotency_key);

    -- 6. Commit happens automatically at the end of the block in PL/pgSQL
    RETURN jsonb_build_object('success', true, 'message', 'Inscrição realizada com sucesso!');
EXCEPTION WHEN unique_violation THEN
    -- Fallback in case idempotency or unique constraints were hit exactly at the same millisecond
    RETURN jsonb_build_object('success', false, 'error', 'Conflito de inscrição. Tente novamente.');
END;
$$;
