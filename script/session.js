//const { getPenalties } = require("../appjsonloader");

var sessions = [];
var currentSession = {};

const sessionRoundNo = document.getElementById('session_round_no');
const sessionTrack = document.getElementById('session_track');
const sessionScoreType = document.getElementById('session_score_type');
const sessionSessionID = document.getElementById('session_id_input');
const saveSessionButton = document.getElementById('save_session_btn');

console.log(saveSessionButton);

sessionSessionID.addEventListener('beforeinput', _ => {
   console.log("session_session_id is being edited");
   saveSessionButton.disabled = false;
});

saveSessionButton.addEventListener('click', async _ => {
   console.log("saving session ID for :", currentSession);
   currentSession.subsession_id = sessionSessionID.value;
   fetch('./updatesession', {
      method: 'POST',
      body: JSON.stringify(currentSession),
      headers: {
         'Content-type': 'application/json; charset=UTF-8',
      }
   })
      .then(res => res.json())
      .then(data => {
         location.reload()
      })
}); //saveSessionButton.addEventListener


function displayEditSessionDetails(session_ref) {
   saveSessionButton.disabled = true;
   console.log ("sessions:", sessions);
   const sessionsMatched = sessions.filter(session => session.session_ref == session_ref);
   console.log ("sessions matched:", sessionsMatched);
   currentSession = sessionsMatched[0];
   console.log("This Session:", currentSession);

   sessionRoundNo.innerHTML = currentSession.round_no;
   sessionTrack.innerHTML = currentSession.track_name;
   sessionScoreType.innerHTML = currentSession.score_type;
   sessionSessionID.value = currentSession.subsession_id;

}//displayEditSessionDetails

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

      var rowHTML = '<div class="row"  >' +
         '<div class="cell" data-title="'+session.session_ref+'">' + session.round_no + '</div>' +
         '<div class="cell" data-title="'+session.session_ref+'">'+ session.track_name + '</div>' +
         '<div class="cell" data-title="'+session.session_ref+'">'+ session.score_type + '</div>' +
         '<div class="cell" data-title="'+session.session_ref+'">' + session.subsession_id + '</div>' +
         '</div>';
      tableHTML = tableHTML + rowHTML;
      rowcounter += 1;
   });
   $("#sessions_table").html(tableHTML);

   document.querySelector('#sessions_table')
      .addEventListener('click', (ev) => {
         lastAction = 1;
         saveSessionButton.disabled = true;
         let session_ref = ev.target.dataset.title;
         console.log("selected session Ref: ", session_ref);
         //const session_ref_int = Number(session_ref);
         displayEditSessionDetails(Number(session_ref));

      });
} //displaySessions

$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
   getSessions();
   //displaySessions();


}); //document is ready
