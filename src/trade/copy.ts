import { AlphaRouter, SwapType } from "@uniswap/smart-order-router";
import { ethers, Wallet, BigNumber, Contract } from "ethers";
import { Pool } from "@uniswap/v3-sdk";
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";

import { Alchemy, Network, TokenBalancesResponse } from "alchemy-sdk";

import TxQuery, { ITxQuery } from "../models/txTable";
import CopierQuery, { ICopierQuery } from "../models/copier";
import { ERC20ABI } from "./ERC20Abi";

import { Interface } from "ethers/lib/utils";

const V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const MY_ADDRESS = "0x0485E62c3a8583DF0668CDd9a2fD599c5a98280e";
const web3Provider = new ethers.providers.JsonRpcProvider(
  // "https://eth-mainnet.g.alchemy.com/v2/PqG8PhPOj1OOWddl8lTfAAXs3FQyim1O"
  "https://eth-goerli.g.alchemy.com/v2/rEClcGAkhNFov-l7TnBTmdVU0KqcLfIk"
);

const signer = new Wallet(
  "",
  web3Provider
);

let router = new AlphaRouter({ chainId: 5, provider: web3Provider });

const WETH = new Token(
  5,
  "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  // "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  18,
  "WETH",
  "Wrapped Ether"
);

const USDC = new Token(
  5,
  "0x07865c6e87b9f70255377e024ace6630c1eaa37f",
  // "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  6,
  "USDC",
  "USD//C"
);

const alchemyconfig = {
  apiKey: "rEClcGAkhNFov-l7TnBTmdVU0KqcLfIk",
  network: Network.ETH_GOERLI,
};

const alchemy = new Alchemy(alchemyconfig);

const initCopy = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    TxQuery.find({ copyStarted: false })
      .sort({ dispatchTimestamp: 1 })
      .then(async (txs: ITxQuery[]) => {
        if (txs.length === 0) initCopy();
        else {
          for (const tx of txs) {
            console.log("tx copied: ", tx);
            const value = "10000000000000000";
            const wethAmount = CurrencyAmount.fromRawAmount(WETH, value);

            console.log("**********************route started");
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
            console.log(`Quote Exact In: ${route.quote.toFixed(2)}`);
            console.log(
              `Gas Adjusted Quote In: ${route.quoteGasAdjusted.toFixed(2)}`
            );
            console.log(
              `Gas Used USD: ${route.estimatedGasUsedUSD.toFixed(6)}`
            );
            const transaction = {
              data: route.methodParameters.calldata,
              to: V3_SWAP_ROUTER_ADDRESS,
              value: BigNumber.from(route.methodParameters.value),
              from: MY_ADDRESS,
              gasPrice: BigNumber.from(route.gasPriceWei),
            };

            let ERC20Interface = new Interface([
              "function approve(address _spender, uint256 value)",
            ]);

            const WETHContract = new Contract(
              WETH.address,
              ERC20Interface,
              signer
            );
            await (
              await WETHContract.approve(V3_SWAP_ROUTER_ADDRESS, value)
            ).wait();

            let response = await signer.sendTransaction(transaction);
            console.log("response == ", response.hash);

            TxQuery.updateOne({ _id: tx._id }, { copyStarted: true }).catch(
              (err) => {
                console.log(err);
              }
            );
          }
          initCopy();
        }
      })
      .catch((err) => {
        console.log(err);
        initCopy();
      });
  });
};

export default initCopy;
