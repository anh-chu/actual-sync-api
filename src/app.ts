import 'dotenv/config';

import fs from 'node:fs';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

// @ts-ignore
import swaggerFile from './swagger_output.json' assert { type: "json" };

import config from './load-config.js';
import * as apiApp from './app-api.js';
import errorMiddleware from './util/error-middleware.js';

const app = express();

process.on('unhandledRejection', (reason) => {
  console.log('Rejection:', reason);
});

app.set('trust proxy', true);
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.raw({ type: 'application/actual-sync', limit: '20mb' }));
app.use(bodyParser.raw({ type: 'application/encrypted-file', limit: '50mb' }));
app.use(errorMiddleware);

app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))
app.use('/api', apiApp.handlers);

// The web frontend
app.use((req, res, next) => {
  res.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.set('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

if (!fs.existsSync(config.apiFiles)) {
  fs.mkdirSync(config.apiFiles);
}

app.listen(config.port, config.hostname, () => {
  console.log(`[server]: Server is running at http://${config.hostname}:${config.port}`);
});
