var leagueID = "XXXXX";

function getLeague() {
   fetch('./leagueid')
      .then(res => res.json())
      .then(data => {
         console.log("leagueid data received :", data);
         leagueID = data.leagueid;
         $("#leagueid").html(leagueID);
         setMenuLinks();
      });
}//getLeague

function setMenuLinks(){
   $("#link_drivers").attr("href", "/admin/"+leagueID+"/drivers");
   $("#link_tables").attr("href", "/"+leagueID);
   $("#link_penalty").attr("href", "/admin/"+leagueID+"/stewardspen");
   $("#link_recalculate").attr("href", "/"+leagueID+"/recalculate");
   $("#link_reload").attr("href", "/"+leagueID+"/reload");
   $("#link_penalties").attr("href", "/admin/"+leagueID+"/penaltylist");
   $("#link_session").attr("href", "/admin/"+leagueID+"/session");
   $("#link_log").attr("href", "/admin/"+leagueID+"/loglist");
}//setMenuLinks


$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
   getLeague();
});