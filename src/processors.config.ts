import { IProcessorConfig } from "./processors/IProcessorConfig";
import * as erc721 from "./abi/erc721";
import { ITransfer } from "./events/Transfer/model";
import { dataHandler, eventHandler } from "./events/Transfer/handler";

export const ProcessorsConfig = [
  {
    network: "eth-mainnet",
    filePath: "./processors/processor-erc721",
    identifier: "erc721-transfer-processor",
    startBlock: 12_287_507,
    contractAddresses: [
      "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
      "0xCcc441ac31f02cD96C153DB6fd5Fe0a2F4e6A68d",
    ],
    mongoDbUrl: process.env.MONGODB_URL!,
    mongoDbName: process.env.MONGODB_DB_NAME!,
    filter: [[erc721.events.Transfer.topic]],
    eventHandler: eventHandler,
    dataHandler: dataHandler,
  },
];

export default ProcessorsConfig;
