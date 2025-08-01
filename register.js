// Manages routing of the protest function
// https://www.tutorialspoint.com/expressjs/expressjs_url_building.htm

// Express requirements

var express = require('express');
var router = express.Router();
var path = require('path');
var iRacing = require('./iracing.js');

//app internal requirements
var config = require('./appconfig.js');
//var editor = require('./editor2.js');  // editor2.js includes cache functionality
var leaguedata = require('./leaguedata.js');

//Register Middleware
router.use(function (req, res, next) {
   console.log("A PROTEST request received at " + Date.now() + " for " + JSON.stringify(req.url));
   next();
});

//Register routes
router.get('/', function (req, res) {
   const reqLeagueID = req.baseUrl.split("/")[1].toUpperCase();
   console.log("GET Routed to /:leagueid/register/:route - with league ID : ", reqLeagueID, " and route :", req.params.route);
   res.cookie('leagueid', reqLeagueID);
   res.sendFile(path.join(__dirname, '/html/register.html'));
});


router.get('/:route', function (req, res) {
   const reqLeagueID = req.baseUrl.split("/")[1].toUpperCase();
   console.log("GET Routed to /:leagueid/register/:route - with league ID : ", reqLeagueID, " and route :", req.params.route);
   if (config.leagueIDs.includes(reqLeagueID)) {
      switch (req.params.route) {
         case "header.png":
            res.sendFile(path.join(__dirname, '/data/' + reqLeagueID + '/img/header.png'));
            console.log("sending header.png from ", __dirname);
            break;

         case "style.css":
            res.sendFile(path.join(__dirname, '/css/style.css'));
            break;

      }//switch route
   } else {
      res.send('Sorry, this is an unknown league.');
   }
});


router.post('/', function (req, res) {
   res.send('No POST route on the root of REGISTER/.');
});

router.post('/:route', function (req, res) {
   const reqLeagueID = req.baseUrl.split("/")[1].toUpperCase();
   console.log("POST Routed to /:leagueid/register/:route - with league ID : ", reqLeagueID, " and route :", req.params.route);

   switch (req.params.route) {

      case "driver":
         const thisCust_Id = req.body.cust_id;
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

      case "registerconfirmation":
         var newRegistration = {}
         newRegistration = JSON.parse(req.body.registration);
         //console.log("new registration Recieved : ", newRegistration);
         leaguedata.submitProtest(reqLeagueID, newRegistration).then((result) => {
            leaguedata.cache[reqLeagueID].registration = result;
            res.sendFile(path.join(__dirname, '/html/registerconf.html'));
         });
         break;

      default:
         res.send('UNKNOWN ROUTE : The leagueid you specified is ' + reqLeagueID + " and the route requested is :" + req.params.route);
   }//switch route
});   // Post routes


//export this router to use in our index.js
module.exports = router;