"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../config/prisma");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Não autenticado" });
        }
        const { status, channel, search } = req.query;
        const leads = await prisma_1.prisma.lead.findMany({
            where: {
                ownerId: userId,
                status: status ? status.toUpperCase() : undefined,
                channel: channel ? channel.toUpperCase() : undefined,
                OR: search
                    ? [
                        { name: { contains: search, mode: "insensitive" } },
                        { contact: { contains: search, mode: "insensitive" } },
                        { niche: { contains: search, mode: "insensitive" } },
                        { city: { contains: search, mode: "insensitive" } },
                    ]
                    : undefined,
            },
            orderBy: { createdAt: "desc" },
        });
        return res.json(leads);
    }
    catch (error) {
        console.error("Erro ao listar leads:", error);
        return res.status(500).json({ message: "Erro ao listar leads" });
    }
});
router.post("/", async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Não autenticado" });
        }
        const { name, contact, channel, status, city, niche, notes } = req.body;
        if (!name || !contact || !channel) {
            return res.status(400).json({ message: "Nome, contato e canal são obrigatórios" });
        }
        const lead = await prisma_1.prisma.lead.create({
            data: {
                name,
                contact,
                channel: channel.toUpperCase(),
                status: status?.toUpperCase(),
                city,
                niche,
                notes,
                ownerId: userId,
            },
        });
        return res.status(201).json(lead);
    }
    catch (error) {
        console.error("Erro ao criar lead:", error);
        return res.status(500).json({ message: "Erro ao criar lead" });
    }
});
router.put("/:id", async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Não autenticado" });
        }
        const leadId = Number(req.params.id);
        const existing = await prisma_1.prisma.lead.findFirst({
            where: { id: leadId, ownerId: userId },
        });
        if (!existing) {
            return res.status(404).json({ message: "Lead não encontrado" });
        }
        const { name, contact, channel, status, city, niche, notes } = req.body;
        const lead = await prisma_1.prisma.lead.update({
            where: { id: leadId },
            data: {
                name,
                contact,
                channel: channel?.toUpperCase(),
                status: status?.toUpperCase(),
                city,
                niche,
                notes,
            },
        });
        return res.json(lead);
    }
    catch (error) {
        console.error("Erro ao atualizar lead:", error);
        return res.status(500).json({ message: "Erro ao atualizar lead" });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Não autenticado" });
        }
        const leadId = Number(req.params.id);
        const existing = await prisma_1.prisma.lead.findFirst({
            where: { id: leadId, ownerId: userId },
        });
        if (!existing) {
            return res.status(404).json({ message: "Lead não encontrado" });
        }
        await prisma_1.prisma.lead.delete({ where: { id: leadId } });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Erro ao deletar lead:", error);
        return res.status(500).json({ message: "Erro ao deletar lead" });
    }
});
exports.default = router;
