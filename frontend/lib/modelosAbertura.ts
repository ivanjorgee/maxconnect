export type ModeloAbertura = {
  codigo: "M1" | "M2" | "M3" | "M4" | "M5";
  titulo: string;
  texto: string;
};

export const modelosAbertura: ModeloAbertura[] = [
  {
    codigo: "M1",
    titulo: "Oportunidade de novos agendamentos",
    texto:
      "Oi, tudo bem? Aqui é o Dev Ivan, da Maximos Code.\n\nDei uma olhada rápida em como a clínica de vocês aparece no Google e no Instagram e vi um ajuste simples que pode aumentar os agendamentos pelo WhatsApp.\n\nPosso te explicar rapidinho por aqui?",
  },
  {
    codigo: "M2",
    titulo: "Mapeamento de clínicas",
    texto:
      "Oi, tudo bem? Aqui é o Dev Ivan, da Maximos Code.\n\nEstou fazendo um mapeamento de clínicas de estética que têm potencial pra aumentar os agendamentos, e a de vocês chamou atenção.\n\nPosso te explicar rapidinho por aqui?",
  },
  {
    codigo: "M3",
    titulo: "Perda de oportunidades",
    texto:
      "Oi, tudo bem? Aqui é o Dev Ivan, da Maximos Code.\n\nVi algo no jeito que a clínica aparece online que provavelmente está travando alguns agendamentos que poderiam estar entrando agora.\n\nPosso te contar o que é em 1 min por aqui?",
  },
  {
    codigo: "M4",
    titulo: "Foco em resultado no WhatsApp",
    texto:
      "Oi, tudo bem? Aqui é o Dev Ivan, da Maximos Code.\n\nVi que boa parte dos atendimentos de vocês passa pelo WhatsApp, e tenho uma ideia prática pra aumentar o volume de pessoas chegando por esse canal sem complicar a rotina.\n\nFaz sentido eu te explicar em 1 min?",
  },
  {
    codigo: "M5",
    titulo: "Funil digital / novos clientes",
    texto:
      "Oi, tudo bem? Aqui é o Dev Ivan, da Maximos Code.\n\nTrabalho ajudando clínicas a organizar o funil digital (Google, Instagram e WhatsApp) pra aumentar a previsibilidade de novos clientes, e vi um ponto específico que poderia ser ajustado aí.\n\nQuer que eu te conte qual é?",
  },
];
