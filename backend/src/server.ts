import app from './app';
const env = require('./config/env');
const { conectarBanco } = require('./config/database');

async function main() {
  await conectarBanco();
  app.listen(env.port, () => {
    console.log(`DOTE API em http://localhost:${env.port}/api`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
