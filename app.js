
console.log("= = = = = = NodeJS running app.js Express version of iRaceResults = = = = = =");

// Express requirements
var config = require('./appconfig.js');
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

//my app requirements
var leaguedata = require('./leaguedata.js'); //was calc_league.js
var admin = require('./admin.js');
var protest = require('./protest.js');
var register = require('./register.js');
var logger = require ('./logger.js');


app.use(bodyParser.urlencoded({ extended: false })); //To parse URL encoded data
app.use(bodyParser.json());//To parse json data
app.use(cookieParser());//To Parse Cookies
app.use(express.static('script'));
app.use(express.static('html'));
app.use(express.static('css'));

// Custom Routes
app.use('/admin', admin);
app.use('/:leagueid/protest', protest);
app.use('/:leagueid/register', register);

// Bugs
// BUG : Protest numbering sequence incorrect
// BUG : If more than one round is open for protest, the events for only the first round are shown 
// BUG : Dividing lines are missing in scores table


// Preload and cache config and results for named league
leaguedata.loadCache();

//Middleware
app.use(function (req, res, next) {
   //console.log("A request received at " + Date.now() + " for " + JSON.stringify(req.url));
   next();
});

//Routes

app.get('/cache', function (req, res) {
   res.send(JSON.stringify(leaguedata.cache));
});

// https://www.tutorialspoint.com/expressjs/expressjs_url_building.htm
app.get('/:leagueid', function (req, res) {
   const reqLeagueiD = req.params.leagueid.toUpperCase();
   //console.log("base URL called, sending tables")
   if (config.leagueIDs.includes(reqLeagueiD)) {
      //res.cookie('leagueid', reqLeagueiD);
      res.sendFile(path.join(__dirname, '/html/tables.html'));
   } else {
      res.send('Sorry, this is an unknown league.');
   }
});


app.get('/:leagueid/img/:route', function (req, res) {
   const reqLeagueID = req.params.leagueid.toUpperCase();
   //console.log("Routed to /:leagueid/img/:route -  static IMG file with league ID : ", reqLeagueID, " for file :", req.params.route)
   if (config.leagueIDs.includes(reqLeagueID)) {
      switch (req.params.route) {
         case "header.png":
            res.sendFile(path.join(__dirname, '/data/' + reqLeagueID + '/img/header.png'));
            break;
         case "footer.png":
            res.sendFile(path.join(__dirname, '/data/' + reqLeagueID + '/img/footer.png'));
            break;
         default:
            res.send('UNKNOWN ROUTE : The leagueid you specified is ' + reqLeagueID + " and the route requested is :" + req.params.route);
      }//switch route
   } else {
      res.send('Sorry, this is an unknown league.');
   }
});


app.get('/:leagueid/:route', function (req, res) {
   const reqLeagueID = req.params.leagueid.toUpperCase();
   //console.log("GET Routed to /:leagueid/:route - with league ID : ", reqLeagueID, " and route :", req.params.route);
   if (config.leagueIDs.includes(reqLeagueID)) {
      switch (req.params.route) {
         case "favicon.ico":
            res.sendFile(path.join(__dirname, '/img/favicon.ico'));
            console.log("sending favicon from ", __dirname);
            break;
         case "bkgrnd.jpg":
            res.sendFile(path.join(__dirname, '/img/bkgrnd.jpg'));
            break;
         case "leftbar.png":
            res.sendFile(path.join(__dirname, '/img/leftbar.png'));
            break;
         case "middlebar.png":
            res.sendFile(path.join(__dirname, '/img/middlebar.png'));
            break;
         case "header.png":
            res.sendFile(path.join(__dirname, '/data/' + reqLeagueID + '/img/header.png'));
            console.log("sending header.png from ", __dirname);
            break;
         case "footer.png":
            res.sendFile(path.join(__dirname, '/data/' + reqLeagueID + '/img/footer.png'));
            break;
         case "style.css":
            res.sendFile(path.join(__dirname, '/css/style.css'));
            break;

         case "tables":
            //res.send("Tables for " + reqLeagueiD);
            //res.cookie('leagueid', reqLeagueID);
            //res.sendFile(path.join(__dirname, '/html/tables.html'));

            res.redirect('/' + reqLeagueID);
            break;
         case "displayconfig":
            let displayConfig = leaguedata.getTablesDisplayConfig(reqLeagueID);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(displayConfig));
            break;
         case "classtotals":
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            //const CT1 = leaguedata.getFilteredClassTotals(reqLeagueID);
            //const CT2 = leaguedata.cache[reqLeagueID].classtotals;
            leaguedata.getFilteredClassTotals(reqLeagueID).then((result) => {
               res.end(JSON.stringify(result));
            });
            //res.end(JSON.stringify(leaguedata.cache[reqLeagueID].classtotals));
            break;
         case "teamstotals":
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.cache[reqLeagueID].teamstotals));
            break;

         case "reload":
            console.log("reload request recieved, loading saved files into Cache");
            leaguedata.updateCache(reqLeagueID).then((result2) => {
               console.log("reload of cache done - sending response");
               res.send("reloaded Cache for " + reqLeagueID);
            });
            break;

         case "recalculate":
            console.log("have been asked to recalculate");
            logger.clearLog(); 
            leaguedata.reCalculate(reqLeagueID).then((result) => {
               leaguedata.updateCache(reqLeagueID).then((result2) => {
                  console.log("recalculation done - sending response");
                  res.send("recalculated " + reqLeagueID + '<br> <a href = "tables"> Reload Tables </a>');
               });
            });
            break;
         case "classes":
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.cache[reqLeagueID].classes));
            break;
         case "protests":
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.cache[reqLeagueID].protests));
            break;
         case "drivers":
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.cache[reqLeagueID].drivers));
            break;
         case "rounds":
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.getRounds(reqLeagueID)));
            break;

         case "penalties":
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.cache[reqLeagueID].penalties));
            break;

         case "completedrounds":
            //console.log ("processing request for completed rounds");
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.getCompletedRounds(reqLeagueID)));
            break;

         case "driverlist":
            //console.log ("processing request for driver list");
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.cache[reqLeagueID].drivers));
            break;

         case "penaltylist":
            //res.cookie('leagueid', reqLeagueID);
            //      res.cookie('leagueid', reqLeagueID);
            res.sendFile(path.join(__dirname, '/html/penaltylist.html'));
            break;

         default:
            res.send('UNKNOWN ROUTE : The leagueid you specified is ' + reqLeagueID + " and the route requested is :" + req.params.route);
      }//switch route
   } else {
      res.send('Sorry, this is an unknown league.');
   }
});



app.post('/:leagueid/:route', function (req, res) {
   console.log("POST Routed to /:leagueid/:route - with league ID : ", reqLeagueID, " and route :", req.params.route)
   const reqLeagueID = req.params.leagueid.toUpperCase();
   switch (req.params.route) {

      default:
         res.send('UNKNOWN POST ROUTE : The leagueid you specified is ' + reqLeagueID + " and the route requested is :" + req.params.route);
   }
});

// Other routes here
app.get('*', function (req, res) {
   console.log("Routed to * - unknown URL");
   res.send('Sorry, this is an unknown URL.');
});

var server = app.listen(config.port, function () {
   console.log("Express App running on port ", config.port);
   console.log("Available leagues are ", JSON.stringify(config.leagueIDs));
})