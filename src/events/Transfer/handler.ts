import * as erc721 from "../../abi/erc721";
import { Block, EventHandler, Item, TypedContext } from "../../processors/IProcessor";
import { ITransfer, TransferModel } from "../../model/mongo/transfer";

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
