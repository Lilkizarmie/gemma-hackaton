import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import decisionRouter from "./routes/decision.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok"
  });
});

app.use("/api/v1", decisionRouter);

export default app;

