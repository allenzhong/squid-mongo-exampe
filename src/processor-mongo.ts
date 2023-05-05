import {
  EvmBatchProcessor,
  BatchProcessorItem,
  BatchHandlerContext,
} from "@subsquid/evm-processor";

import { lookupArchive } from "@subsquid/archive-registry";
import assert from "assert";
import { ITransfer, TransferModel } from "./model/mongo/transfer";
import * as bayc from "./abi/bayc";
import { MongoDatabase, MongoStore } from "@allenzhong/squid-mongo";
import dotenv from "dotenv";
dotenv.config();

type Item = BatchProcessorItem<typeof processor>;
type Context = BatchHandlerContext<MongoStore, Item>;
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

const CONTRACT_ADDRESS = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";

const processor = new EvmBatchProcessor()
  .setDataSource({
    archive: lookupArchive("eth-mainnet"),
  })
  .setBlockRange({
    from: 12_287_507,
  })
  .addLog(CONTRACT_ADDRESS, {
    filter: [[bayc.events.Transfer.topic]],
    data: {
      evmLog: {
        topics: true,
        data: true,
      },
      transaction: {
        hash: true,
      },
    },
  });

function getRawTransfers(ctx: Context): RawTransfer[] {
  let transfers: RawTransfer[] = [];

  for (let block of ctx.blocks) {
    for (let item of block.items) {
      if (item.kind !== "evmLog") continue;
      let { from, to, tokenId } = bayc.events.Transfer.decode(item.evmLog);
      transfers.push({
        id: item.evmLog.id,
        contractAddress: CONTRACT_ADDRESS,
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

function createTransfers(rawTransfers: RawTransfer[]) {
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

async function saveTransfers(ctx: Context, rawTransfers: RawTransfer[]) {
  const transfers = createTransfers(rawTransfers);
  await ctx.store.upsert(
    TransferModel,
    transfers,
    (t) => ({ id: t.id }),
    (t) => ({
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


processor.run(
  new MongoDatabase({
    url: process.env.MONGODB_URL!,
    dbName: process.env.MONGODB_DB_NAME!,
    statusIdentifier: CONTRACT_ADDRESS,
  }),
  async (ctx) => {
    const rawTransfers: RawTransfer[] = getRawTransfers(ctx);
    console.log(`Got ${rawTransfers.length} transfers`);
    await saveTransfers(ctx, rawTransfers);
  }
);
