"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await (0, database_1.connectMemoryDatabase)();
}, 300000);
afterAll(async () => {
    await (0, database_1.disconnectDatabase)();
});
