export interface IProcessorConfig {
  filePath: string;
  identifier: string;
  startBlock: number;
  contractAddresses: string[];
  mongoDbUrl: string;
  mongoDbName: string;
}

export const ProcessorsConfig: IProcessorConfig[] = [
  {
    filePath: "./processors/processor-bayc",
    identifier: "bayc",
    startBlock: 12_287_507,
    contractAddresses: ["0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"],
    mongoDbUrl: process.env.MONGODB_URL!,
    mongoDbName: process.env.MONGODB_DB_NAME!,
  },
  {
    filePath: "./processors/processor-fluf",
    identifier: "fluf",
    startBlock: 13450863,
    contractAddresses: ["0xCcc441ac31f02cD96C153DB6fd5Fe0a2F4e6A68d"],
    mongoDbUrl: process.env.MONGODB_URL!,
    mongoDbName: process.env.MONGODB_DB_NAME!,
  },
];

export default ProcessorsConfig;
