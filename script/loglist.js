
var log_entries = [];
var log_entries_filtered = [];

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
            filterLogEntries(filter_round_no, filter_cust_id);

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

function getLogEntries() {
   console.log("fetching log Entreis");

   fetch('./recalculationlog')
      .then(res => res.json())
      .then(data => {
         console.log("recalcualtion log data received :", data);
         log_entries = data;
         log_entries_filtered = log_entries;
         displayLogEntries();

      });
}//getLogEntries

function filterLogEntries (filter_round_no, filter_cust_id) {

   if ((filter_round_no == 0) & (filter_cust_id == 0)) {
      log_entries_filtered = log_entries;
   } else if (filter_round_no == 0) {
      log_entries_filtered = log_entries.filter(log_entry => ((log_entry.cust_id == filter_cust_id) || (log_entry.cust_id == 0)));
   } else if (filter_cust_id == 0) {
      log_entries_filtered = log_entries.filter(log_entry => ((log_entry.round_no == filter_round_no) || (log_entry.round_no == 0)));
   } else {
      log_entries_filtered = log_entries.filter(log_entry =>  ((log_entry.cust_id == filter_cust_id) || (log_entry.cust_id == 0)));
      log_entries_filtered = log_entries_filtered.filter(log_entry => ((log_entry.round_no == filter_round_no) || (log_entry.round_no == 0)));
   }
   displayLogEntries();
}//filterlog_entries

function setFilters() {
   var roundSelect = $("#round_select");
   roundSelect.on("change", function (event) {
      console.log("Filtering by Round = ", this.value);
      filter_round_no = this.value;
      var driverSelect = $("#driver_select");
      filter_cust_id = driverSelect[0].value;
      filterLogEntries(filter_round_no, filter_cust_id);
   }); //roundSelect.on change

   var driverSelect = $("#driver_select");
   driverSelect.on("change", function (event) {
      console.log("Filtering by Driver = ", this.value)
      filter_cust_id = this.value;
      var roundSelect = $("#round_select");
      filter_round_no = roundSelect[0].value;
      filterLogEntries(filter_round_no, filter_cust_id);
   }); //roundSelect.on change
} //setFilters

function displayLogEntries() {
   var tableTopHtml = '<div class="row header">' +
      '<div class="cell row header blue" data-title="Row">Timestamp</div>' +
      '<div class="cell row header blue" data-title="Row">Details</div>' +
'<div class="cell row header blue" data-title="Row">cust_id</div>' +
'<div class="cell row header blue" data-title="Row">round_no</div>' +      
      '</div>';
   var tableHTML = tableTopHtml;
   var rowcounter = 0;
   log_entries_filtered.forEach(log_entry => {
      var rowHTML = '<div class="row" >' +
         '<div class="cell" data-title="Row">' + log_entry.time_stamp + '</div>' +
         '<div class="cell" data-title="Row">' + log_entry.event_text + '</div>' +
         '<div class="cell" data-title="Row">' + log_entry.cust_id + '</div>' +
         '<div class="cell" data-title="Row">' + log_entry.round_no + '</div>' +
         '</div>';
      tableHTML = tableHTML + rowHTML;
      rowcounter += 1;
   });
   $("#log_entries_table").html(tableHTML);

} //displayLogEntries

$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
   getDrivers();
   getRounds();
   getLogEntries();
   setFilters();
   displayLogEntries();
}); //document is ready
