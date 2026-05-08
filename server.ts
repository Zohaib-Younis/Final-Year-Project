import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./backend/config/db.js";
import { seedAdmin } from "./backend/config/seedAdmin.js";

// Import routes
import authRoutes from "./backend/routes/authRoutes.js";
import adminRoutes from "./backend/routes/adminRoutes.js";
import electionRoutes from "./backend/routes/electionRoutes.js";
import voteRoutes from "./backend/routes/voteRoutes.js";
import candidateRoutes from "./backend/routes/candidateRoutes.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

async function startServer() {
  console.log(`\n🚀 Starting server in ${isProduction ? "PRODUCTION" : "DEVELOPMENT"} mode...`);
  
  // Wait for DB connection before proceeding to seed or serve
  const isConnected = await connectDB();
  
  if (isConnected) {
    await seedAdmin();
  } else {
    console.warn("\n⚠️  WARNING: Server started without a database connection.");
    console.warn("⚠️  Database-dependent features will fail until connection is established.\n");
  }

  const app = express();
  
  // --- CORS Configuration ---
  // Allow requests from your Vercel frontend and local development
  app.use(cors({
    origin: [
      "https://final-year-project-neon-iota.vercel.app",
      "http://localhost:5173", // Standard Vite dev port
      "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Socket.io CORS is separate
    },
  });

  // Make io accessible in routes/controllers
  app.set("io", io);

  app.use(express.json({ limit: "10mb" }));

  // --- Socket.io ---
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("disconnect", () => console.log("Client disconnected"));
  });

  // --- API Routes ---
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/elections", electionRoutes);
  app.use("/api/vote", voteRoutes);
  app.use("/api/candidates", candidateRoutes);

  // --- Vite Middleware ---
  if (!isProduction) {
    console.log("🛠️  Starting Vite development server...");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 0 } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Serving production build from dist folder...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is already in use!`);
      if (process.platform === "win32") {
        console.error(`   Run this command to free it: taskkill /F /IM node.exe`);
      } else {
        console.error(`   Run this command to free it: fuser -k ${PORT}/tcp`);
      }
      process.exit(1);
    } else {
      throw err;
    }
  });

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

startServer();
