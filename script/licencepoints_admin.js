var leagueID = "XXXXX";
var classNames = {};

function getLeague() {
   fetch('./leagueid')
      .then(res => res.json())
      .then(data => {
         console.log("leagueid data received:", data);
         leagueID = data.leagueid;
         getClasses();
      });
}

function getClasses() {
   fetch('./classes')
      .then(res => res.json())
      .then(data => {
         console.log("Classes data received:", data);
         // Create a map of class number to class name
         data.forEach(classObj => {
            classNames[classObj.classnumber] = classObj.classname;
         });
         console.log("Class names map:", classNames);
         getLicencePoints();
      })
      .catch(error => {
         console.error("Error fetching classes:", error);
         getLicencePoints();
      });
}

function getLicencePoints() {
   fetch('./licencepoints')
      .then(res => res.json())
      .then(data => {
         console.log("Licence points data received:", data);
         displayLicencePoints(data);
      })
      .catch(error => {
         console.error("Error fetching licence points:", error);
      });
}

function displayLicencePoints(licencePointsData) {
   const container = $("#licencepoints_container");
   container.empty();

   // Check if data is empty or not an array
   if (!licencePointsData || !Array.isArray(licencePointsData) || licencePointsData.length === 0) {
      container.append($("<div>").addClass("class-title").text("No licence points data available"));
      return;
   }

   // Each array in licencePointsData represents a class
   licencePointsData.forEach((classData, classIndex) => {
      if (!classData || !Array.isArray(classData) || classData.length === 0) {
         return;
      }

      // First object contains driver data with all the keys we need
      const firstDriver = classData[0];
      if (!firstDriver || typeof firstDriver !== 'object') {
         return;
      }

      // Extract class name using the classNames map
      // The array index corresponds to the class number (0-indexed array, 1-indexed classes)
      const classNumber = classIndex + 1;
      const className = classNames[classNumber] || firstDriver.Class || `Class ${classNumber}`;

      // Create section for this class
      const section = $("<div>").addClass("class-section");
      const title = $("<div>").addClass("class-title").text(className);
      section.append(title);

      // Create table (using div-based table structure like penalties_admin)
      const table = $("<div>").addClass("table");

      // Get all property keys from first driver to determine columns, excluding ID and Pos
      // Move Total to the end
      let allKeys = Object.keys(firstDriver).filter(key => key !== 'ID' && key !== 'Pos');
      const totalIndex = allKeys.indexOf('Total');
      if (totalIndex > -1) {
         allKeys.splice(totalIndex, 1);
         allKeys.push('Total');
      }

      // Create header row
      const headerRow = $("<div>").addClass("row");
      allKeys.forEach(key => {
         headerRow.append($("<div>").addClass("cell row header blue").attr("data-title", "Row").text(key));
      });
      table.append(headerRow);

      // Create data rows for each driver
      classData.forEach(driver => {
         const row = $("<div>").addClass("row");
         allKeys.forEach(key => {
            let value = driver[key] !== undefined ? driver[key] : '';
            // Replace 0 with '-'
            if (value === 0 || value === '0') {
               value = '-';
            }
            row.append($("<div>").addClass("cell").attr("data-title", key).text(value));
         });
         table.append(row);
      });

      section.append(table);
      container.append(section);
   });
}

$(function () {
   getLeague();
});
