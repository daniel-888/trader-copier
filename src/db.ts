import mongoose from "mongoose";

import init, { initCopy } from "./trade";

const options = {
  useNewUrlParser: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 500,
  connectTimeoutMS: 10000,
};

const initDB = async (): Promise<void> => {
  const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_HOSTNAME,
    MONGO_PORT,
    MONGO_DB,
  } = process.env;

  const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;

  return new Promise((resolve, reject) => {
    initCopy();
    mongoose
      .connect(url)
      .then(() => {
        console.log("MongoDB is connected\n", url);
        init()
          .then(() => {
            console.log("tx listener started");
            resolve();
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
        reject();
      });
  });
};

export default initDB;
