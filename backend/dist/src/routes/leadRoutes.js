"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../config/prisma");
const allowedStatuses = ["MANDADO", "VISUALIZOU", "RESPONDEU", "NEGOCIANDO", "FECHADO"];
const allowedChannels = ["INSTAGRAM", "WHATSAPP", "OUTRO"];
const router = (0, express_1.Router)();
const sanitizeString = (value, maxLength) => {
    if (typeof value !== "string")
        return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed.slice(0, maxLength) : undefined;
};
const sanitizeNumber = (value) => {
    if (value === undefined || value === null)
        return undefined;
    const num = Number(value);
    if (Number.isNaN(num))
        return undefined;
    return num;
};
router.get("/", async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Não autenticado" });
        }
        const { status, channel, search } = req.query;
        const statusParam = status?.toString().toUpperCase();
        const channelParam = channel?.toString().toUpperCase();
        const searchTerm = sanitizeString(search, 120);
        const normalizedStatus = allowedStatuses.includes(statusParam)
            ? statusParam
            : undefined;
        const normalizedChannel = allowedChannels.includes(channelParam)
            ? channelParam
            : undefined;
        const leads = await prisma_1.prisma.lead.findMany({
            where: {
                ownerId: userId,
                status: normalizedStatus,
                channel: normalizedChannel,
                OR: searchTerm
                    ? [
                        { name: { contains: searchTerm, mode: "insensitive" } },
                        { contact: { contains: searchTerm, mode: "insensitive" } },
                        { niche: { contains: searchTerm, mode: "insensitive" } },
                        { city: { contains: searchTerm, mode: "insensitive" } },
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
        const sanitizedName = sanitizeString(name, 140);
        const sanitizedContact = sanitizeString(contact, 140);
        const sanitizedCity = sanitizeString(city, 80);
        const sanitizedNiche = sanitizeString(niche, 80);
        const sanitizedNotes = sanitizeString(notes, 800);
        const sanitizedWhatsapp = sanitizeString(req.body.whatsapp, 30);
        const sanitizedInstagram = sanitizeString(req.body.instagram, 80);
        const sanitizedWebsite = sanitizeString(req.body.website, 200);
        const sanitizedAddress = sanitizeString(req.body.address, 200);
        const sanitizedMapUrl = sanitizeString(req.body.mapUrl, 300);
        const sanitizedRating = sanitizeNumber(req.body.rating);
        const sanitizedReviews = sanitizeNumber(req.body.reviews);
        if (name !== undefined && !sanitizedName) {
            return res.status(400).json({ message: "Nome inválido" });
        }
        if (contact !== undefined && !sanitizedContact) {
            return res.status(400).json({ message: "Contato inválido" });
        }
        if (!sanitizedName || !sanitizedContact || !channel) {
            return res.status(400).json({ message: "Nome, contato e canal são obrigatórios" });
        }
        const normalizedChannel = channel.toString().toUpperCase();
        if (!allowedChannels.includes(normalizedChannel)) {
            return res.status(400).json({ message: "Canal inválido" });
        }
        const normalizedStatus = status
            ? status.toString().toUpperCase()
            : undefined;
        if (status && normalizedStatus && !allowedStatuses.includes(normalizedStatus)) {
            return res.status(400).json({ message: "Status inválido" });
        }
        const lead = await prisma_1.prisma.lead.create({
            data: {
                name: sanitizedName,
                contact: sanitizedContact,
                channel: normalizedChannel,
                status: normalizedStatus,
                city: sanitizedCity,
                niche: sanitizedNiche,
                notes: sanitizedNotes,
                whatsapp: sanitizedWhatsapp,
                instagram: sanitizedInstagram,
                website: sanitizedWebsite,
                address: sanitizedAddress,
                rating: sanitizedRating,
                reviews: sanitizedReviews,
                mapUrl: sanitizedMapUrl,
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
        const sanitizedName = sanitizeString(name, 140);
        const sanitizedContact = sanitizeString(contact, 140);
        const sanitizedCity = sanitizeString(city, 80);
        const sanitizedNiche = sanitizeString(niche, 80);
        const sanitizedNotes = sanitizeString(notes, 800);
        const sanitizedWhatsapp = sanitizeString(req.body.whatsapp, 30);
        const sanitizedInstagram = sanitizeString(req.body.instagram, 80);
        const sanitizedWebsite = sanitizeString(req.body.website, 200);
        const sanitizedAddress = sanitizeString(req.body.address, 200);
        const sanitizedMapUrl = sanitizeString(req.body.mapUrl, 300);
        const sanitizedRating = sanitizeNumber(req.body.rating);
        const sanitizedReviews = sanitizeNumber(req.body.reviews);
        const normalizedChannel = channel
            ? channel.toString().toUpperCase()
            : undefined;
        if (channel && normalizedChannel && !allowedChannels.includes(normalizedChannel)) {
            return res.status(400).json({ message: "Canal inválido" });
        }
        const normalizedStatus = status
            ? status.toString().toUpperCase()
            : undefined;
        if (status && normalizedStatus && !allowedStatuses.includes(normalizedStatus)) {
            return res.status(400).json({ message: "Status inválido" });
        }
        const lead = await prisma_1.prisma.lead.update({
            where: { id: leadId },
            data: {
                name: sanitizedName,
                contact: sanitizedContact,
                channel: normalizedChannel,
                status: normalizedStatus,
                city: sanitizedCity,
                niche: sanitizedNiche,
                notes: sanitizedNotes,
                whatsapp: sanitizedWhatsapp,
                instagram: sanitizedInstagram,
                website: sanitizedWebsite,
                address: sanitizedAddress,
                rating: sanitizedRating,
                reviews: sanitizedReviews,
                mapUrl: sanitizedMapUrl,
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
