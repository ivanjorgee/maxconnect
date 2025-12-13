"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const leadRoutes_1 = __importDefault(require("./routes/leadRoutes"));
const auth_1 = require("./middleware/auth");
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
const allowedOrigins = process.env.FRONTEND_URL?.split(",").map((origin) => origin.trim()) || "*";
app.use((0, cors_1.default)({
    origin: allowedOrigins,
}));
app.use(express_1.default.json());
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/auth", authRoutes_1.default);
app.use("/api/leads", auth_1.authenticate, leadRoutes_1.default);
app.listen(port, () => {
    console.log(`API MaxConnect rodando na porta ${port}`);
});
