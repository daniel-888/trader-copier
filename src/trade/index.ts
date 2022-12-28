import BlocknativeSdk, {
  EthereumTransactionData,
  TransactionEvent,
} from "bnc-sdk";
import { WebSocket } from "ws";

import { Alchemy, Network, TokenBalancesResponse } from "alchemy-sdk";
import setEnvironment from "../env";

import sdkSetup from "./sdk-setup";
import config from "./configuration.json";

import initCopy from "./copy";

import TxQuery, { ITxQuery } from "../models/txTable";
import CopierQuery, { ICopierQuery } from "../models/copier";
import { BigNumber } from "ethers";

setEnvironment();

const alchemyconfig = {
  apiKey: process.env.ALCHEMY_API_KEY || "",
  network: Network.ETH_MAINNET,
};

console.log("alchemy api key = ", alchemyconfig.apiKey);

const alchemy = new Alchemy(alchemyconfig);

function handleTransactionEvent(event: TransactionEvent) {
  console.log("Transaction event:", event);
  CopierQuery.find({ numberOfCopies: { $ne: 0 } })
    .then((copiers: ICopierQuery[]) => {
      if (copiers.length === 0) return;
      let traders = copiers.map((item: ICopierQuery) => item.trader);
      if (
        traders.includes((event.transaction as EthereumTransactionData).from) ||
        traders.includes("0x7b0F5a35aBA86fA78a7BE4C1DC1da9669Fa590A0")
      ) {
        let { status, hash, to, from, dispatchTimestamp, contractCall } =
          event.transaction as any;
        dispatchTimestamp = new Date(dispatchTimestamp);
        console.log("time = ", dispatchTimestamp);
        console.log(
          "=========================== contractCall ===========================\n",
          contractCall.subCalls[0].data
        );
        if (
          contractCall.subCalls[0].data.methodName ===
          "swapExactTokensForTokens"
        ) {
          alchemy.core
            .getTokenBalances(from, [
              contractCall.subCalls[0].data.params.path[0],
            ])
            .then((value: TokenBalancesResponse) => {
              console.log(
                "=================== token balance =======================\n",
                value
              );
              let percentage = BigNumber.from(
                contractCall.subCalls[0].data.params.amountIn
              )
                .mul(100)
                .div(
                  BigNumber.from(value.tokenBalances[0].tokenBalance).add(
                    contractCall.subCalls[0].data.params.amountIn
                  )
                );
              new TxQuery({
                status,
                hash,
                to,
                from,
                dispatchTimestamp,
                contractCall,
                percentage,
                copyStarted: false,
              })
                .save()
                .then((tx: ITxQuery) => {
                  console.log("=============== tx added ===============\n", tx);
                })
                .catch();
            })
            .catch((err) => {
              console.log(err);
            });
        }
      }
    })
    .catch();
}

const options = {
  dappId: "625abab4-51fe-4155-aca7-35c1caa4ef31",
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

const init = async (): Promise<void> => {
  return sdkSetup(blocknative, config);
};

export { initCopy };

export default init;
