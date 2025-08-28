const port = process.argv[2] || 4000;
const leagueIDs = ["NXTPROS5", "NXTGT3S6", "NXTGT3S7", "NXTGT3S8", "IRRTEST01"];

console.log("Server config loaded");

exports.port = port;
exports.leagueIDs = leagueIDs;
