import { ITransfer, TransferModel } from "../model/mongo/transfer";
import * as bayc from "../abi/bayc";
import dotenv from "dotenv";
import {
  BaseProcessor,
  TypedContext,
} from "./IProcessor";
dotenv.config();

interface RawTransfer {
  id: string;
  contractAddress: string;
  tokenId: number;
  from: string;
  to: string;
  timestamp: Date;
  blockNumber: number;
  txHash: string;
}

export default class BaycProcessor extends BaseProcessor {
  private getRawTransfers(ctx: TypedContext): RawTransfer[] {
    let transfers: RawTransfer[] = [];

    for (let block of ctx.blocks) {
      for (let item of block.items) {
        if (item.kind !== "evmLog") continue;
        let { from, to, tokenId } = bayc.events.Transfer.decode(item.evmLog);
        transfers.push({
          id: item.evmLog.id,
          contractAddress: item.evmLog.address,
          tokenId: tokenId.toNumber(),
          from,
          to,
          timestamp: new Date(block.header.timestamp),
          blockNumber: block.header.height,
          txHash: item.transaction.hash,
        });
      }
    }

    return transfers;
  }

  private createTransfers(rawTransfers: RawTransfer[]) {
    let transfers: ITransfer[] = [];
    for (let rawTransfer of rawTransfers) {
      let transfer: ITransfer = {
        id: rawTransfer.id,
        contractAddress: rawTransfer.contractAddress,
        tokenId: rawTransfer.tokenId.toString(),
        to: rawTransfer.to,
        from: rawTransfer.from,
        timestamp: rawTransfer.timestamp,
        blockNumber: rawTransfer.blockNumber,
        txHash: rawTransfer.txHash,
      };
      transfers.push(transfer);
    }
    return transfers;
  }

  private async saveTransfers(ctx: TypedContext, rawTransfers: RawTransfer[]) {
    const transfers = this.createTransfers(rawTransfers);
    await ctx.store.upsert(
      TransferModel,
      transfers,
      (t: ITransfer) => ({ id: t.id }),
      (t: ITransfer) => ({
        tokenId: t.tokenId,
        contractAddress: t.contractAddress,
        to: t.to,
        from: t.from,
        timestamp: t.timestamp,
        blockNumber: t.blockNumber,
        txHash: t.txHash,
      })
    );
  }

  run(): void {
    this.processor.run(this.mongoDb, async (ctx) => {
      const rawTransfers: RawTransfer[] = this.getRawTransfers(ctx);
      console.log(`Got ${rawTransfers.length} transfers`);
      await this.saveTransfers(ctx, rawTransfers);
    });
  }
}
