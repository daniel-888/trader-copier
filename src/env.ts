import {config as configDotenv} from "dotenv";
import * as path from "path";
import * as fs from "fs";

const env: string = process.env.NODE_ENV;
enum EnvConstants {
  LOCAL = "local",
  PRODUCTION = "production",
  DEV = "dev",
  TEST = "test",
}

enum EvnFiles {
  LOCAL = ".env.local",
  PRODUCTION = ".env.prod",
  DEV = ".env.dev",
  TEST = ".env.test",
}

const setEnvironment = (): void => {
  let envPath: string;
  const rootDir: string = path.resolve(__dirname, "../");

  switch (env) {
    case EnvConstants.PRODUCTION:
      envPath = path.resolve(rootDir, EvnFiles.PRODUCTION);
      break;
    case EnvConstants.TEST:
      envPath = path.resolve(rootDir, EvnFiles.TEST);
      break;
    case EnvConstants.LOCAL:
      envPath = path.resolve(rootDir, EvnFiles.LOCAL);
      break;
    case EnvConstants.DEV:
      envPath = path.resolve(rootDir, EvnFiles.DEV);
      break;
    default:
      envPath = path.resolve(rootDir, EvnFiles.LOCAL);
      break;
  }

  if (!fs.existsSync(envPath)) {
    throw new Error(".env file is missing in root directory");
  }

  configDotenv({path: envPath});
}

export default setEnvironment;