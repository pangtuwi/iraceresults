//const { getPenalties } = require("../appjsonloader");

var penalties = [];
var penalties_filtered = [];

function getDrivers() {
   console.log("fetching drivers");
   fetch('./driverlist')
      .then(res => res.json())
      .then(data => {
         console.log("driver data received :", data);
         data.sort(function (a, b) {
            return a.display_name.localeCompare(b.display_name);
         });

         const driver_select = document.getElementById('driver_select');

         //all drivers Option
         var option1 = document.createElement("option");
         option1.text = "All Drivers";
         option1.value = 0;
         driver_select.add(option1);

         //Add Drivers to list
         data.forEach(driver => {
            var option1 = document.createElement("option");
            // Use custom display name if available, otherwise use iRacing name
            option1.text = (driver.custom_display_name && driver.custom_display_name.trim())
               ? driver.custom_display_name
               : driver.display_name;
            option1.value = driver.cust_id;
            driver_select.add(option1);
         });

         //Text Filter for Driver names
         var driverSelect = $("#driver_select"),
            driverSearchField = $("#driver_search"),
            optionsDriver = driverSelect.find("option").clone(); // clone into memory

         // generic function to clean text
         function sanitize(string) {
            return $.trim(string).replace(/\s+/g, ' ').toLowerCase();
         }

         // prepare the options by storing the "searchable" name as data on the element
         optionsDriver.each(function () {
            var option = $(this);
            option.data("sanitized", sanitize(option.text()));
         });

         // handle keyup
         driverSearchField.on("keyup", function (event) {
            var term = sanitize($(this).val()),
               matches;

          
            if (!term) {
               driverSelect.empty().append(optionsDriver.clone());
                 // just show all options, if there's no search term
            } else {
               // otherwise, show the options that match
               matches = optionsDriver.filter(function () {
                  return $(this).data("sanitized").indexOf(term) != -1;
               }).clone();
               driverSelect.empty().append(matches);
            }

            console.log("Filtering by Driver = ", driverSelect[0].value);
            filter_cust_id = driverSelect[0].value;
            var roundSelect = $("#round_select");
            filter_round_no = roundSelect[0].value;
            filterPenalties(filter_round_no, filter_cust_id);

         });

      })
      .catch(error => console.log(error))
}//getDrivers

function getRounds() {
   console.log("fetching Rounds");
   fetch('./completedrounds')
      .then(res => res.json())
      .then(data => {
         console.log("round data received :", data);

         var roundSelect = $("#round_select");
         if (data.length > 0) {
            if (data.length == 1) {
               $("#round_select_comment").html("only one round available for protest");
            } else {
               $("#round_select_comment").html(data.length + " rounds available for protest");
            }

            //All rounds option
            var option = document.createElement("option");
            option.text = "All rounds";
            option.value = 0;
            roundSelect.append(option);

            //Round list
            data.forEach(round => {
               var option = document.createElement("option");
               option.text = round.track_name;
               option.value = round.round_no;
               roundSelect.append(option);
            });

            //var thisRoundNo = roundSelect.children("option:selected").val();
            //getScoredEvents(thisRoundNo);
         } else {
            $("#round_select_comment").html("no rounds are listed");
         }
      })
      .catch(error => console.log(error))
}//getRounds

function getPenalties() {
   console.log("fetching penalties");


   fetch('./penaltiesjson')
      .then(res => res.json())
      .then(data => {
         console.log("penalty list data received :", data);
         penalties = data;
         penalties_filtered = penalties;
         displayPenalties();

      });
}//getPenalties

function filterPenalties (filter_round_no, filter_cust_id) {

   if ((filter_round_no == 0) & (filter_cust_id == 0)) {
      penalties_filtered = penalties;
   } else if (filter_round_no == 0) {
      penalties_filtered = penalties.filter(penalty => penalty.cust_id == filter_cust_id);
   } else if (filter_cust_id == 0) {
      penalties_filtered = penalties.filter(penalty => penalty.round_no == filter_round_no);
   } else {
      penalties_filtered = penalties.filter(penalty => penalty.cust_id == filter_cust_id);
      penalties_filtered = penalties_filtered.filter(penalty => penalty.round_no == filter_round_no);
   }
   displayPenalties();
}//filterPenalties

function setFilters() {
   var roundSelect = $("#round_select");
   roundSelect.on("change", function (event) {
      console.log("Filtering by Round = ", this.value);
      filter_round_no = this.value;
      var driverSelect = $("#driver_select");
      filter_cust_id = driverSelect[0].value;
      filterPenalties(filter_round_no, filter_cust_id);
   }); //roundSelect.on change

   var driverSelect = $("#driver_select");
   driverSelect.on("change", function (event) {
      console.log("Filtering by Driver = ", this.value)
      filter_cust_id = this.value;
      var roundSelect = $("#round_select");
      filter_round_no = roundSelect[0].value;
      filterPenalties(filter_round_no, filter_cust_id);
   }); //roundSelect.on change
} //setFilters

function displayPenalties() {
   var tableTopHtml = '<div class="row header">' +
      '<div class="cell row header blue" data-title="Row">Name</div>' +
      '<div class="cell row header blue" data-title="Row">Round</div>' +
      '<div class="cell row header blue" data-title="Row">Event</div>' +
      '<div class="cell row header blue" data-title="Row">Lap</div>' +
      '<div class="cell row header blue" data-title="Row">Corner</div>' +
      '<div class="cell row header blue" data-title="Row">Protested by</div>' +
      '<div class="cell row header blue" data-title="Row">Drivers Statement</div>' +
      '<div class="cell row header blue" data-title="Row">Decision</div>' +
      '<div class="cell row header blue" data-title="Row">Comments</div>' +
      '<div class="cell row header blue" data-title="Row">Licence points</div>' +
      '<div class="cell row header blue" data-title="Row">Positions</div>' +
      '<div class="cell row header blue" data-title="Row">Points</div>' +
      '<div class="cell row header blue" data-title="Row">DQ</div>' +
      '</div>';
   var tableHTML = tableTopHtml;
   var rowcounter = 0;
   penalties_filtered.forEach(penalty => {
      var rowHTML = '<div class="row" id="' + penalty.incident_no + '" >' +
         '<div class="cell" data-title="Row">' + penalty.display_name + '</div>' +
         '<div class="cell" data-title="Row">' + penalty.round_name + '</div>' +
         '<div class="cell" data-title="Row">' + penalty.score_event + '</div>' +
         '<div class="cell" data-title="Row">' + penalty.lap + '</div>' +
         '<div class="cell" data-title="Row">' + penalty.corner + '</div>' +
         '<div class="cell" data-title="Row">' + penalty.protesting_driver_name + '</div>' +
         '<div class="cell" data-title="Row">' + penalty.driver_statement + '</div>' +
         '<div class="cell" data-title="Row">' + penalty.stewards_decision + '</div>' +
         '<div class="cell" data-title="Row">' + penalty.stewards_comments + '</div>' +
         '<div class="cell" data-title="Row">' + penalty.licence_points + '</div>' +
         '<div class="cell" data-title="Row">' + penalty.positions + '</div>' +
         '<div class="cell" data-title="Row">' + penalty.championship_points + '</div>' +
         '<div class="cell" data-title="Row">' + penalty.disqualified + '</div>' +
         '</div>';
      //replace any undefined values with &nbsp;
      rowHTML = rowHTML.replace(/undefined/g, "&nbsp;"); 

      tableHTML = tableHTML + rowHTML;
      rowcounter += 1;
   });
   $("#penalties_displayed").html(tableHTML);

} //displayPenalties

$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
   getDrivers();
   getRounds();
   getPenalties();
   setFilters();
   displayPenalties();
}); //document is ready
