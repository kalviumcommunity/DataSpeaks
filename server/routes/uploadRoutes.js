import express from "express";
import { uploadFile } from "../controllers/uploadController.js";
import uploadMiddleware from "../middleware/uploadMiddleware.js";

const router = express.Router();
router.post("/", uploadMiddleware.single("file"), uploadFile);

export default router;
