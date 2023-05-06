import { lookupArchive } from "@subsquid/archive-registry";
import {
  BatchHandlerContext,
  BatchProcessorItem,
  EvmBatchProcessor,
  LogItem,
  TransactionItem,
} from "@subsquid/evm-processor";
import * as bayc from "../abi/bayc";
import { AddLogItem } from "@subsquid/evm-processor/lib/interfaces/dataSelection";
import { MongoDatabase, MongoStore } from "@allenzhong/squid-mongo";

export interface IProcessor {
  run: () => void;
}
export type TypedEvmBatchProcessor = EvmBatchProcessor<
  AddLogItem<
    LogItem | TransactionItem,
    LogItem<{
      evmLog: {
        topics: true;
        data: true;
      };
      transaction: {
        hash: true;
      };
    }>
  >
>;
export type TypedItem = BatchProcessorItem<TypedEvmBatchProcessor>;
export type TypedContext = BatchHandlerContext<MongoStore, TypedItem>;

export class BaseProcessor implements IProcessor {
  protected readonly identifier: string;
  protected readonly contractAddresses: string[];
  protected readonly startBlock: number;
  protected readonly mongoDbUrl: string;
  protected readonly mongoDbName: string;
  protected readonly processor: TypedEvmBatchProcessor;
  protected readonly mongoDb: MongoDatabase;
  public constructor(
    mongoDbUrl: string,
    mongoDbName: string,
    identifier: string,
    contract_addresses: string[],
    startBlock: number
  ) {
    this.identifier = identifier;
    this.contractAddresses = contract_addresses;
    this.mongoDbUrl = mongoDbUrl;
    this.mongoDbName = mongoDbName;
    this.startBlock = startBlock;

    this.mongoDb = new MongoDatabase({
      url: process.env.MONGODB_URL!,
      dbName: process.env.MONGODB_DB_NAME!,
      statusIdentifier: this.identifier,
    });

    this.processor = new EvmBatchProcessor()
      .setDataSource({
        archive: lookupArchive("eth-mainnet"),
      })
      .setBlockRange({
        from: this.startBlock,
      })
      .addLog(this.contractAddresses, {
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
  }

  public run() {
    throw new Error("Method not implemented.");
  }
}
