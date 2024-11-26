var penalties = {};

function getRounds() {
   fetch('rounds')
      .then(res => res.json())
      .then(data => {
         console.log("round data received :", data);

         var roundSelect = $("#round_select");
         if (data.length > 0) {
               $("#round_select_comment").html(data.length + " rounds available");
         

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


function getPenalties() {
   var tableTopHtml = '<div class="row header">' +
      '<div class="cell">Penalty no</div>' +
      '<div class="cell">Round</div>' +
      '<div class="cell">Protesting Driver</div>' +
      '<div class="cell">Protested Driver</div>' +
      '<div class="cell">Stewards Decision</div>' +
      '</div>';

   var tableBottomHTML = '</div>'
   var tableHTML = tableTopHtml;
   var rowcounter = 0;
   fetch('./penalties')
      .then(res => res.json())
      .then(data => {
         console.log("penalties data received :", data);
         penalties = data;
         penalties.forEach(penalty => {
            var rowHTML = '<div class="row" id="' + penalty.protest_id + '" >' +
               '<div class="cell" data-title="Row">' + penalty.protest_id + '</div>' +
               '<div class="cell" data-title="Row">' + penalty.round_name + '</div>' +
               '<div class="cell" data-title="Row">' + penalty.protesting_driver_name + '</div>' +
               '<div class="cell" data-title="Row">' + penalty.display_name + '</div>' +
               '<div class="cell" data-title="Row">' + penalty.stewards_decision + '</div>' +
               '</div>';
            tableHTML = tableHTML + rowHTML;
            rowcounter += 1;
         });
         tableHTML = tableHTML + tableBottomHTML;
         $("#penalty_table").html(tableHTML);
      });
}//getPenalties


$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
   getRounds();
   getPenalties();
});