import { Schema, model, Document } from "mongoose";

export interface ITxQuery extends Document {
  _id: Schema.Types.ObjectId;
  status: string; // current status of the transaction
  hash: string;
  to: string;
  from: string;
  value: string;
  dispatchTimestamp: Date;
  contractCall: {
    // if transaction was a contract call otherwise undefined
    contractAddress: string;
    contractType: string;
    methodName: string; // uniswap - multicall, sushiswap - swapExactTokensForEth/swapExactTokensForTokens
    contractName: string;
    // for sushiswap
    params: {
      amountIn: string;
      amountOutMin: string;
      amountOut: string;
      path: [string];
      to: string;
      deadline: string;
    };
    // for uniswap
    subCalls: [
      {
        data: {
          methodName: string; // exactInputSingle
          params: {
            // when methodname is exactInputSingle
            params: {
              tokenIn: string;
              tokenOut: string;
              fee: Number;
              recipient: string;
              amountIn: string;
              amountOutMinimum: string;
              sqrtPriceLimitX96: Number;
            };
            // methodname is multicall
            amountIn: string;
            amountOutMin: string;
            path: [string];
            to: string;
          };
        };
        contractType: string;
      }
    ];
  };
  percentage: Number;
  copyStarted: boolean;
}

const TxSchema: Schema = new Schema({
  status: {
    type: String,
  }, // current status of the transaction
  hash: {
    type: String,
  },
  to: { type: String },
  from: { type: String },
  value: { type: String },
  dispatchTimestamp: { type: Date },
  contractCall: {
    // if transaction was a contract call otherwise undefined
    contractAddress: { type: String },
    contractType: { type: String },
    methodName: { type: String },
    contractName: { type: String },
    params: {
      amountIn: { type: String },
      amountOutMin: { type: String },
      amountOut: { type: String },
      path: [{ type: String }],
      to: { type: String },
      deadline: { type: String },
    },
    subCalls: [
      {
        data: {
          methodName: { type: String },
          params: {
            params: {
              tokenIn: { type: String },
              tokenOut: { type: String },
              fee: { type: Number },
              recipient: { type: String },
              amountIn: { type: String },
              amountOutMinimum: { type: String },
              sqrtPriceLimitX96: { type: Number },
            },
            amountIn: { type: String },
            amountOutMin: { type: String },
            path: [{ type: String }],
            to: { type: String },
          },
        },
        contractType: { type: String },
      },
    ],
  },
  percentage: { type: Number },
  copyStarted: {
    type: Boolean,
    required: true,
  },
});

export default model<ITxQuery>("txs", TxSchema);
