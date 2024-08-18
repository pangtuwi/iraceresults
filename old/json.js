const http = require("http");
const host = 'localhost';
const port = 3001;

const requestListener = function (req, res) {
   res.setHeader("Content-Type", "application/json");
   res.writeHead(200);
   res.end(`{"message": "This is Paul's test JSON response"}`);
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`JSON Server is running on http://${host}:${port}`);
});
