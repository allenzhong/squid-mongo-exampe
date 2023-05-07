import { KnownArchives } from "@subsquid/archive-registry";
import { DataHandler, EventHandler } from "./IProcessor";
export interface IProcessorParams { 
  network: KnownArchives;
  filePath: string;
  identifier: string;
  startBlock: number;
  contractAddresses: string[];
  mongoDbUrl: string;
  mongoDbName: string;
  filter: string[][];
}

export interface IProcessorConfig<T> {
  network: KnownArchives;
  filePath: string;
  identifier: string;
  startBlock: number;
  contractAddresses: string[];
  mongoDbUrl: string;
  mongoDbName: string;
  filter: string[][];
  eventHandler: EventHandler<T>;
  dataHandler: DataHandler<T>;
}
