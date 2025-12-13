import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "ivanjfm01@gmail.com" },
    update: {
      name: "Dev Ivan",
      password: passwordHash,
    },
    create: {
      name: "Dev Ivan",
      email: "ivanjfm01@gmail.com",
      password: passwordHash,
    },
  });

  console.log("Seed concluído: usuário admin criado/atualizado");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
