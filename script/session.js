//const { getPenalties } = require("../appjsonloader");

var sessions = [];


function getSessions() {
   console.log("fetching sessions");


   fetch('./sessions')
      .then(res => res.json())
      .then(data => {
         console.log("session data received :", data);
         sessions = data;
         sessions_filtered = sessions;
         displaySessions();

      });
}//getSessions

function displaySessions() {
   var tableTopHtml = '<div class="row header">' +
      '<div class="cell row header blue" data-title="Row">Round</div>' +
      '<div class="cell row header blue" data-title="Row">Track</div>' +
      '<div class="cell row header blue" data-title="Row">ScoreType</div>' +
      '<div class="cell row header blue" data-title="Row">SessionID</div>' +
      '</div>';
   var tableHTML = tableTopHtml;
   var rowcounter = 0;
   sessions.forEach(session => {
      var rowHTML = '<div class="row" id="' + session.subsession_id + '" >' +
         '<div class="cell" data-title="Row">' + session.round_no + '</div>' +
         '<div class="cell" data-title="Row">' + session.track_name + '</div>' +
         '<div class="cell" data-title="Row">' + session.score_type + '</div>' +
         '<div class="cell" data-title="Row">' + session.subsession_id + '</div>' +
        '</div>';
      tableHTML = tableHTML + rowHTML;
      rowcounter += 1;
   });
   $("#sessions").html(tableHTML);

} //displaySessions

$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
   getSessions();
   displaySessions();
}); //document is ready
