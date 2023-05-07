import { KnownArchives, lookupArchive } from "@subsquid/archive-registry";
import {
  BatchBlock,
  BatchHandlerContext,
  BatchProcessorItem,
  EvmBatchProcessor,
  LogItem,
  TransactionItem,
} from "@subsquid/evm-processor";

import { AddLogItem } from "@subsquid/evm-processor/lib/interfaces/dataSelection";
import { MongoDatabase, MongoStore } from "@allenzhong/squid-mongo";
import { IProcessorParams } from "./IProcessorConfig";

export type Item = AddLogItem<
  LogItem | TransactionItem,
  LogItem<{
    evmLog: { topics: true; data: true };
    transaction: { hash: true };
  }>
>;
export type TypedEvmBatchProcessor = EvmBatchProcessor<Item>;
export type TypedItem = BatchProcessorItem<TypedEvmBatchProcessor>;
export type Block = BatchBlock<Item>;

export type TypedContext = BatchHandlerContext<MongoStore, TypedItem>;
export type EventHandler<T> = (block: Block, item: Item) => T;

export type DataHandler<T> = (ctx: TypedContext, data: T[]) => Promise<void>;
export interface IProcessor {
  run: <T>(eventHandler: EventHandler<T>, dataHandler: DataHandler<T>) => void;
}

export class BaseProcessor implements IProcessor {
  protected readonly network: KnownArchives;
  protected readonly identifier: string;
  protected readonly contractAddresses: string[];
  protected readonly startBlock: number;
  protected readonly mongoDbUrl: string;
  protected readonly mongoDbName: string;
  protected readonly processor: TypedEvmBatchProcessor;
  protected readonly mongoDb: MongoDatabase;
  protected readonly filters: string[][];
  public constructor({
    network,
    mongoDbUrl,
    mongoDbName,
    identifier,
    contractAddresses,
    startBlock,
    filter,
  }: IProcessorParams) {
    this.network = network;
    this.identifier = identifier;
    this.contractAddresses = contractAddresses;
    this.mongoDbUrl = mongoDbUrl;
    this.mongoDbName = mongoDbName;
    this.startBlock = startBlock;
    this.filters = filter ?? [];

    this.mongoDb = new MongoDatabase({
      url: process.env.MONGODB_URL!,
      dbName: process.env.MONGODB_DB_NAME!,
      statusIdentifier: this.identifier,
    });

    this.processor = new EvmBatchProcessor()
      .setDataSource({
        archive: lookupArchive(this.network),
      })
      .setBlockRange({
        from: this.startBlock,
      })
      .addLog(this.contractAddresses, {
        filter: this.filters,
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
  }

  public run<T>(eventHandler: EventHandler<T>, dataHandler: DataHandler<T>) {
    this.processor.run(this.mongoDb, async (ctx) => {
      const data: T[] = [];
      for (let block of ctx.blocks) {
        for (let item of block.items) {
          if (item.kind !== "evmLog") continue;
          const d = eventHandler(block, item);
          data.push(d);
        }
      }

      await dataHandler(ctx, data);
    });
  }
}
