//Apologies for the messy mix of javascript and JQuery :-(
//uses https://github.com/mgalante/jquery.redirect
//other options in https://stackoverflow.com/questions/2367979/pass-post-data-with-window-location-href

var registration = {};

const iRacingCustId = document.getElementById('iracing_cust_id');
const iRacingDisplayName = document.getElementById('iracing_display_name');

/*function getCookie(cname) {
   let name = cname + "=";
   let decodedCookie = decodeURIComponent(document.cookie);
   let ca = decodedCookie.split(';');
   for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
         c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
         return c.substring(name.length, c.length);
      }
   }
   return "";
} */


function showHideBlocks() {

   console.log("Show Hide Blocks")
   var driverInput = document.getElementById("driver_input");
   if (driverInput.style.display === "none") {
      driverInput.style.display = "block";
   } else {
      driverInput.style.display = "none";
   }

   var driverConfirmation = document.getElementById("driver_confirmation");
   if (driverConfirmation.style.display === "none") {
      driverConfirmation.style.display = "block";
      $("#CB1").prop("checked", false);
      $("#CB2").prop("checked", false);
      $("#CB3").prop("checked", false);
   } else {
      driverConfirmation.style.display = "none";
   }

} //ShowHideBlocks

function displayEditDriverDetails(cust_id) {
   fetch('./driver', {
      method: 'POST',
      body: JSON.stringify({
         cust_id: cust_id
      }),
      headers: {
         'Content-type': 'application/json; charset=UTF-8',
      }
   })
      .then(res => res.json())
      .then(data => {
         console.log("received data : ",data)
         findDriverButton.style.display = "none";
         custIdInput.style.display = "none";
         /*newDriverButton.disabled = false;
         addDriverButton.disabled = (lastAction == 1);
         deleteDriverButton.disabled = (lastAction != 1);
         saveDriverButton.disabled = true;
         */
         
         currentDriver = data;
      
         iRacingCustId.innerHTML = data.cust_id;
         iRacingDisplayName.innerHTML = data.display_name;
         //driverClassSelect.selectedIndex = data.classnumber - 1;

         if (lastAction == 2) {
            selectedDriverTitle.innerHTML = "Driver Found in iRacing Database";
         } else {
            selectedDriverTitle.innerHTML = "Selected Driver";
         }

      })
}//displayEditDriverDetails

function showConfirmationRequest() {
   console.log("next button pressed");
   const iracing_cust_id = $("#iracing_cust_id").val();
   const iracing_display_name = $("#iracing_display_name").val();
   const display_name = $("#display_name").val();
   const irating = $("#irating").val();
   const discord_id = $("#discord_id").val();
   registration = {
      cust_id: iracing_cust_id,
      driver_name: iracing_display_name,
      display_name: display_name,
      discord_id: discord_id,
      irating : irating
   }
   console.log("registration object : ", registration);

   $("#driver_name").html(registration.display_name);
   $("#iracing_id").html(registration.cust_id);
   $("#iracing_name").html(registration.iracing_display_name);
   $("#irating").html(registration.irating);
   $("#discord_id").html(registration.discord_id);

   showHideBlocks();
}//showConfirmationRequest

function checkIfConfirmed() {
   var submitButton = document.getElementById("submit_btn");
   if ($("#CB1").is(":checked") && $("#CB2").is(":checked") && $("#CB3").is(":checked")) {
      submitButton.disabled = false;
   } else {
      submitButton.disabled = true;
   }
} //checkIfConfirmed


$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp



   $("#cancel_btn").on("click", function () {
      showHideBlocks();
   });

   $("#next_btn").on("click", function () {
      showConfirmationRequest();
   });


   $("#CB1").on("change", function () {
      checkIfConfirmed();
   });
   $("#CB2").on("change", function () {
      checkIfConfirmed();
   });
   $("#CB3").on("change", function () {
      checkIfConfirmed();
   });

   //var submitButton = $("#submit_btn");
   var submitButton = document.getElementById("submit_btn");
   submitButton.disabled = true;


   $("#submit_btn").click(function () {
      console.log("submit button clicked");
      console.log(JSON.stringify(registration));
      const registrationObj = {
         "registration": JSON.stringify(registration)
      };
      $.redirect("registrationconfirmation", registrationObj);
   });  


});
