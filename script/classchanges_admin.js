var leagueID = "XXXXX";
var classChanges = [];
var drivers = [];
var classes = [];
var currentEditIndex = -1;

function getCookie(name) {
   const value = `; ${document.cookie}`;
   const parts = value.split(`; ${name}=`);
   if (parts.length === 2) return parts.pop().split(';').shift();
}

function getLeague() {
   leagueID = getCookie('leagueid');
   if (!leagueID) {
      console.error("No league ID found in cookie");
      return;
   }
   console.log("League ID:", leagueID);
   getDrivers();
}

function getDrivers() {
   fetch('./driverlist')
      .then(res => res.json())
      .then(data => {
         console.log("Drivers data received:", data);
         drivers = data;
         getClasses();
      })
      .catch(error => {
         console.error("Error fetching drivers:", error);
      });
}

function getClasses() {
   fetch('./classes')
      .then(res => res.json())
      .then(data => {
         console.log("Classes data received:", data);
         classes = data;
         getClassChanges();
      })
      .catch(error => {
         console.error("Error fetching classes:", error);
      });
}

function getClassChanges() {
   fetch('./classchangesjson')
      .then(res => res.json())
      .then(data => {
         console.log("Class changes data received:", data);
         classChanges = data || [];
         displayClassChanges();
      })
      .catch(error => {
         console.error("Error fetching class changes:", error);
         classChanges = [];
         displayClassChanges();
      });
}

function displayClassChanges() {
   const container = $("#classchanges_displayed");

   // Remove all rows except header
   container.find('.row').not(':first').remove();

   if (classChanges.length === 0) {
      const row = $("<div>").addClass("row");
      row.append($("<div>").addClass("cell").attr("colspan", "6").text("No class changes defined"));
      container.append(row);
      return;
   }

   classChanges.forEach((change, index) => {
      const row = $("<div>").addClass("row");

      // Driver name
      row.append($("<div>").addClass("cell").text(change.display_name || 'Unknown'));

      // Original class - get from drivers array
      const driver = drivers.find(d => d.cust_id === change.cust_id);
      const originalClassNumber = driver ? driver.classnumber : null;
      const originalClassObj = originalClassNumber ? classes.find(c => c.classnumber === originalClassNumber) : null;
      const originalClassName = originalClassObj ? originalClassObj.classname : (originalClassNumber ? `Class ${originalClassNumber}` : 'Unknown');
      row.append($("<div>").addClass("cell").text(originalClassName));

      // New class - show class name
      const classObj = classes.find(c => c.classnumber === change.new_class_number);
      const className = classObj ? classObj.classname : `Class ${change.new_class_number}`;
      row.append($("<div>").addClass("cell").text(className));

      // From round
      row.append($("<div>").addClass("cell").text(change.change_from_round));

      // Edit button
      const editCell = $("<div>")
         .addClass("cell")
         .attr("data-title", "Row")
         .css("cursor", "pointer")
         .html("<b>Edit</b>")
         .on("click", function() { editClassChange(index); });
      row.append(editCell);

      // Delete button
      const deleteCell = $("<div>")
         .addClass("cell")
         .attr("data-title", "Row")
         .css("cursor", "pointer")
         .html("<b>Delete</b>")
         .on("click", function() { confirmDeleteClassChange(index); });
      row.append(deleteCell);

      container.append(row);
   });
}

function populateDriverDropdown() {
   const select = $("#edit_driver_select");
   select.empty();

   drivers.forEach(driver => {
      const displayName = driver.custom_display_name || driver.display_name;
      select.append($("<option>")
         .val(driver.cust_id)
         .text(displayName)
         .data("driver", driver));
   });
}

function populateClassDropdown() {
   const select = $("#edit_class_select");
   select.empty();

   classes.forEach(classObj => {
      select.append($("<option>")
         .val(classObj.classnumber)
         .text(classObj.classname));
   });
}

function showAddForm() {
   currentEditIndex = -1;
   $("#form_title").text("Add Class Change");
   populateDriverDropdown();
   populateClassDropdown();
   $("#edit_from_round").val(1);
   $("#classchanges_displayed").parent().hide();
   $("#add_classchange_btn").hide();
   $("#edit_classchange_form").show();
}

function editClassChange(index) {
   currentEditIndex = index;
   const change = classChanges[index];

   $("#form_title").text("Edit Class Change");
   populateDriverDropdown();
   populateClassDropdown();

   $("#edit_driver_select").val(change.cust_id);
   $("#edit_class_select").val(change.new_class_number);
   $("#edit_from_round").val(change.change_from_round);

   $("#classchanges_displayed").parent().hide();
   $("#add_classchange_btn").hide();
   $("#edit_classchange_form").show();
}

function saveClassChange() {
   const cust_id = parseInt($("#edit_driver_select").val());
   const new_class_number = parseInt($("#edit_class_select").val());
   const change_from_round = parseInt($("#edit_from_round").val());

   // Get driver name
   const driver = drivers.find(d => d.cust_id === cust_id);
   const display_name = driver ? (driver.custom_display_name || driver.display_name) : 'Unknown';

   const classChangeData = {
      cust_id: cust_id,
      display_name: display_name,
      new_class_number: new_class_number,
      change_from_round: change_from_round
   };

   const endpoint = currentEditIndex === -1 ? 'addclasschange' : 'updateclasschange';

   if (currentEditIndex !== -1) {
      classChangeData.index = currentEditIndex;
   }

   fetch('./' + endpoint, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
      },
      body: JSON.stringify(classChangeData)
   })
   .then(res => res.json())
   .then(data => {
      console.log("Save response:", data);
      if (data.confirmation) {
         showModal("Success", "Class change saved successfully", "✅");
         cancelEdit();
         getClassChanges();
      } else if (data.error) {
         showModal("Error", data.error, "❌");
      }
   })
   .catch(error => {
      console.error("Error saving class change:", error);
      showModal("Error", "Failed to save class change", "❌");
   });
}

function confirmDeleteClassChange(index) {
   const change = classChanges[index];
   showConfirmModal(
      "Delete Class Change",
      `Are you sure you want to delete the class change for ${change.display_name}?`,
      function() {
         deleteClassChange(index);
      }
   );
}

function deleteClassChange(index) {
   fetch('./deleteclasschange', {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
      },
      body: JSON.stringify({ index: index })
   })
   .then(res => res.json())
   .then(data => {
      console.log("Delete response:", data);
      if (data.confirmation) {
         showModal("Success", "Class change deleted successfully", "✅");
         getClassChanges();
      } else if (data.error) {
         showModal("Error", data.error, "❌");
      }
   })
   .catch(error => {
      console.error("Error deleting class change:", error);
      showModal("Error", "Failed to delete class change", "❌");
   });
}

function cancelEdit() {
   $("#edit_classchange_form").hide();
   $("#classchanges_displayed").parent().show();
   $("#add_classchange_btn").show();
   currentEditIndex = -1;
}

function showModal(title, message, icon) {
   $("#modal-title").text(title);
   $("#modal-message").text(message);
   $("#modal-icon").text(icon);
   $("#modal-overlay").addClass("show");
}

function hideModal() {
   $("#modal-overlay").removeClass("show");
}

function showConfirmModal(title, message, onConfirm) {
   $("#confirm-title").text(title);
   $("#confirm-message").text(message);
   $("#confirm-modal-overlay").addClass("show");

   // Set up one-time click handlers
   $("#confirm-yes-btn").off("click").on("click", function() {
      $("#confirm-modal-overlay").removeClass("show");
      onConfirm();
   });

   $("#confirm-no-btn").off("click").on("click", function() {
      $("#confirm-modal-overlay").removeClass("show");
   });
}

$(function () {
   getLeague();

   $("#add_classchange_btn").on("click", showAddForm);
   $("#save_classchange_btn").on("click", saveClassChange);
   $("#cancel_edit_btn").on("click", cancelEdit);
   $("#modal-btn").on("click", hideModal);
});
