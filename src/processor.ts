import processors from "./processors.config";

async function main() {
  const promises = processors.map(
    async ({
      filePath,
      network,
      mongoDbUrl,
      mongoDbName,
      identifier,
      contractAddresses,
      startBlock,
      filter,
      eventHandler,
      dataHandler,
    }) => {
      const processor = await import(filePath);
      new processor.default({
        network,
        mongoDbUrl,
        mongoDbName,
        identifier,
        contractAddresses,
        startBlock,
        filter,
      }).run(eventHandler, dataHandler);
    }
  );

  await Promise.all(promises);
}

main();
