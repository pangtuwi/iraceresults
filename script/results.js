
var results = [];
var results_filtered = [];

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
            option1.text = driver.display_name;
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
            filterresults(filter_round_no, filter_cust_id);

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

function getresults() {
   console.log("fetching results");

   fetch('./results', {
      method: 'POST',
      body: JSON.stringify({
         round_no: 0,
         cust_id: 532447
      }),
      headers: {
         'Content-type': 'application/json; charset=UTF-8',
      }
   })
      .then(res => res.json())

      .then(data => {
         console.log("results list data received :", data);
         results = data;
         results_filtered = results;
         displayresults();

      });
}//getresults

function filterresults(filter_round_no, filter_cust_id) {

   if ((filter_round_no == 0) & (filter_cust_id == 0)) {
      results_filtered = results;
   } else if (filter_round_no == 0) {
      results_filtered = results.filter(penalty => penalty.cust_id == filter_cust_id);
   } else if (filter_cust_id == 0) {
      results_filtered = results.filter(penalty => penalty.round_no == filter_round_no);
   } else {
      results_filtered = results.filter(penalty => penalty.cust_id == filter_cust_id);
      results_filtered = results_filtered.filter(penalty => penalty.round_no == filter_round_no);
   }
   displayresults();
}//filterresults

function setFilters() {
   var roundSelect = $("#round_select");
   roundSelect.on("change", function (event) {
      console.log("Filtering by Round = ", this.value);
      filter_round_no = this.value;
      var driverSelect = $("#driver_select");
      filter_cust_id = driverSelect[0].value;
      filterresults(filter_round_no, filter_cust_id);
   }); //roundSelect.on change

   var driverSelect = $("#driver_select");
   driverSelect.on("change", function (event) {
      console.log("Filtering by Driver = ", this.value)
      filter_cust_id = this.value;
      var roundSelect = $("#round_select");
      filter_round_no = roundSelect[0].value;
      filterresults(filter_round_no, filter_cust_id);
   }); //roundSelect.on change
} //setFilters

function msToTime(duration) {
    var milliseconds = parseInt((duration%1000))
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return  minutes + ":" + seconds + "." + milliseconds;
} //msToTime

function checkDQ(position) {
   if (position == -1) {
      return "DQ";
   } else {
      return position;
   }
} //checkDQ

function didFinish(finished) {
   if (finished) {
      return "Yes";
   } else {
      return "No";
   }
} //didFinish s

function displayresults() {
   console.log("displaying results : ", results_filtered);
   if (results_filtered.length == 0) {
      $("#results_displayed").html("No results to display");
      return;
   }
   var tableTopHtml = '<div class="row header">' +
                '<div class="cell row header blue" data-title="cust_id">Round</div>' +
                '<div class="cell row header blue" data-title="track_name">Track</div>' +
                '<div class="cell row header blue" data-title="score_event">Score Event</div>' +
                '<div class="cell row header blue" data-title="display_name">Name</div>' +
                '<div class="cell row header blue" data-title="best_lap_time">Best Lap Time</div>' +
                '<div class="cell row header blue" data-title="laps_complete">Laps Complete</div>' +
                '<div class="cell row header blue" data-title="class_interval">Class Interval</div>' +
                '<div class="cell row header blue" data-title="laps_lead">Laps Lead</div>' +
                '<div class="cell row header blue" data-title="starting_position">Starting Position</div>' +
                '<div class="cell row header blue" data-title="finish_position">Finish Position</div>' +
                '<div class="cell row header blue" data-title="finish_position_after_penalties">Finish Position After Penalties</div>' +
                '<div class="cell row header blue" data-title="championship_penalty">Championship Penalty</div>' +
                '<div class="cell row header blue" data-title="finish_position_in_class">Finish Position In Class</div>' +
                '<div class="cell row header blue" data-title="finished">Finished</div>' +
                '<div class="cell row header blue" data-title="finish_position_in_class_after_penalties">Finish Position In Class After Penalties</div>' +
                '<div class="cell row header blue" data-title="score">Score</div>' +
      '</div>';
   var tableHTML = tableTopHtml;
   var rowcounter = 0;
   results_filtered.forEach(result => {
      var rowHTML = '<div class="row" >' +
         '<div class="cell" data-title="Row">' + result.round_no + '</div>' +
         '<div class="cell" data-title="Row">' + result.track_name + '</div>' +
         '<div class="cell" data-title="Row">' + result.score_event + '</div>' +
         '<div class="cell" data-title="Row">' + result.display_name + '</div>' +
         '<div class="cell" data-title="Row">' + msToTime(result.best_lap_time/10) + '</div>' +
         '<div class="cell" data-title="Row">' + result.laps_complete + '</div>' +
         '<div class="cell" data-title="Row">' + msToTime(result.class_interval/10  ) + '</div>' +
         '<div class="cell" data-title="Row">' + result.laps_lead + '</div>' +
         '<div class="cell" data-title="Row">' + result.starting_position + '</div>' +
         '<div class="cell" data-title="Row">' + result.finish_position + '</div>' +
         '<div class="cell" data-title="Row">' + checkDQ(result.finish_position_after_penalties) + '</div>' +
         '<div class="cell" data-title="Row">' + result.championship_penalty + '</div>' +
         '<div class="cell" data-title="Row">' + result.finish_position_in_class + '</div>' +
         '<div class="cell" data-title="Row">' + didFinish(result.finished)   + '</div>' +
         '<div class="cell" data-title="Row">' + checkDQ(result.finish_position_in_class_after_penalties) + '</div>' +
         '<div class="cell" data-title="Row">' + result.score + '</div>' +
         '</div>';
      //replace any undefined values with &nbsp;
      rowHTML = rowHTML.replace(/undefined/g, "&nbsp;");

      tableHTML = tableHTML + rowHTML;
      rowcounter += 1;
   });
   $("#results_displayed").html(tableHTML);

} //displayresults

$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
   getDrivers();
   getRounds();
   getresults();
   setFilters();
   displayresults();
}); //document is ready
