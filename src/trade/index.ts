import BlocknativeSdk from "bnc-sdk";
import Web3 from "web3";
import { WebSocket } from "ws";

import sdkSetup from "./sdk-setup";
import config from "./configuration.json";

function handleTransactionEvent(transaction: any) {
  console.log("Transaction event:", transaction);
}

const options = {
  dappId: "cf2e2f60-da99-4c31-984f-21855194d264",
  networkId: 1,
  transactionHandlers: [handleTransactionEvent],
  ws: WebSocket, // only neccessary in server environments
  name: "Instance name here", // optional, use when running multiple instances
  onerror: (error: Error) => {
    console.log(error);
  }, //optional, use to catch errors
};

const blocknative = new BlocknativeSdk(options);

// export default blocknative;

const init = async () => {
  await sdkSetup(blocknative, config);
};

export default init;
