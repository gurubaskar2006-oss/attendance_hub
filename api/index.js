const app = require('../server/dist/index.js');

const handler = app.default || app;

module.exports = (req, res) => {
  return handler(req, res);
};
