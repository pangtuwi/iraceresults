/**
 * Test Helper Utilities
 * Common functions used across test files
 */

const fs = require('fs/promises');
const path = require('path');

/**
 * Create a backup copy of a file
 * @param {string} sourcePath - Path to source file
 * @param {string} backupPath - Path for backup file
 */
async function backupFile(sourcePath, backupPath) {
  try {
    await fs.copyFile(sourcePath, backupPath);
    console.log(`Backed up ${sourcePath} to ${backupPath}`);
  } catch (error) {
    throw new Error(`Failed to backup file: ${error.message}`);
  }
}

/**
 * Restore a file from backup
 * @param {string} backupPath - Path to backup file
 * @param {string} targetPath - Path to restore to
 */
async function restoreFile(backupPath, targetPath) {
  try {
    await fs.copyFile(backupPath, targetPath);
    console.log(`Restored ${backupPath} to ${targetPath}`);
  } catch (error) {
    throw new Error(`Failed to restore file: ${error.message}`);
  }
}

/**
 * Delete a file
 * @param {string} filePath - Path to file to delete
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`Deleted ${filePath}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}

/**
 * Load JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<any>} Parsed JSON data
 */
async function loadJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load JSON from ${filePath}: ${error.message}`);
  }
}

/**
 * Save JSON file
 * @param {string} filePath - Path to save JSON file
 * @param {any} data - Data to save
 */
async function saveJSON(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Saved JSON to ${filePath}`);
  } catch (error) {
    throw new Error(`Failed to save JSON to ${filePath}: ${error.message}`);
  }
}

/**
 * Deep comparison of class totals with detailed error reporting
 * @param {Array} actual - Actual class totals
 * @param {Array} expected - Expected class totals
 * @returns {Object} Comparison result { matches: boolean, differences: Array }
 */
function compareClassTotals(actual, expected) {
  const differences = [];

  // Check if both are arrays
  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    return {
      matches: false,
      differences: ['One or both inputs are not arrays']
    };
  }

  // Check array lengths
  if (actual.length !== expected.length) {
    differences.push(`Number of classes differs: actual=${actual.length}, expected=${expected.length}`);
  }

  // Compare each class
  const classCount = Math.min(actual.length, expected.length);
  for (let classIdx = 0; classIdx < classCount; classIdx++) {
    const actualClass = actual[classIdx];
    const expectedClass = expected[classIdx];

    if (!Array.isArray(actualClass) || !Array.isArray(expectedClass)) {
      differences.push(`Class ${classIdx}: Not an array`);
      continue;
    }

    // Check number of drivers in class
    if (actualClass.length !== expectedClass.length) {
      differences.push(`Class ${classIdx}: Driver count differs: actual=${actualClass.length}, expected=${expectedClass.length}`);
    }

    // Compare each driver
    const driverCount = Math.min(actualClass.length, expectedClass.length);
    for (let driverIdx = 0; driverIdx < driverCount; driverIdx++) {
      const actualDriver = actualClass[driverIdx];
      const expectedDriver = expectedClass[driverIdx];

      // Compare each property
      const allKeys = new Set([...Object.keys(actualDriver), ...Object.keys(expectedDriver)]);
      for (const key of allKeys) {
        if (actualDriver[key] !== expectedDriver[key]) {
          differences.push(
            `Class ${classIdx}, Driver ${driverIdx} (${actualDriver.Name || 'Unknown'}): ` +
            `${key} differs: actual=${actualDriver[key]}, expected=${expectedDriver[key]}`
          );
        }
      }
    }
  }

  return {
    matches: differences.length === 0,
    differences
  };
}

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 */
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  backupFile,
  restoreFile,
  deleteFile,
  loadJSON,
  saveJSON,
  compareClassTotals,
  wait
};
