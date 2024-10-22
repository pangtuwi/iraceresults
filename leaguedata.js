//https://betterstack.com/community/questions/how-to-check-sync-file-exists-node-js/

//External file requirements
const axios = require('axios');
const calcscores = require('./calcscores');
//const jsonloader = require('./jsonloader');
var config = require('./appconfig.js');
var jsonloader = require('./appjsonloader');
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
var cache = {};

async function loadCache() {
   await Promise.all(config.leagueIDs.map(async (leagueID) => {
      let league = { "config": {}, "classes": [], "scoring": [], "points": [], "drivers": [], "teams": [], "rounds": [],"classchanges": [], "penalties": [] };
      league.config = await jsonloader.getLeagueConfig(leagueID);
      league.classes = await jsonloader.getClasses(leagueID);
      league.scoring = await jsonloader.getScoring(leagueID);
      league.points = await jsonloader.getPoints(leagueID);
      league.drivers = await jsonloader.getDrivers(leagueID);
      league.teams = await jsonloader.getTeams(leagueID);
      //league.season = await jsonloader.getSeason(leagueID);
      league.rounds = await jsonloader.getRounds(leagueID);
      league.classchanges = await jsonloader.getClassChanges(leagueID);
      league.penalties = await jsonloader.getPenalties(leagueID);
      league.classtotals = await jsonloader.getClassTotals(leagueID);
      league.teamstotals = await jsonloader.getTeamsTotals(leagueID);
      cache[leagueID] = league;
   }));
   console.log("League Cache Loaded...")
} //loadCache

async function updateCache(leagueID) {
   let league = { "config": {}, "classes": [], "scoring": [], "points": [],"drivers": [], "teams": [], "rounds": [], "classchanges": [], "penalties": [] };
   league.config = await jsonloader.getLeagueConfig(leagueID);
   league.classes = await jsonloader.getClasses(leagueID);
   league.scoring = await jsonloader.getScoring(leagueID);
   league.points = await jsonloader.getPoints(leagueID);
   league.drivers = await jsonloader.getDrivers(leagueID);
   league.teams = await jsonloader.getTeams(leagueID);
   //league.season = await jsonloader.getSeason(leagueID);
   league.rounds = await jsonloader.getRounds(leagueID);
   league.classchanges = await jsonloader.getClassChanges(leagueID);
   league.penalties = await jsonloader.getPenalties(leagueID);
   league.classtotals = await jsonloader.getClassTotals(leagueID);
   league.teamstotals = await jsonloader.getTeamsTotals(leagueID);
   cache[leagueID] = league;
   console.log("League Cache updated for ", leagueID)
} //updateCache(leagueid)

function getRounds(leagueID) {
   //const rounds = {};
   //return cache[leagueID].season;
   return cache[leagueID].rounds;
} //getRounds

/*  old version using season construct
function getSessions(leagueID) {
   const sessions = [];
   cache[leagueID].season.forEach(round => {
      round.sessions.forEach(session => {
         let thisSession = {};
         thisSession.round_no = round.round_no;
         thisSession.session_no = session.session_no;
         thisSession.event_type = session.event_type;
         thisSession.list_text = round.track_name + " : " + session.session_no + " : " + session.event_type;
         thisSession.subsession_id = session.subsession_id;
         sessions.push(thisSession);
      });
   });
   return sessions;
} //getSessions

*/

function getSessions(leagueID) {
   const sessions = [];
   cache[leagueID].rounds.forEach(round => {
      var subsession_counter = 0;
      round.subsession_ids.forEach(subsession=> {
         let thisSession = {};
         thisSession.subsession_id = subsession;
         thisSession.score_type_id = round.score_types[subsession_counter];
         thisSession.round_no = round.round_no;
         sessions.push(thisSession);
         subsession_counter += 1;
      });
   });
   return sessions;
} //getSessions

/*
function getScoredEvents(leagueID) {
   const scored_events = [];
   cache[leagueID].season.forEach(round => {
      round.sessions.forEach(session => {
         session.scored_events.forEach(scored_event => {
            let thisScoredEvent = {};
            thisScoredEvent.round_no = round.round_no;
            thisScoredEvent.session_no = session.session_no;
            thisScoredEvent.event_type = session.event_type;
            thisScoredEvent.list_text = round.track_name + " : " + session.session_no + " : " + session.event_type + " : " + scored_event.score_event;
            thisScoredEvent.subsession_id = session.subsession_id;
            thisScoredEvent.score_event = scored_event.score_event;
            scored_events.push(thisScoredEvent);
         });
      });
   });
   return scored_events;
} //getScoredEvents
 */

//Function to login to iRacing (note password determined elsewhere)
async function authUser() {
   const res = await axiosInstance.post('/auth', {
      email: 'pangtuwi@gmail.com',
      password: 'tVIAVW3xGUvWyrBu03jVVtM7FxLobilJe9UqzAw+cv4='
   });
   //console.log ("AXIOS - res =", res);
   //console.log("AXIOS - got headers from iRacing : ", res.headers['set-cookie']);
   return res.headers['set-cookie'];
}

async function getSubsession(id, cookie) {
   //console.log ("AXIOS - fetching :",`/data/results/get?subsession_id=${id}`);
   //console.log ("AXIOS - using cookie:", cookie);
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

async function downloadNewSessionFiles(seasonSubSessions, leagueID) {
   console.log("in downloadNewSubSessionFiles");
   let loadFromFileSubSessions = [];
   let loadFromiRacingSubSessions = [];

   //Check which Subsession datafiles have already been downloaded
   for (const subsession_id of seasonSubSessions) {
      const pathToFileOrDir = `./data/${leagueID}/irresults/${subsession_id}.json`;

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
         const obj = await jsonloader.getSubSession(leagueID, subsession_id);
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
         exporter.exportLeagueSessionJSON(leagueID, obj);
      }
   }
} //downloadNewSessionFiles

async function reCalculate(leagueID) {
   // let subsessionIdArray = [];
   try {
      console.log("Recalculating - start by updating cache");
      await updateCache(leagueID);
      console.log("Cache Updated");
      var leagueData = cache[leagueID];

      console.log("Checking if I have all the subsession Files");
      const session_array = getSessions(leagueID);
      const seasonSubSessions = calcscores.getSubSessionArray(session_array);
      await downloadNewSessionFiles(seasonSubSessions, leagueID);
      console.log("Got all the files, calculating");

      //Calculate Scores for the season
      const driverScores = await calcscores.calc(leagueData, seasonSessions);
      const classResults = await calcscores.classResultsTable(leagueData.rounds, driverScores, leagueData.config.apply_drop_scores, leagueData.config.no_drop_scores_rounds);
      const teamsResults = await calcscores.teamsResultsTable(leagueData.rounds, leagueData.teams, classResults);
      const newDrivers = await calcscores.getNewDrivers();

      //Output full results JSON
      /*
      const results = { "season": [], "driverScores": [] };
      results.season = leagueData.season
      results.driverScores = driverScores;
      exporter.exportResultsJSON(results, "results.json"); */

      //Output CSV for each round
     /* leagueData.season.forEach(round => {
         exporter.exportRoundCSV(leagueData.season, round.round_no, driverScores);
      }); */

      //Output Individual Results Table
      exporter.exportResultsJSON(classResults, './data/' + leagueID + '/classtotals.json');

      //Output Teams Results Table
      exporter.exportResultsJSON(teamsResults, "./data/" + leagueID + "/teamstotals.json");

      //Save new Drivers File if updated
      if (leagueData.config.class_to_add_new_drivers_to != -1) {
         const DriversToSave = newDrivers.map(item => {
            const container = {};
            container.cust_id = item.cust_id;
            container.display_name = item.display_name;
            container.classnumber = item.classnumber;
            return container;
         })
         jsonloader.saveDrivers(leagueID, DriversToSave);
      }

      return classResults;

   } catch (e) {
      console.error(e);
   }

}

exports.cache = cache;
exports.loadCache = loadCache;
exports.updateCache = updateCache;
exports.reCalculate = reCalculate;
exports.getRounds = getRounds;
exports.getSessions = getSessions;
//exports.getScoredEvents = getScoredEvents;