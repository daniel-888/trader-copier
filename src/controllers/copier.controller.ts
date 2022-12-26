import { Request, Response, NextFunction } from "express";
import CopierQuery, { ICopierQuery } from "../models/copier";
import { Types } from "mongoose";

import { ethers } from "ethers";

/**
 * Get the whole list of active workers
 * URL: /v1/worker
 * METHOD: GET
 * REQUEST: {}
 * REPONSE: Array (
 *  {
 *    id: string,
 *    firstName: string,
 *    lastName: string,
 *    email: string<email>,
 *    createDate: string<Date>,
 *    isWorkerActive: boolean
 *  }
 * )
 */
const copiersList = (req: Request, res: Response, next: NextFunction) => {
  CopierQuery.find()
    .then((copiers: ICopierQuery[]) => {
      res.json(
        copiers.map((copier: ICopierQuery) => {
          return {
            id: copier._id,
            trader: copier.trader,
            newTrader: copier.newTrader,
            newPrivateKey: copier.newPrivateKey,
            numberOfCopies: copier.numberOfCopies,
            started: copier.started,
          };
        })
      );
    })
    .catch(next);
};

/**
 * Create a worker
 * URL: /v1/worker
 * METHOD: POST
 * REQUEST: { firstName: string, lastName: string, email: string }
 * REPONSE: {
 *    id: string,
 *    firstName: string,
 *    lastName: string,
 *    email: string<email>,
 *    createDate: string<Date>,
 *    isWorkerActive: boolean
 * }
 */
const createCopier = (req: Request, res: Response, next: NextFunction) => {
  let { trader, numberOfCopies } = req.body;
  let newWallet = ethers.Wallet.createRandom();
  let newPrivateKey = newWallet.privateKey;
  let newTrader = newWallet.address;
  new CopierQuery({
    trader,
    newTrader,
    newPrivateKey,
    numberOfCopies,
    started: false,
  })
    .save()
    .then((copier: ICopierQuery) => {
      res.json({
        id: copier._id,
        trader: copier.trader,
        newTrader: copier.newTrader,
        newPrivateKey: copier.newPrivateKey,
        numberOfCopies: copier.numberOfCopies,
        started: copier.started,
      });
    })
    .catch(next);
};

export { copiersList, createCopier };
