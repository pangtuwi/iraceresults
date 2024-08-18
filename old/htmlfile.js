//https://www.digitalocean.com/community/tutorials/how-to-create-a-web-server-in-node-js-with-the-http-module
//https://stackoverflow.com/questions/5978361/image-server-using-node-js-and-ni-framework?rq=3

const http = require("http");
const host = 'localhost';
const port = 3000;
const fs = require('fs').promises;

let indexFile;
let headerImg;

const requestListener = function (req, res) {
   console.log("server file requested: ", req.url);
   switch (req.url) {
      case "/tables":
         res.setHeader("Content-Type", "text/html");
         res.writeHead(200);
         res.send(headerImg);
         res.end(indexFile);
         break;
      case "/header2.png":
         console.log ("sending header.png");
         res.setHeader("Content-Type", "image/png");
         res.writeHead(200);
         res.end(headerImg);
         /*fs.readFile(__dirname + "/header.png", function(err, data){
            res.writeHead(200, {"Content-Type": "image/png"});
            res.write(data, "binary");
            res.end(); 
            console.log ("header.png sent")
        }); */
      default :
         res.setHeader("Content-Type", "text/html");
         res.writeHead(200);
         res.end(indexFile);
   }
   
};

const server = http.createServer(requestListener);


 async function createServer() {
   try {
      const classTotals = await fs.readFile(__dirname + "/classtotals.json", { encoding: 'utf8' });
      const htmlText = await fs.readFile(__dirname + "/table.html", { encoding: 'utf8' });
      headerImg = await fs.readFile(__dirname + "/header.png");
      indexFile = htmlText.replace("{{CLASSTOTALSJSON}}", classTotals);
      server.listen(port, host, () => {
         console.log(`HTML NXTGen TABLE server is running on http://${host}:${port}`);
      });
     
   } catch (error) {
      console.error(`Could not read table.html &/or classtotals.json file: ${error}`);
      process.exit(1);
   }
 }

createServer();

