var leagueName = "XXXXX";
var leagueID = "YYYYY";

function getLeagueDetails() {
   fetch('./leaguename')
      .then(res => res.json())
      .then(data => {
         console.log("league name received :", data);
         leagueName = data.leaguename;
         $("#leagueid").html(leagueName);
         leagueID = data.leagueid;
         setMenuLinks();
      });
}//getLeagueDetails

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


// Monitor iframe for authentication errors
function setupIframeErrorMonitoring() {
   const iframe = document.querySelector('iframe[name="iframe_target"]');

   if (!iframe) {
      console.log('No iframe found for monitoring');
      return;
   }

   console.log('Setting up iframe error monitoring');

   // Listen for messages from iframe content
   window.addEventListener('message', function(event) {
      console.log('Message received from iframe:', event.data);
      // Check if message indicates authentication error
      if (event.data && event.data.type === 'auth_error') {
         console.log('Auth error detected, reloading page');
         window.location.reload();
      }
   });

   // Intercept iframe navigation errors
   iframe.addEventListener('load', function() {
      console.log('Iframe loaded, checking for auth errors');
      try {
         // Try to access iframe content to check for error pages
         const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

         // Check if iframe contains an error message (this will only work for same-origin content)
         if (iframeDoc && iframeDoc.body) {
            const bodyText = iframeDoc.body.innerText || iframeDoc.body.textContent;
            console.log('Iframe body text:', bodyText.substring(0, 100));
            if (bodyText.includes('Authentication Required') || bodyText.includes('session has expired')) {
               console.log('Auth error page detected in iframe');
               window.location.reload();
            }
         }
      } catch (e) {
         // Cross-origin access will throw an error, which is expected and can be ignored
         console.log('Cannot access iframe content (cross-origin or not loaded)');
      }
   });
}//setupIframeErrorMonitoring

$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
   console.log("Admin page ready");
   getLeagueDetails();
   getUserInfo();
   setupIframeErrorMonitoring();
});