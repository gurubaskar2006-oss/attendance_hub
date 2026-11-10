import { MongoMemoryServer } from 'mongodb-memory-server';

async function main() {
  console.log('Ensuring MongoDB binary is downloaded and ready...');
  const mongod = await MongoMemoryServer.create();
  console.log('MongoDB is ready at:', mongod.getUri());
  await mongod.stop();
  console.log('Ready for testing and offline development!');
}

main().catch((err) => {
  console.error('Download error:', err);
  process.exit(1);
});

