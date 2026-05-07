import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
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

async function startServer() {
  await connectDB();
  await seedAdmin();

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 0 } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is already in use!`);
      console.error(`   Run this command to free it: taskkill /F /IM node.exe`);
      console.error(`   Then run 'npm run dev' again.\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
