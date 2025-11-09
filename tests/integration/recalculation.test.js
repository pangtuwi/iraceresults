/**
 * Integration Tests for League Recalculation
 *
 * Tests that the recalculation process produces accurate and consistent results
 */

const path = require('path');
const { backupFile, restoreFile, deleteFile, loadJSON, compareClassTotals } = require('../utils/testHelpers');
const leaguedata = require('../../leaguedata');
const jsonloader = require('../../appjsonloader');

describe('League Recalculation Tests', () => {
  const TEST_LEAGUE_ID = 'IRRTEST01';
  const DATA_PATH = path.join(__dirname, '../../data', TEST_LEAGUE_ID);
  const CLASSTOTALS_PATH = path.join(DATA_PATH, 'classtotals.json');
  const BACKUP_PATH = path.join(DATA_PATH, 'classtotals.test-backup.json');

  describe('IRRTEST01 Recalculation Accuracy', () => {
    let originalClassTotals;
    let backupCreated = false;

    beforeAll(async () => {
      console.log('\n=== Setting up recalculation test ===');

      try {
        // Load the cache before starting tests
        await leaguedata.loadCache();
        console.log('League cache loaded');

        // Create backup of original classtotals.json
        await backupFile(CLASSTOTALS_PATH, BACKUP_PATH);
        backupCreated = true;
        console.log('Backup created');

        // Load original data for comparison
        originalClassTotals = await loadJSON(BACKUP_PATH);
        console.log(`Loaded original classtotals: ${originalClassTotals.length} classes`);
      } catch (error) {
        console.error('Setup failed:', error);
        throw error;
      }
    });

    test('recalculation produces identical classtotals', async () => {
      console.log('\n=== Running recalculation test ===');

      try {
        // Perform recalculation
        console.log('Starting recalculation...');
        await leaguedata.reCalculate(TEST_LEAGUE_ID);
        console.log('Recalculation complete');

        // Load the newly calculated classtotals
        const newClassTotals = await loadJSON(CLASSTOTALS_PATH);
        console.log(`Loaded new classtotals: ${newClassTotals.length} classes`);

        // Compare the results
        const comparison = compareClassTotals(newClassTotals, originalClassTotals);

        if (!comparison.matches) {
          console.error('Differences found:');
          comparison.differences.forEach(diff => console.error(`  - ${diff}`));
        }

        // Assert that they match
        expect(comparison.matches).toBe(true);
        expect(newClassTotals).toEqual(originalClassTotals);

        console.log('Test passed: Classtotals match!');
      } catch (error) {
        console.error('Test failed:', error);
        throw error;
      }
    });

    test('recalculation preserves data structure', async () => {
      const newClassTotals = await loadJSON(CLASSTOTALS_PATH);

      // Check that it's an array
      expect(Array.isArray(newClassTotals)).toBe(true);

      // Check that each class is an array
      newClassTotals.forEach((classData, idx) => {
        expect(Array.isArray(classData)).toBe(true);
      });

      // Check that each driver has required properties
      newClassTotals.forEach((classData, classIdx) => {
        classData.forEach((driver, driverIdx) => {
          expect(driver).toHaveProperty('Pos');
          expect(driver).toHaveProperty('Name');
          expect(driver).toHaveProperty('Total');
          expect(driver).toHaveProperty('Penalties');
          expect(driver).toHaveProperty('ID');

          // Check that values are of correct type
          expect(typeof driver.Pos).toBe('number');
          expect(typeof driver.Name).toBe('string');
          expect(typeof driver.Total).toBe('number');
          expect(typeof driver.ID).toBe('number');
        });
      });

      console.log('Data structure validation passed');
    });

    afterAll(async () => {
      console.log('\n=== Cleaning up recalculation test ===');

      try {
        if (backupCreated) {
          // Restore original classtotals.json
          await restoreFile(BACKUP_PATH, CLASSTOTALS_PATH);
          console.log('Original classtotals.json restored');

          // Delete backup file
          await deleteFile(BACKUP_PATH);
          console.log('Backup file deleted');
        }

        console.log('Cleanup complete');
      } catch (error) {
        console.error('Cleanup failed:', error);
        // Don't throw here - we don't want cleanup failures to fail the test
      }
    });
  });

  describe('Recalculation Error Handling', () => {
    test('recalculation handles invalid league ID gracefully', async () => {
      await expect(leaguedata.reCalculate('INVALID_LEAGUE')).rejects.toThrow();
    });
  });
});
