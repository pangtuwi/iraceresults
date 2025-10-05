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
const e = require('express');
var logger = require ('./logger.js');

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
      league.fullresults = await jsonloader.getFullResults(leagueID);
      league.protests = await jsonloader.getProtests(leagueID);
      cache[leagueID] = league;
   }));
   //console.log("League Cache Loaded...")
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
   league.fullresults = await jsonloader.getFullResults(leagueID);
   league.protests = await jsonloader.getProtests(leagueID);
   cache[leagueID] = league;
   //console.log("League Cache updated for ", leagueID)
} //updateCache(leagueid)

function getValidRounds(leagueID) {
   let allRounds = cache[leagueID].rounds;
   let validRounds = [];
   allRounds.forEach (round => {
      var hasValidSubsessionIds = false;
      round.subsession_ids.forEach (subsession_id => {
         if (subsession_id > 0) hasValidSubsessionIds = true;
      });
      if (hasValidSubsessionIds) {
         validRounds.push(round);
      }
   });
   //return cache[leagueID].rounds;
   return validRounds;
} //getValidRounds


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
   //Gets Live Sessions (i.e. those with SubsessionID != 0)
   const sessions = [];
   cache[leagueID].rounds.forEach(round => {
      var subsession_counter = 0;
      round.subsession_ids.forEach(subsession => {
         if (subsession != 0) {
            let thisSession = {};
            thisSession.subsession_id = subsession;
            thisSession.track_name = round.track_name;
            thisSession.score_type_id = round.score_types[subsession_counter];
            thisSession.round_no = round.round_no;
            sessions.push(thisSession);
            subsession_counter += 1;
         }
      });
   });
   //console.log("getSessions - sessions = ", sessions);
   return sessions;
} //getSessions

function getAllSessions(leagueID) {
   const sessions = [];
   cache[leagueID].rounds.forEach(round => {
      var subsession_counter = 0;
      round.subsession_ids.forEach(subsession => {
  
            let thisSession = {};
            thisSession.subsession_id = subsession;
            thisSession.track_name = round.track_name;
            thisSession.subsession_counter = subsession_counter;
            
            //generate a unique ID for the session
            const session_ref = Number(round.round_no) * 1000 + subsession_counter;
            thisSession.session_ref = session_ref;
            thisSession.score_type_id = round.score_types[subsession_counter];
            thisSession.round_no = round.round_no;
            sessions.push(thisSession);
            subsession_counter += 1;
      });
   });
   //console.log("getSessions - sessions = ", sessions);
   return sessions;
} //getSessions

function getSessionsDetail(leagueID) {
   var sessions = getAllSessions(leagueID);
   const scoring = cache[leagueID].scoring;
   sessions.forEach(session => {
      session.score_type = scoring[session.score_type_id].score_type;
   });
   return sessions;
} //getSessionsDetail


function getScoredEvents(leagueID, round_no) {
   var scored_events = [];
   var subsession_counter = 0;
   const scoring = cache[leagueID].scoring;
   
   //cache[leagueID].rounds.forEach(round => {
   let validRounds = getValidRounds(leagueID);
   validRounds.forEach(round => {   
      if ((round.round_no == round_no) && (round.subsession_ids.length > 0)) {
         round.subsession_ids.forEach((session_id, i) => {
            session_scored_events = scoring[round.score_types[subsession_counter]].scored_events;
            session_scored_events.forEach((scored_event, j) => {
               let thisScoredEvent = {};
               thisScoredEvent.session_id = session_id;
               thisScoredEvent.round_session_no = i;
               thisScoredEvent.event_type = scored_event.score_event;
               thisScoredEvent.score_event_no = j;
               scored_events.push(thisScoredEvent);
            });
            subsession_counter += 1;
         });
      }
   });
   return scored_events;
} //getScoredEvents

//Returns the session number for a given round and event type
function getSessionNo(leagueID, round_no, score_event) {
   //var scored_events = [];
   var session_no = 0;
   var subsession_counter = 0;
   const scoring = cache[leagueID].scoring;
   cache[leagueID].rounds.forEach(round => {
      if ((round.round_no == round_no) && (round.subsession_ids.length > 0)) {
         round.subsession_ids.forEach((session_id, i) => {
            session_scored_events = scoring[round.score_types[subsession_counter]].scored_events;
            session_scored_events.forEach((scored_event, j) => {
               if (scored_event.score_event == score_event) {
                  session_no = i+1;
               }
            });
            subsession_counter += 1;
         });
      }
   });
   return session_no;
} //getSessionNo


async function updateSessionID(leagueID, modSession) {
   const existsRoundIndex = cache[leagueID].rounds.findIndex((round) => round.round_no === modSession.round_no);
   const rounds = cache[leagueID].rounds;
   if (existsRoundIndex == -1) {
      console.log("ERROR - Could not find round while updating subsession_id");
   } else {
         thisRound = cache[leagueID].rounds[existsRoundIndex];
         //console.log ("found Round: ", thisRound );
         const existsSessionID = thisRound.subsession_ids[modSession.subsession_counter];
         //console.log ("found subsession : ", existsSessionID);
         if (existsSessionID == NaN) {
            console.log("ERROR - Could not find Subsession when updating subsession_id")
         } else {
            thisRound.subsession_ids[modSession.subsession_counter] = Number(modSession.subsession_id);
            //console.log("Updating SessionID for Round ", existsRoundIndex, " and subsession at index ", modSession.subsession_counter, " with subsession_id :", modSession.subsession_id);
            //console.log ("SessionID updated Successfully.  Rounds = ", cache[leagueID].rounds);
            await jsonloader.saveRounds(leagueID, rounds);
         }
   }
} //updateSession

function getTablesDisplayConfig(leagueID) {
   const classes = cache[leagueID].classes;
   const config = cache[leagueID].config;
   var displayConfig = { "classes_to_display": [], "display_overall_table": 0 };
   classes.forEach(thisClass => {
      if (thisClass.display_in_tables == 1) {
         displayConfig.classes_to_display.push(thisClass);
      }
   });
   if (config.display_overall_table == 1) displayConfig.display_overall_table = 1;
   return displayConfig;
} //getTablesDisplayConfig


//Function to get filtered class totals (removes cust_id / ID)
async function getFilteredClassTotals(reqLeagueID) {
   const filteredClassTotals = [];
   for (const classID in cache[reqLeagueID].classtotals) {
      const classData = cache[reqLeagueID].classtotals[classID];
      const filteredClassData = [];
      for (const driverID in classData) {
         const driverData = classData[driverID];
         //const { ID, ...rest } = driverData;
         //filteredClassData.push(rest);
         filteredClassData.push(driverData);
      }
      filteredClassTotals.push(filteredClassData);
   }
   return filteredClassTotals;
} //getFilteredClassTotals

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

async function submitProtest(leagueID, newProtest) {
   let protests = await jsonloader.getProtests(leagueID);
   newProtest.round_id = Number(newProtest.round_no);
   newProtest.protesting_driver_id = Number(newProtest.protesting_driver_id);
   newProtest.protested_driver_id = Number(newProtest.protested_driver_id);
   newProtest.protest_id = (newProtest.round_id * 1000) + cache[leagueID].protests.length;
   const scoredEvents = getScoredEvents(leagueID, newProtest.round_id);
   const eventNumber = Number(newProtest.event);
   //newProtest.score_event = scoredEvents[eventNumber].event_type;
   scoredEvents.forEach((scoredEvent, i) => {
      scoredEvent.eventNumber = scoredEvent.round_session_no *100 + scoredEvent.score_event_no;
      if (scoredEvent.eventNumber == eventNumber) {
         newProtest.score_event = scoredEvent.event_type;
      }
   });
   newProtest.timestamp = Date.now();
   newProtest.resolved = 0;
   protests.push(newProtest);
   await jsonloader.saveProtests(leagueID, protests);
   return protests;
} //submitProtest

async function updateDriver(leagueID, cust_id, custData) {
   const existsDriverIndex = cache[leagueID].drivers.findIndex((driver) => driver.cust_id === cust_id);
   if (existsDriverIndex == -1) {
      console.log("ERROR - COULD NOT FIND DRIVER");
   } else {
      cache[leagueID].drivers[existsDriverIndex] = custData;
      jsonloader.saveDrivers(leagueID, cache[leagueID].drivers);
   }
} //updateDriver

async function addDriver(leagueID, newDriver) {
   cache[leagueID].drivers.push(newDriver);
   jsonloader.saveDrivers(leagueID, cache[leagueID].drivers);
} //addDriver


async function deleteDriver(leagueID, cust_id) {
   cache[leagueID].drivers.splice(existsDriverIndex, 1);
   jsonloader.saveDrivers(leagueID, cache[leagueID].driver);
} //addDriver

async function updateConfig(leagueID, configData) {
   cache[leagueID].config = configData;
   await jsonloader.saveConfig(leagueID, configData);
} //updateConfig

function getClassName(leagueID, classnumber) {
   let className = "Unknown";
   if (cache[leagueID] && cache[leagueID].classes) {
      const classData = cache[leagueID].classes.find(cls => cls.classnumber === classnumber);
      if (classData) {
         className = classData.classname;
      }
   }
   return className;
}

function getUnresolvedProtests(leagueid) {
   let protests = cache[leagueid].protests;
   //Filter obj to get only unresolved protests
   const unresolvedProtests = protests.filter(protest => protest.resolved == 0);
   //console.log(obj);   
   return unresolvedProtests;
} //getUnresolvedProtests

function getFilteredResults(leagueID, round_no, cust_id) {
   let fullresults = cache[leagueID].fullresults;
   let results = [];

   fullresults.forEach(result => {
      const round_no = result.round_no;
      const track_name = result.track_name;
      const score_event = result.score_event;
      result.results.forEach(classresult => {
         const classnumber = classresult.classnumber;
         classresult.positions.forEach(driverresult => { 
            let thisResult = deepCopy(driverresult);
            thisResult.round_no = round_no;
            thisResult.track_name = track_name;
            thisResult.score_event = score_event;
            thisResult.classnumber = classnumber;
            thisResult.classname = getClassName(leagueID, classnumber);
            results.push(thisResult);
         });
      });
   });

   // Apply filtering based on the provided parameters
   if (round_no) {
      results = results.filter(result => result.round_no === round_no);
   }
   if (cust_id) {
      results = results.filter(result => result.cust_id === cust_id);
   }
   return results;
} //getFilteredResults



async function submitPenalty(leagueID, newPenalty) {
   //penalties = await jsonloader.getPenalties(leagueID);
   //var protests = await jsonloader.getProtests(leagueID);
   let penalties = cache[leagueID].penalties;
   let protests = cache[leagueID].protests;
   const resolvedProtestIndex = protests.findIndex((protest) => protest.protest_id == newPenalty.protest_id);
   if (resolvedProtestIndex == -1) {
      logger.log("ERROR - No protest associated with this penalty")
   } else {
      //console.log("marking protest ", resolvedProtestIndex, " as resolved : ");
      protests[resolvedProtestIndex].resolved = 1;
      await jsonloader.saveProtests(leagueID, protests);
   }
   newPenalty.penalty_id = (newPenalty.round_no * 1000) + cache[leagueID].penalties.length;
   newPenalty.timestamp = Date.now();
   newPenalty.session_no = getSessionNo(leagueID, newPenalty.round_no, newPenalty.score_event);
   penalties.push(newPenalty);
   await jsonloader.savePenalties(leagueID, penalties);
   return penalties;
} //submitPenalty

async function unresolveProtest(leagueID, protest_id) {
   let protests = cache[leagueID].protests;
   const protestIndex = protests.findIndex((protest) => protest.protest_id == protest_id);

   if (protestIndex == -1) {
      logger.log("ERROR - Protest not found with ID: " + protest_id);
      throw new Error("Protest not found");
   } else {
      console.log("Marking protest ", protest_id, " as unresolved");
      protests[protestIndex].resolved = 0;
      await jsonloader.saveProtests(leagueID, protests);
      return protests;
   }
} //unresolveProtest

async function resolveProtest(leagueID, protest_id) {
   let protests = cache[leagueID].protests;
   const protestIndex = protests.findIndex((protest) => protest.protest_id == protest_id);

   if (protestIndex == -1) {
      logger.log("ERROR - Protest not found with ID: " + protest_id);
      throw new Error("Protest not found");
   } else {
      console.log("Marking protest ", protest_id, " as resolved");
      protests[protestIndex].resolved = 1;
      await jsonloader.saveProtests(leagueID, protests);
      return protests;
   }
} //resolveProtest

async function deletePenalty(leagueID, penalty_id) {
   let penalties = cache[leagueID].penalties;
   const penaltyIndex = penalties.findIndex((penalty) => penalty.penalty_id == penalty_id);
   if (penaltyIndex == -1) {
      console.log("No penalty found with ID ", penalty_id);
   } else {
      //console.log("Deleting penalty ", penaltyIndex, " with ID ", penalty_id);
      penalties.splice(penaltyIndex, 1);
      await jsonloader.savePenalties(leagueID, penalties);
   }
   return penalties;
} //deletePenalty

async function submitStewardsPenalty(leagueID, newPenalty) {
   let penalties = cache[leagueID].penalties;
   newPenalty.penalty_id = (newPenalty.round_no * 1000) + cache[leagueID].penalties.length;

   newPenalty.round_id = Number(newPenalty.round_no);
   const scoredEvents = getScoredEvents(leagueID, newPenalty.round_id);
   const eventNumber = Number(newPenalty.event);
   
   scoredEvents.forEach((scoredEvent, i) => {
      scoredEvent.eventNumber = scoredEvent.round_session_no *100 + scoredEvent.score_event_no;
      if (scoredEvent.eventNumber == eventNumber) {
         newPenalty.score_event = scoredEvent.event_type;
      }
   });

   newPenalty.timestamp = Date.now();
   newPenalty.session_no = getSessionNo(leagueID, newPenalty.round_no, newPenalty.score_event);
   //console.log("Adding Stewards Penalty : ", newPenalty);
   penalties.push(newPenalty);
   await jsonloader.savePenalties(leagueID, penalties);
   return penalties;
} // submitStewardsPenalty

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
   //console.log("in downloadNewSubSessionFiles");
   let loadFromFileSubSessions = [];
   let loadFromiRacingSubSessions = [];

   //Check which Subsession datafiles have already been downloaded
   for (const subsession_id of seasonSubSessions) {
      const pathToFileOrDir = `./data/${leagueID}/irresults/${subsession_id}.json`;

      // Check if the file or directory exists synchronously
      if (fs.existsSync(pathToFileOrDir)) {
         //console.log(`The file  '${pathToFileOrDir}' exists.`);
         loadFromFileSubSessions.push(subsession_id);
      } else {
         //console.log(`The file '${pathToFileOrDir}' does not exist.`);
         loadFromiRacingSubSessions.push(subsession_id);
      }
   }

   if (loadFromFileSubSessions.length > 0) {
      for (const subsession_id of loadFromFileSubSessions) {
         //console.log("getting subsession data from File for : " + subsession_id);
         const obj = await jsonloader.getSubSession(leagueID, subsession_id);
         seasonSessions[subsession_id] = obj;
      }
   }

   if (loadFromiRacingSubSessions.length > 0) {
      const cookie = await authUser();
      for (const subsession_id of loadFromiRacingSubSessions) {
         logger.log("getting subsession data from iRacing.com for : " + subsession_id);
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
      logger.log("Request for Recalculation recieved",0, 0);
      await updateCache(leagueID);
      var leagueData = cache[leagueID];
      leagueData.rounds = getValidRounds(leagueID);

      const session_array = getSessions(leagueID);
      const seasonSubSessions = calcscores.getSubSessionArray(session_array);
      await downloadNewSessionFiles(seasonSubSessions, leagueID);
      logger.log("Got all the files, calculating", 0, 0);

      //Calculate Scores for the season
      const driverScores = await calcscores.calc(leagueData, seasonSessions);
      const classResults = await calcscores.classResultsTable(leagueData.rounds, driverScores, leagueData.config.apply_drop_scores, leagueData.config.no_drop_scores_rounds);
      const teamsResults = await calcscores.teamsResultsTable(leagueData.rounds, leagueData.teams, classResults);
      const newDrivers = await calcscores.getNewDrivers();

      //Output full results JSON
      exporter.exportResultsJSON(leagueData.fullresults, './data/' + leagueID + '/fullresults.json');

      //Output csv results for each round - uncomment to enable round by round csv output
      /*leagueData.rounds.forEach(round => {
         exporter.exportRoundCSV2(leagueData.rounds, round.round_no, leagueData.scoring, driverScores);
      }); */

      //Output Individual Results Table
      exporter.exportResultsJSON(classResults, './data/' + leagueID + '/classtotals.json');

      //Output Teams Results Table
      exporter.exportResultsJSON(teamsResults, "./data/" + leagueID + "/teamstotals.json");

      //Save new Drivers File if updated
      if (leagueData.config.class_to_add_new_drivers_to != -1) {
         const DriversToSave = newDrivers.map(item => {
            const container = {};
            //console.log("Adding new driver to league : ", item.display_name);
            container.cust_id = item.cust_id;
            container.display_name = item.display_name;
            //check if item has originalClassNumber property (added during calc process)
            if (item.hasOwnProperty('originalClassNumber')) {
               container.classnumber = item.originalClassNumber;
               //console.log("Putting driver ", item.display_name, " back into class ", item.originalClassNumber); 
            
            } else {
               container.classnumber = item.classnumber;
            }
            return container;
         })
         jsonloader.saveDrivers(leagueID, DriversToSave);
      }

      return classResults;

   } catch (e) {
      logger.log(e, 0, 0);
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
exports.getSessionsDetail = getSessionsDetail;
exports.getScoredEvents = getScoredEvents;
exports.getFilteredClassTotals = getFilteredClassTotals;
exports.getFilteredResults = getFilteredResults;
exports.getUnresolvedProtests = getUnresolvedProtests;
exports.submitProtest = submitProtest;
exports.unresolveProtest = unresolveProtest;
exports.resolveProtest = resolveProtest;
exports.submitPenalty = submitPenalty;
exports.deletePenalty = deletePenalty;
exports.submitStewardsPenalty = submitStewardsPenalty;
exports.addDriver = addDriver;
exports.deleteDriver = deleteDriver;
exports.updateDriver = updateDriver;
exports.updateConfig = updateConfig;
exports.updateSessionID = updateSessionID;
exports.getTablesDisplayConfig = getTablesDisplayConfig;