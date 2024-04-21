import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createDebug from 'debug';

const debug = createDebug('actual:config');
// const debugSensitive = createDebug('actual-sensitive:config');

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
debug(`project root: '${projectRoot}'`);
export const sqlDir = path.join(projectRoot, 'src', 'sql');

let defaultDataDir = fs.existsSync('/data') ? '/data' : projectRoot;
debug(`default data directory: '${defaultDataDir}'`);

function parseJSON(path, allowMissing = false) {
  let text;
  try {
    text = fs.readFileSync(path, 'utf8');
  } catch (e) {
    if (allowMissing) {
      debug(`config file '${path}' not found, ignoring.`);
      return {};
    }
    throw e;
  }
  return JSON.parse(text);
}

let userConfig;

let configFile = path.join(projectRoot, 'config.json');

if (!fs.existsSync(configFile)) {
  configFile = path.join(defaultDataDir, 'config.json');
}

debug(`loading config from default path: '${configFile}'`);
userConfig = parseJSON(configFile, true);

/** @type {Omit<import('./config-types.js').Config, 'mode' | 'dataDir' | 'serverFiles' | 'apiFiles' | 'userFiles'>} */
let defaultConfig = {
  port: 5007,
  hostname: 'localhost',
  upload: {
    fileSizeSyncLimitMB: 20,
    syncEncryptedFileSizeLimitMB: 50,
    fileSizeLimitMB: 20,
  },
};

/** @type {import('./config-types.js').Config} */
let config;
if (process.env.NODE_ENV === 'test') {
  config = {
    mode: 'test',
    dataDir: projectRoot,
    apiFiles: path.join(projectRoot, 'test-api-files'),
    ...defaultConfig,
  };
} else {
  config = {
    mode: 'development',
    ...defaultConfig,
    dataDir: defaultDataDir,
    apiFiles: path.join(defaultDataDir, 'api-files'),
    ...(userConfig || {}),
  };
}

const finalConfig = {
  ...config,
  actualUrl: process.env.ACTUAL_URL,
  port: +process.env.API_PORT! || +process.env.PORT! || config.port,
  hostname: process.env.API_HOSTNAME || config.hostname,
  apiFiles: process.env.API_FILES || config.apiFiles,
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: process.env.REDIS_PORT || 6379,
  https:
    process.env.ACTUAL_HTTPS_KEY && process.env.ACTUAL_HTTPS_CERT
      ? {
          key: process.env.ACTUAL_HTTPS_KEY.replace(/\\n/g, '\n'),
          cert: process.env.ACTUAL_HTTPS_CERT.replace(/\\n/g, '\n'),
          ...(config.https || {}),
        }
      : config.https,
  upload:
    process.env.ACTUAL_UPLOAD_FILE_SYNC_SIZE_LIMIT_MB ||
    process.env.ACTUAL_UPLOAD_SYNC_ENCRYPTED_FILE_SYNC_SIZE_LIMIT_MB ||
    process.env.ACTUAL_UPLOAD_FILE_SIZE_LIMIT_MB
      ? {
          fileSizeSyncLimitMB:
            +process.env.ACTUAL_UPLOAD_FILE_SYNC_SIZE_LIMIT_MB! ||
            +process.env.ACTUAL_UPLOAD_FILE_SIZE_LIMIT_MB! ||
            config.upload.fileSizeSyncLimitMB,
          syncEncryptedFileSizeLimitMB:
            +process.env.ACTUAL_UPLOAD_SYNC_ENCRYPTED_FILE_SYNC_SIZE_LIMIT_MB! ||
            +process.env.ACTUAL_UPLOAD_FILE_SIZE_LIMIT_MB! ||
            config.upload.syncEncryptedFileSizeLimitMB,
          fileSizeLimitMB:
            +process.env.ACTUAL_UPLOAD_FILE_SIZE_LIMIT_MB! ||
            config.upload.fileSizeLimitMB,
        }
      : config.upload,
};

debug(`using Actual URL ${finalConfig.actualUrl}`);
debug(`using port ${finalConfig.port}`);
debug(`using hostname ${finalConfig.hostname}`);
debug(`using server files directory ${finalConfig.serverFiles}`);
debug(`using user files directory ${finalConfig.userFiles}`);
debug(`using web root directory ${finalConfig.webRoot}`);

if (finalConfig.upload) {
  debug(`using file sync limit ${finalConfig.upload.fileSizeSyncLimitMB}mb`);
  debug(
    `using sync encrypted file limit ${finalConfig.upload.syncEncryptedFileSizeLimitMB}mb`,
  );
  debug(`using file limit ${finalConfig.upload.fileSizeLimitMB}mb`);
}

export default finalConfig;