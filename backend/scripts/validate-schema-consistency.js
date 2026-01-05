#!/usr/bin/env node
/**
 * Schema Consistency Validator
 * 
 * This script checks for common issues that cause deployment failures:
 * 1. CamelCase fields in AuditLog.create calls (should be snake_case)
 * 2. Mismatched field names between models and queries
 * 3. Missing required fields in create calls
 * 
 * Run before deployment: node scripts/validate-schema-consistency.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
let errorCount = 0;
let warningCount = 0;

const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  reset: '\x1b[0m'
};

function error(file, line, message) {
  console.log(`${colors.red}ERROR${colors.reset} [${file}:${line}] ${message}`);
  errorCount++;
}

function warning(file, line, message) {
  console.log(`${colors.yellow}WARNING${colors.reset} [${file}:${line}] ${message}`);
  warningCount++;
}

function getAllJsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllJsFiles(fullPath, files);
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Patterns that indicate camelCase usage in AuditLog.create
const auditLogCamelCasePatterns = [
  /AuditLog\.create\(\{[^}]*\buserId:/,
  /AuditLog\.create\(\{[^}]*\buserRole:/,
  /AuditLog\.create\(\{[^}]*\bactionType:/,
  /AuditLog\.create\(\{[^}]*\bactionDescription:/,
  /AuditLog\.create\(\{[^}]*\btableName:/,
  /AuditLog\.create\(\{[^}]*\brecordId:/,
  /AuditLog\.create\(\{[^}]*\boldValues:/,
  /AuditLog\.create\(\{[^}]*\bnewValues:/
];

// Patterns for Transaction.create missing required fields
const transactionRequiredFields = ['type'];

// Patterns that indicate camelCase where snake_case is expected
const snakeCaseModels = ['Wallet', 'Expert', 'AuditLog', 'Transaction', 'EscrowAccount'];

console.log('='.repeat(60));
console.log('Schema Consistency Validator');
console.log('='.repeat(60));
console.log('');

const files = getAllJsFiles(srcDir);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(srcDir, file);

  // Check for AuditLog.create with camelCase (except through auditService)
  if (content.includes('AuditLog.create') && !file.includes('auditService')) {
    lines.forEach((line, idx) => {
      auditLogCamelCasePatterns.forEach(pattern => {
        if (pattern.test(line)) {
          error(relativePath, idx + 1, 
            'AuditLog.create uses camelCase field - should be snake_case (e.g., user_id, user_role)');
        }
      });
    });
  }

  // Check for Transaction.create without 'type' field
  if (content.includes('Transaction.create')) {
    lines.forEach((line, idx) => {
      if (line.includes('Transaction.create')) {
        // Look ahead for the type field in the next few lines
        const nextLines = lines.slice(idx, idx + 15).join('\n');
        if (!nextLines.includes("type:") && !nextLines.includes("type :")) {
          warning(relativePath, idx + 1, 
            'Transaction.create might be missing required "type" field');
        }
      }
    });
  }

  // Check for where clauses with userId on snake_case models
  lines.forEach((line, idx) => {
    if (line.includes('where:') && line.includes('userId:')) {
      // Check if this is a snake_case model query
      for (const model of snakeCaseModels) {
        if (lines.slice(Math.max(0, idx - 5), idx + 1).join('\n').includes(`${model}.find`)) {
          error(relativePath, idx + 1, 
            `${model} query uses 'userId' - should be 'user_id'`);
          break;
        }
      }
    }
  });
}

console.log('');
console.log('='.repeat(60));
console.log(`Results: ${colors.red}${errorCount} errors${colors.reset}, ${colors.yellow}${warningCount} warnings${colors.reset}`);
console.log('='.repeat(60));

if (errorCount > 0) {
  console.log(`\n${colors.red}FAILED${colors.reset}: Fix the errors above before deploying.`);
  process.exit(1);
} else if (warningCount > 0) {
  console.log(`\n${colors.yellow}PASSED WITH WARNINGS${colors.reset}: Review warnings before deploying.`);
  process.exit(0);
} else {
  console.log(`\n${colors.green}PASSED${colors.reset}: No schema consistency issues found.`);
  process.exit(0);
}
