import Redlock from 'redlock';
import ioredis from 'ioredis';
import { createClient } from 'redis';
import JWTR from 'jwt-redis';

import finalConfig from '../load-config.js';

// Initialize client with redis
export const redisClient = createClient({
  url: `redis://${finalConfig.redisHost}:${finalConfig.redisPort}`,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

await redisClient.connect();

export const sessionPrefix = 'actual:';
export const credsPrefix = 'actualCreds:';

// @ts-ignore
export const jwtr = new JWTR.default(redisClient);

// 12h
export const expiresIn = 1000 * 60 * 60 * 12;

// Create a Redlock instance for distributed locking
export const redlock = new Redlock([
  // @ts-ignore
  new ioredis.Redis(`redis://${finalConfig.redisHost}:${finalConfig.redisPort}`),
]);

export const config = {
  dataDir: finalConfig.apiFiles,
  serverURL: finalConfig.actualUrl,
};