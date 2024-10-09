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
var editor = require('./editor2.js');  // editor2.js includes cache functionality

app.use(bodyParser.urlencoded({ extended: false })); //To parse URL encoded data
app.use(bodyParser.json());//To parse json data
app.use(cookieParser());//To Parse Cookies
app.use(express.static('img'));  //to serve Static Files images
app.use(express.static('script'));
app.use(express.static('html'));
app.use(express.static('css'));

// Preload and cache config and results for named league
leaguedata.loadCache();

//Middleware
app.use(function (req, res, next) {
   console.log("A request received at " + Date.now() + " for " + JSON.stringify(req.url));
   next();
});

//Routes
app.get('/', function (req, res) {
   res.sendFile(path.join(__dirname, "html/index.html"));
});

app.get('/cache', function (req, res) {
   res.send(JSON.stringify(leaguedata.cache));
});

// https://www.tutorialspoint.com/expressjs/expressjs_url_building.htm
app.get('/:leagueid', function (req, res) {
   const reqLeagueiD = req.params.leagueid.toUpperCase();
   if (config.leagueIDs.includes(reqLeagueiD)) {
      res.send('Found the league you specified : ' + reqLeagueiD + ' : will route to league tables');
   } else {
      res.send('Sorry, this is an unknown league.');
   }
});


app.get('/:leagueid/:route', function (req, res) {
   const reqLeagueID = req.params.leagueid.toUpperCase();

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
      case "drivers.js":
         res.sendFile(path.join(__dirname, '/script/drivers.js'));
         break;

      case "tables":
         //res.send("Tables for " + reqLeagueiD);
         res.cookie('leagueid', reqLeagueID);
         res.sendFile(path.join(__dirname, '/html/tables.html'));
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
      case "recalculate":
         leaguedata.reCalculate(reqLeagueID).then((result) => {
            leaguedata.updateCache(reqLeagueID).then((result2) => {
               res.send("recalculated " + reqLeagueID + '<br> <a href = "tables"> Reload Tables </a>');
            });
         });

      case "classes":
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(leaguedata.cache[reqLeagueID].classes));
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

      default:
         res.send('UNKNOWN ROUTE : The leagueid you specified is ' + reqLeagueID + " and the route requested is :" + req.params.route);
   }//switch route
});

app.post('/:leagueid/:route', function (req, res) {
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
      default:
         res.send('UNKNOWN ROUTE : The leagueid you specified is ' + reqLeagueID + " and the route requested is :" + req.params.route);
   } //switch route
});

// Other routes here
app.get('*', function (req, res) {
   res.send('Sorry, this is an invalid URL.');
});

var server = app.listen(config.port, function () {
   console.log("Express App running on port ", config.port);
   console.log("Available leagues are ", JSON.stringify(config.leagueIDs));
})