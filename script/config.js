var leagueid = "";

// Get league ID from cookie
function getLeagueID() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'leagueid') {
            leagueid = value;
            return value;
        }
    }
    return null;
}

// Load configuration data
function loadConfig() {
    console.log("Loading configuration for league:", leagueid);
    fetch('../' + leagueid + '/configjson')
        .then(res => res.json())
        .then(data => {
            console.log("Config data received:", data);
            populateForm(data);
        })
        .catch(error => {
            console.error("Error loading config:", error);
            showMessage("Error loading configuration", "error");
        });
}

// Populate form with config data
function populateForm(config) {
    document.getElementById('apply_drop_scores').value = config.apply_drop_scores || "FALSE";

    // Handle no_drop_scores_rounds array
    if (Array.isArray(config.no_drop_scores_rounds)) {
        document.getElementById('no_drop_scores_rounds').value = config.no_drop_scores_rounds.join(',');
    } else {
        document.getElementById('no_drop_scores_rounds').value = '';
    }

    document.getElementById('class_to_add_new_drivers_to').value = config.class_to_add_new_drivers_to || -1;
    document.getElementById('protest_open_after_hrs').value = config.protest_open_after_hrs || 0;
    document.getElementById('protest_open_for_hrs').value = config.protest_open_for_hrs || 0;
    document.getElementById('display_overall_table').value = config.display_overall_table || 0;
}

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

// Save configuration
function saveConfig(event) {
    event.preventDefault();

    // Parse no_drop_scores_rounds from comma-separated string to array
    const noDropScoresInput = document.getElementById('no_drop_scores_rounds').value.trim();
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

    console.log("Saving config:", configData);

   // fetch('../admin/' + leagueid + '/updateconfig', {
    fetch('./updateconfig', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
    })
    .then(res => res.json())
    .then(data => {
        console.log("Save response:", data);
        if (data.confirmation) {
            showMessage(data.confirmation, "success");
        } else if (data.error) {
            showMessage("Error: " + data.error, "error");
        }
    })
    .catch(error => {
        console.error("Error saving config:", error);
        showMessage("Error saving configuration", "error");
    });
}

// Initialize on page load
$(document).ready(function () {
    getLeagueID();
    loadConfig();

    // Attach form submit handler
    document.getElementById('config-form').addEventListener('submit', saveConfig);
});
