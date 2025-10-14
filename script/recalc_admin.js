var leagueid = "";

// Show status message
function showMessage(message, type) {
    const statusDiv = document.getElementById('status-message');
    statusDiv.textContent = message;
    statusDiv.className = type;
    statusDiv.style.display = 'block';

    // Hide message after 5 seconds
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

// Recalculate league data
function recalculateLeagueData(event) {
    event.preventDefault();

    // Parse no_drop_scores_rounds from comma-separated string to array
  /*  const noDropScoresInput = document.getElementById('no_drop_scores_rounds').value.trim();
    let noDropScoresArray = [];
    if (noDropScoresInput) {
        noDropScoresArray = noDropScoresInput.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
    }

    const configData = {
        apply_drop_scores: document.getElementById('apply_drop_scores').value,
        no_drop_scores_rounds: noDropScoresArray,
        class_to_add_new_drivers_to: parseInt(document.getElementById('class_to_add_new_drivers_to').value),
        protest_open_after_hrs: parseInt(document.getElementById('protest_open_after_hrs').value),
        protest_open_for_hrs: parseInt(document.getElementById('protest_open_for_hrs').value),
        display_overall_table: parseInt(document.getElementById('display_overall_table').value)
    };
    */
   

    const recalculationData = {
        post_to_discord: document.getElementById('post_to_discord').value,
        reason_for_recalculation: document.getElementById('reason_for_recalculation').value.trim(),
       // user : user
    };


    console.log("recalculating:", recalculationData);

   // fetch('../admin/' + leagueid + '/updateconfig', {
    fetch('./recalculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(recalculationData)
    })
    .then(res => res.json())
    .then(data => {
        console.log("Recalculation response:", data);
        if (data.confirmation) {
            showMessage(data.confirmation, "success");
        } else if (data.error) {
            showMessage("Error: " + data.error, "error");
        }
    })
    .catch(error => {
        console.error("Error Recalculating:", error);
        showMessage("Error Recalculating", "error");
    });
}

// Initialize on page load
$(document).ready(function () {

    // Attach form submit handler
    document.getElementById('recalculation-form').addEventListener('submit', recalculateLeagueData);
});
