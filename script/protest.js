const title = document.getElementById('title');
const protesting_driver_select = document.getElementById('protesting_driver_select');
const protested_driver_select = document.getElementById('protested_driver_select');
const round_select = document.getElementById('round_select');
const session_select = document.getElementById('session_select');
const scored_event_select = document.getElementById('scored_event_select');

function getCookie(cname) {
   let name = cname + "=";
   let decodedCookie = decodeURIComponent(document.cookie);
   let ca = decodedCookie.split(';');
   for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
         c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
         return c.substring(name.length, c.length);
      }
   }
   return "";
}

function getDrivers() {
   fetch('./drivers')
      .then(res => res.json())
      .then(data => {
         //console.log("driver data received :", data);
         data.sort(function (a, b) {
            return a.display_name.localeCompare(b.display_name);
         });
         data.forEach(driver => {
            var option1 = document.createElement("option");
            option1.text = driver.display_name;
            option1.value = driver.cust_id;
            protesting_driver_select.add(option1);
            var option2 = document.createElement("option");
            option2.text = driver.display_name;
            option2.value = driver.cust_id;
            protested_driver_select.add(option2);
         });

         //Text Filter for Driver names
         var protestingDriverSelect = $("#protesting_driver_select"),
            protestingSearchField = $("#protesting_driver_search"),
            optionsPD = protestingDriverSelect.find("option").clone(); // clone into memory

         // generic function to clean text
         function sanitize(string) {
            return $.trim(string).replace(/\s+/g, ' ').toLowerCase();
         }

         // prepare the options by storing the "searchable" name as data on the element
         optionsPD.each(function () {
            var option = $(this);
            option.data("sanitized", sanitize(option.text()));
         });

         // handle keyup
         protestingSearchField.on("keyup", function (event) {
            var term = sanitize($(this).val()),
               matches;

            // just show all options, if there's no search term
            if (!term) {
               protestingDriverSelect.empty().append(optionsPD.clone());
               return;
            }

            // otherwise, show the options that match
            matches = optionsPD.filter(function () {
               return $(this).data("sanitized").indexOf(term) != -1;
            }).clone();
            protestingDriverSelect.empty().append(matches);
         });

         var protestedDriverSelect = $("#protested_driver_select"),
            protestedSearchField = $("#protested_driver_search"),
            optionsPD2 = protestedDriverSelect.find("option").clone(); // clone into memory

         optionsPD2.each(function () {
            var option = $(this);
            option.data("sanitized", sanitize(option.text()));
         });

         // handle keyup
         protestedSearchField.on("keyup", function (event) {
            var term = sanitize($(this).val()),
               matches;

            // just show all options, if there's no search term
            if (!term) {
               protestedDriverSelect.empty().append(optionsPD2.clone());
               return;
            }

            // otherwise, show the options that match
            matches = optionsPD2.filter(function () {
               return $(this).data("sanitized").indexOf(term) != -1;
            }).clone();
            protestedDriverSelect.empty().append(matches);
         });
      })
      .catch(error => console.log(error))
}//getDrivers

function getRounds() {
   fetch('rounds')
      .then(res => res.json())
      .then(data => {
         data.forEach(round => {
            var option = document.createElement("option");
            option.text = round.track_name;
            option.value = round.round_no;
            round_select.add(option);
         });

         var roundSelect =  $("#round_select");
         roundOptions = roundSelect.find("option").clone(); // clone into memory
         roundOptions.each(function () {
            var option = $(this);
            option.data("round_no", this.value);
         });
      })
      .catch(error => console.log(error))
}//getRounds

function getSessions() {
   fetch('sessions')
      .then(res => res.json())
      .then(data => {
         data.forEach(session => {
            var option = document.createElement("option");
            option.text = session.list_text;
            option.value = session.subsession_id;
            //option.data("round_no", session.round_no);
            option.dataset.round_no = session.round_no;
            session_select.add(option);
            console.log("sessions option added", option);
         });

         //Filter for Sessions
         var sessionSelect = $("#session_select");
         sessionOptions = sessionSelect.find("option").clone(); // clone into memory
         
         // handle keyup
         var roundSelect = $("#round_select");
         roundSelect.on("change", function (event) {
            var thisRoundNo = $(this).children("option:selected").val();
            //console.log("selected round no ", thisRoundNo);
            var term = thisRoundNo,matches;
            //console.log("search term selected", term);
            // just show all options, if there's no search term
            if (!term) {
               sessionSelect.empty().append(sessionOptions.clone());
               return;
            }

            // otherwise, show the options that match
            matches = sessionOptions.filter(function () {
               console.log("checking round_no :", $(this).data("round_no"));
               return $(this).data("round_no") == term;
            }).clone();
            sessionSelect.empty().append(matches);
         });
      })
      .catch(error => console.log(error))
} //GetSessions

function getScoredEvents() {
   fetch('scoredevents')
      .then(res => res.json())
      .then(data => {
         console.log("Got Scored_events : ", data);
         data.forEach(scored_event=> {
            var option = document.createElement("option");
            option.text = scored_event.list_text;
            option.value = scored_event.score_event;
            option.dataset.subsession_id = scored_event.subsession_id;
            scored_event_select.add(option);
            console.log("scoredEvent option added", option);
         });

         //Filter for Sessions
         var scoredEventSelect = $("#scored_event_select");
         scoredEventOptions = scoredEventSelect.find("option").clone(); // clone into memory

         // handle keyup
         var sessionSelect = $("#session_select");
         sessionSelect.on("change", function (event) {
            var thisSubSessionID = $(this).children("option:selected").val();
            console.log("selected subsession ID ", thisSubSessionID);
            var term = thisSubSessionID,matches;

            // just show all options, if there's no search term
            if (!term) {
               scoredEventSelect.empty().append(scoredEventOptions.clone());
               console.log("no search term");
               return;
            }

            // otherwise, show the options that match
            matches = scoredEventOptions.filter(function () {
               console.log ("checking subsession_id : ", $(this).data("subsession_id"));
               return $(this).data("subsession_id") == term;
            }).clone();
            scoredEventSelect.empty().append(matches);
         });
      })
      .catch(error => console.log(error))
} //getScoredEvents


$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
   let leagueID = getCookie("leagueid");
   title.innerHTML = "LEAGUE RACE PROTEST : " + leagueID;
   getDrivers();
   getRounds();
   getSessions();
   getScoredEvents();
});

