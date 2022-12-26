import express, { Express } from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import cors from "cors";
import bodyParser from "body-parser";

import initDB from "./db";
import initRoute from "./routes";
import setEnvironment from "./env";

// import init from "./trade";

// Swagger OpenAPI definition file
const swaggerDocument = require("./swagger/swagger.json");
const customCss = fs.readFileSync(
  process.cwd() + "/src/swagger/swagger.css",
  "utf8"
);

// .env set
setEnvironment();

// connect mongodb
initDB();

const app: Express = express();

// swagger - ui client
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, { customCss })
);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(morgan("dev"));

initRoute(app);

app.set("trust proxy", true);
const server = app.listen(process.env.PORT || 3000, () => {
  // tslint:disable-next-line:no-console
  console.log("Server is running on port 3000");
});

// init();
import BlocknativeSdk, { SDKError } from "bnc-sdk";
import Web3 from "web3";
import { WebSocket } from "ws"; // only neccessary in server environments

const wsapi_url = "wss://api.blocknative.com/v0";

const web3 = new Web3(wsapi_url);

// create options object
const options = {
  dappId: "625abab4-51fe-4155-aca7-35c1caa4ef31",
  networkId: 1,
  transactionHandlers: [(event: any) => console.log(event.transaction)],
  ws: WebSocket,
  onerror: (error: SDKError) => {
    console.log(error);
  },
};
// initialize and connect to the api
const blocknative = new BlocknativeSdk(options);

const address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const { emitter, details } = blocknative.account(address);

emitter.on("all", (transaction) => {
  console.log(transaction);
});

process.on("SIGTERM", () => {
  console.info("SIGTERM signal received.");
  console.log("Closing https server.");
  server.close(() => {
    console.log("Http server closed.");
    // boolean means [force], see in mongoose doc
    mongoose.connection.close(false, () => {
      console.log("MongoDb connection closed.");
      process.exit(0);
    });
  });
});
