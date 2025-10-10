// Load environment variables from .env file
require('dotenv').config();

console.log("= = = = = = NodeJS running app.js Express version of iRaceResults = = = = = =");

// Express requirements
var config = require('./appconfig.js');
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

//my app requirements
var leaguedata = require('./leaguedata.js'); //was calc_league.js
var admin = require('./admin.js');
var protest = require('./protest.js');
var register = require('./register.js');
var logger = require('./logger.js');
var auth = require('./auth.js');
var authRoutes = require('./authRoutes.js');

// Authentication configuration
var authConfig = {
   GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
   GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
   GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:' + config.port + '/auth/google/callback',
   SESSION_SECRET: process.env.SESSION_SECRET || 'iraceresults-secret-change-this-in-production'
};

app.use(bodyParser.urlencoded({ extended: false })); //To parse URL encoded data
app.use(bodyParser.json());//To parse json data
app.use(cookieParser());//To Parse Cookies

// Session middleware (must be before passport)
app.use(session({
   secret: authConfig.SESSION_SECRET,
   resave: false,
   saveUninitialized: false,
   cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
   }
}));

// Initialize Passport authentication
auth.initializePassport(app, authConfig);

app.use(express.static('script'));
app.use(express.static('html'));
app.use(express.static('css'));

// Authentication Routes
app.use('/auth', authRoutes);

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
   console.log("A request received at " + Date.now() + " for " + JSON.stringify(req.url));
   next();
});

//Routes

app.get('/cache', function (req, res) {
   res.send(JSON.stringify(leaguedata.cache));
});

app.get('/leaguelist', function (req, res) {
   res.send(JSON.stringify(leaguedata.getLeagueList()));
});


// https://www.tutorialspoint.com/expressjs/expressjs_url_building.htm
app.get('/:leagueid', function (req, res) {
   const reqLeagueiD = req.params.leagueid.toUpperCase();
   console.log("base URL called, sending tables")
   if (config.leagueIDs.includes(reqLeagueiD)) {
      //res.cookie('leagueid', reqLeagueiD);
      res.sendFile(path.join(__dirname, '/html/tables.html'));
   } else {
      res.send('Sorry, this is an unknown league.');
   }
});

app.get('/img/:route', function (req, res) {
   console.log("Routed to /img/:route -  static IMG file :", req.params.route)

   switch (req.params.route) {
      case "leftbar.png":
         res.sendFile(path.join(__dirname, '/img/leftbar.png'));
         break;
      case "middlebar.png":
         res.sendFile(path.join(__dirname, '/img/middlebar.png'));
         break;
      default:
         res.send('UNKNOWN ROUTE fetching /img/:route');
   }//switch route
});




app.get('/:leagueid/img/:route', function (req, res) {
   const reqLeagueID = req.params.leagueid.toUpperCase();
   console.log("Routed to /:leagueid/img/:route -  static IMG file with league ID : ", reqLeagueID, " for file :", req.params.route)
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
   console.log("GET Routed to /:leagueid/:route - with league ID : ", reqLeagueID, " and route :", req.params.route);
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
         case "blank.png":
            res.sendFile(path.join(__dirname, '/trackmaps/' + 'blank.png'));
            break;
         case "style.css":
            res.sendFile(path.join(__dirname, '/css/style.css'));
            break;

         case "tables":
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
            leaguedata.getFilteredClassTotals(reqLeagueID).then((result) => {
               res.end(JSON.stringify(result));
            });
            break;
         case "teamstotals":
            console.log("app.js GET : Getting teamstotals for league ", reqLeagueID);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.cache[reqLeagueID].teamstotals));
            break;

         case "fullresults":
            console.log("app.js GET : Getting fullresults for league ", reqLeagueID);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            console.log("Full Results are ", leaguedata.cache[reqLeagueID].fullresults);
            res.end(JSON.stringify(leaguedata.cache[reqLeagueID].fullresults));
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
            console.log("app.js GET : Getting drivers for league ", reqLeagueID);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.cache[reqLeagueID].drivers));
            break;
         case "rounds":
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.getRounds(reqLeagueID)));
            break;

         case "penaltiesjson":
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

         case "penalties":
            //res.cookie('leagueid', reqLeagueID);
            //      res.cookie('leagueid', reqLeagueID);
            res.sendFile(path.join(__dirname, '/html/penalties.html'));
            break;

   /*      case "irres":
            res.sendFile(path.join(__dirname, '/html/irres.html'));
            break;
*/

         case "results":
            res.cookie('leagueid', reqLeagueID);
            res.sendFile(path.join(__dirname, '/html/results.html'));
            break;

         default:
            res.send('UNKNOWN ROUTE : The leagueid you specified is ' + reqLeagueID + " and the route requested is :" + req.params.route);
      }//switch route
   } else {
      res.send('Sorry, this is an unknown league.');
   }
});


app.post('/:leagueid/:route', function (req, res) {
   const reqLeagueID = req.params.leagueid.toUpperCase();
   console.log("POST Routed to /:leagueid/:route - with league ID : ", reqLeagueID, " and route :", req.params.route)
   switch (req.params.route) {

      case "map":
         console.log("Processing map request");
         console.log("Request body is ", req.body);
         const reqTrack = req.body.round_name;
         console.log("Requested track is ", reqTrack);
         const availableTracks = ["Fuji", "RBull", "Spa", "Imola", "Thrux", "Dayt", "LagSeca", "Brands", "NurbGP, "];   

         //check if requested track is available (case insensitive)
         if (availableTracks.map(track => track.toLowerCase()).includes(reqTrack.toLowerCase())) {
            //convert reqTrack to lowercase and fetch
            res.sendFile(path.join(__dirname, '/trackmaps/' + reqTrack.toLowerCase() + '.png'));
         } else if (reqTrack === "none") {
            res.sendFile(path.join(__dirname, '/trackmaps/' + 'blank.png'));
         } else {
            res.sendFile(path.join(__dirname, '/trackmaps/' + 'nomap.png'));
         }
         break;

      case "results":
         console.log("Processing results request");
         console.log("Request body is ", req.body);
         const round_no = req.body.round_no;
         const cust_id = req.body.cust_id;
         console.log("Requested round_no is ", round_no, " and cust_id is ", cust_id);
         const filteredResults = leaguedata.getFilteredResults(reqLeagueID, round_no, cust_id);
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(filteredResults));
         break;

      case "irresults":
         console.log("Processing iRacing results request");
         console.log("Request body is ", req.body);
         const reqRoundNo = req.body.round_no;
         const reqSessionNo = req.body.session_no;
         console.log("Requested round number is ", reqRoundNo, " and session number is ", reqSessionNo);
         //const reqSessionID = leaguedata.getSessionID(reqLeagueID, reqRoundNo, reqSessionNo);
         const reqSessionID = leaguedata.cache[reqLeagueID].rounds[reqRoundNo].subsession_ids[reqSessionNo];

         if (reqSessionID === 0) {
            res.send('No such round/session');
            return;
         }

         //send the file
         res.sendFile(path.join(__dirname, '/data/' + reqLeagueID + '/irresults/' + reqSessionID + '.json'));
         break;

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