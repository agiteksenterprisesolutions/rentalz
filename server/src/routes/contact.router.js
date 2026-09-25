import express from "express";
import { submitContact } from "../controllers/contact.controller.js";
import { formLimiter } from "../utils/rate-limiter.js";

const contactRouter = express.Router();

contactRouter.post("/", formLimiter, submitContact);

export default contactRouter;
