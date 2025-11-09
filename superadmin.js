const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');
const config = require('./appconfig');
const auth = require('./auth');

// Use auth.ensureSuperAdmin middleware for all routes
router.use(auth.ensureSuperAdmin);

// Serve super admin page
router.get('/', function (req, res) {
   res.sendFile(path.join(__dirname, '/html/superadmin.html'));
});

// Get list of leagues
router.get('/leagues', function (req, res) {
   try {
      const leagues = config.leagueIDs.map(leagueID => {
         const configPath = path.join(__dirname, 'data', leagueID, 'config.json');
         try {
            // Clear the require cache to get fresh data
            delete require.cache[require.resolve(configPath)];
            const configData = require(configPath);
            return {
               leagueID: leagueID,
               leagueName: configData.league_name || leagueID,
               leagueStatus: configData.league_status !== undefined ? configData.league_status : 1
            };
         } catch (err) {
            return {
               leagueID: leagueID,
               leagueName: leagueID,
               leagueStatus: 1
            };
         }
      });
      res.json(leagues);
   } catch (error) {
      console.error("Error getting leagues:", error);
      res.status(500).json({ error: error.message });
   }
});

// Create new league
router.post('/createleague', async function (req, res) {
   const { leagueID, leagueName } = req.body;

   if (!leagueID || !leagueName) {
      return res.status(400).json({ error: "Missing leagueID or leagueName" });
   }

   try {
      // Check if league already exists
      if (config.leagueIDs.includes(leagueID)) {
         return res.status(400).json({ error: "League ID already exists" });
      }

      const templatePath = path.join(__dirname, 'data', 'TEMPLATE');
      const newLeaguePath = path.join(__dirname, 'data', leagueID);

      // Check if directory already exists
      try {
         await fs.access(newLeaguePath);
         return res.status(400).json({ error: "League directory already exists" });
      } catch (err) {
         // Directory doesn't exist, which is good
      }

      // Copy template directory
      await copyDirectory(templatePath, newLeaguePath);

      // Update config.json with league name
      const configPath = path.join(newLeaguePath, 'config.json');
      const configData = JSON.parse(await fs.readFile(configPath, 'utf8'));
      configData.league_name = leagueName;
      await fs.writeFile(configPath, JSON.stringify(configData, null, 3));

      // Add to config.json
      config.leagueIDs.push(leagueID);
      await updateConfigJson(config.leagueIDs);

      res.json({ confirmation: "League created successfully" });
   } catch (error) {
      console.error("Error creating league:", error);
      res.status(500).json({ error: error.message });
   }
});

// Delete league
router.post('/deleteleague', async function (req, res) {
   const { leagueID } = req.body;

   if (!leagueID) {
      return res.status(400).json({ error: "Missing leagueID" });
   }

   try {
      // Remove from config
      const index = config.leagueIDs.indexOf(leagueID);
      if (index > -1) {
         config.leagueIDs.splice(index, 1);
         await updateConfigJson(config.leagueIDs);
      }

      // Delete directory (optional - commented out for safety)
      // const leaguePath = path.join(__dirname, 'data', leagueID);
      // await fs.rm(leaguePath, { recursive: true, force: true });

      res.json({ confirmation: "League removed from config (data directory preserved)" });
   } catch (error) {
      console.error("Error deleting league:", error);
      res.status(500).json({ error: error.message });
   }
});

// Update league status
router.post('/updateleaguestatus', async function (req, res) {
   const { leagueID, leagueStatus } = req.body;

   if (!leagueID) {
      return res.status(400).json({ error: "Missing leagueID" });
   }

   if (leagueStatus === undefined || leagueStatus === null) {
      return res.status(400).json({ error: "Missing leagueStatus" });
   }

   try {
      const configPath = path.join(__dirname, 'data', leagueID, 'config.json');
      const configData = JSON.parse(await fs.readFile(configPath, 'utf8'));
      configData.league_status = parseInt(leagueStatus);
      await fs.writeFile(configPath, JSON.stringify(configData, null, 3));

      // Clear the require cache for this config file
      delete require.cache[require.resolve(configPath)];

      // Update the leaguedata cache with the new status
      const leaguedata = require('./leaguedata.js');
      if (leaguedata.cache[leagueID] && leaguedata.cache[leagueID].config) {
         leaguedata.cache[leagueID].config.league_status = parseInt(leagueStatus);
      }

      res.json({ confirmation: "League status updated successfully" });
   } catch (error) {
      console.error("Error updating league status:", error);
      res.status(500).json({ error: error.message });
   }
});

// Get points.json for a league
router.get('/points/:leagueID', async function (req, res) {
   const leagueID = req.params.leagueID.toUpperCase();

   try {
      const pointsPath = path.join(__dirname, 'data', leagueID, 'points.json');
      const pointsData = JSON.parse(await fs.readFile(pointsPath, 'utf8'));
      res.json(pointsData);
   } catch (error) {
      console.error("Error reading points:", error);
      res.status(500).json({ error: error.message });
   }
});

// Save points.json for a league
router.post('/points/:leagueID', async function (req, res) {
   const leagueID = req.params.leagueID.toUpperCase();

   try {
      const pointsPath = path.join(__dirname, 'data', leagueID, 'points.json');
      await fs.writeFile(pointsPath, JSON.stringify(req.body, null, 3));
      res.json({ confirmation: "Points saved successfully" });
   } catch (error) {
      console.error("Error saving points:", error);
      res.status(500).json({ error: error.message });
   }
});

// Get scoring.json for a league
router.get('/scoring/:leagueID', async function (req, res) {
   const leagueID = req.params.leagueID.toUpperCase();

   try {
      const scoringPath = path.join(__dirname, 'data', leagueID, 'scoring.json');
      const scoringData = JSON.parse(await fs.readFile(scoringPath, 'utf8'));
      res.json(scoringData);
   } catch (error) {
      console.error("Error reading scoring:", error);
      res.status(500).json({ error: error.message });
   }
});

// Save scoring.json for a league
router.post('/scoring/:leagueID', async function (req, res) {
   const leagueID = req.params.leagueID.toUpperCase();

   try {
      const scoringPath = path.join(__dirname, 'data', leagueID, 'scoring.json');
      await fs.writeFile(scoringPath, JSON.stringify(req.body, null, 3));
      res.json({ confirmation: "Scoring saved successfully" });
   } catch (error) {
      console.error("Error saving scoring:", error);
      res.status(500).json({ error: error.message });
   }
});

// Get rounds.json for a league
router.get('/rounds/:leagueID', async function (req, res) {
   const leagueID = req.params.leagueID.toUpperCase();

   try {
      const roundsPath = path.join(__dirname, 'data', leagueID, 'rounds.json');
      const roundsData = JSON.parse(await fs.readFile(roundsPath, 'utf8'));
      res.json(roundsData);
   } catch (error) {
      console.error("Error reading rounds:", error);
      res.status(500).json({ error: error.message });
   }
});

// Save rounds.json for a league
router.post('/rounds/:leagueID', async function (req, res) {
   const leagueID = req.params.leagueID.toUpperCase();

   try {
      const roundsPath = path.join(__dirname, 'data', leagueID, 'rounds.json');
      await fs.writeFile(roundsPath, JSON.stringify(req.body, null, 3));
      res.json({ confirmation: "Rounds saved successfully" });
   } catch (error) {
      console.error("Error saving rounds:", error);
      res.status(500).json({ error: error.message });
   }
});

// Get classes.json for a league
router.get('/classes/:leagueID', async function (req, res) {
   const leagueID = req.params.leagueID.toUpperCase();

   try {
      const classesPath = path.join(__dirname, 'data', leagueID, 'classes.json');
      const classesData = JSON.parse(await fs.readFile(classesPath, 'utf8'));
      res.json(classesData);
   } catch (error) {
      console.error("Error reading classes:", error);
      res.status(500).json({ error: error.message });
   }
});

// Save classes.json for a league
router.post('/classes/:leagueID', async function (req, res) {
   const leagueID = req.params.leagueID.toUpperCase();

   try {
      const classesPath = path.join(__dirname, 'data', leagueID, 'classes.json');
      await fs.writeFile(classesPath, JSON.stringify(req.body, null, 3));
      res.json({ confirmation: "Classes saved successfully" });
   } catch (error) {
      console.error("Error saving classes:", error);
      res.status(500).json({ error: error.message });
   }
});

// Get tracks.json
router.get('/tracks', async function (req, res) {
   try {
      const tracksPath = path.join(__dirname, 'tracks.json');
      const tracksData = JSON.parse(await fs.readFile(tracksPath, 'utf8'));
      res.json(tracksData);
   } catch (error) {
      console.error("Error reading tracks:", error);
      res.status(500).json({ error: error.message });
   }
});

// Save tracks.json
router.post('/tracks', async function (req, res) {
   try {
      const tracksPath = path.join(__dirname, 'tracks.json');
      await fs.writeFile(tracksPath, JSON.stringify(req.body, null, 3));
      res.json({ confirmation: "Tracks saved successfully" });
   } catch (error) {
      console.error("Error saving tracks:", error);
      res.status(500).json({ error: error.message });
   }
});

// Upload track map
router.post('/uploadtrackmap', async function (req, res) {
   try {
      const { shortName, imageData } = req.body;

      if (!shortName || !imageData) {
         return res.status(400).json({ error: "Missing shortName or imageData" });
      }

      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/png;base64,/, '');

      const trackmapsPath = path.join(__dirname, 'trackmaps', `${shortName.toLowerCase()}.png`);
      await fs.writeFile(trackmapsPath, base64Data, 'base64');

      res.json({ confirmation: "Track map uploaded successfully" });
   } catch (error) {
      console.error("Error uploading track map:", error);
      res.status(500).json({ error: error.message });
   }
});

// Validate track maps
router.get('/validate-trackmaps', async function (req, res) {
   try {
      // 1. Get all track names used in rounds across all leagues
      const tracksUsedInRounds = new Map(); // Map<trackName, Set<leagueID>>

      for (const leagueID of config.leagueIDs) {
         try {
            const roundsPath = path.join(__dirname, 'data', leagueID, 'rounds.json');
            const roundsData = JSON.parse(await fs.readFile(roundsPath, 'utf8'));

            roundsData.forEach(round => {
               if (round.track_name) {
                  if (!tracksUsedInRounds.has(round.track_name)) {
                     tracksUsedInRounds.set(round.track_name, new Set());
                  }
                  tracksUsedInRounds.get(round.track_name).add(leagueID);
               }
            });
         } catch (err) {
            console.log(`Could not read rounds for league ${leagueID}:`, err.message);
         }
      }

      // 2. Get all tracks registered in tracks.json
      const tracksPath = path.join(__dirname, 'tracks.json');
      const tracksData = JSON.parse(await fs.readFile(tracksPath, 'utf8'));
      const registeredTracks = new Set(tracksData.map(t => t.short_name));

      // 3. Get all track map PNG files from /trackmaps
      const trackmapsDir = path.join(__dirname, 'trackmaps');
      const trackMapFiles = await fs.readdir(trackmapsDir);
      const availableTrackMaps = new Set(
         trackMapFiles
            .filter(file => file.endsWith('.png') && file !== 'blank.png' && file !== 'nomap.png')
            .map(file => file.replace('.png', ''))
      );

      // 4. Find tracks used in rounds but missing from tracks.json
      const missingFromTracksList = [];
      tracksUsedInRounds.forEach((leagues, trackName) => {
         if (!registeredTracks.has(trackName)) {
            missingFromTracksList.push({
               trackName: trackName,
               usedByLeagues: Array.from(leagues)
            });
         }
      });

      // 5. Find tracks in tracks.json but missing PNG files
      const missingTrackMapFiles = [];
      tracksData.forEach(track => {
         const shortNameLower = track.short_name.toLowerCase();
         if (!availableTrackMaps.has(shortNameLower)) {
            missingTrackMapFiles.push({
               fullName: track.full_name,
               shortName: track.short_name
            });
         }
      });

      res.json({
         missingFromTracksList,
         missingTrackMapFiles
      });
   } catch (error) {
      console.error("Error validating track maps:", error);
      res.status(500).json({ error: error.message });
   }
});

// Helper functions

async function copyDirectory(src, dest) {
   await fs.mkdir(dest, { recursive: true });
   const entries = await fs.readdir(src, { withFileTypes: true });

   for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
         await copyDirectory(srcPath, destPath);
      } else {
         await fs.copyFile(srcPath, destPath);
      }
   }
}

async function updateConfigJson(leagueIDs) {
   const configPath = path.join(__dirname, 'config.json');
   const configData = {
      leagueIDs: leagueIDs
   };
   await fs.writeFile(configPath, JSON.stringify(configData, null, 3));

   // Update the in-memory config as well
   config.leagueIDs = leagueIDs;
}

module.exports = router;
