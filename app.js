console.log("= = = = = = NodeJS running app.js Express version of iRaceResults = = = = = =");

// Express requirements
var config = require ('./appconfig.js');
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

//my app requirements
var leaguedata = require('./leaguedata.js'); //was calc_league.js

app.use(bodyParser.urlencoded({ extended: false })); //To parse URL encoded data
app.use(bodyParser.json());//To parse json data
app.use(cookieParser());//To Parse Cookies
app.use(express.static('img'));  //to serve Static Files images
app.use(express.static('script'));
app.use(express.static('html'));

// Preload and cache config and results for named league
leaguedata.loadCache();

//Middleware
app.use(function(req, res, next){
   console.log("A request received at " + Date.now() + " for " + JSON.stringify(req.url));
   next();
});

//Routes
app.get('/', function (req, res) {
   res.sendFile(path.join(__dirname,"html/index.html"));
}); 

app.get('/cache', function (req, res) {
   res.send (JSON.stringify(leaguedata.cache));
});

// https://www.tutorialspoint.com/expressjs/expressjs_url_building.htm
app.get('/:leagueid', function(req, res){
   const reqLeagueiD = req.params.leagueid.toUpperCase();
   if (config.leagueIDs.includes(reqLeagueiD)){ 
      res.send('Found the league you specified : ' + reqLeagueiD + ' : will route to league tables');
   } else {
      res.send('Sorry, this is an unknown league.');
   }
});

app.get('/:leagueid/:route', function(req, res){
   const reqLeagueiD = req.params.leagueid.toUpperCase();
   
   switch (req.params.route){
      case "tables":
         res.send("Tables for " + reqLeagueiD);
         break;
      case "recalculate":
         leaguedata.reCalculate(reqLeagueiD);
         res.send("recalculated " + reqLeagueiD);
         break;
      default : 
      res.send('UNKNOWN ROUTE : The leagueid you specified is ' + reqLeagueiD + " and the route requested is :" + req.params.route);
   }//switch route
});

// Other routes here
app.get('*', function(req, res){
   res.send('Sorry, this is an invalid URL.');
});

var server = app.listen(config.port, function () {
   console.log("Express App running on port ", config.port);
   console.log("Available leagues are ", JSON.stringify(config.leagueIDs));
})