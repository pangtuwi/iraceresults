// https://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http
// https://www.geeksforgeeks.org/node-js-querystring-decode-function/


const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const port = process.argv[2] || 3000;

//const classTotals = fs.readFile(__dirname + "/classtotals.json", { encoding: 'utf8' });

http.createServer(function (req, res) {
   console.log(`Client Request recieved : ${req.method} ${req.url}`);
   //Default to table if root called
   if (req.url == "/") req.url = "/table.html";
   // parse URL
   const parsedUrl = url.parse(req.url);
   // extract URL path

   let filename = parsedUrl.pathname;
   let pathname = `.${parsedUrl.pathname}`;
   const querystring = require('querystring');  
   let output = querystring.decode(parsedUrl.query); 
   //console.log(parsedUrl);
   //console.log("Query is", parsedUrl.query);


   switch (pathname) {
      case "./table":
         console.log("QueryString Output: ", output);
         // read file from file system
         fs.readFile(__dirname+"/classtotals.json", function(err, data){
            if(err){
               res.statusCode = 500;
               res.end(`Error getting the classtotals file: ${err}.`);
            } else {
               // if the file is found, set Content-type and send data

               res.setHeader("Content-Type", "application/json");
               res.writeHead(200);
               res.end(data);
            }
         });
         break;
      default:
         // based on the URL path, extract the file extension. e.g. .js, .doc, ...
         const ext = path.parse(pathname).ext;
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

         /*fs.exists(filename, function (exist) {
            if(!exist) {
               // if the file is not found, return 404
               res.statusCode = 404;
               res.end(`File ${filename} not found! (__dirname is ${__dirname})`);
               return;
            } */

            // if is a directory search for index file matching the extension
            //if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

            // read file from file system
            fs.readFile(__dirname+filename, function(err, data){
               if(err){
               res.statusCode = 500;
               res.end(`Error getting the file: ${err}.`);
               } else {
               // if the file is found, set Content-type and send data
               res.setHeader('Content-type', map[ext] || 'text/plain' );
               res.end(data);
               }
            });
        // });  paert of exists call
      }
}).listen(parseInt(port));

console.log(`Server listening on port ${port}`);