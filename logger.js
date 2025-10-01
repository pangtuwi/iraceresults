//External file requirements

//Constants
var logToConsole = false;
var eventList = [];

function log (eventText, cust_id, round_no){
 if (logToConsole) {
   console.log("LOGGER :", eventText);
 }
 // convert Date.now() to readable timestamp
 var time_stamp = new Date().toLocaleString();
 // add event to list
 eventList.push ({time_stamp : time_stamp, event_text : eventText, cust_id : cust_id, round_no : round_no});

}//log

function getLog () {
   return eventList;
} //getLog

function clearLog () {
   eventList = [];
   console.log ("LOGGER: Log list has been cleared");
} //clearLog

function setLogToConsole(newVal) {
 logToConsole = newVal;
} //logToConsole

exports.log = log;
exports.getLog = getLog;
exports.clearLog = clearLog;
exports.setLogToConsole = setLogToConsole;
