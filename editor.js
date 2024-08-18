//https://www.freecodecamp.org/news/nodejs-callbacks/
//https://stackoverflow.com/questions/2722159/how-to-filter-object-array-based-on-attributes

const fs = require('fs');
const path = require('path');

function tableHeaderRow(tableData, headerColor){
   let cols = Object.keys(tableData[0]);
   let html = '<div class="row header '+ headerColor +'">';
   
   // Loop through the column names and create header cells
   cols.forEach((item) => {
      html += ('<div class="cell">'+item+'</div>');
   });
   html += '</div>'
   return html
}//tableHeaderRow

function tableRows(tableData){
   let cols = Object.keys(tableData[0]);
   let html = "";
   tableData.forEach((item) => {
      html += ('<div class="row" id='+ item.cust_id + '>')
      let colCounter = 0;
      let vals = Object.values(item);
      vals.forEach((elem) => {
         html += ('<div class="cell" data-title="'+cols[colCounter]+'">' + elem +'</div>');
         colCounter +=1
      });
      html += '</div>'
   });
   return html
}//tableRows

function objToHTMLTable(baseHTTMLFile, tableData, headerColor, callback) {
   fs.readFile(path.resolve(__dirname, "./html/", baseHTTMLFile),'utf8', function (err, HTMLData) {
      if (err) {
         return(`Error getting baseHTMLFile: ${err}.`);
      } else {
         console.log("base HTML file returned");
         let tableHeaderHTML = tableHeaderRow(tableData, headerColor);
         let tableBodyHTML = tableRows(tableData);
         HTMLData = HTMLData.replace('<div class="row header"><div class="cell">Data</div></div>', tableHeaderHTML);
         HTMLData = HTMLData.replace('<div class="row"><div class="cell" data-title="Row">No data Found</div></div>', tableBodyHTML);
         callback (null, HTMLData);
      }
   });
} //objToHTMLTable

 function getDriversHTML(driverClass, callback){
   console.log ("in getDriversHTML funciton");
   fs.readFile(path.resolve(__dirname, "./data/drivers.json"), { encoding: 'utf8' }, function (err, JSONdata) {
      if (err) {
         console.log(`Error getting the drivers.json file: ${err}.`);
         callback(`Error getting the drivers.json file: ${err}.`, null);
      } else {
         console.log("drivers.json file is back");
         var drivers = JSON.parse(JSONdata);
         var filteredDrivers = drivers;
         if (driverClass != -1) filteredDrivers = drivers.filter(o => o.classnumber == driverClass);
         objToHTMLTable("drivers.html", filteredDrivers, "blue", function(err, data){
            callback(null, data);
         });   
         
      }
   });
 } //getDriversHTML

 function getPenaltiesHTML(round, callback){
   console.log ("in getPenaltiesHTML funciton");
   fs.readFile(path.resolve(__dirname, "./data/penalties.json"), { encoding: 'utf8' }, function (err, JSONdata) {
      if (err) {
         console.log(`Error getting the penalties.json file: ${err}.`);
         callback(`Error getting the penalties.json file: ${err}.`, null);
      } else {
         console.log("penalties.json file is back");
         var penalties = JSON.parse(JSONdata);
         var filteredPenalties = penalties;
         if (round != -1) filteredPenalties = penalties.filter(o => o.round_no == round);
         objToHTMLTable("penalties.html", filteredPenalties, "red", function(err, data){
            callback(null, data);
         });   
         
      }
   });
 } //getPenaltiesHTML

 exports.getDriversHTML = getDriversHTML;
 exports.getPenaltiesHTML = getPenaltiesHTML;