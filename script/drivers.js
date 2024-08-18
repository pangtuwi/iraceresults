//https://www.topcoder.com/thrive/articles/fetch-api-javascript-how-to-make-get-and-post-requests

const newDriverButton = document.getElementById('new_driver_btn');
const findDriverButton = document.getElementById('find_driver_btn');
const saveDriverButton = document.getElementById('save_driver_btn');
const addDriverButton = document.getElementById('add_driver_btn');
const deleteDriverButton = document.getElementById('delete_driver_btn');
const custIdInput = document.getElementById('cust_id_input');
const driverClassSelect = document.getElementById('driver_class_select');
const driverCustId = document.getElementById('driver_cust_id');
const driverDisplayName = document.getElementById('driver_display_name');
const selectedDriverTitle = document.getElementById('selected_driver_title');

var currentDriver = {};

var lastAction = 0; // capture button sequences  1=select from table, 2=new, 3=change class select

driverClassSelect.addEventListener('change', _ => {
   selectedDriverTitle.innerHTML = "Selected Driver - driverclass modified, click save to update league database."
   if (lastAction == 1) saveDriverButton.disabled = false;
   lastAction = 3;
   currentDriver.classnumber = driverClassSelect.selectedIndex+1;
});

newDriverButton.addEventListener('click', async _ => {
   lastAction = 2;
   newDriverButton.disabled = true;
   addDriverButton.disabled = true;
   saveDriverButton.disabled = true;
   deleteDriverButton.disabled = true;
   driverCustId.innerHTML = "";
   driverDisplayName.innerHTML = "";
   driverClassSelect.selectedIndex = 0;
   findDriverButton.style.display = "inline";
   custIdInput.style.display = "inline";
   selectedDriverTitle.innerHTML = "New Driver - enter cust_id and click Find to confirm details";
   findDriverButton.addEventListener('click', async _ => {
      const cust_id = custIdInput.value;
      //console.log("read cust_id from input:",  cust_id)
      displayEditDriverDetails(cust_id);
   })
}); //newDriverButton.addEventListener

addDriverButton.addEventListener('click', async _ => {
   console.log("adding driver :", currentDriver);
   fetch('./adddriver', {
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
}); //addDriverButton.addEventListener

saveDriverButton.addEventListener('click', async _ => {
   console.log("saving driver :", currentDriver);
   fetch('./moddriver', {
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
}); //saveDriverButton.addEventListener

deleteDriverButton.addEventListener('click', async _ => {
   console.log("deleting driver :", currentDriver);
   fetch('./deletedriver', {
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
}); //deleteDriverButton.addEventListener

function getClasses() {
   fetch('./classes')
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
         newDriverButton.disabled = false;
         addDriverButton.disabled = (lastAction == 1);
         deleteDriverButton.disabled = (lastAction != 1);
         saveDriverButton.disabled = true;
         
         currentDriver = data;
      
         driverCustId.innerHTML = data.cust_id;
         driverDisplayName.innerHTML = data.display_name;
         driverClassSelect.selectedIndex = data.classnumber - 1;

         if (lastAction == 2) {
            selectedDriverTitle.innerHTML = "New Driver Found  - use add button to add to league";
         } else {
            selectedDriverTitle.innerHTML = "Selected Driver";
         }

      })
}//displayEditDriverDetails

document.querySelector('#driver_table')
   .addEventListener('click', (ev) => {
      lastAction = 1;
      saveDriverButton.disabled = true;
      let cust_id = ev.target.firstChild.data;
      //console.log("cust_id:", cust_id);
      const cust_id_int = Number(cust_id);
      //console.log("cust_id_int:", cust_id_int);
      if ((Number.isInteger(cust_id_int)) && (cust_id_int > 100)) {
         displayEditDriverDetails(cust_id);
      }
   });


getClasses();
addDriverButton.disabled = true;
deleteDriverButton.disabled = true;
saveDriverButton.disabled = true;



