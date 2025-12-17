import { describe, expect, it, vi, afterEach } from "vitest";
import { isConversaPending, isFollowup1Pending } from "./followup-rules";
import { StatusFunil, TipoInteracao } from "@prisma/client";

const baseInteracoes = [
  {
    tipo: TipoInteracao.MENSAGEM_1,
    data: new Date("2024-01-01T10:00:00.000Z"),
  },
];

describe("followup rules", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("marca followup 1 pendente apos 24h sem proxima acao", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-02T12:30:00.000Z"));

    const result = isFollowup1Pending({
      statusFunil: StatusFunil.MENSAGEM_1_ENVIADA,
      proximaAcao: null,
      interacoes: baseInteracoes,
    });

    expect(result).toBe(true);
  });

  it("nao marca followup 1 pendente se ja ha proxima acao", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-02T12:30:00.000Z"));

    const result = isFollowup1Pending({
      statusFunil: StatusFunil.MENSAGEM_1_ENVIADA,
      proximaAcao: "FOLLOW_UP_1",
      interacoes: baseInteracoes,
    });

    expect(result).toBe(false);
  });

  it("marca followup conversa pendente apos 24h sem reuniao", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-02T12:30:00.000Z"));

    const result = isConversaPending({
      statusFunil: StatusFunil.EM_CONVERSA,
      proximaAcao: null,
      dataReuniao: null,
      interacoes: [
        {
          tipo: TipoInteracao.FOLLOWUP_CONVERSA,
          data: new Date("2024-01-01T10:00:00.000Z"),
        },
      ],
    });

    expect(result).toBe(true);
  });
});
