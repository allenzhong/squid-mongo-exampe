import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import {
  EvmBatchProcessor,
  BatchProcessorItem,
  BatchHandlerContext,
} from "@subsquid/evm-processor";

import { lookupArchive } from "@subsquid/archive-registry";
import assert from "assert";
import { Owner, Token, Transfer } from "./model";
import * as bayc from "./abi/bayc";

type Item = BatchProcessorItem<typeof processor>;
type Context = BatchHandlerContext<Store, Item>;
interface RawTransfer {
  id: string;
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

function createOwners(rawTransfers: RawTransfer[]): Map<string, Owner> {
  let owners: Map<string, Owner> = new Map()
  for (let t of rawTransfers) {
      owners.set(t.from, new Owner({id: t.from}))
      owners.set(t.to, new Owner({id: t.to}))
  }
  return owners
}

function createTokens(
  rawTransfers: RawTransfer[],
  owners: Map<string, Owner>): Map<string, Token> {

  let tokens: Map<string, Token> = new Map()
  for (let t of rawTransfers) {
      let tokenIdString = `${t.tokenId}`
      tokens.set(tokenIdString, new Token({
          id: tokenIdString,
          tokenId: t.tokenId,
          owner: owners.get(t.to)
      }))
  }
  return tokens
}
function createTransfers(
  rawTransfers: RawTransfer[],
  owners: Map<string, Owner>,
  tokens: Map<string, Token>): Transfer[] {

  return rawTransfers.map(t => new Transfer({
      id: t.id,
      token: tokens.get(`${t.tokenId}`),
      from: owners.get(t.from),
      to: owners.get(t.to),
      timestamp: t.timestamp,
      blockNumber: t.blockNumber,
      txHash: t.txHash
  }))
}
processor.run(new TypeormDatabase(), async (ctx) => {
  let rawTransfers: RawTransfer[] = getRawTransfers(ctx)

  let owners: Map<string, Owner> = createOwners(rawTransfers)
  let tokens: Map<string, Token> = createTokens(rawTransfers, owners)
  let transfers: Transfer[] = createTransfers(rawTransfers, owners, tokens)

  await ctx.store.upsert([...owners.values()])
  await ctx.store.upsert([...tokens.values()])
  await ctx.store.insert(transfers)
});
