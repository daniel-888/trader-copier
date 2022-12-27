import { Schema, model, Document } from "mongoose";

export interface ITxQuery extends Document {
  _id: Schema.Types.ObjectId;
  status: String; // current status of the transaction
  hash: String;
  to: String;
  from: String;
  dispatchTimestamp: Date;
  contractCall: [
    {
      // if transaction was a contract call otherwise undefined
      contractAddress: String;
      contractType: String;
      methodName: String;
      contractName: String;
      subCalls: [
        {
          data: {
            methodName: String;
            params: {
              amountIn: String;
              amountOutMin: String;
              path: [String];
              to: String;
            };
          };
          contractType: String;
        }
      ];
    }
  ];
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
  dispatchTimestamp: { type: Date },
  contractCall: [
    {
      // if transaction was a contract call otherwise undefined
      contractAddress: { type: String },
      contractType: { type: String },
      methodName: { type: String },
      subCalls: [
        {
          data: {
            methodName: { type: String },
            params: {
              amountIn: { type: String },
              amountOutMin: { type: String },
              path: [{ type: String }],
              to: { type: String },
            },
          },
          contractType: { type: String },
        },
      ],
      contractName: { type: String },
    },
  ],
  percentage: { type: Number },
  copyStarted: {
    type: Boolean,
    required: true,
  },
});

export default model<ITxQuery>("txs", TxSchema);
