import { AlphaRouter, SwapType } from "@uniswap/smart-order-router";
import { ethers } from "ethers";
import { Pool } from "@uniswap/v3-sdk";
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";

import TxQuery, { ITxQuery } from "../models/txTable";
import CopierQuery, { ICopierQuery } from "../models/copier";

const V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const MY_ADDRESS = "0x0485E62c3a8583DF0668CDd9a2fD599c5a98280e";
const web3Provider = new ethers.providers.JsonRpcProvider(
  "https://eth-goerli.g.alchemy.com/v2/rEClcGAkhNFov-l7TnBTmdVU0KqcLfIk"
);

let router = new AlphaRouter({ chainId: 5, provider: web3Provider });

const WETH = new Token(
  5,
  "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  18,
  "WETH",
  "Wrapped Ether"
);

const USDC = new Token(
  5,
  "0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557",
  6,
  "USDC",
  "USD//C"
);

const initCopy = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    TxQuery.find({ copyStarted: false })
      .sort({ dispatchTimestamp: 1 })
      .then(async (txs: ITxQuery[]) => {
        if (txs.length === 0) initCopy();
        else {
          for (const tx of txs) {
            console.log("tx copied: ", tx);
            const value = "100000";
            const wethAmount = CurrencyAmount.fromRawAmount(WETH, value);

            const route = await router.route(
              wethAmount,
              USDC,
              TradeType.EXACT_INPUT,
              {
                type: SwapType.SWAP_ROUTER_02,
                recipient: MY_ADDRESS,
                slippageTolerance: new Percent(5, 100),
                deadline: Math.floor(Date.now() / 1000 + 1800),
              }
            );
            console.log("route = ", route);
            TxQuery.updateOne({ _id: tx._id }, { copyStarted: true }).catch(
              (err) => {
                console.log(err);
              }
            );
            initCopy();
          }
        }
      })
      .catch((err) => {
        console.log(err);
        initCopy();
      });
  });
};

export default initCopy;
