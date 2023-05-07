import mongoose, { Schema } from "mongoose";
import { ITransfer } from "../interfaces";

export const TransferSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    contractAddress: { type: String, required: true },
    tokenId: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    timestamp: { type: Date, required: true },
    blockNumber: { type: Number, required: true },
    txHash: { type: String, required: true },
  },
  {
    collection: "transfers",
    timestamps: true,
  }
);

TransferSchema.index(
  { contractAddress: 1, tokenId: 1, from: 1, to: 1, timestamp: 1 },
  { unique: true }
);

export const TransferModel = mongoose.model<ITransfer>(
  "transfers",
  TransferSchema
);
