const fs = require('fs');
const path = require('path');

const port = process.argv[2] || 4000;

// Load league IDs from config.json
let leagueIDs = [];
try {
   const configPath = path.join(__dirname, 'config.json');
   const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
   leagueIDs = configData.leagueIDs || [];
   console.log("Server config loaded - League IDs loaded from config.json");
} catch (error) {
   console.error("Error loading config.json, using empty league IDs array:", error.message);
   leagueIDs = [];
}

exports.port = port;
exports.leagueIDs = leagueIDs;
