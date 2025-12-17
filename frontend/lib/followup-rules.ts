import { StatusFunil, TipoInteracao } from "@prisma/client";

type InteracaoLike = {
  tipo: TipoInteracao;
  data: Date | string;
};

type EmpresaFollowupLike = {
  statusFunil: StatusFunil;
  proximaAcao?: string | null;
  dataReuniao?: Date | string | null;
  interacoes: InteracaoLike[];
};

const LIMIT_MS = 24 * 60 * 60 * 1000;

export function isFollowup1Pending(empresa: EmpresaFollowupLike): boolean {
  const limit = Date.now() - LIMIT_MS;
  const last = empresa.interacoes[0];
  const lastIsM1 = last?.tipo === TipoInteracao.MENSAGEM_1;
  const lastIsOlder = last ? new Date(last.data).getTime() <= limit : false;
  const noAction = !empresa.proximaAcao;
  return empresa.statusFunil === StatusFunil.MENSAGEM_1_ENVIADA && lastIsM1 && lastIsOlder && noAction;
}

export function isConversaPending(empresa: EmpresaFollowupLike): boolean {
  const limit = Date.now() - LIMIT_MS;
  const last = empresa.interacoes[0];
  const lastIsOlder = last ? new Date(last.data).getTime() <= limit : false;
  const noAction = !empresa.proximaAcao;
  return empresa.statusFunil === StatusFunil.EM_CONVERSA && lastIsOlder && !empresa.dataReuniao && noAction;
}
