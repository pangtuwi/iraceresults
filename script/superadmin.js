var leagues = [];
var currentLeague = null;
var pointsData = [];
var scoringData = [];
var roundsData = [];
var classesData = [];

// Section navigation
function showSection(sectionName) {
   $(".section").removeClass("active");
   $("#section-" + sectionName).addClass("active");

   $(".menuitem").removeClass("active");
   $("#btn-" + sectionName).parent().addClass("active");
}

// Modal functions
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

   $("#confirm-yes-btn").off("click").on("click", function() {
      $("#confirm-modal-overlay").removeClass("show");
      onConfirm();
   });

   $("#confirm-no-btn").off("click").on("click", function() {
      $("#confirm-modal-overlay").removeClass("show");
   });
}

// =========================
// LEAGUES SECTION
// =========================

function loadLeagues() {
   fetch('/superadmin/leagues')
      .then(res => res.json())
      .then(data => {
         console.log("Leagues data received:", data);
         leagues = data;
         displayLeagues();
         populateLeagueSelects();
      })
      .catch(error => {
         console.error("Error fetching leagues:", error);
         showModal("Error", "Failed to load leagues", "❌");
      });
}

function displayLeagues() {
   const container = $("#leagues_table");
   container.find('.row').not(':first').remove();

   if (leagues.length === 0) {
      const row = $("<div>").addClass("row");
      row.append($("<div>").addClass("cell").attr("colspan", "3").text("No leagues found"));
      container.append(row);
      return;
   }

   leagues.forEach(league => {
      const row = $("<div>").addClass("row");

      row.append($("<div>").addClass("cell").text(league.leagueID));
      row.append($("<div>").addClass("cell").text(league.leagueName));

      const actionsCell = $("<div>").addClass("cell");
      const deleteBtn = $("<div>")
         .css("cursor", "pointer")
         .html("<b>Delete</b>")
         .on("click", function() {
            showConfirmModal(
               "Delete League",
               `Are you sure you want to delete league ${league.leagueID}?`,
               function() { deleteLeague(league.leagueID); }
            );
         });
      actionsCell.append(deleteBtn);
      row.append(actionsCell);

      container.append(row);
   });
}

function showLeagueModal() {
   $("#league_modal_title").text("Add New League");
   $("#new_league_id").val("");
   $("#new_league_name").val("");
   $("#league_modal_overlay").addClass("show");
}

function hideLeagueModal() {
   $("#league_modal_overlay").removeClass("show");
}

function createLeague() {
   const leagueID = $("#new_league_id").val().trim().toUpperCase();
   const leagueName = $("#new_league_name").val().trim();

   if (!leagueID || !leagueName) {
      showModal("Error", "Please provide both League ID and League Name", "❌");
      return;
   }

   if (!/^[A-Z0-9]+$/.test(leagueID)) {
      showModal("Error", "League ID must contain only uppercase letters and numbers", "❌");
      return;
   }

   fetch('/superadmin/createleague', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueID, leagueName })
   })
   .then(res => res.json())
   .then(data => {
      if (data.confirmation) {
         showModal("Success", "League created successfully", "✅");
         hideLeagueModal();
         loadLeagues();
      } else if (data.error) {
         showModal("Error", data.error, "❌");
      }
   })
   .catch(error => {
      console.error("Error creating league:", error);
      showModal("Error", "Failed to create league", "❌");
   });
}

function deleteLeague(leagueID) {
   fetch('/superadmin/deleteleague', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueID })
   })
   .then(res => res.json())
   .then(data => {
      if (data.confirmation) {
         showModal("Success", "League deleted successfully", "✅");
         loadLeagues();
      } else if (data.error) {
         showModal("Error", data.error, "❌");
      }
   })
   .catch(error => {
      console.error("Error deleting league:", error);
      showModal("Error", "Failed to delete league", "❌");
   });
}

// =========================
// POINTS SECTION
// =========================

function populateLeagueSelects() {
   const selects = ["#league_select_points", "#league_select_scoring", "#league_select_rounds", "#league_select_classes"];

   selects.forEach(selectId => {
      const select = $(selectId);
      select.empty();
      select.append($("<option>").val("").text("-- Select League --"));

      leagues.forEach(league => {
         select.append($("<option>")
            .val(league.leagueID)
            .text(`${league.leagueID} - ${league.leagueName}`));
      });
   });
}

function loadPoints(leagueID) {
   currentLeague = leagueID;
   fetch(`/superadmin/points/${leagueID}`)
      .then(res => res.json())
      .then(data => {
         pointsData = data;
         displayPoints();
      })
      .catch(error => {
         console.error("Error fetching points:", error);
         showModal("Error", "Failed to load points data", "❌");
      });
}

function displayPoints() {
   const container = $("#points_table");
   container.find('.row').not(':first').remove();

   if (pointsData.length === 0) {
      const row = $("<div>").addClass("row");
      row.append($("<div>").addClass("cell").attr("colspan", "6").text("No points systems defined"));
      container.append(row);
      return;
   }

   pointsData.forEach((point, index) => {
      const row = $("<div>").addClass("row");

      row.append($("<div>").addClass("cell").text(index + 1));
      row.append($("<div>").addClass("cell").text(point.scoring_category));
      row.append($("<div>").addClass("cell").text(point.scoring_type));
      row.append($("<div>").addClass("cell").text(point.min_lap_ratio));
      row.append($("<div>").addClass("cell").text(JSON.stringify(point.position_scores)));

      const actionsCell = $("<div>").addClass("cell");
      const editBtn = $("<span>")
         .css({"cursor": "pointer", "margin-right": "10px"})
         .html("<b>Edit</b>")
         .on("click", function() { editPoints(index); });
      const deleteBtn = $("<span>")
         .css("cursor", "pointer")
         .html("<b>Delete</b>")
         .on("click", function() {
            showConfirmModal(
               "Delete Points System",
               `Are you sure you want to delete ${point.scoring_category}?`,
               function() { deletePoints(index); }
            );
         });
      actionsCell.append(editBtn).append(deleteBtn);
      row.append(actionsCell);

      container.append(row);
   });
}

var editingPointsIndex = -1;

function showPointsModal(title, point) {
   $("#points_modal_title").text(title);
   $("#points_scoring_category").val(point ? point.scoring_category : "");
   $("#points_scoring_type").val(point ? point.scoring_type : "");
   $("#points_min_lap_ratio").val(point ? point.min_lap_ratio : "");
   $("#points_position_scores").val(point ? point.position_scores.join(",") : "");
   $("#points_modal_overlay").addClass("show");
}

function hidePointsModal() {
   $("#points_modal_overlay").removeClass("show");
   editingPointsIndex = -1;
}

function editPoints(index) {
   editingPointsIndex = index;
   showPointsModal("Edit Points System", pointsData[index]);
}

function deletePoints(index) {
   pointsData.splice(index, 1);
   savePoints();
}

function addPoints() {
   editingPointsIndex = -1;
   showPointsModal("Add Points System", null);
}

function savePointsFromModal() {
   const scoringCategory = $("#points_scoring_category").val().trim();
   const scoringType = $("#points_scoring_type").val().trim();
   const minLapRatio = parseFloat($("#points_min_lap_ratio").val());
   const positionScoresStr = $("#points_position_scores").val().trim();

   if (!scoringCategory) {
      showModal("Error", "Please enter a scoring category", "❌");
      return;
   }

   if (!scoringType) {
      showModal("Error", "Please enter a scoring type", "❌");
      return;
   }

   if (isNaN(minLapRatio)) {
      showModal("Error", "Please enter a valid min lap ratio", "❌");
      return;
   }

   if (!positionScoresStr) {
      showModal("Error", "Please enter position scores", "❌");
      return;
   }

   const pointData = {
      scoring_category: scoringCategory,
      scoring_type: scoringType,
      min_lap_ratio: minLapRatio,
      position_scores: positionScoresStr.split(",").map(s => parseInt(s.trim()))
   };

   if (editingPointsIndex >= 0) {
      pointsData[editingPointsIndex] = pointData;
   } else {
      pointsData.push(pointData);
   }

   hidePointsModal();
   savePoints();
}

function savePoints() {
   fetch(`/superadmin/points/${currentLeague}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pointsData)
   })
   .then(res => res.json())
   .then(data => {
      if (data.confirmation) {
         showModal("Success", "Points saved successfully", "✅");
         displayPoints();
      } else if (data.error) {
         showModal("Error", data.error, "❌");
      }
   })
   .catch(error => {
      console.error("Error saving points:", error);
      showModal("Error", "Failed to save points", "❌");
   });
}

// =========================
// SCORING SECTION
// =========================

function loadScoring(leagueID) {
   currentLeague = leagueID;

   // Load both points and scoring data
   Promise.all([
      fetch(`/superadmin/points/${leagueID}`).then(res => res.json()),
      fetch(`/superadmin/scoring/${leagueID}`).then(res => res.json())
   ])
   .then(([points, scoring]) => {
      pointsData = points;
      scoringData = scoring;
      displayScoring();
   })
   .catch(error => {
      console.error("Error fetching scoring:", error);
      showModal("Error", "Failed to load scoring data", "❌");
   });
}

function displayScoring() {
   const container = $("#scoring_table");
   container.find('.row').not(':first').remove();

   if (scoringData.length === 0) {
      const row = $("<div>").addClass("row");
      row.append($("<div>").addClass("cell").attr("colspan", "4").text("No scoring types defined"));
      container.append(row);
      return;
   }

   scoringData.forEach((scoring, index) => {
      const row = $("<div>").addClass("row");

      row.append($("<div>").addClass("cell").text(index + 1));
      row.append($("<div>").addClass("cell").text(scoring.score_type));

      const eventsText = scoring.scored_events.map(e => e.score_event).join(", ");
      row.append($("<div>").addClass("cell").text(eventsText));

      const actionsCell = $("<div>").addClass("cell");
      const editBtn = $("<span>")
         .css({"cursor": "pointer", "margin-right": "10px"})
         .html("<b>Edit</b>")
         .on("click", function() { editScoring(index); });
      const deleteBtn = $("<span>")
         .css("cursor", "pointer")
         .html("<b>Delete</b>")
         .on("click", function() {
            showConfirmModal(
               "Delete Score Type",
               `Are you sure you want to delete ${scoring.score_type}?`,
               function() { deleteScoring(index); }
            );
         });
      actionsCell.append(editBtn).append(deleteBtn);
      row.append(actionsCell);

      container.append(row);
   });
}

var editingScoringIndex = -1;
var currentScoredEvents = [];
var editingEventIndex = -1;

function showScoringModal(title, scoring) {
   $("#scoring_modal_title").text(title);
   $("#scoring_score_type").val(scoring ? scoring.score_type : "");
   currentScoredEvents = scoring ? JSON.parse(JSON.stringify(scoring.scored_events)) : [];
   displayScoredEvents();
   populateEventScoringSystemSelect();
   $("#scoring_modal_overlay").addClass("show");
}

function hideScoringModal() {
   $("#scoring_modal_overlay").removeClass("show");
   editingScoringIndex = -1;
   currentScoredEvents = [];
}

function displayScoredEvents() {
   const container = $("#score_events_list");
   container.empty();

   if (currentScoredEvents.length === 0) {
      container.append($("<div>").text("No events defined").css("color", "#999"));
      return;
   }

   currentScoredEvents.forEach((event, index) => {
    /*  const pointsType = pointsData[event.scoring_system] ?
         `${event.scoring_system}: ${pointsData[event.scoring_system].scoring_category}` :
         `Index ${event.scoring_system}`;
*/
      const eventItem = $("<div>").addClass("event-item");
      const eventInfo = $("<div>").html(
    //     `<b>${event.score_event}</b> - ${event.simsession_name} - Points: ${pointsType}`
         `<b>${event.score_event}</b>`
      );

      const controls = $("<div>").addClass("event-controls");
      const upBtn = $("<button>").addClass("event-btn").text("↑")
         .on("click", function() { moveEvent(index, -1); });
      const downBtn = $("<button>").addClass("event-btn").text("↓")
         .on("click", function() { moveEvent(index, 1); });
      const editBtn = $("<button>").addClass("event-btn").text("Edit")
         .on("click", function() { editEvent(index); });
      const deleteBtn = $("<button>").addClass("event-btn delete").text("Delete")
         .on("click", function() { deleteEvent(index); });

      if (index === 0) upBtn.prop("disabled", true);
      if (index === currentScoredEvents.length - 1) downBtn.prop("disabled", true);

      controls.append(upBtn).append(downBtn).append(editBtn).append(deleteBtn);
      eventItem.append(eventInfo).append(controls);
      container.append(eventItem);
   });
}

function populateEventScoringSystemSelect() {
   const select = $("#event_scoring_system");
   select.empty();

   pointsData.forEach((point, index) => {
      select.append($("<option>")
         .val(index)
         .text(`${index}: ${point.scoring_category} (${point.scoring_type})`));
   });
}

function moveEvent(index, direction) {
   const newIndex = index + direction;
   if (newIndex < 0 || newIndex >= currentScoredEvents.length) return;

   const temp = currentScoredEvents[index];
   currentScoredEvents[index] = currentScoredEvents[newIndex];
   currentScoredEvents[newIndex] = temp;
   displayScoredEvents();
}

function showEventModal(title, event) {
   $("#event_modal_title").text(title);
   $("#event_score_event").val(event ? event.score_event : "");
   $("#event_simsession_name").val(event ? event.simsession_name : "RACE");
   populateEventScoringSystemSelect();
   $("#event_scoring_system").val(event ? event.scoring_system : 0);
   $("#event_modal_overlay").addClass("show");
}

function hideEventModal() {
   $("#event_modal_overlay").removeClass("show");
   editingEventIndex = -1;
}

function addEvent() {
   editingEventIndex = -1;
   showEventModal("Add Event", null);
}

function editEvent(index) {
   editingEventIndex = index;
   showEventModal("Edit Event", currentScoredEvents[index]);
}

function deleteEvent(index) {
   currentScoredEvents.splice(index, 1);
   displayScoredEvents();
}

function saveEventFromModal() {
   const scoreEvent = $("#event_score_event").val().trim();
   const simsessionName = $("#event_simsession_name").val();
   const scoringSystem = parseInt($("#event_scoring_system").val());

   if (!scoreEvent) {
      showModal("Error", "Please enter an event name", "❌");
      return;
   }

   if (isNaN(scoringSystem)) {
      showModal("Error", "Please select a valid points type", "❌");
      return;
   }

   const eventData = {
      score_event: scoreEvent,
      simsession_name: simsessionName,
      scoring_system: scoringSystem
   };

   if (editingEventIndex >= 0) {
      currentScoredEvents[editingEventIndex] = eventData;
   } else {
      currentScoredEvents.push(eventData);
   }

   hideEventModal();
   displayScoredEvents();
}

function editScoring(index) {
   editingScoringIndex = index;
   showScoringModal("Edit Scoring Type", scoringData[index]);
}

function deleteScoring(index) {
   scoringData.splice(index, 1);
   saveScoring();
}

function addScoring() {
   editingScoringIndex = -1;
   showScoringModal("Add Scoring Type", null);
}

function saveScoringFromModal() {
   const scoreType = $("#scoring_score_type").val().trim();

   if (!scoreType) {
      showModal("Error", "Please enter a score type", "❌");
      return;
   }

   if (currentScoredEvents.length === 0) {
      showModal("Error", "Please add at least one score event", "❌");
      return;
   }

   const scoringItem = {
      score_type: scoreType,
      scored_events: currentScoredEvents
   };

   if (editingScoringIndex >= 0) {
      scoringData[editingScoringIndex] = scoringItem;
   } else {
      scoringData.push(scoringItem);
   }

   hideScoringModal();
   saveScoring();
}

function saveScoring() {
   fetch(`/superadmin/scoring/${currentLeague}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scoringData)
   })
   .then(res => res.json())
   .then(data => {
      if (data.confirmation) {
         showModal("Success", "Scoring saved successfully", "✅");
         displayScoring();
      } else if (data.error) {
         showModal("Error", data.error, "❌");
      }
   })
   .catch(error => {
      console.error("Error saving scoring:", error);
      showModal("Error", "Failed to save scoring", "❌");
   });
}

// =========================
// ROUNDS SECTION
// =========================

function loadRounds(leagueID) {
   currentLeague = leagueID;
   fetch(`/superadmin/rounds/${leagueID}`)
      .then(res => res.json())
      .then(data => {
         roundsData = data;
         displayRounds();
      })
      .catch(error => {
         console.error("Error fetching rounds:", error);
         showModal("Error", "Failed to load rounds data", "❌");
      });
}

function displayRounds() {
   const container = $("#rounds_table");
   container.find('.row').not(':first').remove();

   if (roundsData.length === 0) {
      const row = $("<div>").addClass("row");
      row.append($("<div>").addClass("cell").attr("colspan", "6").text("No rounds defined"));
      container.append(row);
      return;
   }

   roundsData.forEach((round, index) => {
      const row = $("<div>").addClass("row");

      row.append($("<div>").addClass("cell").text(round.round_no));
      row.append($("<div>").addClass("cell").text(round.track_name));
      row.append($("<div>").addClass("cell").text(new Date(round.start_time).toLocaleString()));
      row.append($("<div>").addClass("cell").text(JSON.stringify(round.subsession_ids)));
      row.append($("<div>").addClass("cell").text(JSON.stringify(round.score_types)));

      const actionsCell = $("<div>").addClass("cell");
      const editBtn = $("<span>")
         .css({"cursor": "pointer", "margin-right": "10px"})
         .html("<b>Edit</b>")
         .on("click", function() { editRound(index); });
      const deleteBtn = $("<span>")
         .css("cursor", "pointer")
         .html("<b>Delete</b>")
         .on("click", function() {
            showConfirmModal(
               "Delete Round",
               `Are you sure you want to delete round ${round.round_no}?`,
               function() { deleteRound(index); }
            );
         });
      actionsCell.append(editBtn).append(deleteBtn);
      row.append(actionsCell);

      container.append(row);
   });
}

var editingRoundIndex = -1;

function showRoundModal(title, round) {
   $("#round_modal_title").text(title);
   $("#round_number").val(round ? round.round_no : "");
   $("#round_track_name").val(round ? round.track_name : "");
   $("#round_start_time").val(round ? round.start_time : "");
   $("#round_subsession_ids").val(round ? round.subsession_ids.join(",") : "0");
   $("#round_score_types").val(round ? round.score_types.join(",") : "0");
   $("#round_modal_overlay").addClass("show");
}

function hideRoundModal() {
   $("#round_modal_overlay").removeClass("show");
   editingRoundIndex = -1;
}

function editRound(index) {
   editingRoundIndex = index;
   showRoundModal("Edit Round", roundsData[index]);
}

function deleteRound(index) {
   roundsData.splice(index, 1);
   saveRounds();
}

function addRound() {
   editingRoundIndex = -1;
   showRoundModal("Add Round", null);
}

function saveRoundFromModal() {
   const roundNo = parseInt($("#round_number").val());
   const trackName = $("#round_track_name").val().trim();
   const startTime = $("#round_start_time").val().trim();
   const subsessionIdsStr = $("#round_subsession_ids").val().trim();
   const scoreTypesStr = $("#round_score_types").val().trim();

   if (isNaN(roundNo)) {
      showModal("Error", "Please enter a valid round number", "❌");
      return;
   }

   if (!trackName) {
      showModal("Error", "Please enter a track name", "❌");
      return;
   }

   if (!startTime) {
      showModal("Error", "Please enter a start time", "❌");
      return;
   }

   const roundData = {
      round_no: roundNo,
      track_name: trackName,
      start_time: startTime,
      subsession_ids: subsessionIdsStr.split(",").map(s => parseInt(s.trim())),
      score_types: scoreTypesStr.split(",").map(s => parseInt(s.trim()))
   };

   if (editingRoundIndex >= 0) {
      roundsData[editingRoundIndex] = roundData;
   } else {
      roundsData.push(roundData);
   }

   hideRoundModal();
   saveRounds();
}

function saveRounds() {
   fetch(`/superadmin/rounds/${currentLeague}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roundsData)
   })
   .then(res => res.json())
   .then(data => {
      if (data.confirmation) {
         showModal("Success", "Rounds saved successfully", "✅");
         displayRounds();
      } else if (data.error) {
         showModal("Error", data.error, "❌");
      }
   })
   .catch(error => {
      console.error("Error saving rounds:", error);
      showModal("Error", "Failed to save rounds", "❌");
   });
}

// =========================
// CLASSES SECTION
// =========================

function loadClasses(leagueID) {
   currentLeague = leagueID;
   fetch(`/superadmin/classes/${leagueID}`)
      .then(res => res.json())
      .then(data => {
         classesData = data;
         displayClasses();
      })
      .catch(error => {
         console.error("Error fetching classes:", error);
         showModal("Error", "Failed to load classes data", "❌");
      });
}

function displayClasses() {
   const container = $("#classes_table");
   container.find('.row').not(':first').remove();

   if (classesData.length === 0) {
      const row = $("<div>").addClass("row");
      row.append($("<div>").addClass("cell").attr("colspan", "5").text("No classes defined"));
      container.append(row);
      return;
   }

   classesData.forEach((cls, index) => {
      const row = $("<div>").addClass("row");

      row.append($("<div>").addClass("cell").text(cls.classnumber));
      row.append($("<div>").addClass("cell").text(cls.classname));
      row.append($("<div>").addClass("cell").text(cls.position_score_by));
      row.append($("<div>").addClass("cell").text(cls.display_in_tables ? "Yes" : "No"));

      const actionsCell = $("<div>").addClass("cell");
      const editBtn = $("<span>")
         .css({"cursor": "pointer", "margin-right": "10px"})
         .html("<b>Edit</b>")
         .on("click", function() { editClass(index); });
      const deleteBtn = $("<span>")
         .css("cursor", "pointer")
         .html("<b>Delete</b>")
         .on("click", function() {
            showConfirmModal(
               "Delete Class",
               `Are you sure you want to delete class ${cls.classname}?`,
               function() { deleteClass(index); }
            );
         });
      actionsCell.append(editBtn).append(deleteBtn);
      row.append(actionsCell);

      container.append(row);
   });
}

var editingClassIndex = -1;

function showClassModal(title, cls) {
   $("#class_modal_title").text(title);
   $("#class_number").val(cls ? cls.classnumber : "");
   $("#class_name").val(cls ? cls.classname : "");
   $("#position_score_by").val(cls ? cls.position_score_by : "class");
   $("#display_in_tables").prop("checked", cls ? cls.display_in_tables === 1 : true);
   $("#class_modal_overlay").addClass("show");
}

function hideClassModal() {
   $("#class_modal_overlay").removeClass("show");
   editingClassIndex = -1;
}

function editClass(index) {
   editingClassIndex = index;
   showClassModal("Edit Class", classesData[index]);
}

function deleteClass(index) {
   classesData.splice(index, 1);
   saveClasses();
}

function addClass() {
   editingClassIndex = -1;
   showClassModal("Add New Class", null);
}

function saveClassFromModal() {
   const classNumber = parseInt($("#class_number").val());
   const className = $("#class_name").val().trim();
   const positionScoreBy = $("#position_score_by").val();
   const displayInTables = $("#display_in_tables").is(":checked") ? 1 : 0;

   if (isNaN(classNumber)) {
      showModal("Error", "Please enter a valid class number", "❌");
      return;
   }

   if (!className) {
      showModal("Error", "Please enter a class name", "❌");
      return;
   }

   const classData = {
      classnumber: classNumber,
      classname: className,
      position_score_by: positionScoreBy,
      display_in_tables: displayInTables
   };

   if (editingClassIndex >= 0) {
      // Editing existing class
      classesData[editingClassIndex] = classData;
   } else {
      // Adding new class
      classesData.push(classData);
   }

   hideClassModal();
   saveClasses();
}

function saveClasses() {
   fetch(`/superadmin/classes/${currentLeague}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classesData)
   })
   .then(res => res.json())
   .then(data => {
      if (data.confirmation) {
         showModal("Success", "Classes saved successfully", "✅");
         displayClasses();
      } else if (data.error) {
         showModal("Error", data.error, "❌");
      }
   })
   .catch(error => {
      console.error("Error saving classes:", error);
      showModal("Error", "Failed to save classes", "❌");
   });
}

// =========================
// TRACKS SECTION
// =========================

var tracksData = [];
var editingTrackIndex = -1;
var trackMapFile = null;

function loadTracks() {
   fetch('/superadmin/tracks')
      .then(res => res.json())
      .then(data => {
         tracksData = data;
         displayTracks();
      })
      .catch(error => {
         console.error("Error fetching tracks:", error);
         showModal("Error", "Failed to load tracks data", "❌");
      });
}

function displayTracks() {
   const container = $("#tracks_table");
   container.find('.row').not(':first').remove();

   if (tracksData.length === 0) {
      const row = $("<div>").addClass("row");
      row.append($("<div>").addClass("cell").attr("colspan", "3").text("No tracks defined"));
      container.append(row);
      return;
   }

   tracksData.forEach((track, index) => {
      const row = $("<div>").addClass("row");

      row.append($("<div>").addClass("cell").text(track.full_name));
      row.append($("<div>").addClass("cell").text(track.short_name));

      const actionsCell = $("<div>").addClass("cell");
      const editBtn = $("<span>")
         .css({"cursor": "pointer", "margin-right": "10px"})
         .html("<b>Edit</b>")
         .on("click", function() { editTrack(index); });
      const deleteBtn = $("<span>")
         .css("cursor", "pointer")
         .html("<b>Delete</b>")
         .on("click", function() {
            showConfirmModal(
               "Delete Track",
               `Are you sure you want to delete ${track.full_name}?`,
               function() { deleteTrack(index); }
            );
         });
      actionsCell.append(editBtn).append(deleteBtn);
      row.append(actionsCell);

      container.append(row);
   });
}

function showTrackModal(title, track) {
   $("#track_modal_title").text(title);
   $("#track_full_name").val(track ? track.full_name : "");
   $("#track_short_name").val(track ? track.short_name : "");
   $("#track_map_upload").val("");
   trackMapFile = null;

   // Load and display track map preview
   if (track && track.short_name) {
      const mapPath = `/trackmaps/${track.short_name.toLowerCase()}.png`;
      // Try to load the track map, fallback to nomap.png if not found
      const img = new Image();
      img.onload = function() {
         $("#track_map_preview").attr("src", mapPath);
      };
      img.onerror = function() {
         $("#track_map_preview").attr("src", "/trackmaps/nomap.png");
      };
      img.src = mapPath;
   } else {
      $("#track_map_preview").attr("src", "/trackmaps/nomap.png");
   }

   $("#track_modal_overlay").addClass("show");
}

function hideTrackModal() {
   $("#track_modal_overlay").removeClass("show");
   editingTrackIndex = -1;
   trackMapFile = null;
}

function editTrack(index) {
   editingTrackIndex = index;
   showTrackModal("Edit Track", tracksData[index]);
}

function deleteTrack(index) {
   tracksData.splice(index, 1);
   saveTracks();
}

function addTrack() {
   editingTrackIndex = -1;
   showTrackModal("Add New Track", null);
}

function saveTrackFromModal() {
   const fullName = $("#track_full_name").val().trim();
   const shortName = $("#track_short_name").val().trim();

   if (!fullName) {
      showModal("Error", "Please enter a full track name", "❌");
      return;
   }

   if (!shortName) {
      showModal("Error", "Please enter a short name", "❌");
   return;
   }

   const trackData = {
      full_name: fullName,
      short_name: shortName
   };

   if (editingTrackIndex >= 0) {
      tracksData[editingTrackIndex] = trackData;
   } else {
      tracksData.push(trackData);
   }

   // Save tracks first, then upload map if provided
   saveTracks()
      .then(() => {
         if (trackMapFile) {
            uploadTrackMap(shortName, trackMapFile);
         } else {
            showModal("Success", "Track saved successfully", "✅");
            hideTrackModal();
         }
      })
      .catch(error => {
         console.error("Error in saveTrackFromModal:", error);
         // Error already shown by saveTracks()
      });
}

function saveTracks() {
   return fetch('/superadmin/tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tracksData)
   })
   .then(res => res.json())
   .then(data => {
      if (data.confirmation) {
         displayTracks();
         return Promise.resolve();
      } else if (data.error) {
         showModal("Error", data.error, "❌");
         return Promise.reject(new Error(data.error));
      }
   })
   .catch(error => {
      console.error("Error saving tracks:", error);
      showModal("Error", "Failed to save tracks", "❌");
      return Promise.reject(error);
   });
}

function uploadTrackMap(shortName, file) {
   const reader = new FileReader();
   reader.onload = function(e) {
      const imageData = e.target.result;

      fetch('/superadmin/uploadtrackmap', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ shortName, imageData })
      })
      .then(res => res.json())
      .then(data => {
         if (data.confirmation) {
            showModal("Success", "Track map uploaded successfully", "✅");
            hideTrackModal();
         } else if (data.error) {
            showModal("Error", data.error, "❌");
         }
      })
      .catch(error => {
         console.error("Error uploading track map:", error);
         showModal("Error", "Failed to upload track map", "❌");
      });
   };
   reader.readAsDataURL(file);
}

function validateTrackMaps() {
   fetch('/superadmin/validate-trackmaps')
      .then(res => res.json())
      .then(data => {
         showValidationModal(data);
      })
      .catch(error => {
         console.error("Error validating track maps:", error);
         showModal("Error", "Failed to validate track maps", "❌");
      });
}

function showValidationModal(data) {
   const missingTracksDiv = $("#validation_missing_tracks");
   const missingFilesDiv = $("#validation_missing_files");

   // Populate missing tracks
   missingTracksDiv.empty();
   if (data.missingFromTracksList && data.missingFromTracksList.length > 0) {
      data.missingFromTracksList.forEach(item => {
         const trackDiv = $("<div>").css({"margin-bottom": "10px", "padding": "5px", "background": "#f0f0f0", "border": "1px solid #ccc"});
         trackDiv.append($("<div>").html(`<b>Track:</b> ${item.trackName}`));
         trackDiv.append($("<div>").html(`<b>Used by leagues:</b> ${item.usedByLeagues.join(", ")}`));
         missingTracksDiv.append(trackDiv);
      });
   } else {
      missingTracksDiv.append($("<div>").text("All tracks used in rounds are registered in the tracks list.").css("color", "#666"));
   }

   // Populate missing files
   missingFilesDiv.empty();
   if (data.missingTrackMapFiles && data.missingTrackMapFiles.length > 0) {
      data.missingTrackMapFiles.forEach(item => {
         const fileDiv = $("<div>").css({"margin-bottom": "10px", "padding": "5px", "background": "#f0f0f0", "border": "1px solid #ccc"});
         fileDiv.append($("<div>").html(`<b>Track:</b> ${item.fullName}`));
         fileDiv.append($("<div>").html(`<b>Short Name:</b> ${item.shortName}`));
         missingFilesDiv.append(fileDiv);
      });
   } else {
      missingFilesDiv.append($("<div>").text("All registered tracks have corresponding PNG files.").css("color", "#666"));
   }

   $("#validation_modal_overlay").addClass("show");
}

function hideValidationModal() {
   $("#validation_modal_overlay").removeClass("show");
}

// =========================
// INITIALIZATION
// =========================

$(function () {
   // Load user info
   fetch('/auth/status')
      .then(res => res.json())
      .then(data => {
         if (data.authenticated) {
            $("#user-name").text(data.user.displayName);
         }
      });

   loadLeagues();

   // Section navigation
   $("#btn-leagues").on("click", function() { showSection("leagues"); });
   $("#btn-points").on("click", function() { showSection("points"); });
   $("#btn-scoring").on("click", function() { showSection("scoring"); });
   $("#btn-rounds").on("click", function() { showSection("rounds"); });
   $("#btn-classes").on("click", function() { showSection("classes"); });
   $("#btn-tracks").on("click", function() { showSection("tracks"); });

   // League actions
   $("#add_league_btn").on("click", showLeagueModal);
   $("#save_league_btn").on("click", createLeague);
   $("#cancel_league_btn").on("click", hideLeagueModal);

   // Points actions
   $("#league_select_points").on("change", function() {
      const leagueID = $(this).val();
      if (leagueID) loadPoints(leagueID);
   });
   $("#add_points_btn").on("click", addPoints);
   $("#save_points_btn").on("click", savePointsFromModal);
   $("#cancel_points_btn").on("click", hidePointsModal);

   // Scoring actions
   $("#league_select_scoring").on("change", function() {
      const leagueID = $(this).val();
      if (leagueID) loadScoring(leagueID);
   });
   $("#add_scoring_btn").on("click", addScoring);
   $("#save_scoring_btn").on("click", saveScoringFromModal);
   $("#cancel_scoring_btn").on("click", hideScoringModal);
   $("#add_event_btn").on("click", addEvent);
   $("#save_event_btn").on("click", saveEventFromModal);
   $("#cancel_event_btn").on("click", hideEventModal);

   // Rounds actions
   $("#league_select_rounds").on("change", function() {
      const leagueID = $(this).val();
      if (leagueID) loadRounds(leagueID);
   });
   $("#add_round_btn").on("click", addRound);
   $("#save_round_btn").on("click", saveRoundFromModal);
   $("#cancel_round_btn").on("click", hideRoundModal);

   // Classes actions
   $("#league_select_classes").on("change", function() {
      const leagueID = $(this).val();
      if (leagueID) loadClasses(leagueID);
   });
   $("#add_class_btn").on("click", addClass);
   $("#save_class_btn").on("click", saveClassFromModal);
   $("#cancel_class_btn").on("click", hideClassModal);

   // Tracks actions
   $("#add_track_btn").on("click", addTrack);
   $("#save_track_btn").on("click", saveTrackFromModal);
   $("#cancel_track_btn").on("click", hideTrackModal);
   $("#validate_trackmaps_link").on("click", validateTrackMaps);
   $("#validation_ok_btn").on("click", hideValidationModal);
   $("#track_map_upload").on("change", function() {
      trackMapFile = this.files[0];
      // Preview the uploaded image immediately
      if (trackMapFile) {
         const reader = new FileReader();
         reader.onload = function(e) {
            $("#track_map_preview").attr("src", e.target.result);
         };
         reader.readAsDataURL(trackMapFile);
      }
   });

   // Load tracks on page load
   loadTracks();

   // Modal close
   $("#modal-btn").on("click", hideModal);
});
