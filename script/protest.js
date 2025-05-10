//Apologies for the messy mix of javascript and JQuery :-(
//uses https://github.com/mgalante/jquery.redirect
//other options in https://stackoverflow.com/questions/2367979/pass-post-data-with-window-location-href

var protest = {};

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
         console.log("driver data received :", data);
         data.sort(function (a, b) {
            return a.display_name.localeCompare(b.display_name);
         });

         const protesting_driver_select = document.getElementById('protesting_driver_select');
         const protested_driver_select = document.getElementById('protested_driver_select');
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
   fetch('./protestablerounds')
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

            data.forEach(round => {
               var option = document.createElement("option");
               option.text = round.track_name;
               option.value = round.round_no;
               roundSelect.append(option);
            });

            var thisRoundNo = roundSelect.children("option:selected").val();
            getScoredEvents(thisRoundNo);
         } else {
            $("#round_select_comment").html("no rounds are available for protest");
         }
      })
      .catch(error => console.log(error))
}//getRounds


/*function getScoredEvents(round_no) {
   fetch('./scoredevents',)
      .then(res => res.json())
      .then(data => {
         console.log("received data : ", data);
         var scoredEventSelect = $("#scored_event_select");
         scoredEventSelect.empty();
         data.forEach(event => {
            var option = document.createElement("option");
            option.text = event.event_type;
            option.value = event.event_type;
            scoredEventSelect.append(option);
         });
      });
} //getScoredEvents */

function getScoredEvents(round_no) {
   fetch('scoredevents', {
      method: 'POST',
      body: JSON.stringify({
         round_no: round_no
      }),
      headers: {
         'Content-type': 'application/json; charset=UTF-8',
      }
   })
      .then(res => res.json())
      .then(data => {
         console.log("received data : ", data);
         var scoredEventSelect = $("#scored_event_select");
         scoredEventSelect.empty();
         data.forEach(event => {
            var option = document.createElement("option");
            option.text = event.event_type;
            //create integer as combination of session counter and score event counter
            option.value = event.round_session_no * 100 + event.score_event_no;
            //option.value = event.score_event_no;
            console.log ("Adding Event : ", option.text, "   with value = ", option.value);
            scoredEventSelect.append(option);
         });
      });
} //getScoredEvents

function showHideBlocks() {

   console.log("Show Hide Blocks")
   var driverInput = document.getElementById("driver_input");
   if (driverInput.style.display === "none") {
      driverInput.style.display = "block";
   } else {
      driverInput.style.display = "none";
   }

   var driverConfirmation = document.getElementById("driver_confirmation");
   if (driverConfirmation.style.display === "none") {
      driverConfirmation.style.display = "block";
      $("#CB1").prop("checked", false);
      $("#CB2").prop("checked", false);
      $("#CB3").prop("checked", false);
      $("#CB4").prop("checked", false);
   } else {
      driverConfirmation.style.display = "none";
   }

} //ShowHideBlocks

function selectRound() {
   var thisRoundNo = $(this).children("option:selected").val();
   getScoredEvents(thisRoundNo);
}// selectRound

function showConfirmationRequest() {
   console.log("next button pressed");
   const protestingDriver = $("#protesting_driver_select").children("option:selected").val();
   const protestingDriverName = $("#protesting_driver_select").children("option:selected").text();
   const protestedDriver = $("#protested_driver_select").children("option:selected").val();
   const protestedDriverName = $("#protested_driver_select").children("option:selected").text();
   const roundNo = $("#round_select").children("option:selected").val();
   const roundName = $("#round_select").children("option:selected").text();
   const event = $("#scored_event_select").children("option:selected").val();
   const lap = $("#protest_lap").val();
   const corner = $("#protest_corner").val();
   const driverStatement = $("#incident_description").val();
   protest = {
      protesting_driver_id: protestingDriver,
      protesting_driver_name: protestingDriverName,
      protested_driver_id: protestedDriver,
      protested_driver_name: protestedDriverName,
      round_name: roundName,
      round_no: roundNo,
      event: event,
      lap: lap,
      corner: corner,
      driver_statement: driverStatement
   }
   console.log("protest object : ", protest);

   $("#protesting_driver_name").html(protest.protesting_driver_name);
   $("#protested_driver_name").html(protest.protested_driver_name);
   $("#protesting_driver_name2").html(protest.protesting_driver_name);
   $("#protested_driver_name2").html(protest.protested_driver_name);
   $("#round_name").html(protest.round_name);
   $("#event").html(protest.event);
   $("#driver_statement").html(protest.driver_statement);

   showHideBlocks();
}//showConfirmationRequest

function checkIfConfirmed() {
   var submitButton = document.getElementById("submit_btn");
   if ($("#CB1").is(":checked") && $("#CB2").is(":checked") && $("#CB3").is(":checked") && $("#CB4").is(":checked")) {
      submitButton.disabled = false;
   } else {
      submitButton.disabled = true;
   }
} //checkIfConfirmed


$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp

   var roundSelect = $("#round_select");
   roundSelect.on("change", selectRound());

   $("#cancel_btn").on("click", function () {
      showHideBlocks();
   });

   $("#next_btn").on("click", function () {
      showConfirmationRequest();
   });


   $("#CB1").on("change", function () {
      checkIfConfirmed();
   });
   $("#CB2").on("change", function () {
      checkIfConfirmed();
   });
   $("#CB3").on("change", function () {
      checkIfConfirmed();
   });
   $("#CB4").on("change", function () {
      checkIfConfirmed();
   });

   //var submitButton = $("#submit_btn");
   var submitButton = document.getElementById("submit_btn");
   submitButton.disabled = true;


   $("#submit_btn").click(function () {
      console.log("submit button clicked");
      console.log(JSON.stringify(protest));
      const protestObj = {
         "protest": JSON.stringify(protest)
      };
      $.redirect("protestconfirmation", protestObj);
   });  

   getDrivers();
   getRounds();

});
