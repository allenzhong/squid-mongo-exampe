import ProcessorsConfig from "./processors.config";

async function main() {
  const promises = ProcessorsConfig.map(
    async ({
      filePath,
      identifier,
      startBlock,
      contractAddresses,
      mongoDbUrl,
      mongoDbName,
    }) => {
      const processor = await import(filePath);
      new processor.default(
        mongoDbUrl,
        mongoDbName,
        identifier,
        contractAddresses,
        startBlock
      ).run();
    }
  );

  await Promise.all(promises);
}

main();
