const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'logs') continue;
      walk(full, files);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

function hasLoggerUsage(content) {
  // Avoid false positives like "logger.js" filenames
  return /\blogger\s*\./.test(content);
}

function declaresLoggerIdentifier(content) {
  // Many controllers do: const logger = req.log?.child(...)
  // In that case, no import is required.
  return /\b(const|let|var)\s+logger\b/.test(content);
}

function exportsLoggerIdentifier(content) {
  return /\bmodule\.exports\s*=\s*logger\b/.test(content) ||
    /\bmodule\.exports\s*=\s*\{[^}]*\blogger\b/.test(content) ||
    /\bexports\.logger\b/.test(content);
}

function hasLoggerImport(content) {
  // Covers typical patterns used in this repo
  return (
    /require\((['"])\.\.\/config\/logger\1\)/.test(content) ||
    /require\((['"])\.\/config\/logger\1\)/.test(content) ||
    /require\((['"])\.\.\/\.\.\/config\/logger\1\)/.test(content) ||
    /require\((['"])\.\/logger\1\)/.test(content) ||
    /from\s+(['"])\.\.\/config\/logger\1/.test(content) ||
    /from\s+(['"])\.\/config\/logger\1/.test(content)
  );
}

function isLoggerDefinitionFile(filePath) {
  return filePath.endsWith(path.join('src', 'config', 'logger.js'));
}

function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  const files = walk(srcDir);

  const offenders = [];

  for (const file of files) {
    if (isLoggerDefinitionFile(file)) continue;

    const content = fs.readFileSync(file, 'utf8');
    if (!hasLoggerUsage(content)) continue;
    if (declaresLoggerIdentifier(content)) continue;
    if (exportsLoggerIdentifier(content)) continue;
    if (hasLoggerImport(content)) continue;

    offenders.push(path.relative(path.join(__dirname, '..'), file));
  }

  if (offenders.length) {
    console.error('Found files using logger.* without importing logger:');
    for (const f of offenders) console.error(' - ' + f);
    process.exitCode = 1;
  } else {
    console.log('OK: All files using logger.* import the logger module.');
  }
}

main();
