import express from "express";
import { createCity, createMake, deleteCity, deleteMake, listCities, listMakes, updateCity, updateMake } from "../controllers/catalog.controller.js";
import { requirePermissions } from "../middleware/acl.middleware.js";
import { verifyUser } from "../middleware/verify.middleware.js";

const catalogRouter = express.Router();

catalogRouter.get("/cities", listCities);
catalogRouter.post("/cities", verifyUser, requirePermissions("city:manage"), createCity);
catalogRouter.patch("/cities/:id", verifyUser, requirePermissions("city:manage"), updateCity);
catalogRouter.delete("/cities/:id", verifyUser, requirePermissions("city:manage"), deleteCity);

catalogRouter.get("/makes", listMakes);
catalogRouter.post("/makes", verifyUser, requirePermissions("make:manage"), createMake);
catalogRouter.patch("/makes/:id", verifyUser, requirePermissions("make:manage"), updateMake);
catalogRouter.delete("/makes/:id", verifyUser, requirePermissions("make:manage"), deleteMake);

export default catalogRouter;
