const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const path = require('path');
const port = process.argv[2] || 3000;


async function startMyServer(){
   const classTotals = await fs.readFile(__dirname + "/classtotals.json", { encoding: 'utf8' });
   http.createServer(function (req, res) {
      console.log(`${req.method} ${req.url}`);
   
      // parse URL
      const parsedUrl = url.parse(req.url);
      const querystring = require('querystring');  
      let output = querystring.decode(parsedUrl.query); 
      //console.log(parsedUrl);
      //console.log("Query is", parsedUrl.query);
      
      
      // extract URL path
      //let pathname = `.${parsedUrl.pathname}`;
      let filename = `.${parsedUrl.pathname}`;
      let pathname = __dirname+parsedUrl.pathname;
      console.log("Got Pathname:", pathname);
      console.log("Got Filename:", filename);
   
      switch (filename) {
         case "./table":
            console.log("QueryString Output: ", output);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(classTotals);
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

            // if is a directory search for index file matching the extension
            //if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

            // read file from file system
            fs.readFile(filename, function(err, data){
               if(err){
                  res.statusCode = 500;
                  res.end(`Error getting the file: ${err}.`);
               } else {
                  // if the file is found, set Content-type and send data
                  console.log("got file, sending...")
                  res.setHeader('Content-type', map[ext] || 'text/plain' );
                  res.end(data);
               }
            });

            /*fs.exists(pathname, function (exist) {
               if(!exist) {
                  // if the file is not found, return 404
                  res.statusCode = 404;
                  res.end(`File ${pathname} not found!`);
                  return;
               }*/
   
      }
   
   }).listen(parseInt(port));
   console.log(`Server listening on port ${port}`);
}

startMyServer();
