import { ModeloAbertura } from "@prisma/client";

export const modelosFollowUp1: Record<ModeloAbertura, { titulo: string; texto: string }> = {
  M1: {
    titulo: "Follow-up 1 – Oportunidade de novos agendamentos",
    texto:
      "Oi, tudo bem? Volto aqui para garantir que você viu a ideia sobre aumentar os agendamentos da clínica pelo WhatsApp.\n\nConsigo te mostrar rapidinho como ficaria para vocês e quais resultados esperar. Posso te enviar agora?",
  },
  M2: {
    titulo: "Follow-up 1 – Mapeamento de clínicas",
    texto:
      "Oi! Estou finalizando o mapeamento das clínicas com potencial de aumentar agendamentos e a sua entrou na lista.\n\nPosso te enviar um diagnóstico rápido com o próximo passo para ativar mais contatos pelo WhatsApp?",
  },
  M3: {
    titulo: "Follow-up 1 – Perda de oportunidades",
    texto:
      "Oi, tudo bem? Notei que podemos recuperar oportunidades que não estão virando agendamento aí na clínica.\n\nPosso te mostrar em 1 min o ajuste que evita perder esses contatos e traz mais respostas?",
  },
  M4: {
    titulo: "Follow-up 1 – Foco em resultado no WhatsApp",
    texto:
      "Oi! Vi que o WhatsApp é chave no atendimento de vocês.\n\nTenho um ajuste simples para aumentar o volume de pessoas chegando por esse canal sem complicar a rotina. Quer que eu te envie como ficaria?",
  },
  M5: {
    titulo: "Follow-up 1 – Funil digital / novos clientes",
    texto:
      "Oi, tudo bem? Sobre organizar o funil digital (Google/Instagram/WhatsApp) para trazer novos clientes todos os dias:\n\nPosso te enviar o passo rápido que adaptei para vocês, mostrando onde ajustar para destravar os agendamentos?",
  },
};
