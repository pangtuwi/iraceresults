
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

app.use(bodyParser.urlencoded({ extended: false })); //To parse URL encoded data
app.use(bodyParser.json());//To parse json data
app.use(cookieParser());//To Parse Cookies
app.use(express.static('img'));  //to serve Static Files images
app.use(express.static('script'));
app.use(express.static('html'));
app.use(express.static('css'));
app.use('/admin', admin);

// Preload and cache config and results for named league
leaguedata.loadCache();

//Middleware
app.use(function (req, res, next) {
   console.log("A request received at " + Date.now() + " for " + JSON.stringify(req.url));
   next();
});

//Routes
/*
Dont think the below is correct.   Should route to a default page

app.get('', function (req, res) {
   res.sendFile(path.join(__dirname, "html/tables.html"));
});

app.get('/', function (req, res) {
   res.sendFile(path.join(__dirname, "html/tables.html"));
});
*/

app.get('/cache', function (req, res) {
   res.send(JSON.stringify(leaguedata.cache));
});

// https://www.tutorialspoint.com/expressjs/expressjs_url_building.htm
app.get('/:leagueid', function (req, res) {
   const reqLeagueiD = req.params.leagueid.toUpperCase();
   console.log("base URL called, sending tables")
   if (config.leagueIDs.includes(reqLeagueiD)) {
      res.cookie('leagueid', reqLeagueiD);
      res.sendFile(path.join(__dirname, '/html/tables.html'));
   } else {
      res.send('Sorry, this is an unknown league.');
   }
});


app.get('/:leagueid/:route', function (req, res) {
   const reqLeagueID = req.params.leagueid.toUpperCase();

   if (config.leagueIDs.includes(reqLeagueID)) {
      switch (req.params.route) {
         case "favicon.ico":
            res.sendFile(path.join(__dirname, '/img/favicon.ico'));
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

            res.redirect('/'+reqLeagueID);
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
            res.end(JSON.stringify(leaguedata.cache[reqLeagueID].classtotals));
            break;
         case "teamstotals":
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.cache[reqLeagueID].teamstotals));
            break;
         case "protest":
            res.cookie('leagueid', reqLeagueID);
            res.sendFile(path.join(__dirname, '/html/protest.html'));
            break;
         case "recalculate":
            console.log("have been asked to recalculate");
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
         case "protestablerounds":
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.getProtestableRounds(reqLeagueID)));
            break;
         case "penalties":
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(leaguedata.cache[reqLeagueID].penalties));
            break;
         case "penaltylist":
            //res.cookie('leagueid', reqLeagueID);
            res.sendFile(path.join(__dirname, '/html/penalties.html'));
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
         res.send('UNKNOWN POST ROUTE : The leagueid you specified is ' + reqLeagueID + " and the route requested is :" + req.params.route);
   }
});

// Other routes here
app.get('*', function (req, res) {
   res.send('Sorry, this is an invalid URL.');
});

var server = app.listen(config.port, function () {
   console.log("Express App running on port ", config.port);
   console.log("Available leagues are ", JSON.stringify(config.leagueIDs));
})