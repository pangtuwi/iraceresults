const fs = require('fs/promises');

async function getConfig () {
   const data = await fs.readFile('./data/config.json', { encoding: 'utf8' });
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

 async function getSeason () {
   const data = await fs.readFile('./data/season.json', { encoding: 'utf8' });
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

async function getScoringPointsSystem () {
   const data = await fs.readFile('./data/scoring.json', { encoding: 'utf8' });
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

async function getClasses () {
   const data = await fs.readFile('./data/classes.json', { encoding: 'utf8' });
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

async function getDrivers () {
   const data = await fs.readFile('./data/drivers.json', { encoding: 'utf8' });
   console.log("Drivers Loaded from json file");
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

async function getClassChanges () {
   const data = await fs.readFile('./data/classchanges.json', { encoding: 'utf8' });
   console.log("Class Changes Loaded from json file");
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

/*async function saveDrivers (newDrivers) {
   const data = await fs.readFile('./data/drivers.json', { encoding: 'utf8' });
   console.log("Drivers Loaded from json file");
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
} */

async function saveDrivers(newDrivers){
   let filename = './data/drivers.json';
   let timestamp = Math.floor(Date.now());
   let backupfilename = './data/backup/drivers_' + timestamp + '.json';
   await fs.copyFile(filename, backupfilename);
   await fs.writeFile(filename, JSON.stringify(newDrivers));
} //saveDrivers

async function getTeams () {
   const data = await fs.readFile('./data/teams.json', { encoding: 'utf8' });
   //console.log(data);
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

async function getPenalties () {
   const data = await fs.readFile('./data/penalties.json', { encoding: 'utf8' });
   console.log("Penalties Loaded from json file");
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}
 
async function getSubSession (subsession_id) {
   const data = await fs.readFile('./results/'+subsession_id+'.json', { encoding: 'utf8' });
   console.log("Subsession" + subsession_id+" loaded from json file");
   const obj = JSON.parse(data);
   //console.log(obj);   
   return obj;
}

exports.getConfig = getConfig;
exports.getSeason = getSeason; 
exports.getScoringPointsSystem = getScoringPointsSystem;
exports.getDrivers = getDrivers;
exports.saveDrivers = saveDrivers;
exports.getClasses = getClasses;
exports.getClassChanges = getClassChanges;
exports.getPenalties = getPenalties;
exports.getTeams = getTeams;
exports.getSubSession = getSubSession;

