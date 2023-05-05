import mongoose, { Schema } from "mongoose";

export interface ITransfer {
  id: string;
  contractAddress: string;
  tokenId: string;
  from: string;
  to: string;
  timestamp: Date;
  blockNumber: number;
  txHash: string;
}

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
    collection: "transfer",
    timestamps: true,
  }
);

TransferSchema.index(
  { contractAddress: 1, tokenId: 1, from: 1, to: 1, timestamp: 1 },
  { unique: true }
);

export const TransferModel = mongoose.model<ITransfer>(
  "transfer",
  TransferSchema
);
