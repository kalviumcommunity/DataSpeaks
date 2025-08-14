import express from "express";
import { queryFile } from "../controllers/queryController.js";

const router = express.Router();

router.post("/", queryFile);

export default router;
