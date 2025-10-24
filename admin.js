// https://www.tutorialspoint.com/expressjs/expressjs_url_building.htm

// Express requirements
var express = require('express');
var router = express.Router();
var path = require('path');
var iRacing = require('./iracing.js');
var logger = require('./logger.js');

//app internal requirements
var config = require('./appconfig.js');
var editor = require('./editor2.js');  // editor2.js includes cache functionality
var leaguedata = require('./leaguedata.js'); //was calc_league.js
var auth = require('./auth.js');
var discord = require('./discord.js');

//Admin Middleware - Authentication required
router.use(auth.ensureAuthenticated);

router.use(function (req, res, next) {
   //console.log("An ADMIN request received at " + Date.now() + " for " + JSON.stringify(req.url));
   next();
});

// Helper function to format date and time in readable format
// Returns format like "9:45pm on Tuesday 14th of October"
function formatDateTimeReadable(date) {
   const day = date.getDate();
   const suffix = (day === 1 || day === 21 || day === 31) ? 'st' : (day === 2 || day === 22) ? 'nd' : (day === 3 || day === 23) ? 'rd' : 'th';

   const hours = date.getHours();
   const minutes = date.getMinutes();
   const ampm = hours >= 12 ? 'pm' : 'am';
   const displayHours = hours % 12 || 12;
   const displayMinutes = minutes.toString().padStart(2, '0');
   const timeString = displayHours + ':' + displayMinutes + ampm;

   const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
   const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
   const dayName = dayNames[date.getDay()];
   const monthName = monthNames[date.getMonth()];

   return timeString + ' on ' + dayName + ' ' + day + suffix + ' of ' + monthName;
}

//admin routes

router.get('/', function (req, res) {
   res.send('You need to specify the League you wish to administer.');
});

router.get('/:leagueid', auth.ensureAuthorizedForLeague, function (req, res) {
   //console.log("Admin request for /:leagueid   :", req.params.leagueid);
   const reqLeagueiD = req.params.leagueid.toUpperCase();
   if (config.leagueIDs.includes(reqLeagueiD)) {
      //res.send('Found the league you specified : ' + reqLeagueiD + ' : will route to league admin');

      res.sendFile(path.join(__dirname, '/html/admin.html'));

   } else {
      res.send('Sorry, this is an unknown league.');
   }
});

router.get('/:leagueid/:route', auth.ensureAuthorizedForLeague, function (req, res) {
   const reqLeagueID = req.params.leagueid.toUpperCase();

   switch (req.params.route) {

      case "style.css":
         res.sendFile(path.join(__dirname, '/css/style.css'));
         break;

      case "header.png":
         res.sendFile(path.join(__dirname, '/data/' + reqLeagueID + '/img/header.png'));
         console.log("sending header.png from ", __dirname);
         break;

      case "drivers":
         editor.getDriversHTML(reqLeagueID, -1, function (err, data) {
            if (err) {
               res.statusCode = 500;
               res.end(`Error getting driver data : ${err}.`);
            } else {
               // if the file is found, set Content-type and send data
               res.setHeader("Content-Type", "text/html");
               res.writeHead(200);
               res.end(data);
            }
         });
         break;

      case "leagueid":
         const reqLeagueiD = req.params.leagueid.toUpperCase();
         const leagueIDObj = { "leagueid": reqLeagueiD };
         console.log("sending leagueID: ", JSON.stringify(leagueIDObj));
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(leagueIDObj));
         break;


      case "leaguename":
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         const reply = { leagueid: reqLeagueID, leaguename: leaguedata.cache[reqLeagueID].config.league_name };
         console.log("Sending league name reply :", reply);
         res.end(JSON.stringify(reply));
         break;


      case "protests":
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(leaguedata.cache[reqLeagueID].protests));
         break;

      case "sessions":
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(leaguedata.getSessionsDetail(reqLeagueID)));
         break;

      case "unresolvedprotests":
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         const unresolved = leaguedata.getUnresolvedProtests(reqLeagueID)
         res.end(JSON.stringify(unresolved));
         break;

      case "allprotests":
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(leaguedata.cache[reqLeagueID].protests));
         break;

      case "stewarding":
         res.cookie('leagueid', reqLeagueID);
         res.sendFile(path.join(__dirname, '/html/stewarding.html'));
         break;

      case "stewardspen":
         res.cookie('leagueid', reqLeagueID);
         res.sendFile(path.join(__dirname, '/html/stewardspen.html'));
         break;

      case "penalties_admin":
         res.cookie('leagueid', reqLeagueID);
         res.sendFile(path.join(__dirname, '/html/penalties_admin.html'));
         break;

      case "protests_admin":
         res.cookie('leagueid', reqLeagueID);
         res.sendFile(path.join(__dirname, '/html/protests_admin.html'));
         break;

      case "recalc_admin":
         res.cookie('leagueid', reqLeagueID);
         res.sendFile(path.join(__dirname, '/html/recalc_admin.html'));
         break;

      case "licencepoints_admin":
         res.cookie('leagueid', reqLeagueID);
         res.sendFile(path.join(__dirname, '/html/licencepoints_admin.html'));
         break;

      case "session":
         res.cookie('leagueid', reqLeagueID);
         res.sendFile(path.join(__dirname, '/html/session.html'));
         break;

      case "loglist":
         res.cookie('leagueid', reqLeagueID);
         res.sendFile(path.join(__dirname, '/html/loglist.html'));
         break;

      case "recalculationlog":
         console.log("sending recalculation log")
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(logger.getLog()));
         break;

      case "completedrounds":
         //console.log ("processing request for completed rounds");
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(leaguedata.getCompletedRounds(reqLeagueID)));
         break;

      case "classes":
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(leaguedata.cache[reqLeagueID].classes));
         break;


      case "driverlist":
         //console.log ("processing request for driver list");
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(leaguedata.cache[reqLeagueID].drivers));
         break;

      case "penaltiesjson":
         //console.log ("processing request for penalty list");
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(leaguedata.cache[reqLeagueID].penalties));
         break;

      case "licencepoints":
         console.log("processing request for licence points");
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(leaguedata.cache[reqLeagueID].licencepoints));
         break;

      case "config":
         res.cookie('leagueid', reqLeagueID);
         res.sendFile(path.join(__dirname, '/html/config.html'));
         break;

      case "configjson":
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(leaguedata.cache[reqLeagueID].config));
         break;

      case "discordtablesupdated":
         console.log("Request received to notify Discord that tables have been updated");
         discord.sendWebhookMessage("Tables have been updated : http://iraceresults.co.uk/" + reqLeagueID + "/").then((result) => {
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify({ confirmation: "ok" }));
         })
            .catch(error => {
               console.log(error);
               res.setHeader("Content-Type", "application/json");
               res.writeHead(500);
               res.end(JSON.stringify({ error: error.message }));
            });
         break;

      default:
         res.send('UNKNOWN ADMIN ROUTE : The leagueid you specified is ' + reqLeagueID + " and the route requested is :" + req.params.route);
   }//switch route
});

router.post('/', function (req, res) {
   res.send('No POST route on admin.');
});

router.post('/:leagueid/:route', auth.ensureAuthorizedForLeague, function (req, res) {
   const reqLeagueID = req.params.leagueid.toUpperCase();
   switch (req.params.route) {

      case "scoredevents":
         const reqRoundNo = req.body.round_no;
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         const scoredEvents = leaguedata.getScoredEvents(reqLeagueID, reqRoundNo);
         res.end(JSON.stringify(scoredEvents));
         break;

      case "driver":
         //const thisCust_Id = Number(JSON.parse(data).cust_id);
         const thisCust_Id = req.body.cust_id;

         //MOVE THIS INTO leaguedata.JS
         const thisDriver = leaguedata.cache[reqLeagueID].drivers.find((driver) => driver.cust_id == thisCust_Id);
         console.log("processing request for cust_id:", thisCust_Id);
         if (thisDriver === undefined) {
            iRacing.getDriverData(thisCust_Id, function (err, data) {
               if (err) {
                  res.statusCode = 500;
                  res.end(`Error getting driver data : ${err}.`);
               } else {
                  // if the file is found, set Content-type and send data
                  if (data.members.length == 1) {
                     const tempDriver = data.members[0];
                     var newDriver = {
                        cust_id: tempDriver.cust_id,
                        display_name: tempDriver.display_name,
                        classnumber: 1
                     };
                     console.log("new Driver is :", newDriver);
                  } else {
                     var newDriver = { cust_id: thisCust_Id, display_name: "cust_id not found in iR Database", classnumber: 1 };
                     console.log("new Driver is :", newDriver);
                  }
                  console.log("new Driver is :", newDriver);
                  res.setHeader("Content-Type", "application/json");
                  res.writeHead(200);
                  res.end(JSON.stringify(newDriver));
               }
            });
         } else {
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(thisDriver));
         }
         break;

      case "moddriver":
         // var modDriver = JSON.parse(data);
         const modDriver = req.body;
         if (modDriver.cust_id === undefined) {
            const errormsg = { error: "could not read driver info sent to server" };
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(errormsg));
         } else {
            modDriver.cust_id = Number(modDriver.cust_id);
            const existsDriverIndex = leaguedata.cache[reqLeagueID].drivers.findIndex((driver) => driver.cust_id === modDriver.cust_id);
            if (existsDriverIndex == -1) {
               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(JSON.stringify({ error: "could not find matching driver in database" }));
            } else {
               leaguedata.updateDriver(reqLeagueID, modDriver.cust_id, modDriver);
               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(JSON.stringify({ confirmation: "modified driver record saved successfuly" }));
            }
         }

         break;


      case "adddriver":
         //var newDriver = JSON.parse(data);
         const newDriver = req.body;
         if (newDriver === undefined) {
            const errormsg = { error: "could not read driver info sent to server" };
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(errormsg));
         } else {
            newDriver.cust_id = Number(newDriver.cust_id);
            leaguedata.addDriver(reqLeagueID, newDriver);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify({ confirmation: "modified driver record saved successfuly" }));
         }


         break;

      case "deletedriver":
         //var deleteDriver = JSON.parse(data);
         const deleteDriver = req.body.cust_id;
         if (deleteDriver === undefined) {
            const errormsg = { error: "could not read driver info sent to server" };
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(errormsg));
         } else {
            deleteDriver.cust_id = Number(deleteDriver.cust_id);
            const existsDriverIndex = leaguedata.cache[reqLeagueID].drivers.findIndex((driver) => driver.cust_id === deleteDriver.cust_id);
            if (existsDriverIndex == -1) {
               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(JSON.stringify({ error: "could not find matching driver in database" }));
            } else {
               leaguedata.deleteDriver(reqLeagueID, deleteDriver.cust_id);

               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(JSON.stringify({ confirmation: "modified driver record saved successfuly" }));
            }
         }
         break;

      case "updatesession":
         const modSession = req.body;
         if (modSession.session_ref === undefined) {
            const errormsg = { error: "could not read session info sent to server" };
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(errormsg));
         } else {
            console.log("request recieved to update session: ", modSession);
            modSession.session_ref = Number(modSession.session_ref);
            if (leaguedata.updateSessionID(reqLeagueID, modSession)) {
               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(JSON.stringify({ confirmation: "modified session record saved successfully" }));
            } else {

            }
         }
         break;

      case "penalty":
         var newPenalty = {}
         newPenalty = JSON.parse(req.body.penalty);
         console.log("new Penalty Recieved : ", newPenalty);
         leaguedata.submitPenalty(reqLeagueID, newPenalty).then((result) => {
            leaguedata.cache[reqLeagueID].penalties = result;
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify({ confirmation: "Penalty submitted Successfully" }));
         });
         break;

      case "stewardspenalty":
         var newPenalty = {}
         newPenalty = JSON.parse(req.body.penalty);
         console.log("new STEWARDS Penalty Recieved : ", newPenalty);
         leaguedata.submitStewardsPenalty(reqLeagueID, newPenalty).then((result) => {
            leaguedata.cache[reqLeagueID].penalties = result;
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify({ confirmation: "ok" }));
            //res.sendFile(path.join(__dirname, '/html/protestconf.html'));
         });
         break;

      case "updatepenalty":
         const updatedPenalty = req.body;
         console.log("Update Penalty Request Body : ", updatedPenalty);
         if (!updatedPenalty.penalty_id) {
            res.setHeader("Content-Type", "application/json");
            res.writeHead(400);
            res.end(JSON.stringify({ error: "penalty_id is required" }));
            return;
         }
         leaguedata.updatePenalty(reqLeagueID, updatedPenalty).then((result) => {
            leaguedata.cache[reqLeagueID].penalties = result;
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify({ confirmation: "ok" }));
         })
            .catch(error => {
               console.log(error);
               res.setHeader("Content-Type", "application/json");
               res.writeHead(500);
               res.end(JSON.stringify({ error: error.message }));
            });
         break;

      case "deletepenalty":
         var penalty_id = -1;
         console.log("Delete Penalty Request Body : ", req.body);
         penalty_id = JSON.parse(req.body.penalty_id);
         console.log("Delete Penalty Recieved : ", penalty_id);
         leaguedata.deletePenalty(reqLeagueID, penalty_id).then((result) => {
            leaguedata.cache[reqLeagueID].penalties = result;
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify({ confirmation: "ok" }));
         })
            .catch(error => console.log(error));
         break;

      //send list of penalties to be resolved
      case "penaltiesjson":
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(leaguedata.cache[reqLeagueID].penalties));
         break;

      case "updateconfig":
         const modConfig = req.body;
         if (modConfig === undefined) {
            const errormsg = { error: "could not read config info sent to server" };
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(errormsg));
         } else {
            console.log("request received to update config: ", modConfig);
            leaguedata.updateConfig(reqLeagueID, modConfig).then((result) => {
               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(JSON.stringify({ confirmation: "Config updated successfully" }));
            }).catch((error) => {
               res.setHeader("Content-Type", "application/json");
               res.writeHead(500);
               res.end(JSON.stringify({ error: error.message }));
            });
         }
         break;

      case "unresolveprotest":
         var protest_id = -1;
         console.log("Unresolve Protest Request Body : ", req.body);
         protest_id = JSON.parse(req.body.protest_id);
         console.log("Unresolve Protest Received : ", protest_id);
         leaguedata.unresolveProtest(reqLeagueID, protest_id).then((result) => {
            leaguedata.cache[reqLeagueID].protests = result;
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify({ confirmation: "ok" }));
         })
            .catch(error => {
               console.log(error);
               res.setHeader("Content-Type", "application/json");
               res.writeHead(500);
               res.end(JSON.stringify({ error: error.message }));
            });
         break;

      case "resolveprotest":
         var protest_id = -1;
         console.log("Resolve Protest Request Body : ", req.body);
         protest_id = JSON.parse(req.body.protest_id);
         console.log("Resolve Protest Received : ", protest_id);
         leaguedata.resolveProtest(reqLeagueID, protest_id).then((result) => {
            leaguedata.cache[reqLeagueID].protests = result;
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify({ confirmation: "ok" }));
         })
            .catch(error => {
               console.log(error);
               res.setHeader("Content-Type", "application/json");
               res.writeHead(500);
               res.end(JSON.stringify({ error: error.message }));
            });
         break;

      case "discordmessage":
         var message = "";
         console.log("Discord Message Request Body : ", req.body);
         message = req.body.message;
         console.log("Discord Message Received : ", message);
         discord.sendWebhookMessage(message).then((result) => {
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify({ confirmation: "ok" }));
         })
            .catch(error => {
               console.log(error);
               res.setHeader("Content-Type", "application/json");
               res.writeHead(500);
               res.end(JSON.stringify({ error: error.message }));
            });
         break;

      case "recalculate":
         console.log("have been asked to recalculate");
         console.log("Recalculate Message Request Body : ", req.body);
         const reason_for_recalculation = req.body.reason_for_recalculation;
         const post_to_discord = req.body.post_to_discord;
         const recalcTimestamp = new Date();

         logger.log("Recalculation requested by " + req.user.displayName + " (" + req.user.email + ")");
         //console.log("Recalculation requested by " + req.user.displayName + " (" + req.user.email + ")");
         if (reason_for_recalculation && reason_for_recalculation.length > 0) {
            logger.log("Reason for recalculation: " + reason_for_recalculation);
         }

         // Save recalculation log entry
         const recalcEntry = {
            timestamp: recalcTimestamp.toISOString(),
            formattedDate: formatDateTimeReadable(recalcTimestamp),
            userDisplayName: req.user.displayName,
            userEmail: req.user.email,
            reason: reason_for_recalculation || "No reason given"
         };

         var jsonloader = require('./appjsonloader');
         jsonloader.saveRecalculation(reqLeagueID, recalcEntry).catch((error) => {
            logger.log("Error saving recalculation log: " + error.message);
         });

         if (post_to_discord && post_to_discord === "TRUE") {
            const formattedDate = formatDateTimeReadable(recalcTimestamp);

            discord.sendWebhookMessage("Tables updated at " + formattedDate + " by " + req.user.displayName +
               " \n Updated tables  can be found at http://iraceresults.co.uk/" + reqLeagueID + "/" +
               (reason_for_recalculation && reason_for_recalculation.length > 0 ? ". \n Reason for Update: " + reason_for_recalculation : ". No reason given.")).catch((error) => {
                  logger.log("Error sending Discord notification of recalculation: " + error.message);
               });
         }

         logger.clearLog();
         leaguedata.reCalculate(reqLeagueID).then((result) => {
            leaguedata.updateCache(reqLeagueID).then((result2) => {
               console.log("recalculation done - sending response");
               const recalcJSONMessage = {
                  confirmation: "recalculated " + reqLeagueID,
                  formattedDate: formatDateTimeReadable(recalcTimestamp),
                  userDisplayName: req.user.displayName,
                  userEmail: req.user.email,
                  reason: reason_for_recalculation || "No reason given"
               };
               res.send(JSON.stringify(recalcJSONMessage));
            });
         });
         break;


      default:
         res.send('UNKNOWN ROUTE : The leagueid you specified is ' + reqLeagueID + " and the route requested is :" + req.params.route);
   } //switch route
});

//export this router to use in our index.js
module.exports = router;