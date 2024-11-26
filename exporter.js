const csvwrite = require('./csvwrite')
const utils = require ('./utils/utils');
const fs = require('fs');
var path = require('path');

//Returns size of score Array required = sum of score events in all rounds
function getScoreArrayIndexes(season, this_round_index) {
   let total_size = 0;
   let total_rounds = 0
   let this_round_start_index = 0;
   let this_round_size = 0;
   let round_size = 0;
   let rounds_array = [];
   let round_counter = 0;
   season.forEach(round => {
      total_rounds++;
      round_size = 0;
      if (round_counter == this_round_index) {
         if (total_size == 0) {
            this_round_start_index = 0; 
         } else {
            this_round_start_index = total_size ; 
         }
      }
      round.sessions.forEach(session => {
         if (round_counter == this_round_index) {
            this_round_size =  round_size + session.scored_events.length;  
         }
         total_size = total_size + session.scored_events.length;
         round_size = round_size + session.scored_events.length;   
      });
      rounds_array.push(round_size);
      round_counter += 1;
   });
   const score_size = {
      total: total_size,
      this_round_index : this_round_index,
      this_round_start_index : this_round_start_index,
      this_round_size : this_round_size,
      rounds : rounds_array
   }
   return score_size;
} //getScoreArrayIndexes


//Returns size of score Array required = sum of score events in all rounds
function getScoreArrayIndexesNew(rounds, scoring, this_round_index) {
   let total_size = 0;
   let total_rounds = 0
   let this_round_start_index = 0;
   let this_round_size = 0;
   let scored_events_length = 0;
   let round_size = 0;
   let rounds_array = [];
   let round_counter = 0;
   rounds.forEach(round => {
      total_rounds++;
      round_size = 0;
      if (round_counter == this_round_index) {
         if (total_size == 0) {
            this_round_start_index = 0;
         } else {
            this_round_start_index = total_size;
         }
      }
      var subsession_counter = 0;
      round.subsession_ids.forEach(session => {
         scored_events_length = scoring[round.score_types[subsession_counter]].scored_events.length;
         if (round_counter == this_round_index) {
            //this_round_size = round_size + session.scored_events.length;

            this_round_size = round_size + scored_events_length;
         }
         total_size = total_size + scored_events_length;
         round_size = round_size + scored_events_length;
         subsession_counter += 1;
      });
      rounds_array.push(round_size);
      round_counter += 1;
   });
   const score_size = {
      total: total_size,
      this_round_index: this_round_index,
      this_round_start_index: this_round_start_index,
      this_round_size: this_round_size,
      rounds: rounds_array
   }
   return score_size;
} //getScoreArrayIndexesNEw



async function exportRoundCSV(season, roundindex, driverScores){
   const round = season[roundindex-1];
   let arrayIndexes = getScoreArrayIndexes(season, roundindex-1);

   //Set up header and array data structures
   let scoreCount = 0;
   let outputHeaders = ["Pos", "ID", "Name"];
   let outputLine = {"Pos": 0, "ID": "", "Name": "", "Total": 0}
   let scoreColumns = []
   let outputArray = []
   round.sessions.forEach(session => {
      scoreCount = scoreCount + session.scored_events.length;
      session.scored_events.forEach(scored_event => {
         let titleStr = session.event_type + "-" + scored_event.score_event
         outputHeaders.push(titleStr)
         outputLine[titleStr] = titleStr
         scoreColumns.push(titleStr)
      });
   });
   outputHeaders.push("Total");
   outputLine.Total = 0;

   //Iterate through Driver Scores
   driverScores.forEach(driverClass => {
      driverClass.drivers.forEach(driver =>{
         let newline = utils.deepCopy(outputLine);
         newline.ID = driver.cust_id;
         newline.Name = driver.display_name;   
         let lineTotal = 0;
         let columnCounter = 0
         for (let i = arrayIndexes.this_round_start_index; i < arrayIndexes.this_round_start_index + arrayIndexes.this_round_size; i++) {
            score = driver.scores[i];
            var nameindex = scoreColumns[columnCounter];
            newline[nameindex] = score;
            lineTotal = lineTotal + score;
            columnCounter +=1
         }
         newline.Total = lineTotal
         outputArray.push(newline)
      });

      //Sort

      const sorter1 = (a, b) => a.Total < b.Total ? 1 : -1;
      outputArray.sort(sorter1)
      let newPos = 0
      outputArray.forEach(driver => {
         newPos += 1
         driver.Pos = newPos 
      })

      let filename = driverClass.classname.replace(/\s/g, "");
      filename = './results/'+ filename + "_" + roundindex;
      //console.log("output Array is :", outputArray)
      csvwrite.exportCSV(filename, outputHeaders, outputArray);
      outputArray = [];
   });
} //exportRoundCSV



async function exportRoundCSV2(rounds, roundindex, scoring, driverScores){
   // New version no longer based on seasons
   const round = rounds[roundindex-1];
   let arrayIndexes = getScoreArrayIndexesNew(rounds, scoring, roundindex);

   //Set up header and array data structures
   let scoreCount = 0;
   let outputHeaders = ["Pos", "ID", "Name"];
   let outputLine = {"Pos": 0, "ID": "", "Name": "", "Total": 0}
   let scoreColumns = []
   let outputArray = []

   var subsessionCounter = 0;
   round.subsession_ids.forEach(subsession_id => {
      let session = scoring[round.score_types[subsessionCounter]];
      scoreCount = scoreCount + session.scored_events.length;
      session.scored_events.forEach(scored_event => {
         let titleStr = session.score_type + "-" + scored_event.score_event
         outputHeaders.push(titleStr)
         outputLine[titleStr] = titleStr
         scoreColumns.push(titleStr)
      });
      subsessionCounter +=1;
   });
   
  /* round.sessions.forEach(session => {
      scoreCount = scoreCount + session.scored_events.length;
      session.scored_events.forEach(scored_event => {
         let titleStr = session.event_type + "-" + scored_event.score_event
         outputHeaders.push(titleStr)
         outputLine[titleStr] = titleStr
         scoreColumns.push(titleStr)
      });
   }); */
   outputHeaders.push("Total");
   outputLine.Total = 0;

   //Iterate through Driver Scores
   driverScores.forEach(driverClass => {
      driverClass.drivers.forEach(driver =>{
         let newline = utils.deepCopy(outputLine);
         newline.ID = driver.cust_id;
         newline.Name = driver.display_name;   
         let lineTotal = 0;
         let columnCounter = 0
         for (let i = arrayIndexes.this_round_start_index; i < arrayIndexes.this_round_start_index + arrayIndexes.this_round_size; i++) {
            score = driver.scores[i];
            var nameindex = scoreColumns[columnCounter];
            newline[nameindex] = score;
            lineTotal = lineTotal + score;
            columnCounter +=1
         }
         newline.Total = lineTotal
         outputArray.push(newline)
      });

      //Sort

      const sorter1 = (a, b) => a.Total < b.Total ? 1 : -1;
      outputArray.sort(sorter1)
      let newPos = 0
      outputArray.forEach(driver => {
         newPos += 1
         driver.Pos = newPos 
      })

      let filename = driverClass.classname.replace(/\s/g, "");
      filename = './results/'+ filename + "_" + roundindex;
      //console.log("output Array is :", outputArray)
      csvwrite.exportCSV(filename, outputHeaders, outputArray);
      outputArray = [];
   });
} //exportRoundCSV2



async function exportSessionJSON(session){
   let filename = './results/'+session.subsession_id + '.json'
   fs.writeFile(filename, JSON.stringify(session), (err) => {
      if (err) throw err;
      console.log('Session saved : ', filename);
   });
} //exportSessionJSON

async function exportLeagueSessionJSON(leagueID, session){
   let filename = path.join(__dirname, '/data/'+leagueID+'/irresults/'+session.subsession_id + '.json');
   fs.writeFile(filename, JSON.stringify(session), (err) => {
      if (err) throw err;
      console.log('Session saved : ', filename);
   });
} //exportSessionJSON

async function exportResultsJSON(results, filename){
   //let filename = 'results.json'
   fs.writeFile(filename, JSON.stringify(results), (err) => {
      if (err) throw err;
      console.log('Results saved as : ', filename);
   });
} //exportSessionJSON


exports.exportRoundCSV = exportRoundCSV;
exports.exportRoundCSV2 = exportRoundCSV2;
exports.exportSessionJSON = exportSessionJSON;
exports.exportLeagueSessionJSON = exportLeagueSessionJSON;
exports.exportResultsJSON = exportResultsJSON;
//exports.exportClassResultsTableJSON = exportClassResultsTableJSON;  MOVED TO SCORING.JS