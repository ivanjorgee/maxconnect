"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const leadRoutes_1 = __importDefault(require("./routes/leadRoutes"));
const auth_1 = require("./middleware/auth");
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
app.disable("x-powered-by");
app.set("trust proxy", 1);
const allowedOrigins = (process.env.FRONTEND_URL || process.env.FRONTEND_URLS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const corsOptions = {
    origin: allowedOrigins.length ? allowedOrigins : ["http://localhost:5173"],
};
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: "Muitas tentativas. Tente novamente em alguns minutos.",
});
app.use((0, cors_1.default)(corsOptions));
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, compression_1.default)());
app.use(globalLimiter);
app.use(express_1.default.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/auth", authLimiter, authRoutes_1.default);
app.use("/api/leads", auth_1.authenticate, leadRoutes_1.default);
app.listen(port, () => {
    console.log(`API MaxConnect rodando na porta ${port}`);
});
