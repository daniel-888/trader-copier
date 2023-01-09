import { AlphaRouter, SwapType } from "@uniswap/smart-order-router";
import { ethers, Wallet, BigNumber, Contract } from "ethers";
import {
  Token,
  WETH9,
  Ether,
  CurrencyAmount,
  TradeType,
  Percent,
  SupportedChainId,
} from "@uniswap/sdk-core";

import { Alchemy, Network } from "alchemy-sdk";

import { ITxQuery } from "../../models/txTable";
import CopierQuery, { ICopierQuery } from "../../models/copier";
import { ERC20ABI } from "../ERC20Abi";

const V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const MY_ADDRESS = "0x0485E62c3a8583DF0668CDd9a2fD599c5a98280e";
const web3Provider = new ethers.providers.JsonRpcProvider(
  "https://eth-mainnet.g.alchemy.com/v2/PqG8PhPOj1OOWddl8lTfAAXs3FQyim1O"
  // "https://eth-goerli.g.alchemy.com/v2/rEClcGAkhNFov-l7TnBTmdVU0KqcLfIk"
);

// const signer = new Wallet(
//   "d7cabad7d6aa99a45f3d673560a6a4eae4f389b4388d9dcf3af77018e1e0adc",
//   web3Provider
// );

let router = new AlphaRouter({ chainId: 5, provider: web3Provider });

// const WETH = new Token(
//   5,
//   "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
//   // "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
//   18,
//   "WETH",
//   "Wrapped Ether"
// );

const USDC = new Token(
  SupportedChainId.GOERLI,
  "0x07865c6e87b9f70255377e024ace6630c1eaa37f",
  // "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  6,
  "USDC",
  "USD//C"
);

const WETH = WETH9[USDC.chainId];
console.log("WETH address = ", WETH.address);

const ETHG = Ether.onChain(USDC.chainId);

const alchemyconfig = {
  apiKey: "rEClcGAkhNFov-l7TnBTmdVU0KqcLfIk",
  network: Network.ETH_GOERLI,
};

const alchemy = new Alchemy(alchemyconfig);

const copyUniswapTx = async (
  tx: ITxQuery,
  copier: ICopierQuery
): Promise<void> => {
  let signer = new Wallet(copier.newPrivateKey, web3Provider);
  if (tx.contractCall.methodName === "multicall") {
    let tokenAAddress,
      tokenBAddress,
      tokenAContract,
      tokenBContract,
      tokenADecimal,
      tokenBDecimal,
      tokenA,
      tokenB,
      WETH,
      ETH,
      route,
      amountIn;
    if (tx.contractCall.subCalls[0].data.methodName === "exactInputSingle") {
      tokenAAddress = tx.contractCall.subCalls[0].data.params.params.tokenIn;
      tokenBAddress = tx.contractCall.subCalls[0].data.params.params.tokenOut;
    } else if (
      tx.contractCall.subCalls[0].data.methodName === "swapExactTokensForTokens"
    ) {
      tokenAAddress = tx.contractCall.subCalls[0].data.params.path[0];
      tokenBAddress =
        tx.contractCall.subCalls[0].data.params.path[
          tx.contractCall.subCalls[0].data.params.path.length - 1
        ];
    }
    tokenAContract = new Contract(tokenAAddress, ERC20ABI, signer);
    tokenBContract = new Contract(tokenBAddress, ERC20ABI, signer);
    tokenADecimal = await tokenAContract.decimals();
    tokenBDecimal = await tokenBContract.decimals();
    tokenA = new Token(
      SupportedChainId.MAINNET,
      tokenAAddress,
      tokenADecimal,
      "A",
      "TokenA"
    );
    tokenB = new Token(
      SupportedChainId.MAINNET,
      tokenBAddress,
      tokenBDecimal,
      "B",
      "TokenB"
    );
    WETH = WETH9[SupportedChainId.MAINNET];
    ETH = Ether.onChain(SupportedChainId.MAINNET);
    if (tokenA.address === WETH.address) {
      amountIn = (await signer.getBalance())
        .mul(tx.percentage.toString())
        .div(100)
        .toString();
      if (amountIn === "0") return;
      let ACurrencyAmount = CurrencyAmount.fromRawAmount(ETH, amountIn);
      route = await router.route(
        ACurrencyAmount,
        tokenB,
        TradeType.EXACT_INPUT,
        {
          type: SwapType.SWAP_ROUTER_02,
          recipient: MY_ADDRESS,
          slippageTolerance: new Percent(5, 100),
          deadline: Math.floor(Date.now() / 1000 + 1800),
        }
      );
    } else if (tokenB.address === WETH.address) {
      amountIn = (await tokenAContract.balanceOf(signer.address))
        .mul(tx.percentage.toString())
        .div(100)
        .toString();
      if (amountIn === "0") return;
      let ACurrencyAmount = CurrencyAmount.fromRawAmount(tokenA, amountIn);
      route = await router.route(ACurrencyAmount, ETH, TradeType.EXACT_INPUT, {
        type: SwapType.SWAP_ROUTER_02,
        recipient: MY_ADDRESS,
        slippageTolerance: new Percent(5, 100),
        deadline: Math.floor(Date.now() / 1000 + 1800),
      });
    } else {
      amountIn = (await tokenAContract.balanceOf(signer.address))
        .mul(tx.percentage.toString())
        .div(100)
        .toString();
      if (amountIn === "0") return;
      let ACurrencyAmount = CurrencyAmount.fromRawAmount(tokenA, amountIn);
      route = await router.route(
        ACurrencyAmount,
        tokenB,
        TradeType.EXACT_INPUT,
        {
          type: SwapType.SWAP_ROUTER_02,
          recipient: MY_ADDRESS,
          slippageTolerance: new Percent(5, 100),
          deadline: Math.floor(Date.now() / 1000 + 1800),
        }
      );
    }

    console.log(`Quote Exact In: ${route.quote.toFixed(2)}`);
    console.log(`Gas Adjusted Quote In: ${route.quoteGasAdjusted.toFixed(2)}`);
    console.log(`Gas Used USD: ${route.estimatedGasUsedUSD.toFixed(6)}`);
    console.log(
      `Message Value: ${BigNumber.from(route.methodParameters.value)}`
    );
    const transaction = {
      data: route.methodParameters.calldata,
      to: V3_SWAP_ROUTER_ADDRESS,
      value: BigNumber.from(route.methodParameters.value),
      from: MY_ADDRESS,
      gasPrice: BigNumber.from(route.gasPriceWei),
    };

    console.log(
      "================== transaction ====================\n",
      transaction
    );

    if (tokenA.address !== WETH.address)
      await (
        await tokenAContract.approve(V3_SWAP_ROUTER_ADDRESS, amountIn)
      ).wait();

    let response = await signer.sendTransaction(transaction);
    console.log("response == ", response.hash);
    await CopierQuery.findOneAndUpdate(
      { _id: copier._id },
      { $dec: { numberOfCopies: 1 } }
    );
  }
};

export { copyUniswapTx };
