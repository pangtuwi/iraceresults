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
      let league = { "config": {}, "classes": [], "scoring": [], "points": [], "drivers": [], "teams": [], "rounds": [], "classchanges": [], "penalties": [] };
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
      league.protests = await jsonloader.getProtests(leagueID);
      cache[leagueID] = league;
   }));
   console.log("League Cache Loaded...")
} //loadCache

async function updateCache(leagueID) {
   let league = { "config": {}, "classes": [], "scoring": [], "points": [], "drivers": [], "teams": [], "rounds": [], "classchanges": [], "penalties": [] };
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
   league.protests = await jsonloader.getProtests(leagueID);
   cache[leagueID] = league;
   console.log("League Cache updated for ", leagueID)
} //updateCache(leagueid)

function getRounds(leagueID) {
   return cache[leagueID].rounds;
} //getRounds

function getProtestableRounds(leagueID) {
   const rounds = cache[leagueID].rounds;
   var protestableRounds = [];
   const now = new Date();
   const min_hours_cutoff = cache[leagueID].config.protest_open_after_hrs;
   const max_hours_cutoff = min_hours_cutoff + cache[leagueID].config.protest_open_for_hrs
   console.log(now);
   rounds.forEach(round => {
      let round_start_time = new Date(round.start_time);
      let hours_since_race = (now - round_start_time) / (60 * 60 * 1000);
      const thisRound = {
         round_no: round.round_no,
         track_name: round.track_name,
         start_time: round_start_time,
         hours_since_race: hours_since_race
      }
      //console.log(min_hours_cutoff,"  > ", thisRound.hours_since_race, "  <", max_hours_cutoff );
      if ((thisRound.hours_since_race > min_hours_cutoff) && (thisRound.hours_since_race < max_hours_cutoff)) {
         protestableRounds.push(thisRound);
      }
   });
   return protestableRounds
} //getProtestableRounds


function getCompletedRounds(leagueID) {
   const rounds = cache[leagueID].rounds;
   var completedRounds = [];
   const now = new Date();
   //console.log("request for completed rounds from time : ", now);
   rounds.forEach(round => {
      let round_start_time = new Date(round.start_time);
      let hours_since_race = (now - round_start_time) / (60 * 60 * 1000);
      const thisRound = {
         round_no: round.round_no,
         track_name: round.track_name,
         start_time: round_start_time,
         hours_since_race: hours_since_race
      }
      //console.log(min_hours_cutoff,"  > ", thisRound.hours_since_race, "  <", max_hours_cutoff );
      if (thisRound.hours_since_race > 0) {
         completedRounds.push(thisRound);
      }
   });
   return completedRounds
} //getCompletedRounds


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
      round.subsession_ids.forEach(subsession => {
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


function getScoredEvents(leagueID, round_no) {
   var scored_events = [];
   var subsession_counter = 0;
   const scoring = cache[leagueID].scoring;
   cache[leagueID].rounds.forEach(round => {
      if ((round.round_no == round_no)  && (round.subsession_ids.length > 0)){
         round.subsession_ids.forEach(session => {
            session_scored_events = scoring[round.score_types[subsession_counter]].scored_events;
            session_scored_events.forEach(scored_event => {
               let thisScoredEvent = {};
               thisScoredEvent.event_type = scored_event.score_event;
               scored_events.push(thisScoredEvent);
            });
            subsession_counter += 1;
         });
      }
   });
   return scored_events;
} //getScoredEvents

function getTablesDisplayConfig(leagueID){
   const classes = cache[leagueID].classes;
   const config = cache[leagueID].config;
   var displayConfig = {"classes_to_display" : [], "display_overall_table" : 0};
   classes.forEach(thisClass => {
      if (thisClass.display_in_tables == 1) {
         displayConfig.classes_to_display.push(thisClass);
      }
   });
   if (config.display_overall_table == 1) displayConfig.display_overall_table = 1;
   return displayConfig;
} //getTablesDisplayConfig


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

async function submitProtest(leagueID, newProtest){
   protests = await jsonloader.getProtests(leagueID);
   newProtest.protest_id = newProtest.round_id + "-" + cache[leagueID].protests.length; 
   newProtest.timestamp = Date.now();
   protests.push(newProtest);
   await jsonloader.saveProtests(leagueID,protests);
   return protests;
} //submitProtest


async function submitPenalty(leagueID, newPenalty){
  penalties = await jsonloader.getPenalties(leagueID);
  protests = await jsonloader.getProtests(leagueID);
  const resolvedProtestIndex = protests.findIndex((protest) => protest.protest_id == newPenalty.protest_id);
  if (resolvedProtestIndex == -1){
   console.log("No protest associated with this penalty")
  } else {
   console.log ("marking protest as resolved : ", resolvedProtestIndex);
  }
   newPenalty.penalty_id = newPenalty.round_no + "-" + cache[leagueID].penalties.length; 
   newPenalty.timestamp = Date.now();
   penalties.push(newPenalty);
   await jsonloader.savePenalties(leagueID,penalties);
   return penalties;
} //submitPenalty

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
      /*leagueData.season.forEach(round => {
          exporter.exportRoundCSV(leagueData.season, round.round_no, driverScores);
       }); */
       leagueData.rounds.forEach(round => {
         exporter.exportRoundCSV2(leagueData.rounds, round.round_no, leagueData.scoring, driverScores);
       });

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
exports.getProtestableRounds = getProtestableRounds;
exports.getCompletedRounds = getCompletedRounds;
exports.getSessions = getSessions;
exports.getScoredEvents = getScoredEvents;
exports.submitProtest = submitProtest;
exports.submitPenalty = submitPenalty;
exports.getTablesDisplayConfig = getTablesDisplayConfig;