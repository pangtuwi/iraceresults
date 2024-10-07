const jsonloader = require('./jsonloader');
const utils = require('./utils/utils');


let DriverScoreTable = {};
let Drivers = {};
let Season = {};


//Returns size of score Array required = sum of score events in all rounds
function getScoreArraySizes(season) {
   let total_size = 0;
   let total_rounds = 0
   let rounds_array = [];
   season.forEach(round => {
      total_rounds++;
      let round_size = 0;
      round.sessions.forEach(session => {
         total_size = total_size + session.scored_events.length;
         round_size = round_size + session.scored_events.length
      });
      rounds_array.push(round_size);
   });
   const score_size = {
      total: total_size,
      rounds: rounds_array
   }
   return score_size;
} //getScoreArraySizes

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
            this_round_start_index = total_size;
         }
      }
      round.sessions.forEach(session => {
         if (round_counter == this_round_index) {
            this_round_size = round_size + session.scored_events.length;
         }
         total_size = total_size + session.scored_events.length;
         round_size = round_size + session.scored_events.length;
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
} //getScoreArrayIndexes

// Returns the score array position of a specified round, session and event
function getScoreArrayPosition(season, round_no, session_no, score_event) {
   let position_counter = 0;
   let position_found = 0;
   let round_counter = 0;
   let session_counter = 0;
   let event_counter = 0;
   season.forEach(round => {
      round.sessions.forEach(session => {
         session.scored_events.forEach(event => {
            if ((round_counter == round_no) && (session_counter == session_no) && (event.score_event = score_event)) {
               position_found = position_counter;
            }
            position_counter += 1;
            event_counter += 1;
         });
         session_counter += 1;
      });
      round_counter += 1;
   });
   return position_found;
}//getScoreArrayPosition

//Takes iracing session Results and creates an array of driver results by driver class 
function createClassResultsArray(leagueconfig, results, classes, score_event_type, min_lap_ratio) {
   let classResults = utils.deepCopy(classes);  // create new array
   classResults.forEach(driverClass => {
      driverClass.positions = [];
      driverClass.positionCounter = 0;
      driverClass.leaderLapsCompleted = 0;
   });
   results.forEach(result => {
      let thisDriver = Drivers.find(item => item.cust_id === result.cust_id);
      if (thisDriver == undefined) {
         let newDriver = {};
         newDriver.cust_id = result.cust_id;
         newDriver.display_name = result.display_name;
         newDriver.classnumber = leagueconfig.class_to_add_new_drivers_to;

         if (leagueconfig.class_to_add_new_drivers_to != -1) {
            Drivers.push(newDriver);   //Add to Driver List
            thisDriver = newDriver;    //Make current drive

            //Add to DriverScoreTable
            const score_array_sizes = getScoreArraySizes(Season);  //Calculate size of scoring array 
            thisDriver.scores = new Array(score_array_sizes.total).fill(0);   //Score Array filled with zeros
            thisDriver.positions = new Array(score_array_sizes.total).fill(0);   //position Array filled with zeros
            thisDriver.penalties = new Array(score_array_sizes.total).fill(0);   //penalties Array filled with zeros
            let driverClassNumber = thisDriver.classnumber;
            const index = DriverScoreTable.findIndex(elem => elem.classnumber === driverClassNumber);
            if (index != -1) DriverScoreTable[index].drivers.push(thisDriver);
         }
      }
      try {
         let classIndex = classResults.findIndex(item => item.classnumber === thisDriver.classnumber);
         let newPositionResult = new Object();
         newPositionResult.cust_id = result.cust_id;
         newPositionResult.display_name = result.display_name;
         newPositionResult.best_lap_time = result.best_lap_time;
         newPositionResult.laps_complete = result.laps_complete;
         newPositionResult.class_interval = result.class_interval;
         newPositionResult.laps_lead = result.laps_lead;
         newPositionResult.starting_position = result.starting_position + 1;
         newPositionResult.finish_position = result.finish_position + 1;  //iracing counts from 0 
         newPositionResult.finish_position_after_penalties = newPositionResult.finish_position;
         newPositionResult.championship_penalty = 0;

         classResults[classIndex].positionCounter = classResults[classIndex].positionCounter + 1;
         if (classResults[classIndex].positionCounter == 1) {
            classResults[classIndex].leaderLapsCompleted = result.laps_complete;
         }
         let newPosition = classResults[classIndex].positionCounter;
         newPositionResult.finish_position_in_class = newPosition;

         if (result.reason_out == "Disconnected") {
            newPositionResult.finished = 0;
            newPositionResult.finish_position_after_penalties = -1;
            newPositionResult.finish_position_in_class_after_penalties = -1;
            console.log(" - - - Driver " + result.display_name + " Disconnected.  DQ");
         } else if (result.laps_complete < min_lap_ratio * classResults[classIndex].leaderLapsCompleted) {
            newPositionResult.finished = 0;
            newPositionResult.finish_position_after_penalties = -1;
            newPositionResult.finish_position_in_class_after_penalties = -1;
            console.log(" - - - Driver " + result.display_name + " only completed " + result.laps_complete + " of " + classResults[classIndex].leaderLapsCompleted + " laps.  DQ");
         } else {
            newPositionResult.finished = 1;
            //newPositionResult.finish_position_after_penalties = newPosition;  
            newPositionResult.finish_position_in_class_after_penalties = newPosition;
         }

         classResults[classIndex].positions.push(newPositionResult);
      }
      catch (err) {
         console.log(" - - - Driver : " + result.display_name + " not found in League Driver list");

      }
   });

   //calculate starting position in class
   if ((score_event_type == "Race") || (score_event_type == "Positions Gained")) {
      let class_driver_count = [];
      let class_counter = 0;
      classResults.forEach(driverClass => {
         class_counter += 1;
         class_driver_count.push(driverClass.positions.length);
         if (class_counter == 1) {
            const sorter_StartingPosition = (a, b) => a.starting_position > b.starting_position ? 1 : -1;
            driverClass.positions = driverClass.positions.sort(sorter_StartingPosition);
            let newStartPosition = 0;
            driverClass.positions.forEach(driver => {
               newStartPosition += 1;
               driver.starting_position_in_class = newStartPosition;
            });
            const sorter_FinishingPositionAfterPenalties = (a, b) => a.finish_position_after_penalties > b.finish_position_after_penalties ? 1 : -1;
            driverClass.positions = driverClass.positions.sort(sorter_FinishingPositionAfterPenalties);
         } else {
            driverClass.positions.forEach(position => {
               position.starting_position_in_class = position.starting_position - class_driver_count[class_counter - 2];
            });
         }
      });
   }

   // Process finish interval times (needed for time penalties).   
   // Reset to class leader = 0 and assume +10s gap for everyone > 1 lap down  (note - not accurate just a way to handle)
   classResults.forEach(driverClass => {
      let first_in_class_interval = driverClass.positions.length > 0 ? driverClass.positions[0].class_interval : 0;
      let first_in_class_interval_offset = 0;
      let previous_driver_interval = 0;
      if (first_in_class_interval > 0) {
         first_in_class_interval_offset = first_in_class_interval;
      } else if (first_in_class_interval < 0) {
         first_in_class_interval = 0;
         first_in_class_interval_offset = 0;
      }
      let index = 0;
      driverClass.positions.forEach(position => {
         index += 1;
         if (position.class_interval >= 0) {
            position.class_interval = position.class_interval - first_in_class_interval_offset;
            previous_driver_interval = position.class_interval;
         } else { // negative so > 1 lap down.
            if (index == 1) {
               position.class_interval = 0;
            } else {
               position.class_interval = previous_driver_interval + 9999;  // 10 seconds * 10000 -1 (so that a 10s penalty moves them one position back)
            }
            previous_driver_interval = position.class_interval;
         }
      })
   });

   return classResults;
}//createClassResultsArray

// inserts results into the Driver score table
function updateDriverScoreTable(subSessionResultsByClass, round_no, score_no, score_array_sizes) {
   let class_index = 0;
   const round_index = round_no - 1;
   const score_index = score_no - 1;
   let array_position = 0;
   for (let index = 0; index < round_index; index++) {
      array_position = array_position + score_array_sizes.rounds[index];
   }
   array_position = array_position + score_index;

   for (const thisClass of DriverScoreTable) {
      for (var pos = 0; pos < subSessionResultsByClass[class_index].positions.length; pos++) {
         let classPositionDriver = subSessionResultsByClass[class_index].positions[pos];
         let driver = thisClass.drivers.find(item => item.cust_id === classPositionDriver.cust_id);
         if (driver) {
            driver.scores[array_position] = classPositionDriver.score;
            if (thisClass.position_score_by == "overall") {
               driver.positions[array_position] = classPositionDriver.finish_position_after_penalties;
            } else {
               driver.positions[array_position] = classPositionDriver.finish_position_in_class_after_penalties;
            }
            driver.penalties[array_position] = classPositionDriver.championship_penalty;
         }
      }
      class_index++;
   }
} //updateDriverScoreTable

//Takes the season config file and Returns an array containing all of the iracing subsession_ids required for download 
function getSubSessionList(season) {
   let subsessionIdArray = [];
   for (const round of season) {
      for (const subSessionInfo of round.sessions) {
         let subsession_id = subSessionInfo.subsession_id;
         if (!subsessionIdArray.includes(subsession_id)) {
            subsessionIdArray.push(subsession_id);
         }
      }
   }
   return subsessionIdArray;
} // getSubSessionList

// applies penalties into Driver Score Table
function applyPenalties(season, classResults, drivers, penalties) {
   //ToDo : Check if both time and position penalties applied.   Would cause issues
   penalties.forEach(penalty => {

      //time penalties
      if (penalty.time_added > 0) {
         //console.log(" - - - Processing Position Penalty for:", penalty.display_name);
         let driver = drivers.find(item => penalty.cust_id === item.cust_id);
         let class_index = driver.classnumber - 1;
         if (class_index < 0) {
            class_index = 0;
            console.log ("class index not found for driver ", driver.display_name);
         }
         let thisClass = classResults[class_index].positions
         // let lastPos = thisClass.length
         let driverPenalised = thisClass.find(item => driver.cust_id === item.cust_id);
         driverPenalised.class_interval = driverPenalised.class_interval + penalty.time_added;

         //Re-sort Results for class based on new times
         const time_added_sorter = (a, b) => a.class_interval > b.class_interval ? 1 : -1;
         thisClass.sort(time_added_sorter);
         let newPos = 0
         thisClass.forEach(driver => {
            newPos += 1
            driver.Pos = newPos
         })
      }

      // Finishing position penalties
      if (penalty.positions > 0) {
         //console.log(" - - - Processing Position Penalty for:", penalty.display_name);
         let driver = drivers.find(item => penalty.cust_id === item.cust_id);
         let class_index = driver.classnumber - 1
         //TODO : fix the class_index not down to zero
         let thisClass = classResults[class_index].positions
         let lastPos = thisClass.length
         let driverPenalised = thisClass.find(item => driver.cust_id === item.cust_id)
         let driverPos = driverPenalised.finish_position_in_class_after_penalties - 1;
         if (driverPenalised.finish_position_in_class_after_penalties != lastPos) {
            let countPositionsAffected = Math.min(penalty.positions, lastPos - driverPos - 1);
            for (let i = driverPos; i < driverPos + countPositionsAffected; i++) {
               thisClass[i] = thisClass[i + 1];
               thisClass[i].finish_position_after_penalties = i + 1;
               thisClass[i].finish_position_in_class_after_penalties = i + 1;
            }
            thisClass[driverPos + countPositionsAffected] = driverPenalised;
            if (driverPenalised.finished == 0) {
               console.log(' - - - - ', driver.display_name, ' did not Finish, position penalty not applied');
               thisClass[driverPos + countPositionsAffected].finish_position_after_penalties = -1;
               thisClass[driverPos + countPositionsAffected].finish_position_in_class_after_penalties = -1;
            } else {
               console.log(' - - - - ', driver.display_name, ": Penalty of ", countPositionsAffected, " positions applied");
               thisClass[driverPos + countPositionsAffected].finish_position_after_penalties = driverPenalised.finish_position + penalty.positions;
               thisClass[driverPos + countPositionsAffected].finish_position_in_class_after_penalties = driverPenalised.finish_position_in_class + penalty.positions;
            }
         } else {
            console.log(' - - - - ', driver.display_name, " in last position, position penalty not applied")
         }
      }


      if (penalty.championship_points > 0) {
         console.log(" - - - -  Processing Championship points Penalty for:", penalty.display_name, "  ", penalty.championship_points, " points");
         let driver = drivers.find(item => penalty.cust_id === item.cust_id);
         let score_array_position = getScoreArrayPosition(season, penalty.round_no, penalty.session_no, penalty.score_event);
         let class_index = driver.classnumber - 1;
         //TODO : fix the class_index not down to zero
         let thisClassPositions = classResults[class_index].positions;
         let driverPenalisedIndex = thisClassPositions.findIndex(item => penalty.cust_id === item.cust_id);
         thisClassPositions[driverPenalisedIndex].championship_penalty -= penalty.championship_points;
      }
   });
   return classResults
}//applyPenalties


// Reorders results by fastest lap
function applyFastestLap(classResults) {
   const sorter_FastestLap = (a, b) => a.best_lap_time > b.best_lap_time ? 1 : -1;
   classResults.forEach(driverClass => {
      driverClass.positions.sort(sorter_FastestLap);
      let position_counter = 0;
      //let driver_count = length(driverClass.positions);
      driverClass.positions.forEach(position => {
         if ((position.best_lap_time == -1) || (position.finished == 0)) {
            position.fastest_lap_position_in_class = -1;
            //position.finish_position_in_class = -1;
            //position.finish_position_after_penalties = -1;
         } else {
            position_counter += 1;
            position.fastest_lap_position_in_class = position_counter;
            //position.finish_position_in_class = position_counter;
            //position.finish_position_after_penalties = position_counter;
         }
      })
   });
   return classResults
} //applyFastestLap


//Returns score for position from scoring array 
function getScore(position, scoring) {
   let position_index = position - 1; // i.e. P1 = 0
   if ((position > scoring.length) || (position == -1)) {
      return (0);
   } else {
      return (scoring[position_index]);
   }
} //getScore


// Inserts scores into driver Table based on positions after penalties
function applyPositionScores(classResults, scoring) {
   classResults.forEach(driverClass => {
      driverClass.positions.forEach(position => {
         if (driverClass.position_score_by == "overall") {
            position.score = getScore(position.finish_position_after_penalties, scoring);
         } else {   //score by class
            position.score = getScore(position.finish_position_in_class_after_penalties, scoring);
         }
      });
   });
   return classResults
} //applyPositionScores


// Inserts scores into driver Table based on fastest lap position in class
function applyFastestLapScores(classResults, scoring) {
   classResults.forEach(driverClass => {
      driverClass.positions.forEach(position => {
         position.score = getScore(position.fastest_lap_position_in_class, scoring);
      });
   });
   return classResults
} //applyFastestLapScores


// Inserts scores into driver Table based on Laps Led
function applyLapsLedScores(classResults, scoring) {
   classResults.forEach(driverClass => {
      driverClass.positions.forEach(position => {
         if ((position.laps_lead > 0) && (position.finished > 0)) {
            position.score = getScore(1, scoring);
            console.log(" - - - ", position.display_name, " led for ", position.laps_lead, "laps and got additional score of ", position.score);
         } else {
            position.score = 0;
         }
      });
   });
   return classResults
} //applyLapsLedScores


// Inserts scores into driver Table based on Positions gained in class
function applyPositionsGainedScores(classResults, scoring) {
   classResults.forEach(driverClass => {
      driverClass.positions.forEach(position => {
         const positions_gained = position.starting_position_in_class - position.finish_position_in_class_after_penalties;
         //console.log(position.display_name, ", ", driverClass.classnumber, ", ",position.starting_position, ", ", position.starting_position_in_class, ", ", position.finish_position, ",", position.finish_position_in_class, ", ", position.finish_position_after_penalties, ",", position.finish_position_in_class_after_penalties, ", ", positions_gained);
         if ((positions_gained > 0) && (position.finished == 1)) {
            position.score = positions_gained * getScore(1, scoring);
            //console.log(" - - - ", position.display_name, " gained ", positions_gained, " positions and got additional score of ", position.score);
         } else {
            position.score = 0;
         }
      });
   });
   return classResults
} //applyPositionsGainedScores


//Calculates the scores for the whole season
async function calc(leagueconfig, seasonSessions) {
   //Load driver Class descriptors from json file and create DriverScoreTable
   let driverClasses = await jsonloader.getClasses();
   DriverScoreTable = utils.deepCopy(driverClasses);
   DriverScoreTable.forEach(driverClass => {
      driverClass.drivers = []; //Add blank array of drivers
   });

   //Load Scoring Points System from json file   
   const scoring = await jsonloader.getScoringPointsSystem();

   //Load Season file containing rounds, events etc. into season object and create score arrays
   Season = await jsonloader.getSeason();
   const score_array_sizes = getScoreArraySizes(Season);  //Calculate size of scoring array 

   //load json file containing list of Drivers for season and put into correct classes in DriverScoreTable
   Drivers = await jsonloader.getDrivers();
   //OriginalDrivers = Drivers;

   Drivers.forEach(driver => {   //create score arrays and put each driver into correct position in class array
      driver.scores = new Array(score_array_sizes.total).fill(0);   //Score Array filled with zeros
      driver.positions = new Array(score_array_sizes.total).fill(0);   //position Array filled with zeros
      driver.penalties = new Array(score_array_sizes.total).fill(0);   //penalties Array filled with zeros
      let driverClassNumber = driver.classnumber;
      const index = DriverScoreTable.findIndex(elem => elem.classnumber === driverClassNumber);
      if (index != -1) DriverScoreTable[index].drivers.push(driver);
   });

   //Load driver Class Changes
   const classChanges = await jsonloader.getClassChanges();

   //load json file containing list of Penalties
   const Penalties = await jsonloader.getPenalties();

   //Process season object, scoring each event of each session of each round.
   Season.forEach(round => {
      console.log("Calculating Scores for round ", round.round_no, " = ", round.track_name);
      var score_event_counter = 0;

      // Process class changes
      classChanges.forEach(classChange => {
         var driver_to_move = {};
         if (classChange.change_from_round == round.round_no) {
            //take driver out of class and put in new class
            DriverScoreTable.forEach(driverClassTable => {
               driver_to_move = driverClassTable.drivers.find(item => item.cust_id === classChange.cust_id) ?? driver_to_move;
               driverClassTable.drivers = driverClassTable.drivers.filter(x => x.cust_id !== classChange.cust_id);
            });
            DriverScoreTable[classChange.new_class_number - 1].drivers.push(driver_to_move);
            var driver = Drivers.find((item => item.cust_id === classChange.cust_id));
            driver.classnumber = classChange.new_class_number;
         }
      });


      round.sessions.forEach(session => {
         let subsession_id = session.subsession_id;
         let session_results = seasonSessions[subsession_id].session_results;
         console.log(" - processing session ", subsession_id);

         session.scored_events.forEach(scoreEvent => {
            score_event_counter++;
            console.log(" - - processing event ", scoreEvent.score_event);
            let subsession = session_results.find(item => item.simsession_name === scoreEvent.simsession_name);
            let subsession_score_array = scoring[scoreEvent.scoring_system].position_scores;  //scoring system to use
            let resultsSplitByClass = createClassResultsArray(leagueconfig, subsession.results, driverClasses, scoreEvent.score_event, scoring[scoreEvent.scoring_system].min_lap_ratio);

            if (scoring[scoreEvent.scoring_system].scoring_type === "Fastest Lap") {
               console.log(" - - - Applying Fastest Lap scoring");
               resultsSplitByClass = applyFastestLap(resultsSplitByClass);
            }

            let subsession_penalties = Penalties.filter(function (item) {
               return ((item.round_no == round.round_no) && (item.session_no == session.session_no) && (item.score_event == scoreEvent.score_event))
            });
            console.log(" - - - found penalties for this event ", subsession_penalties.length);
            resultsAfterPositionPenalties = applyPenalties(Season, resultsSplitByClass, Drivers, subsession_penalties);

            //ToDo Penlty for race must carry over to Positions gained (work around = 2 penalties)
            let score_type = scoring[scoreEvent.scoring_system].scoring_type;
            if (score_type === "Position") {
               scoredResults = applyPositionScores(resultsAfterPositionPenalties, subsession_score_array);
            } else if (score_type === "Fastest Lap") {
               scoredResults = applyFastestLapScores(resultsAfterPositionPenalties, subsession_score_array);
            } else if (score_type === "Laps Led") {
               scoredResults = applyLapsLedScores(resultsAfterPositionPenalties, subsession_score_array);
            } else if (score_type === "Positions Gained") {
               scoredResults = applyPositionsGainedScores(resultsAfterPositionPenalties, subsession_score_array);
            }
            let scoresAdded = updateDriverScoreTable(scoredResults, round.round_no, score_event_counter, score_array_sizes);

         });
      });
   });
   return DriverScoreTable;
};  //calc

async function classResultsTable(season, driverScores, apply_drop_scores_text, no_drop_scores_rounds) {
   //Set up header and array data structures
   let apply_drop_scores = (apply_drop_scores_text === "TRUE");
   let classesArray = [];
   let classArray = [];
   let outputHeaders = ["Pos", "Name"];
   let outputLine = { "Pos": 0, "Name": "" }
   let scoreColumns = [];
   let outputArray = [];
   let arrayIndexes = [];
   season.forEach(function (round, i) {
      let thisArrayIndexSet = getScoreArrayIndexes(season, i);
      arrayIndexes.push(thisArrayIndexSet);
      let titleStr = round.track_name;
      outputHeaders.push(titleStr);
      scoreColumns.push(titleStr);
      outputLine[titleStr] = 0;
   });
   if (apply_drop_scores) {
      outputHeaders.push("Drop");
      outputLine.Drop = 0;
   }
   outputHeaders.push("Penalties");
   outputHeaders.push("Total");
   outputLine.Penalties = 0;
   outputLine.Total = 0;

   //Iterate through Driver Scores
   driverScores.forEach(driverClass => {
      classArray = [];
      driverClass.drivers.forEach(driver => {
         let newline = utils.deepCopy(outputLine);
         //newline.ID = driver.cust_id;
         newline.Name = driver.display_name;
         newline.Penalties = 0;
         newline.Total = 0;
         arrayIndexes.forEach(function (iS, columnCounter) {  //indexSet
            var nameindex = scoreColumns[columnCounter];
            var driverRoundTotal = 0;
            var driverRoundPenalties = 0;
            for (let i = iS.this_round_start_index; i < iS.this_round_start_index + iS.this_round_size; i++) {
               score = driver.scores[i];
               penalty = driver.penalties[i];
               driverRoundTotal += score;
               driverRoundPenalties += penalty;
            }
            if (apply_drop_scores && !no_drop_scores_rounds.includes(iS.this_round_index + 1)) {
               if (columnCounter == 0) {
                  newline.Drop = driverRoundTotal;
               } else {
                  newline.Drop = Math.min(newline.Drop, driverRoundTotal);
               }
            }

            newline[nameindex] = driverRoundTotal;
            newline.Penalties += driverRoundPenalties;
            newline.Total += driverRoundTotal;
            newline.Total += driverRoundPenalties;
         });
         if (apply_drop_scores) {
            newline.Drop = -1 * newline.Drop;
            newline.Total = newline.Total + newline.Drop;
         }
         classArray.push(newline)
      });

      //Sort
      const sorter1 = (a, b) => a.Total < b.Total ? 1 : -1;
      classArray.sort(sorter1)
      let newPos = 0
      classArray.forEach(driver => {
         newPos += 1
         driver.Pos = newPos
      })

      classesArray.push(classArray);
      //console.log(classArray);
   });
   return classesArray;
} // ClassResultsTable

// Teams Results Table Calculation
function teamsResultsTable(season, teams, classesArray) {
   //Create output Table
   let teamsTable = [];

   //Create Array of drivers and put all the class results into it (class is irrelevant for teams scores)
   let driversArray = [];
   classesArray.forEach(driverClass => {
      driverClass.forEach(driver => {
         driversArray.push(driver);
      });
   });

   //create Array of rounds
   let scoreColumns = [];
   let outputHeaders = ["Pos", "Team Name", "Driver 1", "Driver 2", "Driver 3"];
   let outputLine = { "Pos": 0, "Team Name": "", "Driver 1": "", "Driver 2": "", "Driver 3": "" }

   season.forEach(function (round, i) {
      //let thisArrayIndexSet = getScoreArrayIndexes(season, i);
      //arrayIndexes.push(thisArrayIndexSet);
      let titleStr = round.track_name;
      outputHeaders.push(titleStr);
      scoreColumns.push(titleStr);
      outputLine[titleStr] = 0;
   });

   outputLine.Total = 0

   //Add driver names to teams Results table
   teams.forEach(function (team, i) {
      let newline = utils.deepCopy(outputLine);
      newline["Team Name"] = team.team_name;
      newline["Driver 1"] = team.drivers[0].display_name;
      if (team.drivers.length > 1) {
         newline["Driver 2"] = team.drivers[1].display_name;
      }
      if (team.drivers.length > 2) {
         newline["Driver 3"] = team.drivers[2].display_name;
      }
      teamsTable.push(newline);
   });

   //iterate through teams and get all team driver results.  Select Best 2
   teams.forEach(team => {
      scoreColumns.forEach(columnName => {
         let driverScoreArray = [];
         let teamScore = 0;
         team.drivers.forEach(driver => {
            var thisDriverScore = 0;
            let thisDriver = driversArray.find(item => item.Name === driver.display_name);
            if (thisDriver === undefined) {
               thisDriverScore = 0;
               console.log("Could not find driver ", driver.display_name, " for scoring team ", team.team_name);
            } else {
               thisDriverScore = thisDriver[columnName];
            }
            driverScoreArray.push(thisDriverScore);
         });
         switch (driverScoreArray.length) {
            case 1:
               teamScore = driverScoreArray[0];
               break;
            case 2:
               teamScore = driverScoreArray[0] + driverScoreArray[1];
               break;
            default:
               const sum = driverScoreArray.reduce((total, thisScore) => total + thisScore);
               const minScore = Math.min(...driverScoreArray);  //... is the spread operator
               teamScore = sum - minScore;
         }
         let thisTeam = teamsTable.find(item => item["Team Name"] === team.team_name);
         thisTeam[columnName] = teamScore;
         thisTeam.Total += teamScore;
      });
   });

   //Sort teamsTable
   const sorter1 = (a, b) => a.Total < b.Total ? 1 : -1;
   teamsTable.sort(sorter1)
   let newPos = 0
   teamsTable.forEach(team => {
      newPos += 1
      team.Pos = newPos
   })

   return teamsTable;
}//teamsResultsTable

function getNewDrivers(){
   return Drivers;
} //getNewDrivers

//ToDo : What to do if there is a driver in the results that is not in the drivers list.
//toDo : Occasional timeouts from iRacing
//ToDo : Eliminate reason_out:"Disconnected" drivers
//ToDo : Class moves for Drivers

exports.getSubSessionList = getSubSessionList;
exports.calc = calc;
exports.classResultsTable = classResultsTable;
exports.teamsResultsTable = teamsResultsTable;
exports.getNewDrivers = getNewDrivers;