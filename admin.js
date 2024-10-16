// https://www.tutorialspoint.com/expressjs/expressjs_url_building.htm

// Express requirements
var express = require('express');
var router = express.Router();
var path = require('path');

//app internal requirements
var config = require('./appconfig.js');
var editor = require('./editor2.js');  // editor2.js includes cache functionality
var leaguedata = require('./leaguedata.js'); //was calc_league.js

//Admin Middleware
router.use(function (req, res, next) {
   console.log("An ADMIN request received at " + Date.now() + " for " + JSON.stringify(req.url));
   next();
});

//admin routes

router.get('/', function (req, res) {
   res.send('GET route on admin.');
});

router.get('/:leagueid', function (req, res) {
   const reqLeagueiD = req.params.leagueid.toUpperCase();
   if (config.leagueIDs.includes(reqLeagueiD)) {
      res.send('Found the league you specified : ' + reqLeagueiD + ' : will route to league admin');
   } else {
      res.send('Sorry, this is an unknown league.');
   }
});

router.get('/:leagueid/:route', function (req, res) {
   const reqLeagueID = req.params.leagueid.toUpperCase();
   switch (req.params.route) {

      case "style.css":
         res.sendFile(path.join(__dirname, '/css/style.css'));
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

      case "classes":
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(leaguedata.cache[reqLeagueID].classes));
         break;

      default:
         res.send('UNKNOWN ADMIN ROUTE : The leagueid you specified is ' + reqLeagueID + " and the route requested is :" + req.params.route);
   }//switch route
});

router.post('/', function (req, res) {
   res.send('No POST route on admin.');
});

router.post('/:leagueid/:route', function (req, res) {
   const reqLeagueID = req.params.leagueid.toUpperCase();
   switch (req.params.route) {

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
         const modDriver = req.body.cust_id;
         if (modDriver === undefined) {
            const errormsg = { error: "could not read driver info sent to server" };
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(errormsg));
         } else {
            modDriver.cust_id = Number(modDriver.cust_id);
            const existsDriverIndex = drivers.findIndex((driver) => driver.cust_id === modDriver.cust_id);
            if (existsDriverIndex == -1) {
               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(JSON.stringify({ error: "could not find matching driver in database" }));
            } else {
               drivers[existsDriverIndex] = modDriver;
               jsonloader.saveDrivers(drivers);
               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(JSON.stringify({ confirmation: "modified driver record saved successfuly" }));
            }
         }

         break;


      case "adddriver":
         //var newDriver = JSON.parse(data);
         const newDriver = req.body.cust_id;
         if (newDriver === undefined) {
            const errormsg = { error: "could not read driver info sent to server" };
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(errormsg));
         } else {
            newDriver.cust_id = Number(newDriver.cust_id);
            drivers.push(newDriver);
            jsonloader.saveDrivers(drivers);
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
            const existsDriverIndex = drivers.findIndex((driver) => driver.cust_id === deleteDriver.cust_id);
            if (existsDriverIndex == -1) {
               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(JSON.stringify({ error: "could not find matching driver in database" }));
            } else {
               drivers.splice(existsDriverIndex, 1);
               jsonloader.saveDrivers(drivers);
               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(JSON.stringify({ confirmation: "modified driver record saved successfuly" }));
            }
         }

         break;

      default:
         res.send('UNKNOWN ROUTE : The leagueid you specified is ' + reqLeagueID + " and the route requested is :" + req.params.route);
   } //switch route
});




//export this router to use in our index.js
module.exports = router;