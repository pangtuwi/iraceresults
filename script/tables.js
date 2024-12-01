var classTotals = [];
var teamsTotals = [];
var buttonCounter = 0;

/*function getCookie(name) {
   // Split cookie string and get all individual name=value pairs in an array
   let cookieArr = document.cookie.split(";");

   // Loop through the array elements
   for (let i = 0; i < cookieArr.length; i++) {
      let cookiePair = cookieArr[i].split("=");

      // Removing whitespace at the beginning of the cookie name and compare it with the given string 
      if (name == cookiePair[0].trim()) {
         // Decode the cookie value and return
         return decodeURIComponent(cookiePair[1]);
      }
   }
   // Return null if not found
   return null;
} */

function toggleButtons(bNo) {
   //Functon to toggle the button classes
   for (let i = 0; i < buttonCounter; i++) {
      let thisBut = document.getElementById("btn" + i);
      console.log("toggling button no :", i, "      found button :",thisBut, "   of nobuttons =", buttonCounter);
      if (i == bNo) {
         thisBut.classList.add("button-class-selected");
      } else {
         thisBut.classList.remove("button-class-selected");
      }
   }
}

// Function to convert JSON data to HTML table
function showTable(NG_Class) {
   console.log ("running  show table ", NG_Class);

   // Get the container element where the table will be inserted
   let container = document.getElementById("container");

   //Clear it
   container.innerHTML = "";

   // Create the table element
   let table = document.createElement("table");
   //table.style.cssText = 'position:absolute;top:300px;left:300px;width:200px;height:200px;-moz-border-radius:100px;border:1px  solid #ddd;-moz-box-shadow: 0px 0px 8px  #fff;display:none;';
   table.style.cssText = 'width:100%';

   //USe correct data (-1 is a hack to say dont select sub array, show Teams data)
   let tableData = {};
   if (NG_Class == -1) {   //show Teams Data
      tableData = teamsTotals;
   } else {
      tableData = classTotals[NG_Class];
   }

   // Get the keys (column names) of the correct object in the JSON data
   let cols = Object.keys(tableData[0]);

   // Create the header element
   let thead = document.createElement("thead");
   let tr = document.createElement("tr");
   tr.classList.add("table-column-headers")


   // Loop through the column names and create header cells
   cols.forEach((item) => {
      let th = document.createElement("th");
      th.innerText = item; // Set the column name as the text of the header cell
      tr.appendChild(th); // Append the header cell to the header row
   });
   thead.appendChild(tr); // Append the header row to the header
   table.append(tr) // Append the header to the table

   // Loop through the JSON data and create table rows
   tableData.forEach((item) => {
      let tr = document.createElement("tr");

      // Get the values of the current object in the JSON data
      let vals = Object.values(item);

      // Loop through the values and create table cells
      let counter = 0;
      vals.forEach((elem) => {
         counter += 1;

         let td = document.createElement("td");
         switch (counter) {
            case 1:
               td.classList.add("score-td-left");
               break;
            case 2:
               td.classList.add("score-td-name");
               break;
            default:
               td.classList.add("score-td");
         }

         td.innerText = elem; // Set the value as the text of the table cell
         tr.appendChild(td); // Append the table cell to the table row
      });
      table.appendChild(tr); // Append the table row to the table
   });
   container.appendChild(table) // Append the table to the container element
} //showTable (convert to HTML)


// gets data from API and sets the content of #result div
function getClassTotals() {
   //let container = document.getElementById("container");
   //container.innerText = 'Loading....' + NG_Class
   //fetch('./'+leagueid+'/classtotals')
   fetch('./classtotals')
      .then(res => res.json())
      .then(data => {
         //container.innerText = JSON.stringify(data, null, 2)
         //convert(data, NG_Class);
         console.log ("class totals recieved from server");
         console.log(data);
         classTotals = data;
         generateClassButtons();
      })
      .catch(error => console.log(error))
} //getClassTotals

// gets data from API and sets the content of #result div
/*function getData(NG_Class) {
   // let leagueid = getCookie("leagueid");
   toggleButtons(NG_Class);
   let container = document.getElementById("container");
   container.innerText = 'Loading....' + NG_Class
   //fetch('./'+leagueid+'/classtotals')
   fetch('./classtotals')
      .then(res => res.json())
      .then(data => {
         //container.innerText = JSON.stringify(data, null, 2)
         convert(data, NG_Class);
      })
      .catch(error => console.log(error))
} */

// gets data from API and sets the content of #result div
function getTable(buttonID, classID) {
   toggleButtons(buttonID);
   showTable(classID);
} //getTable


// gets teams data from API and sets the content of #result div
function getTeamsData(but_no) {
   //let leagueid = getCookie("leagueid");
   toggleButtons(but_no);
   let container = document.getElementById("container");
   container.innerText = 'Loading Teams Data'
   fetch('./teamstotals')
      .then(res => res.json())
      .then(data => {
         //container.innerText = JSON.stringify(data, null, 2)
         showTable(data, -1);  //-1 is a hack to use the same function
      })
      .catch(error => console.log(error))
} //getTeamsData

function generateClassButtons() {
   //read in the Classes Available and generate necessary buttons
   //get Button container element and clear it
   fetch('./displayconfig')
   .then(res => res.json())
   .then(data => {
      console.log ("button display config recieved from server")
      let tr = document.getElementById("classButtons");
      tr.innerHTML = "";
      //classButtons.innerHTML = JSON.stringify(data);
      let classes_to_display = data.classes_to_display;
      var classCounter = -1;
      //var buttonsHTML = "";

      if (data.display_overall_table == 1) {
         let classesAvailable = classTotals.length -1;
         console.log("adding button :", 0);
         //let tdHTML = '<td width="15%"><button class="button-class-select" id="btn'+classCounter+'" onclick="getTable('+classCounter+')">'+thisClass.classname+'</button></td>';
         let td = document.createElement("td");
         let newButton = document.createElement("button");
         newButton.classList.add ("button_class_select");
         newButton.id = "btn"+0;
         //console.log ("no onclick yet");
         newButton.setAttribute('onclick', "getTable(0,"+ classesAvailable+")");
         newButton.innerText = "Overall"; // Set the value as the text of the table cell
         td.setAttribute("width", "15%");
         td.appendChild(newButton);
         tr.appendChild(td); // Append the table cell to the table row
         console.log ("adding button : ", td);
         buttonCounter +=1;
      }

      classes_to_display.forEach(thisClass => { 
         classCounter += 1;
         console.log("adding button :", buttonCounter);
         //let tdHTML = '<td width="15%"><button class="button-class-select" id="btn'+classCounter+'" onclick="getTable('+classCounter+')">'+thisClass.classname+'</button></td>';
         let td = document.createElement("td");
         let newButton = document.createElement("button");
         newButton.classList.add ("button_class_select");
         newButton.id = "btn"+buttonCounter;
         //console.log ("no onclick yet");
         newButton.setAttribute('onclick', "getTable("+buttonCounter+","+classCounter+")");
         newButton.innerText = thisClass.classname; // Set the value as the text of the table cell
         td.setAttribute("width", "15%");
         td.appendChild(newButton);
         tr.appendChild(td); // Append the table cell to the table row
         console.log (" button added : ", td);
         buttonCounter +=1;
      });

   // gets teams data from API and sets the content of #result div
   fetch('./teamstotals')
      .then(res => res.json())
      .then(data => {
         //container.innerText = JSON.stringify(data, null, 2)
         teamsTotals = data;
         //showTable(data, -1);  //-1 is a hack to use the same function
         console.log("adding button for Teams:", -1);
         //buttonCounter +=1;
         //let tdHTML = '<td width="15%"><button class="button-class-select" id="btn'+classCounter+'" onclick="getTable('+classCounter+')">'+thisClass.classname+'</button></td>';
         let td = document.createElement("td");
         let newButton = document.createElement("button");
         newButton.classList.add ("button_class_select");
         newButton.id = "btn"+buttonCounter;
         newButton.setAttribute('onclick', `getTable(${buttonCounter},-1)`);
         newButton.innerText = "Teams"; // Set the value as the text of the table cell
         td.setAttribute("width", "15%");
         td.appendChild(newButton);
         tr.appendChild(td); // Append the table cell to the table row
         console.log ("adding button : ", td);
         
      })
      .catch(error => console.log(error));
      
   }) 
   .catch(error => console.log(error))
   
}//generateClassButtons

$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
   console.log ("document is ready");
   /* old code from stewarding.js
   $("#cancel_btn").on("click", function () {
   });

   var submitButton = document.getElementById("submit_btn");
   submitButton.disabled = true;

   $("#stewards_comments").on("change", function () {
      submitButton.disabled = false;
   });

   $("#submit_btn").click(function () {
      console.log("submit button clicked");
      var thisPenalty = getStewardsDecision();
      const penaltyObj = {
         "penalty": JSON.stringify(thisPenalty)
      };
      postPenalty(penaltyObj);
   });

   getProtests(); */

   //get ClassTotals Data from Server and generate class buttons
   getClassTotals(); 

});