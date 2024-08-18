//https://betterstack.com/community/questions/how-to-check-sync-file-exists-node-js/

//External file requirements
const axios = require('axios');
const scores = require('./scoring');
const jsonloader = require('./jsonloader');
const exporter = require('./exporter');
const { deepCopy } = require('./utils/utils');
const fs = require('fs');

//axios setup
const BASE_URL = 'https://members-ng.iracing.com/';
const TIMEOUT = 5000;

const axiosInstance = axios.create({
   baseURL: BASE_URL,
   timeout: TIMEOUT,
});

//Season Variables
let seasonSessions = [];

//Function to login to iRacing (note password determined elsewhere)
async function authUser() {
   var password = "pdhn!10iRacing";
   var username = "pangtuwi@gmail.com";
   const res = await axiosInstance.post('/auth', {
      email: 'pangtuwi@gmail.com',
      password: 'tVIAVW3xGUvWyrBu03jVVtM7FxLobilJe9UqzAw+cv4='
   });
   return res.headers['set-cookie'];
}

async function getSubsession(id, cookie) {
   const res = await axiosInstance.get(`/data/results/get?subsession_id=${id}`, {
      headers: {
         cookie,
      },
   });
   return res.data;
}

async function getSubsessionData(link) {
   const res = await axiosInstance.get(link);
   return res.data;
}

async function reCalculate() {
   // let subsessionIdArray = [];
   try {
      const config = await jsonloader.getConfig();
      const season = await jsonloader.getSeason();
      const seasonSubSessions = scores.getSubSessionList(season);
      let loadFromFileSubSessions = [];
      let loadFromiRacingSubSessions = [];
      const teams = await jsonloader.getTeams();

      //Check which Subsession datafiles have already been downloaded
      for (const subsession_id of seasonSubSessions) {
         const pathToFileOrDir = `./results/${subsession_id}.json`;

         // Check if the file or directory exists synchronously
         if (fs.existsSync(pathToFileOrDir)) {
            console.log(`The file  '${pathToFileOrDir}' exists.`);
            loadFromFileSubSessions.push(subsession_id);
         } else {
            console.log(`The file '${pathToFileOrDir}' does not exist.`);
            loadFromiRacingSubSessions.push(subsession_id);
         }
      }

      if (loadFromFileSubSessions.length > 0) {
         for (const subsession_id of loadFromFileSubSessions) {
            console.log("getting subsession data from File for : " + subsession_id);
            const obj = await jsonloader.getSubSession(subsession_id);
            seasonSessions[subsession_id] = obj;
         }
      }

      if (loadFromiRacingSubSessions.length > 0) {
         const cookie = await authUser();
         for (const subsession_id of loadFromiRacingSubSessions) {
            console.log("getting subsession data from iRacing.com for : " + subsession_id);
            const subsessiondata = await getSubsession(subsession_id, cookie);
            const obj = await getSubsessionData(subsessiondata.link);
            seasonSessions[subsession_id] = obj;
            exporter.exportSessionJSON(obj);
         }
      }

      //Calculate Scores for the season
      const driverScores = await scores.calc(seasonSessions);
      const classResults = await scores.classResultsTable(season, driverScores, config.apply_drop_scores, config.no_drop_scores_rounds);
      const teamsResults = await scores.teamsResultsTable(season, teams, classResults);

      //Output full results JSON
      const results = { "season": [], "driverScores": [] };
      results.season = season
      results.driverScores = driverScores;
      exporter.exportResultsJSON(results, "results.json");

      //Output CSV for each round
      season.forEach(round => {
         exporter.exportRoundCSV(season, round.round_no, driverScores);
      });

      //Output Individual Results Table
      exporter.exportResultsJSON(classResults, "./results/classtotals.json")

      //Output Teams Results Table
      exporter.exportResultsJSON(teamsResults, "./results/teamstotals.json")

      return classResults;

   } catch (e) {
      console.error(e);
   }

}

exports.reCalculate = reCalculate;