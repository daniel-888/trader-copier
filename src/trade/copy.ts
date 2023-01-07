import TxQuery, { ITxQuery } from "../models/txTable";
import copyTx from "./copyTx";

const initCopy = async (): Promise<void> => {
  while (true) {
    try {
      let txs = await TxQuery.find({ copyStarted: false })
        .sort({ dispatchTimestamp: 1 });
  
      if (txs.length === 0) {
      }
      else {
        for (const tx of txs) {
          try {
            await copyTx(tx);
          } catch (error) {
            console.log(error);
          }
          TxQuery.updateOne({ _id: tx._id }, { copyStarted: true }).catch(
            (err) => {
              console.log(err);
            }
          );
        }
      }
    } catch (error) {
      console.log(error);      
    }
  }
};

export default initCopy;
