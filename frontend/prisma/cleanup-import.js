const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Ajuste o corte de data para deletar apenas o lote errado
  const cutoff = new Date("2025-01-09T00:00:00Z"); // coloque aqui a data/hora antes do import errado

  const deleted = await prisma.empresa.deleteMany({
    where: {
      createdAt: { gte: cutoff },
    },
  });
  console.log(`Removidas ${deleted.count} empresas criadas após ${cutoff.toISOString()}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
