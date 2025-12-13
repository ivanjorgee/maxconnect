import "dotenv/config";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes";
import leadRoutes from "./routes/leadRoutes";
import { authenticate } from "./middleware/auth";

const app = express();
const port = process.env.PORT || 4000;

app.disable("x-powered-by");
app.set("trust proxy", 1);

const allowedOrigins =
  (process.env.FRONTEND_URL || process.env.FRONTEND_URLS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : ["http://localhost:5173"],
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Muitas tentativas. Tente novamente em alguns minutos.",
});

app.use(cors(corsOptions));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(globalLimiter);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/leads", authenticate, leadRoutes);

app.listen(port, () => {
  console.log(`API MaxConnect rodando na porta ${port}`);
});
