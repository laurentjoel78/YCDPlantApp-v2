require('dotenv').config();

const path = require('path');

const originalExit = process.exit.bind(process);
process.exit = (code) => {
  // eslint-disable-next-line no-console
  console.error('[require-smoke] process.exit called with:', code);
  // eslint-disable-next-line no-console
  console.error(new Error('[require-smoke] exit stack').stack);
  return originalExit(code);
};

process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('[require-smoke] uncaughtException:', err && err.stack ? err.stack : err);
  process.exitCode = process.exitCode || 1;
});

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[require-smoke] unhandledRejection:', reason && reason.stack ? reason.stack : reason);
  process.exitCode = process.exitCode || 1;
});

process.on('exit', (code) => {
  // eslint-disable-next-line no-console
  console.error('[require-smoke] process exiting. code=', code, 'exitCode=', process.exitCode);
});

const modulePath = process.argv[2];
if (!modulePath) {
  console.error('Usage: node scripts/require-smoke.js <modulePath>');
  process.exit(2);
}

try {
  const resolved = modulePath.startsWith('.') || modulePath.startsWith('/')
    ? path.resolve(process.cwd(), modulePath)
    : modulePath;

  // eslint-disable-next-line import/no-dynamic-require, global-require
  require(resolved);
  console.log(`OK: required ${modulePath}`);

  // Helpful signal if something set exitCode behind the scenes.
  // eslint-disable-next-line no-console
  console.error('[require-smoke] after require: exitCode=', process.exitCode);

  // Force a clean termination so any lingering handles don't make it look “stuck”.
  setImmediate(() => originalExit(process.exitCode || 0));
} catch (e) {
  console.error(`FAILED: require ${modulePath}`);
  console.error(e && e.stack ? e.stack : e);
  originalExit(1);
}
