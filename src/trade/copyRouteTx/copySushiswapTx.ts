import {
  Currency,
  ChainId,
  Token,
  WETH9,
  Trade,
  Route,
  TradeType,
  Router,
  Ether,
  Pair,
  CurrencyAmount,
  SwapParameters,
  Percent,
} from "@sushiswap/core-sdk";
import { ethers, Wallet, BigNumber, Contract } from "ethers";
import IUniswapV2Router02 from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { ITxQuery } from "../../models/txTable";
import CopierQuery, { ICopierQuery } from "../../models/copier";
import { ERC20ABI } from "../ERC20Abi";
import { SwapType } from "@uniswap/smart-order-router";

const SUSHISWAP_ROUTER_ADDRESS = "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f";
const MY_ADDRESS = "0x0485E62c3a8583DF0668CDd9a2fD599c5a98280e";
const web3Provider = new ethers.providers.JsonRpcProvider(
  // "https://eth-mainnet.g.alchemy.com/v2/PqG8PhPOj1OOWddl8lTfAAXs3FQyim1O"
  "https://eth-goerli.g.alchemy.com/v2/rEClcGAkhNFov-l7TnBTmdVU0KqcLfIk"
);
// const signer = new Wallet(
//   "d7cabad7d6aa99a45f3d673560a6a4eae4f389b4388d9dcf3af77018e1e0adc",
//   web3Provider
// );

const copySushiswapTx = async (
  tx: ITxQuery,
  copier: ICopierQuery
): Promise<void> => {
  let tokenA, tokenAAddress, tokenAContract, tokenADecimal;
  let tokenB, tokenBAddress, tokenBContract, tokenBDecimal;
  let tokenA_tokenB,
    amountIn,
    amountOut,
    route,
    trade,
    ACurrencyAmount,
    BCurrencyAmount;
  let WETH = WETH9[ChainId.ETHEREUM];
  let ETH = Ether.onChain(ChainId.ETHEREUM);
  let signer = new Wallet(
    "d7cabad7d6aa99a45f3d673560a6a4eae4f389b4388d9dcf3af77018e1e0adcf",
    web3Provider
  );
  tokenAAddress = tx.contractCall.params.path[0];
  tokenBAddress =
    tx.contractCall.params.path[tx.contractCall.params.path.length - 1];
  tokenAContract = new Contract(tokenAAddress, ERC20ABI, signer);
  tokenBContract = new Contract(tokenBAddress, ERC20ABI, signer);
  tokenADecimal = await tokenAContract.decimals();
  tokenBDecimal = await tokenBContract.decimals();
  tokenA = new Token(
    ChainId.ETHEREUM,
    tokenAAddress,
    tokenADecimal,
    "A",
    "TokenA"
  );
  tokenB = new Token(
    ChainId.ETHEREUM,
    tokenBAddress,
    tokenBDecimal,
    "B",
    "TokenB"
  );
  amountIn = (await tokenAContract.balanceOf(signer.address))
    .mul(tx.percentage.toString())
    .div(100)
    .toString();
  amountOut = BigNumber.from(tx.contractCall.params.amountOut)
    .mul(tx.percentage.toString())
    .div(100)
    .toString();
  tokenA_tokenB = new Pair(
    CurrencyAmount.fromRawAmount(tokenA, amountIn),
    CurrencyAmount.fromRawAmount(tokenB, amountOut)
  );
  switch (tx.contractCall.methodName) {
    case "swapExactTokensForETH":
      ACurrencyAmount = CurrencyAmount.fromRawAmount(tokenA, amountIn);
      BCurrencyAmount = CurrencyAmount.fromRawAmount(ETH, amountOut);
      route = new Route([tokenA_tokenB], tokenA, ETH);
      trade = new Trade(route, ACurrencyAmount, TradeType.EXACT_INPUT);
      break;
    case "swapExactTokensForTokens":
      ACurrencyAmount = CurrencyAmount.fromRawAmount(tokenA, amountIn);
      BCurrencyAmount = CurrencyAmount.fromRawAmount(tokenB, amountOut);
      route = new Route([tokenA_tokenB], tokenA, tokenB);
      trade = new Trade(route, ACurrencyAmount, TradeType.EXACT_INPUT);
      break;
    // no case percent 0
    case "swapTokensForExactTokens":
      ACurrencyAmount = CurrencyAmount.fromRawAmount(tokenA, amountIn);
      BCurrencyAmount = CurrencyAmount.fromRawAmount(tokenB, amountOut);
      route = new Route([tokenA_tokenB], tokenA, tokenB);
      trade = new Trade(route, BCurrencyAmount, TradeType.EXACT_OUTPUT);
      break;
    case "swapETHForExactTokens":
      ACurrencyAmount = CurrencyAmount.fromRawAmount(ETH, amountIn);
      BCurrencyAmount = CurrencyAmount.fromRawAmount(tokenB, amountOut);
      route = new Route([tokenA_tokenB], ETH, tokenB);
      trade = new Trade(route, BCurrencyAmount, TradeType.EXACT_OUTPUT);
    case "swapExactETHForTokens":
      ACurrencyAmount = CurrencyAmount.fromRawAmount(ETH, amountIn);
      BCurrencyAmount = CurrencyAmount.fromRawAmount(tokenB, amountOut);
      route = new Route([tokenA_tokenB], ETH, tokenB);
      trade = new Trade(route, ACurrencyAmount, TradeType.EXACT_INPUT);
      break;
    // no case percent 0
    case "swapTokensForExactETH":
      ACurrencyAmount = CurrencyAmount.fromRawAmount(tokenA, amountIn);
      BCurrencyAmount = CurrencyAmount.fromRawAmount(ETH, amountOut);
      route = new Route([tokenA_tokenB], tokenA, ETH);
      trade = new Trade(route, BCurrencyAmount, TradeType.EXACT_OUTPUT);
      break;
    default:
      break;
  }
  let swapParams: SwapParameters = Router.swapCallParameters(trade, {
    recipient: MY_ADDRESS,
    allowedSlippage: new Percent(5, 100),
    deadline: Math.floor(Date.now() / 1000 + 1800),
  });
  let sushiRouterV2 = new Contract(
    SUSHISWAP_ROUTER_ADDRESS,
    IUniswapV2Router02.abi,
    signer
  );
  if (tokenAAddress !== WETH.address)
    await (
      await tokenAContract.approve(SUSHISWAP_ROUTER_ADDRESS, amountIn)
    ).wait();

  let response = await (
    await sushiRouterV2[swapParams.methodName](...swapParams.args, {
      value: swapParams.value,
    })
  ).wait();

  await CopierQuery.findOneAndUpdate(
    { _id: copier._id },
    { $dec: { numberOfCopies: 1 } }
  );
};

export { copySushiswapTx };
