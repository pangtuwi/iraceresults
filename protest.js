// Manages routing of the protest function
// https://www.tutorialspoint.com/expressjs/expressjs_url_building.htm

// Express requirements

var express = require('express');
var router = express.Router();
var path = require('path');
//var iRacing = require('./iracing.js');

//app internal requirements
var config = require('./appconfig.js');
var editor = require('./editor2.js');  // editor2.js includes cache functionality
var leaguedata = require('./leaguedata.js'); //was calc_league.js

//Protest Middleware
router.use(function (req, res, next) {
   console.log("A PROTEST request received at " + Date.now() + " for " + JSON.stringify(req.url));
   next();
});

//protest routes
router.get('/', function (req, res) {
   console.log("a GET request for protest Routed to /");
   const reqLeagueID = req.baseUrl.split("/")[1].toUpperCase();
   res.cookie('leagueid', reqLeagueID);
   res.sendFile(path.join(__dirname, '/html/protest.html'));
});


router.get('/:route', function (req, res) {
   const reqLeagueID = req.baseUrl.split("/")[1].toUpperCase();
   console.log("GET Routed to /:leagueid/protest/:route - with league ID : ", reqLeagueID, " and route :", req.params.route);
   if (config.leagueIDs.includes(reqLeagueID)) {
      switch (req.params.route) {
         case "header.png":
            res.sendFile(path.join(__dirname, '/data/' + reqLeagueID + '/img/header.png'));
            console.log("protest.js GET sending header.png from ", __dirname);
            break;

         case "style.css":
            res.sendFile(path.join(__dirname, '/css/style.css'));
            break;

         /*     case "drivers":
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
                 break; */
         case "drivers":
            console.log("GET routed to protest.js : Getting drivers for league ", reqLeagueID);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.cache[reqLeagueID].drivers));
            break;

         case "protestablerounds":
            console.log("Getting protestable rounds for league ", reqLeagueID);   
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            const protestableRounds = leaguedata.getProtestableRounds(reqLeagueID);
            console.log("protestableRounds: ", protestableRounds);
            res.end(JSON.stringify(protestableRounds));
            break;


         //  break;
      }//switch route
   } else {
      res.send('Sorry, this is an unknown league.');
   }
});


router.post('/', function (req, res) {
   res.send('No POST route on PROTEST/.');
});

router.post('/:route', function (req, res) {
   const reqLeagueID = req.baseUrl.split("/")[1].toUpperCase();
   console.log("POST Routed to /:leagueid/protest/:route - with league ID : ", reqLeagueID, " and route :", req.params.route);

   switch (req.params.route) {
      case "scoredevents":
         const reqRoundNo = req.body.round_no;
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         const scoredEvents = leaguedata.getScoredEvents(reqLeagueID, reqRoundNo);
         res.end(JSON.stringify(scoredEvents));
         break;

      case "protestconfirmation":
         var newProtest = {}
         newProtest = JSON.parse(req.body.protest);
         //console.log("new Protest Recieved : ", newProtest);
         leaguedata.submitProtest(reqLeagueID, newProtest).then((result) => {
            leaguedata.cache[reqLeagueID].protests = result;
            res.sendFile(path.join(__dirname, '/html/protestconf.html'));
         });
         break;

      default:
         res.send('UNKNOWN ROUTE : The leagueid you specified is ' + reqLeagueID + " and the route requested is :" + req.params.route);
   }//switch route
});   // Post routes


//export this router to use in our index.js
module.exports = router;