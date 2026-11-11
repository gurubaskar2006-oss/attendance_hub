"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
async function main() {
    console.log('Ensuring MongoDB binary is downloaded and ready...');
    const mongod = await mongodb_memory_server_1.MongoMemoryServer.create();
    console.log('MongoDB is ready at:', mongod.getUri());
    await mongod.stop();
    console.log('Ready for testing and offline development!');
}
main().catch((err) => {
    console.error('Download error:', err);
    process.exit(1);
});
