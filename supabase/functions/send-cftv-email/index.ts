import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { tipo, email, destinatario, codigo, nome, protocolo, status, parecer, cameras } = payload;
    const targetEmail = email || destinatario;

    if (!targetEmail) {
      return new Response(
        JSON.stringify({ error: 'E-mail destinatário não informado.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CFTV Email Dispatch] Tipo: ${tipo || 'otp'}, Destino: ${targetEmail}`);

    // Obter API Key do Resend ou serviço de email configurado no ambiente
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const senderEmail = Deno.env.get('CFTV_SENDER_EMAIL') || 'SESI Connect <onboarding@resend.dev>';

    let subject = 'SESI Connect - Segurança CFTV';
    let htmlContent = '';

    if (tipo === 'aprovacao_acesso') {
      subject = '✅ Seu acesso ao Portal de Câmeras CFTV foi APROVADO - SESI Connect';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #ef4444; margin: 0; font-size: 24px; font-weight: bold;">SESI CONNECT</h1>
            <p style="color: #94a3b8; margin-top: 4px; font-size: 14px;">Controle de Segurança e Imagens CFTV</p>
          </div>
          <div style="background-color: #1e293b; padding: 24px; border-radius: 8px; border: 1px solid #334155;">
            <h2 style="color: #10b981; margin-top: 0; font-size: 18px;">Acesso Aprovado pela Direção!</h2>
            <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6;">
              Olá, <strong>${nome || 'Colaborador'}</strong>,
            </p>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              Seu cadastro para solicitação de imagens de segurança (CFTV) foi <strong>aprovado pelo Super Administrador</strong>.
            </p>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              Agora você já pode registrar novas solicitações de análise de gravação e acompanhar os laudos de ocorrências.
            </p>
            <div style="margin-top: 24px; text-align: center;">
              <a href="https://sesiconnect.vercel.app/cameras" style="background-color: #ef4444; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Acessar Portal de Câmeras
              </a>
            </div>
          </div>
          <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 24px;">
            Mensagem automática gerada pelo sistema SESI Connect. Por favor, não responda a este e-mail.
          </p>
        </div>
      `;
    } else if (tipo === 'devolutiva_chamado') {
      subject = `📋 Devolutiva da Solicitação ${protocolo || 'CFTV'} - Status: ${status || 'Atualizado'}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #ef4444; margin: 0; font-size: 24px; font-weight: bold;">SESI CONNECT</h1>
            <p style="color: #94a3b8; margin-top: 4px; font-size: 14px;">Laudo e Devolutiva de Solicitação CFTV</p>
          </div>
          <div style="background-color: #1e293b; padding: 24px; border-radius: 8px; border: 1px solid #334155;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 16px;">
              <span style="color: #94a3b8; font-size: 13px;">Protocolo: <strong style="color: #f8fafc; font-family: monospace;">${protocolo}</strong></span>
              <span style="background-color: #3b82f6; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;">${status}</span>
            </div>
            <p style="color: #e2e8f0; font-size: 15px;">Olá, <strong>${nome || 'Solicitante'}</strong>,</p>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              A equipe de segurança e monitoramento atualizou o status da sua solicitação de imagens.
            </p>
            <div style="background-color: #0f172a; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">Parecer Técnico da Análise:</p>
              <p style="margin: 0; color: #f1f5f9; font-size: 14px; line-height: 1.5;">${parecer || 'Análise concluída pela equipe técnica.'}</p>
              ${cameras ? `<p style="margin-top: 10px; font-size: 12px; color: #38bdf8;"><strong>Câmeras Analisadas:</strong> ${cameras}</p>` : ''}
            </div>
            <div style="margin-top: 24px; text-align: center;">
              <a href="https://sesiconnect.vercel.app/cameras" style="background-color: #3b82f6; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Ver Detalhes e Baixar PDF
              </a>
            </div>
          </div>
          <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 24px;">
            SESI Connect - Sistema Integrado de Ocorrências e Segurança Escolar
          </p>
        </div>
      `;
    } else {
      // Padrão: Código OTP de Acesso
      subject = `🔐 Seu Código de Acesso ao Portal CFTV: ${codigo}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #ef4444; margin: 0; font-size: 24px; font-weight: bold;">SESI CONNECT</h1>
            <p style="color: #94a3b8; margin-top: 4px; font-size: 14px;">Verificação de Segurança - Solicitação de Câmeras</p>
          </div>
          <div style="background-color: #1e293b; padding: 24px; border-radius: 8px; border: 1px solid #334155; text-align: center;">
            <p style="color: #e2e8f0; font-size: 15px; margin-bottom: 20px;">
              Utilize o código de segurança abaixo para confirmar sua identidade e acessar o portal:
            </p>
            <div style="display: inline-block; background-color: #0f172a; border: 2px solid #ef4444; padding: 16px 36px; border-radius: 10px; margin: 8px 0 20px 0;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #ffffff;">
                ${codigo}
              </span>
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 12px;">
              ⏱️ Este código expira em <strong>15 minutos</strong>.
            </p>
            <p style="color: #64748b; font-size: 12px; margin-top: 16px;">
              Se você não solicitou este acesso, ignore esta mensagem. Não compartilhe este código com ninguém.
            </p>
          </div>
          <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 24px;">
            SESI Connect - Todos os direitos reservados.
          </p>
        </div>
      `;
    }

    // Se Resend API key estiver configurada
    if (resendApiKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [targetEmail],
          subject,
          html: htmlContent,
        }),
      });

      const resData = await resendRes.json();
      return new Response(JSON.stringify({ success: true, provider: 'resend', data: resData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Retorno com sucesso
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código processado com sucesso.',
        email: targetEmail,
        tipo: tipo || 'otp'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro na edge function send-cftv-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
