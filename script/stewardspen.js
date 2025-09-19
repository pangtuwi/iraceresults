//https://www.topcoder.com/thrive/articles/fetch-api-javascript-how-to-make-get-and-post-requests

//var penalty = {};
var protests = {};
var selectedProtest = {};

/*
function displayEditProtestDetails(protest_id) {
   selectedProtest = protests.find(item => item.protest_id === protest_id);
   let protest = selectedProtest;
   console.log("you selecred protest : ", protest);
   $("#protest_id").html(protest.protest_id);
   $("#protesting_driver_name").html(protest.protesting_driver_name);
   $("#protested_driver_name").html(protest.protested_driver_name);
   $("#protesting_driver_name2").html(protest.protesting_driver_name);
   $("#protested_driver_name2").html(protest.protested_driver_name);
   $("#round_name").html(protest.round_name);
   $("#event").html(protest.event);
   $("#driver_statement").html(protest.driver_statement);

   var submitButton = document.getElementById("submit_btn");
   submitButton.disabled = true;
} // displayEditProtestDetails
*/

function getDrivers() {
   fetch('./driverlist')
      .then(res => res.json())
      .then(data => {
         console.log("driver data received :", data);
         data.sort(function (a, b) {
            return a.display_name.localeCompare(b.display_name);
         });

         const driver_select = document.getElementById('driver_select');

         data.forEach(driver => {
            var option1 = document.createElement("option");
            option1.text = driver.display_name;
            option1.value = driver.cust_id;
            driver_select.add(option1);
         });

         //Text Filter for Driver names
         var driverSelect = $("#driver_select"),
            driverSearchField = $("#driver_search"),
            driverOptions = driverSelect.find("option").clone(); // clone into memory

         // generic function to clean text
         function sanitize(string) {
            return $.trim(string).replace(/\s+/g, ' ').toLowerCase();
         }

         // prepare the options by storing the "searchable" name as data on the element
         driverOptions.each(function () {
            var option = $(this);
            option.data("sanitized", sanitize(option.text()));
         });

         // handle keyup
         driverSearchField.on("keyup", function (event) {
            var term = sanitize($(this).val()),
               matches;

            // just show all options, if there's no search term
            if (!term) {
               driverSelect.empty().append(driverOptions.clone());
               return;
            }

            // otherwise, show the options that match
            matches = driverOptions.filter(function () {
               return $(this).data("sanitized").indexOf(term) != -1;
            }).clone();

            driverSelect.empty().append(matches);
         });

      })
      .catch(error => console.log(error))
}//getDrivers

function getRounds() {
   fetch('completedrounds')
      .then(res => res.json())
      .then(data => {
         console.log("round data received :", data);

         var roundSelect = $("#round_select");
         if (data.length > 0) {
            if (data.length == 1) {
               $("#round_select_comment").html("only one round available for penalties");
            } else {
               $("#round_select_comment").html(data.length + " rounds available for penalties");
            }

            var maxRoundNo = 0;
            data.forEach(round => {
               var option = document.createElement("option");
               option.text = round.track_name;
               option.value = round.round_no;
               if (round.round_no > maxRoundNo) maxRoundNo = round.round_no;
               roundSelect.append(option);
            });

            roundSelect.val(maxRoundNo);   //set to last round in list
            var thisRoundNo = roundSelect.children("option:selected").val();
            getScoredEvents(thisRoundNo);
         } else {
            $("#round_select_comment").html("no rounds are available for penalties");
         }
      })
      .catch(error => console.log(error))
}//getRounds

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
            console.log ("Adding Event : ", option.text, "   with value = ", option.value);
            scoredEventSelect.append(option);
         });
      });
} //getScoredEvents


function getStewardsDecision(){
   var penalty = {};

      //penalty.protest_id = selectedProtest.protest_id;
      //penalty.round_name = selectedProtest.round_name;
      penalty.cust_id = parseInt($("#driver_select").children("option:selected").val());
      penalty.display_name = $("#driver_select").children("option:selected").text();
      penalty.round_no = parseInt($("#round_select").children("option:selected").val());
      penalty.round_name = $("#round_select").children("option:selected").text();
      
      penalty.event = $("#scored_event_select").children("option:selected").val();
      //penalty.score_event_no = session_event_no % 100;  //last two digits
      //penalty.session_no = (session_event_no- penalty.score_event_no)/100;
      //console.log ("session_event_no = ", session_event_no, "  score_event_no = ", penalty.score_event_no, "  session_no = ", penalty.session_no);
      
      penalty.stewards_decision = $("#stewards_decision").children("option:selected").text();
      penalty.time_added = parseInt($("#penalty_time_added").val());   // TO INT
      penalty.positions = parseInt($("#penalty_positions").val());    // TO INT
      penalty.licence_points = parseInt($("#penalty_licence_points").val());  // TO INT
      penalty.championship_points = parseInt($("#penalty_championship_points").val()); // TO INT
      if ($("#penalty_disqualified").text() == "Yes") {
         penalty.disqualified = 1
      } else {
         penalty.disqualified = 0
      }
      penalty.stewards_comments = $("#stewards_comments").val();

   //console.log (penalty);
   return(penalty);
} //stewardsDecision

function postPenalty(newPenalty){
   console.log("post Penalty : about to submit a penalty : ", newPenalty);
   fetch('./stewardspenalty', {
      method: 'POST',
      body: JSON.stringify(newPenalty),
      headers: {
         'Content-type': 'application/json; charset=UTF-8',
      }
   })
      .then(res => res.json())
      .then(data => {
         //console.log("received data : ", data);
         if (data.confirmation == "ok"){
            alert("Penalty has been saved");
         } else {
            alert ("ERROR - Penalty not saved");
         }

      });
} //postPenalty


$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp

   $("#round_select").on("change", (function(){  
       var thisRoundNo = $(this).children("option:selected").val();
         getScoredEvents(thisRoundNo);
         console.log("round selection triggered");
      }));

   $("#cancel_btn").on("click", function () {
   });

   //var submitButton = document.getElementById("submit_btn");
   //submitButton.disabled = true;

   //$("#stewards_comments").on("change", function () {
  //    submitButton.disabled = false;
  // });

   $("#submit_btn").click(function () {
      console.log("submit button clicked");
      var thisPenalty = getStewardsDecision(); 
      const penaltyObj = {
         "penalty": JSON.stringify(thisPenalty)
      };
      postPenalty(penaltyObj);
   });

   getDrivers();
   getRounds();
});




