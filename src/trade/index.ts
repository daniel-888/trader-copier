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
import routers from "./routers";
import { WETH9, SupportedChainId } from "@uniswap/sdk-core";

setEnvironment();

const alchemyconfig = {
  apiKey: process.env.ALCHEMY_API_KEY || "",
  network: Network.ETH_MAINNET,
};

console.log("alchemy api key = ", alchemyconfig.apiKey);

const alchemy = new Alchemy(alchemyconfig);

async function handleTransactionEvent(event: TransactionEvent) {
  console.log("Transaction event:", event);
  let copiers = await CopierQuery.find({ numberOfCopies: { $ne: 0 } });
  if (copiers.length === 0) return;
  let traders = copiers.map((item: ICopierQuery) => item.trader);
  if (
    traders.includes((event.transaction as EthereumTransactionData).from) ||
    traders.includes("0x7b0F5a35aBA86fA78a7BE4C1DC1da9669Fa590A0")
  ) {
    let { status, hash, to, from, value, dispatchTimestamp, contractCall } =
      event.transaction as any;
    dispatchTimestamp = new Date(dispatchTimestamp);
    console.log("time = ", dispatchTimestamp);
    // console.log(
    //   "=========================== contractCall ===========================\n",
    //   contractCall.subCalls[0].data
    // );
    let percentage = 0;
    switch (to) {
      case routers.uniswapAutoRouter:
        if (
          contractCall.subCalls[0].data.methodName ===
          "swapExactTokensForTokens"
        ) {
          if (
            contractCall.subCalls[0].data.params.path[0] !==
            WETH9[SupportedChainId.MAINNET].address
          ) {
            let val = await alchemy.core.getTokenBalances(from, [
              contractCall.subCalls[0].data.params.path[0],
            ]);
            console.log(
              "=================== token balance =======================\n",
              val
            );
            percentage = BigNumber.from(
              contractCall.subCalls[0].data.params.amountIn
            )
              .mul(100)
              .div(
                BigNumber.from(val.tokenBalances[0].tokenBalance).add(
                  contractCall.subCalls[0].data.params.amountIn
                )
              )
              .toNumber();
          } else {
            let val = await alchemy.core.getBalance(from);
            console.log(
              "=================== token balance =======================\n",
              val
            );
            percentage = BigNumber.from(value)
              .mul(100)
              .div(val.add(value))
              .toNumber();
          }
        } else if (
          contractCall.subCalls[0].data.methodName === "exactInputSingle"
        ) {
          if (
            contractCall.subCalls[0].data.params.params.tokenIn !==
            WETH9[SupportedChainId.MAINNET].address
          ) {
            let val = await alchemy.core.getTokenBalances(from, [
              contractCall.subCalls[0].data.params.params.tokenIn,
            ]);
            console.log(
              "=================== token balance =======================\n",
              val
            );
            percentage = BigNumber.from(
              contractCall.subCalls[0].data.params.amountIn
            )
              .mul(100)
              .div(
                BigNumber.from(val.tokenBalances[0].tokenBalance).add(
                  contractCall.subCalls[0].data.params.amountIn
                )
              )
              .toNumber();
          } else {
            let val = await alchemy.core.getBalance(from);
            console.log(
              "=================== token balance =======================\n",
              val
            );
            percentage = BigNumber.from(value)
              .mul(100)
              .div(val.add(value))
              .toNumber();
          }
        }
        break;
      case routers.sushiswapRouter:
        let val;
        switch (contractCall.methodName) {
          case "swapExactTokensForETH":
          case "swapExactTokensForTokens":
            val = await alchemy.core.getTokenBalances(from, [
              contractCall.params.path[0],
            ]);
            percentage = BigNumber.from(contractCall.params.amountIn)
              .mul(100)
              .div(
                BigNumber.from(val.tokenBalances[0].tokenBalance).add(
                  contractCall.params.amountIn
                )
              )
              .toNumber();
            break;
          case "swapExactETHForTokens":
          case "swapETHForExactTokens":
            val = await alchemy.core.getBalance(from);
            percentage = BigNumber.from(value)
              .mul(100)
              .div(val.add(value))
              .toNumber();
            break;
          // case "swapTokensForExactTokens":
          // case "swapTokensForExactETH":
          //   val = await alchemy.core.getTokenBalances(from, [
          //     contractCall.params.path[0],
          //   ]);
          //   percentage = BigNumber.from(contractCall.params.amountIn)
          //     .mul(100)
          //     .div(
          //       BigNumber.from(val.tokenBalances[0].tokenBalance).add(
          //         contractCall.params.amountIn
          //       )
          //     )
          //     .toNumber();
          //   break;
          default:
            break;
        }
        break;
      default:
        break;
    }
    let tx = await (new TxQuery({
      status,
      hash,
      to,
      from,
      value,
      dispatchTimestamp,
      contractCall,
      percentage,
      copyStarted: false,
    })).save();
    console.log("=============== tx added ===============\n", tx);
  }
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
