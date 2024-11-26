//Apologies for the messy mix of javascript and JQuery :-(
//uses https://github.com/mgalante/jquery.redirect
//other options in https://stackoverflow.com/questions/2367979/pass-post-data-with-window-location-href

$(function () {  //document is ready    
   $("#protest_btn").click(function () {
     
     // $.redirect("protest", protestObj);
    window.location.href = "protest";
   }); 
});
