import { Schema, model, Document, trusted } from "mongoose";

export interface ICopierQuery extends Document {
  _id: Schema.Types.ObjectId;
  trader: string;
  newTrader: string;
  newPrivateKey: string;
  numberOfCopies: number;
  started: boolean;
}

const CopierShema: Schema = new Schema({
  trader: {
    type: String,
    required: true,
  },
  newTrader: {
    type: String,
    required: true,
  },
  newPrivateKey: {
    type: String,
    required: true,
  },
  numberOfCopies: {
    type: Number,
    required: true,
  },
  started: {
    type: Boolean,
    required: true,
  },
});

export default model<ICopierQuery>("copiers", CopierShema);
