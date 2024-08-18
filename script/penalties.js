//https://www.topcoder.com/thrive/articles/fetch-api-javascript-how-to-make-get-and-post-requests

const newButton = document.getElementById('new_btn');
const findButton = document.getElementById('find_btn');
const saveButton = document.getElementById('save_btn');
const addButton = document.getElementById('add_btn');
const deleteButton = document.getElementById('delete_btn');

addButton.disabled = true;
deleteButton.disabled = true;
saveButton.disabled = true;

const custIdInput = document.getElementById('cust_id_input');
const driverClassSelect = document.getElementById('driver_class_select');
const driverCustId = document.getElementById('driver_cust_id');
const driverDisplayName = document.getElementById('driver_display_name');
const selectedTitle = document.getElementById('selected_title');

var currentPenalty = {};

var lastAction = 0; // capture button sequences  1=select from table, 2=new, 3=change class select

driverClassSelect.addEventListener('change', _ => {
   selectedTitle.innerHTML = "Selected Penalty - xxxxx modified, click save to update league database."
   if (lastAction == 1) saveButton.disabled = false;
   lastAction = 3;
   currentPenalty.classnumber = driverClassSelect.selectedIndex+1;
});

newButton.addEventListener('click', async _ => {
   lastAction = 2;
   newButton.disabled = true;
   addButton.disabled = true;
   saveButton.disabled = true;
   deleteButton.disabled = true;
   driverCustId.innerHTML = "";
   driverDisplayName.innerHTML = "";
   driverClassSelect.selectedIndex = 0;
   findButton.style.display = "inline";
   custIdInput.style.display = "inline";
   selectedTitle.innerHTML = "New Penalty - enter cust_id and click Find to confirm details";
   findButton.addEventListener('click', async _ => {
      const cust_id = custIdInput.value;
      //console.log("read cust_id from input:",  cust_id)
      displayEditDriverDetails(cust_id);
   })
}); //newDriverButton.addEventListener

addButton.addEventListener('click', async _ => {
   console.log("adding driver :", currentDriver);
   fetch('/adddriver', {
      method: 'POST',
      body: JSON.stringify(currentDriver),
      headers: {
         'Content-type': 'application/json; charset=UTF-8',
      }
   })
      .then(res => res.json())
      .then(data => {
         location.reload()
      })
}); //addButton.addEventListener

saveButton.addEventListener('click', async _ => {
   console.log("saving driver :", currentPenalty);
   fetch('/modpenalty', {
      method: 'POST',
      body: JSON.stringify(currentPenalty),
      headers: {
         'Content-type': 'application/json; charset=UTF-8',
      }
   })
      .then(res => res.json())
      .then(data => {
         location.reload()
      })
}); //saveButton.addEventListener

deleteButton.addEventListener('click', async _ => {
   console.log("deleting penalty :", currentPenalty);
   fetch('/deletepenalty', {
      method: 'POST',
      body: JSON.stringify(currentPenalty),
      headers: {
         'Content-type': 'application/json; charset=UTF-8',
      }
   })
      .then(res => res.json())
      .then(data => {
         location.reload()
      })
}); //deleteButton.addEventListener

function getClasses() {
   fetch('/classes')
      .then(res => res.json())
      .then(data => {
         console.log("classes data received :", data);
         data.forEach(driverClass => {
            var option = document.createElement("option");
            option.text = driverClass.classnumber + " : " + driverClass.classname;
            driverClassSelect.add(option);
         });
      })
      .catch(error => console.log(error))
}//getClasses

function displayEditPenaltyDetails(cust_id) {
   fetch('/penalty', {
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
         findButton.style.display = "none";
         custIdInput.style.display = "none";
         newButton.disabled = false;
         addButton.disabled = (lastAction == 1);
         deleteButton.disabled = (lastAction != 1);
         saveButton.disabled = true;
         
         currentPenalty = data;
      
         driverCustId.innerHTML = data.cust_id;
         driverDisplayName.innerHTML = data.display_name;
         driverClassSelect.selectedIndex = data.classnumber - 1;

         if (lastAction == 2) {
            selectedTitle.innerHTML = "New Penalty Cretaed  - use add button to add to league database";
         } else {
            selectedTitle.innerHTML = "Selected Penalty";
         }

      })
}//displayEditPenaltyDetails

document.querySelector('#list_table')
   .addEventListener('click', (ev) => {
      lastAction = 1;
      saveButton.disabled = true;
      let cust_id = ev.target.firstChild.data;
      //console.log("cust_id:", cust_id);
      const cust_id_int = Number(cust_id);
      //console.log("cust_id_int:", cust_id_int);
      if ((Number.isInteger(cust_id_int)) && (cust_id_int > 100)) {
         displayEditDriverDetails(cust_id);
      }
   });


getClasses();




