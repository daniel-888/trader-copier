import { Router } from "express";

import {
  copiersList,
  createCopier,
} from "../../../controllers/copier.controller";

const router: Router = Router();

router.get("/", copiersList);
router.post("/", createCopier);

export default router;
