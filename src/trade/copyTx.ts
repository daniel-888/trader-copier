import { copyUniswapTx, copySushiswapTx } from "./copyRouteTx";

import { ITxQuery } from "../models/txTable";
import CopierQuery, { ICopierQuery } from "../models/copier";
import routers from "./routers";

const copyTx = async (tx: ITxQuery): Promise<void> => {
  console.log("tx copied: ", tx);

  let copiers = await CopierQuery.find({
    trader: tx.from,
    numberOfCopies: { $ne: 0 },
  });
  for (let i = 0; i < copiers.length; i++) {
    switch (tx.to) {
      case routers.uniswapAutoRouter:
        await copyUniswapTx(tx, copiers[i]);
        break;
      case routers.sushiswapRouter:
        await copySushiswapTx(tx, copiers[i]);
        break;
      default:
        break;
    }
  }
  // uniswap test trade
  // const value = "10000000000000000";
  // const wethAmount = CurrencyAmount.fromRawAmount(ETHG, value);

  // console.log("**********************route started");
  // const route = await router.route(wethAmount, USDC, TradeType.EXACT_INPUT, {
  //   type: SwapType.SWAP_ROUTER_02,
  //   recipient: MY_ADDRESS,
  //   slippageTolerance: new Percent(5, 100),
  //   deadline: Math.floor(Date.now() / 1000 + 1800),
  // });
  // console.log(`Quote Exact In: ${route.quote.toFixed(2)}`);
  // console.log(`Gas Adjusted Quote In: ${route.quoteGasAdjusted.toFixed(2)}`);
  // console.log(`Gas Used USD: ${route.estimatedGasUsedUSD.toFixed(6)}`);
  // console.log(`Message Value: ${BigNumber.from(route.methodParameters.value)}`);
  // const transaction = {
  //   data: route.methodParameters.calldata,
  //   to: V3_SWAP_ROUTER_ADDRESS,
  //   value: BigNumber.from(route.methodParameters.value),
  //   from: MY_ADDRESS,
  //   gasPrice: BigNumber.from(route.gasPriceWei),
  // };

  // console.log(
  //   "================== transaction ====================\n",
  //   transaction
  // );

  // // let ERC20Interface = new Interface([
  // //   "function approve(address _spender, uint256 value)",
  // // ]);

  // // const WETHContract = new Contract(WETH.address, ERC20Interface, signer);
  // // await (await WETHContract.approve(V3_SWAP_ROUTER_ADDRESS, value)).wait();

  // let response = await signer.sendTransaction(transaction);
  // console.log("response == ", response.hash);
};

export default copyTx;
