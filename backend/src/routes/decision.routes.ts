import { Router } from "express";
import { postDecision } from "../controllers/decision.controller";

const decisionRouter = Router();

decisionRouter.post("/decision", postDecision);

export default decisionRouter;

