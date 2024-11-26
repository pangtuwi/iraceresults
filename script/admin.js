var leagueID = "XXXXX";

function getLeague() {
   fetch('./leagueid')
      .then(res => res.json())
      .then(data => {
         console.log("leagueid data received :", data);
         leagueID = data.leagueid;
         $("#leagueid").html(leagueID);
      });
}//getPenalties


$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
   getLeague();
});