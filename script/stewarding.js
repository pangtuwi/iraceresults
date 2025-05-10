//https://www.topcoder.com/thrive/articles/fetch-api-javascript-how-to-make-get-and-post-requests

//var penalty = {};
var protests = {};
var selectedProtest = {};

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
   $("#score_event").html(protest.score_event);
   $("#lap").html(protest.lap);
   $("#corner").html(protest.corner);
   $("#driver_statement").html(protest.driver_statement);

   var submitButton = document.getElementById("submit_btn");
   submitButton.disabled = true;
} // displayEditProtestDetails

function getProtests() {
   var tableTopHtml = '<div class="row header">' +
      '<div class="cell">Protest No</div>' +
      '<div class="cell">Round</div>' +
      '<div class="cell">Protested Driver</div>' +
      '</div>';

   var tableBottomHTML = '</div>'
   var tableHTML = tableTopHtml;
   var rowcounter = 0;
   fetch('./unresolvedprotests')
      .then(res => res.json())
      .then(data => {
         console.log("protests data received :", data);
         protests = data;
         protests.forEach(protest => {
            var rowHTML = '<div class="row" id="' + protest.protest_id + '" >' +
               '<div class="cell" data-title="Row">' + protest.protest_id + '</div>' +
               '<div class="cell" data-title="Row">' + protest.round_name + '</div>' +
               '<div class="cell" data-title="Row">' + protest.protested_driver_name + '</div>' +
               '</div>';
            tableHTML = tableHTML + rowHTML;
            rowcounter += 1;
         });
         tableHTML = tableHTML + tableBottomHTML;
         $("#protest_table").html(tableHTML);

         protests.forEach(protest => {
            //$('"#'+protest.protest_id+'"').on("click", function () {
            $("#" + protest.protest_id).on("click", function () {
               console.log(protest.protest_id);
               displayEditProtestDetails(protest.protest_id);
            })
         });
      });
}//getProtests

function getStewardsDecision(){
   var penalty = {};
   if (selectedProtest == {}){
      console.log("you did not select a protest");
   } else {
      penalty.protest_id = selectedProtest.protest_id;
      penalty.round_name = selectedProtest.round_name;
      penalty.round_no = parseInt(selectedProtest.round_no);   //  TO INT                     
      penalty.score_event = selectedProtest.score_event;
      penalty.lap = selectedProtest.lap;
      penalty.corner = selectedProtest.corner;
      penalty.cust_id = selectedProtest.protested_driver_id;
      penalty.driver_statement = selectedProtest.driver_statement;
      penalty.display_name = selectedProtest.protested_driver_name;
      penalty.protesting_cust_id = selectedProtest.protesting_driver_id;
      penalty.protesting_driver_name = selectedProtest.protesting_driver_name;
      penalty.stewards_decision = $("#stewards_decision").val(); 
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
   }
   console.log (penalty);
   return(penalty);
} //stewardsDecision

function postPenalty(newPenalty){
   console.log("post Penalty : about to submit a penalty : ", newPenalty);
   fetch('./penalty', {
      method: 'POST',
      body: JSON.stringify(newPenalty),
      headers: {
         'Content-type': 'application/json; charset=UTF-8',
      }
   })
      .then(res => res.json())
      .then(data => {
         console.log("received data : ", data);
         location.reload();
      });
} //postPenalty

$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp

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

   getProtests();
});




