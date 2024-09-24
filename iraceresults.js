// https://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http
// https://www.geeksforgeeks.org/node-js-querystring-decode-function/
// https://www.geeksforgeeks.org/how-to-get-post-data-in-node-js/
// https://favicon.io/favicon-generator/

console.log("Node js server running iraceresults.js");

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const config = require('./config.js');
const editor = require('./editor.js');
const iRacing = require('./iracing.js');
const jsonloader = require('./jsonloader');

const results = require('./calc_league.js');

var drivers = {};
var penalties = {};

jsonloader.getDrivers().then((result) => {
   drivers = result;
   //console.log(drivers);
}).catch(console.error);

jsonloader.getPenalties().then((result) => {
   penalties = result;
   //console.log(drivers);
}).catch(console.error);

http.createServer(function (req, res) {
   console.log(`Client Request recieved : ${req.method} ${req.url}`);

   // parse URL
   const parsedUrl = url.parse(req.url);

   // extract URL path
   var pathname = `.${parsedUrl.pathname.replace(config.rootpath, "")}`;

   //Default to index.html if root called
   if (pathname == "./") pathname = "./index.html";
   //console.log ("__dirname is :", __dirname);
   //console.log ("pathname is :", pathname);
   //console.log("Resolved path is :", path.resolve(__dirname, pathname));

   //get Query string
   let output = querystring.decode(parsedUrl.query);
   //console.log("Query is", parsedUrl.query);
   //console.log("QueryString Output: ", output);

   switch (pathname) {
      case "./recalculate":
         results.reCalculate().then((result) => {
            //Save updated driver file
            if (config.class_to_add_new_drivers_to != -1) {
               const DriversToSave = drivers.map(item => {
                  const container = {};
                  container.cust_id = item.cust_id;
                  container.display_name = item.display_name;
                  container.classnumber = item.classnumber;
                  return container;
              })
               jsonloader.saveDrivers(DriversToSave);
            }
            //return results
            const data = JSON.stringify(result);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(data);
         }).catch(console.error);
         break;

      case "./table":
         // read file from file system
         fs.readFile(path.resolve(__dirname, "./results/classtotals.json"), function (err, data) {
            if (err) {
               res.statusCode = 500;
               res.end(`Error getting the classtotals.json file: ${err}.`);
            } else {
               // if the file is found, set Content-type and send data
               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(data);
            }
         });
         break;

      case "./teams":
         // read file from file system
         fs.readFile(path.resolve(__dirname, "./results/teamstotals.json"), function (err, data) {
            if (err) {
               res.statusCode = 500;
               res.end(`Error getting the teamstotals.json file: ${err}.`);
            } else {
               // if the file is found, set Content-type and send data
               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(data);
            }
         });
         break;

      case "./classes":
         // read file from file system
         fs.readFile(path.resolve(__dirname, "./data/classes.json"), function (err, data) {
            if (err) {
               res.statusCode = 500;
               res.end(`Error getting the classes.json file: ${err}.`);
            } else {
               // if the file is found, set Content-type and send data
               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(data);
            }
         });
         break;

      case "./drivers":
         // read file from file system
         //fs.readFile(path.resolve(__dirname, "./results/teamstotals.json"), function (err, data) {
         editor.getDriversHTML(-1, function (err, data) {
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

      case "./driver":
         if (req.method === 'POST') {
            let data = '';
            req.on('data', chunk => {
               data += chunk.toString();
            });
            req.on('end', () => {
               const thisCust_Id = Number(JSON.parse(data).cust_id);
               const thisDriver = drivers.find((driver) => driver.cust_id == thisCust_Id);
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
            });
         } else {
            res.end('Send a POST request to this endpoint');
         }
         break;

      case "./moddriver":
         if (req.method === 'POST') {
            let data = '';
            req.on('data', chunk => {
               data += chunk.toString();
            });
            req.on('end', () => {
               var modDriver = JSON.parse(data);
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
            });
         } else {
            res.end('Send a POST request to this endpoint');
         }
         break;

      case "./adddriver":
         if (req.method === 'POST') {
            let data = '';
            req.on('data', chunk => {
               data += chunk.toString();
            });
            req.on('end', () => {
               var newDriver = JSON.parse(data);
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
            });
         } else {
            res.end('Send a POST request to this endpoint');
         }
         break;

      case "./deletedriver":
         if (req.method === 'POST') {
            let data = '';
            req.on('data', chunk => {
               data += chunk.toString();
            });
            req.on('end', () => {
               var deleteDriver = JSON.parse(data);
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
            });
         } else {
            res.end('Send a POST request to this endpoint');
         }
         break;

      case "./penalties":
         editor.getPenaltiesHTML(-1, function (err, data) {
            if (err) {
               res.statusCode = 500;
               res.end(`Error getting penalty data : ${err}.`);
            } else {
               // if the file is found, set Content-type and send data
               res.setHeader("Content-Type", "text/html");
               res.writeHead(200);
               res.end(data);
            }
         });
         break;

    /*  case "./refactorpenalties":
         var rfPenalties = [];
         penalties.forEach((penalty) => {
            var newPenalty = {};
            Do something here
         });
         res.setHeader("Content-Type", "application/json");
         res.writeHead(200);
         res.end(JSON.stringify(penalties));
         break; */

      default: // static files
         // based on the URL path, extract the file extension. e.g. .js, .doc, ...
         var ext = path.parse(pathname).ext;
         //console.log ("Defauting to loading static file : ", pathname);
       /*  if (ext == '') {
            pathname = 'index.html';
            ext = '.html'
         } */

         // maps file extension to MIME typere
         const map = {
            '.ico': 'image/x-icon',
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword'
         };

         const folders = {
            '.html': './html/',
            '.png': './img/',
            '.jpg': './img/',
            '.css': './css/',
            '.ico': './img/',
            '.js': './script/'
         }

         

         // read file from file system
         fs.readFile(path.resolve(__dirname, folders[ext] || '', pathname), function (err, data) {
            if (err) {
               res.statusCode = 500;
               res.end(`Error loading static file: ${err}.`);
            } else {
               // if the file is found, set Content-type and send data
               res.setHeader('Content-type', map[ext] || 'text/plain');
               res.end(data);
            }
         });
   }
}).listen(parseInt(config.port));

console.log(`Server listening on port ${config.port}`);
