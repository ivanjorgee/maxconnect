"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcrypt_1.default.hash("admin123", 10);
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
