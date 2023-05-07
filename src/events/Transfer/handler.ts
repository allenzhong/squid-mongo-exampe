import * as erc721 from "../../abi/erc721";
import { Block, Item, TypedContext } from "../../processors/IProcessor";
import { IOwner, IToken, ITransfer } from "./interfaces";
import { OwnerModel } from "./models/owner";
import { TokenModel } from "./models/token";
import { TransferModel } from "./models/transfer";

export const eventHandler = (block: Block, item: Item) => {
  if (item.kind !== "evmLog") return;
  let { from, to, tokenId } = erc721.events.Transfer.decode(item.evmLog);
  return {
    id: item.evmLog.id,
    contractAddress: item.evmLog.address,
    tokenId: tokenId.toString(),
    from,
    to,
    timestamp: new Date(block.header.timestamp),
    blockNumber: block.header.height,
    txHash: item.transaction.hash,
  };
};

export const dataHandler = async (ctx: TypedContext, data: ITransfer[]) => {
  console.log(`[Transfer] ${data.length} items`);
  const owners = createOwners(data);
  const tokens = createTokens(data, owners);

  await ctx.store.upsert(
    OwnerModel,
    Array.from(owners.values()).map((o) => ({ id: o, address: o })),
    (o: IOwner) => ({
      address: o.address,
    }),
    (t: IOwner) => ({
      address: t.address,
    })
  );

  await ctx.store.upsert(
    TokenModel,
    Array.from(tokens.values()),
    (t: IToken) => ({ id: t.id }),
    (t: IToken) => ({ ...t })
  );

  await ctx.store.upsert(
    TransferModel,
    data,
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
};

const createOwners = (data: ITransfer[]) => {
  let owners: Map<string, string> = new Map();
  for (let t of data) {
    owners.set(t.from, t.from);
    owners.set(t.to, t.to);
  }
  return owners;
};

const createTokens = (data: ITransfer[], owners: Map<string, string>) => {
  let tokens: Map<string, IToken> = new Map();
  for (let t of data) {
    if (owners.get(t.to)) {
      tokens.set(t.tokenId, {
        id: `${t.contractAddress}_${t.tokenId}`,
        contractAddress: t.contractAddress,
        tokenId: t.tokenId,
        owner: owners.get(t.to)!,
      });
    }
  }
  return tokens;
};
