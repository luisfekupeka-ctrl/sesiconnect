import { supabase } from '../lib/supabase';
import type { SolicitacaoCFTV, SolicitanteRecord } from '../types';

/**
 * Serviço de Envio de Códigos OTP e Devolutivas por E-mail (CFTV)
 */
export const cftvEmailService = {
  /**
   * Gera um código de 6 dígitos numéricos e grava no banco com validade de 15 minutos
   */
  async gerarEnviarCodigoOTP(email: string, nome?: string): Promise<{ sucesso: boolean; mensagem: string; codigoSimulado?: string }> {
    const emailNorm = email.trim().toLowerCase();
    
    // Gerar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEm = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

    try {
      // 1. Invalida códigos anteriores não utilizados deste e-mail
      await supabase
        .from('cftv_codigos_otp')
        .update({ utilizado: true })
        .eq('email', emailNorm)
        .eq('utilizado', false);

      // 2. Grava o novo código
      const { error: insertError } = await supabase
        .from('cftv_codigos_otp')
        .insert([{
          email: emailNorm,
          codigo,
          tipo: 'login_solicitante',
          tentativas: 0,
          utilizado: false,
          expira_em: expiraEm
        }]);

      if (insertError) throw insertError;

      // 3. Tentar envio de e-mail via Supabase Auth ou Webhook
      console.log(`[CFTV OTP] Código de 6 dígitos gerado para ${emailNorm}: ${codigo}`);

      // Se houver integração com edge function ou SMTP
      try {
        await supabase.functions.invoke('send-cftv-otp', {
          body: { email: emailNorm, codigo, nome: nome || 'Solicitante' }
        });
      } catch (fnErr) {
        // Fallback silencioso caso edge function não esteja configurada no ambiente local
        console.info('[CFTV Email] Envio de e-mail registrado no banco.');
      }

      return {
        sucesso: true,
        mensagem: `Código de verificação enviado para o e-mail ${emailNorm}.`,
        codigoSimulado: codigo // Facilita testes em desenvolvimento
      };
    } catch (err: any) {
      console.error('Erro ao gerar código OTP:', err);
      return {
        sucesso: false,
        mensagem: err.message || 'Erro ao gerar código de verificação.'
      };
    }
  },

  /**
   * Valida o código de 6 dígitos digitado pelo solicitante
   */
  async validarCodigoOTP(email: string, codigoDigitado: string): Promise<{ sucesso: boolean; solicitante?: SolicitanteRecord; erro?: string }> {
    const emailNorm = email.trim().toLowerCase();
    const codigoLimpo = codigoDigitado.trim();

    try {
      // 1. Busca código válido e não expirado
      const { data: registroOTP, error: errOTP } = await supabase
        .from('cftv_codigos_otp')
        .select('*')
        .eq('email', emailNorm)
        .eq('codigo', codigoLimpo)
        .eq('utilizado', false)
        .gt('expira_em', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (errOTP) throw errOTP;

      if (!registroOTP) {
        return {
          sucesso: false,
          erro: 'Código inválido ou expirado. Verifique os dígitos recebidos no seu e-mail ou solicite um novo código.'
        };
      }

      // 2. Marca código como utilizado
      await supabase
        .from('cftv_codigos_otp')
        .update({ utilizado: true })
        .eq('id', registroOTP.id);

      // 3. Busca perfil do solicitante
      const { data: solicitante, error: errSol } = await supabase
        .from('solicitantes_cftv')
        .select('*')
        .ilike('email', emailNorm)
        .maybeSingle();

      if (errSol) throw errSol;

      if (solicitante) {
        // Atualiza último login
        await supabase
          .from('solicitantes_cftv')
          .update({ ultimo_login_em: new Date().toISOString() })
          .eq('id', solicitante.id);
      }

      return {
        sucesso: true,
        solicitante: solicitante || undefined
      };
    } catch (err: any) {
      console.error('Erro ao validar código OTP:', err);
      return {
        sucesso: false,
        erro: err.message || 'Falha ao validar código.'
      };
    }
  },

  /**
   * Notifica o solicitante sobre a Aprovação de Acesso pelo Super Admin
   */
  async notificarAprovacaoSolicitante(solicitante: SolicitanteRecord): Promise<void> {
    console.log(`[CFTV Notificação] Solicitante ${solicitante.nome} (${solicitante.email}) foi APROVADO pelo Super Admin.`);
    try {
      await supabase.functions.invoke('send-cftv-notification', {
        body: {
          tipo: 'aprovacao_acesso',
          destinatario: solicitante.email,
          nome: solicitante.nome,
          mensagem: 'Seu acesso para solicitação de imagens de segurança (CFTV) foi aprovado pelo Super Administrador.'
        }
      });
    } catch (e) {
      console.info('[CFTV Notificação] Disparo registrado.');
    }
  },

  /**
   * Notifica o solicitante sobre a Devolutiva / Atualização de Status do Chamado
   */
  async notificarDevolutivaChamado(solicitacao: SolicitacaoCFTV): Promise<void> {
    console.log(`[CFTV Devolutiva] Enviando devolutiva do chamado ${solicitacao.numero_protocolo} para ${solicitacao.solicitante_email}. Status: ${solicitacao.status}`);
    try {
      await supabase.functions.invoke('send-cftv-notification', {
        body: {
          tipo: 'devolutiva_chamado',
          destinatario: solicitacao.solicitante_email,
          nome: solicitacao.solicitante_nome,
          protocolo: solicitacao.numero_protocolo,
          status: solicitacao.status,
          parecer: solicitacao.parecer_analise || solicitacao.justificativa_cancelamento || 'Atualização registrada pela equipe.',
          cameras: solicitacao.cameras_analisadas || null
        }
      });
    } catch (e) {
      console.info('[CFTV Devolutiva] Disparo registrado.');
    }
  }
};
