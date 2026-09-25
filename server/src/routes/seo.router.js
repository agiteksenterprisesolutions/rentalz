import express from "express";
import { seoSettings, sitemapAds, sitemapCategories } from "../controllers/seo.controller.js";

const seoRouter = express.Router();

seoRouter.get("/settings", seoSettings);
seoRouter.get("/sitemap/ads", sitemapAds);
seoRouter.get("/sitemap/categories", sitemapCategories);

export default seoRouter;
