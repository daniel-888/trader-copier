import { Router, Request, Response, NextFunction } from "express";
import copierRouter from "./copier";

const router: Router = Router();

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json({ msg: "This is router v1." });
});

router.use("/copier", copierRouter);

export default router;
