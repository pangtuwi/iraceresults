//Apologies for the messy mix of javascript and JQuery :-(
//uses https://github.com/mgalante/jquery.redirect
//other options in https://stackoverflow.com/questions/2367979/pass-post-data-with-window-location-href


function getirresults(round_no, session_no) {

   let reqJSON = {
      round_no: 1,
        session_no: 0
   };


      fetch('./irresults', {
         method: 'POST',
         body: JSON.stringify(reqJSON),
         headers: {
            'Content-type': 'application/json; charset=UTF-8',
         }
      })
         .then(res => res.json())
         .then(data => {
            console.log("irresults data received :", data);
         });
   
}
$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
    getirresults(1,0);
});
