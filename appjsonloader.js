const fs = require('fs/promises');


async function getLeagueConfig (leagueid) {
   const data = await fs.readFile('./data/' + leagueid + '/config.json', { encoding: 'utf8' });
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

 async function getSeason (leagueid) {
   const data = await fs.readFile('./data/' + leagueid + '/season.json', { encoding: 'utf8' });
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

async function getScoringPointsSystem (leagueid) {
   const data = await fs.readFile('./data/' + leagueid + '/scoring.json', { encoding: 'utf8' });
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

async function getClasses (leagueid) {
   const data = await fs.readFile('./data/' + leagueid + '/classes.json', { encoding: 'utf8' });
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

async function getDrivers (leagueid) {
   const data = await fs.readFile('./data/' + leagueid + '/drivers.json', { encoding: 'utf8' });
   //console.log("Drivers Loaded from json file");
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

async function getClassChanges (leagueid) {
   const data = await fs.readFile('./data/' + leagueid + '/classchanges.json', { encoding: 'utf8' });
   //console.log("Class Changes Loaded from json file");
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

async function saveDrivers(leagueid, newDrivers, backup){
   let filename = './data/' + leagueid + '/drivers.json';
   let timestamp = Math.floor(Date.now());
   await fs.writeFile(filename, JSON.stringify(newDrivers));
   if (backup) {
      let backupfilename = './data/' + leagueid + '/backup/drivers_' + timestamp + '.json';
      await fs.copyFile(filename, backupfilename);
   }
} //saveDrivers

async function getTeams (leagueid) {
   const data = await fs.readFile('./data/' + leagueid + '/teams.json', { encoding: 'utf8' });
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

async function getPenalties (leagueid) {
   const data = await fs.readFile('./data/' + leagueid + '/penalties.json', { encoding: 'utf8' });
   //console.log("Penalties Loaded from json file");
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

async function getClassTotals (leagueid) {
   const data = await fs.readFile('./data/' + leagueid + '/classtotals.json', { encoding: 'utf8' });
   //console.log("Penalties Loaded from json file");
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

async function getTeamsTotals (leagueid) {
   const data = await fs.readFile('./data/' + leagueid + '/teamstotals.json', { encoding: 'utf8' });
   //console.log("Penalties Loaded from json file");
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}
 
async function getSubSession (leagueid, subsession_id) {
   const data = await fs.readFile('./data/' + leagueid + '/irresults/'+subsession_id+'.json', { encoding: 'utf8' });
   console.log("Subsession" + subsession_id+" loaded from json file");
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

exports.getLeagueConfig = getLeagueConfig;
exports.getSeason = getSeason; 
exports.getScoringPointsSystem = getScoringPointsSystem;
exports.getDrivers = getDrivers;
exports.saveDrivers = saveDrivers;
exports.getClasses = getClasses;
exports.getClassChanges = getClassChanges;
exports.getPenalties = getPenalties;
exports.getTeams = getTeams;
exports.getSubSession = getSubSession;
exports.getClassTotals = getClassTotals;
exports.getTeamsTotals = getTeamsTotals;
