import express, {
  Express,
  Router,
  Request,
  Response,
  ErrorRequestHandler,
  NextFunction,
} from "express";
import routerV1 from "./v1";

const router: Router = Router();

// /root API which demonstrates
// router.get("/", (req: Request, res: Response) => {
//   res.status(200).json({
//     version: "0.1.0",
//     date: Date.now(),
//   });
// });

// main router
router.use("/v1", routerV1);

const initRoute = (app: Express) => {
  app.use(router);

  // Implement 500 error route
  app.use(((err: any, req: Request, res: Response, next: NextFunction) => {
    console.log(err);
    res.status(500).send("Something is broken." + err.toString());
  }) as ErrorRequestHandler);

  // Implement 404 error route
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).send("Sorry we could not find that.");
  });
};

export default initRoute;
