var leagueName = "XXXXX";

function getLeagueName() {
   fetch('./leaguename')
      .then(res => res.json())
      .then(data => {
         console.log("league name received :", data);
         leagueName = data.leaguename;
         $("#leagueid").html(leagueName);
         setMenuLinks();
      });
}//getLeague

function getUserInfo() {
   fetch('/auth/status')
      .then(res => res.json())
      .then(data => {
         console.log("User info received:", data);
         if (data.authenticated && data.user) {
            $("#user-name").html(data.user.displayName || data.user.email);
         }
      })
      .catch(error => {
         console.error("Error fetching user info:", error);
      });
}//getUserInfo

function setMenuLinks(){
   $("#link_drivers").attr("href", "/admin/"+leagueID+"/drivers");
   $("#link_tables").attr("href", "/"+leagueID+"/");
   $("#link_protests").attr("href", "/admin/"+leagueID+"/protests_admin");
   $("#link_penalty").attr("href", "/admin/"+leagueID+"/stewardspen");
   $("#link_recalculate").attr("href", "/admin/"+leagueID+"/recalc_admin");
   $("#link_reload").attr("href", "/"+leagueID+"/reload");
   $("#link_penalties").attr("href", "/admin/"+leagueID+"/penalties_admin");
   $("#link_licencepoints").attr("href", "/admin/"+leagueID+"/licencepoints_admin");
   $("#link_session").attr("href", "/admin/"+leagueID+"/session");
   $("#link_log").attr("href", "/admin/"+leagueID+"/loglist");
   $("#link_config").attr("href", "/admin/"+leagueID+"/config");
}//setMenuLinks


$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
   console.log("Admin page ready");
   getLeagueName();
   getUserInfo();
});