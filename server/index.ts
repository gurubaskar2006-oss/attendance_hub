import app from './src/index';

const handler: any = (app as any).default || app;

module.exports = handler;
export default handler;

