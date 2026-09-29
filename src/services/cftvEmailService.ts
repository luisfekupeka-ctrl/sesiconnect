import { supabase } from '../lib/supabase';
import type { SolicitacaoCFTV, SolicitanteRecord } from '../types';

/**
 * Serviço de Envio de Códigos OTP e Devolutivas por E-mail (CFTV)
 */
export const cftvEmailService = {
  /**
   * Gera um código de 6 dígitos numéricos e dispara o envio por e-mail
   */
  async gerarEnviarCodigoOTP(email: string, nome?: string): Promise<{ sucesso: boolean; mensagem: string; codigoSimulado?: string }> {
    const emailNorm = email.trim().toLowerCase();
    
    // Gerar código de 6 dígitos numéricos criptograficamente seguro
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const codigo = (100000 + (array[0] % 900000)).toString();
    const expiraEm = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutos

    try {
      // 1. Grava o novo código na base (mantendo códigos recentes válidos por 30min para evitar expiração prematura)
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

      console.log(`[CFTV OTP] Código de 6 dígitos gerado para ${emailNorm}`);

      // 2. Disparo do e-mail com o código de 6 dígitos via Supabase Edge Function 'send-cftv-email'
      try {
        await supabase.functions.invoke('send-cftv-email', {
          body: { 
            tipo: 'otp',
            email: emailNorm, 
            codigo, 
            nome: nome || 'Solicitante' 
          }
        });
      } catch (fnErr) {
        console.warn('[CFTV Edge Function] Aviso ao invocar send-cftv-email:', fnErr);
      }

      return {
        sucesso: true,
        mensagem: `Código de verificação enviado para o e-mail ${emailNorm}. Válido por 30 minutos.`
      };
    } catch (err: any) {
      console.error('Erro ao gerar/enviar código OTP:', err);
      return {
        sucesso: false,
        mensagem: err.message || 'Erro ao enviar código de verificação por e-mail.'
      };
    }
  },

  /**
   * Valida o código de 6 dígitos digitado pelo solicitante (Isolado no portal de CFTV)
   */
  async validarCodigoOTP(email: string, codigoDigitado: string): Promise<{ sucesso: boolean; solicitante?: SolicitanteRecord; erro?: string }> {
    const emailNorm = email.trim().toLowerCase();
    const codigoLimpo = codigoDigitado.trim().replace(/\D/g, '');

    try {
      // 1. Busca código válido e não expirado na tabela cftv_codigos_otp
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
          erro: 'Código incorreto ou já expirado. Certifique-se de digitar os 6 dígitos recebidos no seu e-mail.'
        };
      }

      // 2. Marca este e todos os códigos anteriores deste e-mail como utilizados
      await supabase
        .from('cftv_codigos_otp')
        .update({ utilizado: true })
        .eq('email', emailNorm)
        .eq('utilizado', false);

      // 3. Busca perfil do solicitante na tabela solicitantes_cftv
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
      await supabase.functions.invoke('send-cftv-email', {
        body: {
          tipo: 'aprovacao_acesso',
          destinatario: solicitante.email,
          email: solicitante.email,
          nome: solicitante.nome,
          mensagem: 'Seu acesso para solicitação de imagens de segurança (CFTV) foi aprovado pelo Super Administrador.'
        }
      });
    } catch (e) {
      console.info('[CFTV Notificação] Disparo de aprovação registrado.', e);
    }
  },

  /**
   * Notifica o solicitante sobre a Devolutiva / Atualização de Status do Chamado
   */
  async notificarDevolutivaChamado(solicitacao: SolicitacaoCFTV): Promise<void> {
    console.log(`[CFTV Devolutiva] Enviando devolutiva do chamado ${solicitacao.numero_protocolo} para ${solicitacao.solicitante_email}. Status: ${solicitacao.status}`);
    try {
      await supabase.functions.invoke('send-cftv-email', {
        body: {
          tipo: 'devolutiva_chamado',
          destinatario: solicitacao.solicitante_email,
          email: solicitacao.solicitante_email,
          nome: solicitacao.solicitante_nome,
          protocolo: solicitacao.numero_protocolo,
          status: solicitacao.status,
          parecer: solicitacao.parecer_analise || solicitacao.justificativa_cancelamento || 'Atualização registrada pela equipe.',
          cameras: solicitacao.cameras_analisadas || null
        }
      });
    } catch (e) {
      console.info('[CFTV Devolutiva] Disparo de devolutiva registrado.', e);
    }
  }
};
