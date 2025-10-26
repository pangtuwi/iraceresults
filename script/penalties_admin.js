var penalties = [];
var penalties_filtered = [];
var currentEditingPenalty = null;

// Modal functions
function showModal(title, message, type = 'info') {
    const modal = $("#modal-overlay");
    const icon = $("#modal-icon");
    const titleEl = $("#modal-title");
    const messageEl = $("#modal-message");
    const btn = $("#modal-btn");

    titleEl.text(title);
    messageEl.text(message);

    // Set icon and button style based on type
    if (type === 'error') {
        icon.text('❌');
        btn.removeClass('error').addClass('error');
    } else if (type === 'success') {
        icon.text('✅');
        btn.removeClass('error');
    } else {
        icon.text('ℹ️');
        btn.removeClass('error');
    }

    modal.addClass('show');
}

function hideModal() {
    $("#modal-overlay").removeClass('show');
}

// Confirmation modal functions
function showConfirm(title, message, onConfirm, onCancel) {
    const confirmModal = $("#confirm-modal-overlay");
    const titleEl = $("#confirm-title");
    const messageEl = $("#confirm-message");

    titleEl.text(title);
    messageEl.text(message);

    // Remove any existing handlers to prevent multiple bindings
    $("#confirm-yes-btn").off("click");
    $("#confirm-no-btn").off("click");

    // Set up new handlers
    $("#confirm-yes-btn").on("click", function () {
        hideConfirm();
        if (onConfirm) onConfirm();
    });

    $("#confirm-no-btn").on("click", function () {
        hideConfirm();
        if (onCancel) onCancel();
    });

    confirmModal.addClass('show');
}

function hideConfirm() {
    $("#confirm-modal-overlay").removeClass('show');
}

function getDrivers() {
    console.log("fetching drivers");
    fetch('./driverlist')
        .then(res => res.json())
        .then(data => {
            console.log("driver data received :", data);
            data.sort(function (a, b) {
                return a.display_name.localeCompare(b.display_name);
            });

            const driver_select = document.getElementById('driver_select');

            //all drivers Option
            var option1 = document.createElement("option");
            option1.text = "All Drivers";
            option1.value = 0;
            driver_select.add(option1);

            //Add Drivers to list
            data.forEach(driver => {
                var option1 = document.createElement("option");
                // Use custom display name if available, otherwise use iRacing name
                option1.text = (driver.custom_display_name && driver.custom_display_name.trim())
                    ? driver.custom_display_name
                    : driver.display_name;
                option1.value = driver.cust_id;
                driver_select.add(option1);
            });

            //Text Filter for Driver names
            var driverSelect = $("#driver_select"),
                driverSearchField = $("#driver_search"),
                optionsDriver = driverSelect.find("option").clone(); // clone into memory

            // generic function to clean text
            function sanitize(string) {
                return $.trim(string).replace(/\s+/g, ' ').toLowerCase();
            }

            // prepare the options by storing the "searchable" name as data on the element
            optionsDriver.each(function () {
                var option = $(this);
                option.data("sanitized", sanitize(option.text()));
            });

            // handle keyup
            driverSearchField.on("keyup", function (event) {
                var term = sanitize($(this).val()),
                    matches;


                if (!term) {
                    driverSelect.empty().append(optionsDriver.clone());
                    // just show all options, if there's no search term
                } else {
                    // otherwise, show the options that match
                    matches = optionsDriver.filter(function () {
                        return $(this).data("sanitized").indexOf(term) != -1;
                    }).clone();
                    driverSelect.empty().append(matches);
                }

                console.log("Filtering by Driver = ", driverSelect[0].value);
                filter_cust_id = driverSelect[0].value;
                var roundSelect = $("#round_select");
                filter_round_no = roundSelect[0].value;
                filterPenalties(filter_round_no, filter_cust_id);

            });

        })
        .catch(error => console.log(error))
}//getDrivers

function getRounds() {
    console.log("fetching Rounds");
    fetch('./completedrounds')
        .then(res => res.json())
        .then(data => {
            console.log("round data received :", data);

            var roundSelect = $("#round_select");
            if (data.length > 0) {
                if (data.length == 1) {
                    $("#round_select_comment").html("only one round available for protest");
                } else {
                    $("#round_select_comment").html(data.length + " rounds available for protest");
                }

                //All rounds option
                var option = document.createElement("option");
                option.text = "All rounds";
                option.value = 0;
                roundSelect.append(option);

                //Round list
                data.forEach(round => {
                    var option = document.createElement("option");
                    option.text = round.track_name;
                    option.value = round.round_no;
                    roundSelect.append(option);
                });

            } else {
                $("#round_select_comment").html("no rounds are listed");
            }
        })
        .catch(error => console.log(error))
}//getRounds

function getPenalties() {
    console.log("fetching penalties");


    fetch('./penaltiesjson')
        .then(res => res.json())
        .then(data => {
            console.log("penalty list data received :", data);
            penalties = data;
            penalties_filtered = penalties;
            displayPenalties();

        });
}//getPenalties

function filterPenalties(filter_round_no, filter_cust_id) {

    if ((filter_round_no == 0) & (filter_cust_id == 0)) {
        penalties_filtered = penalties;
    } else if (filter_round_no == 0) {
        penalties_filtered = penalties.filter(penalty => penalty.cust_id == filter_cust_id);
    } else if (filter_cust_id == 0) {
        penalties_filtered = penalties.filter(penalty => penalty.round_no == filter_round_no);
    } else {
        penalties_filtered = penalties.filter(penalty => penalty.cust_id == filter_cust_id);
        penalties_filtered = penalties_filtered.filter(penalty => penalty.round_no == filter_round_no);
    }
    displayPenalties();
}//filterPenalties

function setFilters() {
    var roundSelect = $("#round_select");
    roundSelect.on("change", function (event) {
        console.log("Filtering by Round = ", this.value);
        filter_round_no = this.value;
        var driverSelect = $("#driver_select");
        filter_cust_id = driverSelect[0].value;
        filterPenalties(filter_round_no, filter_cust_id);
    }); //roundSelect.on change

    var driverSelect = $("#driver_select");
    driverSelect.on("change", function (event) {
        console.log("Filtering by Driver = ", this.value)
        filter_cust_id = this.value;
        var roundSelect = $("#round_select");
        filter_round_no = roundSelect[0].value;
        filterPenalties(filter_round_no, filter_cust_id);
    }); //roundSelect.on change
} //setFilters

function deletePenalty(penalty_id) {
    console.log("Deleting penalty ", penalty_id);
    const deletePenalty = {penalty_id: penalty_id };
    fetch('./deletepenalty', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(deletePenalty)
    })
        .then(res => res.json())
        .then(data => {
            console.log("Response from delete penalty :", data);
            if (data.confirmation == "ok") {
                //remove penalty from local list
                penalties = penalties.filter(penalty => penalty.penalty_id != penalty_id);
                penalties_filtered = penalties_filtered.filter(penalty => penalty.penalty_id != penalty_id);
                displayPenalties();
                showModal("Success", "Penalty deleted successfully", "success");
            } else {
                showModal("Error", "There was a problem deleting the penalty", "error");
            }
        })
        .catch(error => {
            console.log(error);
            showModal("Error", "Failed to delete penalty: " + error, "error");
        })
} //delete_penalty

function limitString(string = '', limit = 0) {
    if (string.length <= limit) {
        return string
    } else {
        return string.substring(0, limit) + "...";
    }
} //limitString

function displayPenalties() {
    var tableTopHtml = '<div class="row header">' +
        '<div class="cell row header blue" data-title="Row">Name</div>' +
        '<div class="cell row header blue" data-title="Row">Round</div>' +
        '<div class="cell row header blue" data-title="Row">Event</div>' +
        '<div class="cell row header blue" data-title="Row">Lap</div>' +
        '<div class="cell row header blue" data-title="Row">Corner</div>' +
        '<div class="cell row header blue" data-title="Row">Protested by</div>' +
        '<div class="cell row header blue" data-title="Row">Driver Statement</div>' +
        '<div class="cell row header blue" data-title="Row">Decision</div>' +
        '<div class="cell row header blue" data-title="Row">Comments</div>' +
        '<div class="cell row header blue" data-title="Row">Licence points</div>' +
        '<div class="cell row header blue" data-title="Row">Positions</div>' +
        '<div class="cell row header blue" data-title="Row">Points</div>' +
        '<div class="cell row header blue" data-title="Row">DQ</div>' +
        '<div class="cell row header blue" data-title="Row">Edit</div>' +
        '<div class="cell row header blue" data-title="Row">Delete</div>' +
        '</div>';
    var tableHTML = tableTopHtml;
    var rowcounter = 0;
    penalties_filtered.forEach(penalty => {
        var rowHTML = '<div class="row" id="' + penalty.penalty_id + '" >' +
            '<div class="cell" data-title="Row">' + penalty.display_name + '</div>' +
            '<div class="cell" data-title="Row">' + penalty.round_name + '</div>' +
            '<div class="cell" data-title="Row">' + penalty.score_event + '</div>' +
            '<div class="cell" data-title="Row">' + penalty.lap + '</div>' +
            '<div class="cell" data-title="Row">' + penalty.corner + '</div>' +
            '<div class="cell" data-title="Row">' + penalty.protesting_driver_name + '</div>' +
            '<div class="cell" data-title="Row">' + limitString(penalty.driver_statement, 100) + '</div>' +
            '<div class="cell" data-title="Row">' + penalty.stewards_decision + '</div>' +
            '<div class="cell" data-title="Row">' + limitString(penalty.stewards_comments, 100) + '</div>' +
            '<div class="cell" data-title="Row">' + penalty.licence_points + '</div>' +
            '<div class="cell" data-title="Row">' + penalty.positions + '</div>' +
            '<div class="cell" data-title="Row">' + penalty.championship_points + '</div>' +
            '<div class="cell" data-title="Row">' + penalty.disqualified + '</div>' +
            '<div class="cell" data-title="Row" style="cursor: pointer" id="edit_penalty_' + penalty.penalty_id + '"><b>Edit</b></div>' +
            '<div class="cell" data-title="Row" style="cursor: pointer" id="delete_penalty_' + penalty.penalty_id + '"><b>Delete</b></div>' +
            '</div>';
        //replace any undefined values with &nbsp;
        rowHTML = rowHTML.replace(/undefined/g, "&nbsp;");

        tableHTML = tableHTML + rowHTML;
        rowcounter += 1;
    });
    $("#penalties_displayed").html(tableHTML);

    penalties_filtered.forEach(penalty => {
        $("#edit_penalty_" + penalty.penalty_id).on("click", function () {
            console.log("Clicked Edit for Penalty " + penalty.penalty_id);
            showEditForm(penalty);
        });

        $("#delete_penalty_" + penalty.penalty_id).on("click", function () {
            console.log("Clicked Delete for Penalty " + penalty.penalty_id);
            // Ask for confirmation before deleting using modal
            showConfirm(
                "Confirm Deletion",
                "Are you sure you want to delete penalty " + penalty.penalty_id + " for " + penalty.display_name + "?",
                function() {
                    // User confirmed deletion
                    console.log("User confirmed deletion");
                    deletePenalty(penalty.penalty_id);
                },
                function() {
                    // User cancelled deletion
                    console.log("User cancelled deletion");
                }
            );
        });
    });

} //displayPenalties

function showEditForm(penalty) {
    currentEditingPenalty = penalty;

    // Populate the form fields
    $("#edit_display_name").text(penalty.display_name || '');
    $("#edit_round_name").text(penalty.round_name || '');
    $("#edit_score_event").text(penalty.score_event || '');
    $("#edit_protesting_driver_name").text(penalty.protesting_driver_name || '');

    $("#edit_lap").val(penalty.lap || '');
    $("#edit_corner").val(penalty.corner || '');
    $("#edit_driver_statement").val(penalty.driver_statement || '');
    $("#edit_stewards_decision").val(penalty.stewards_decision || '');
    $("#edit_stewards_comments").val(penalty.stewards_comments || '');
    $("#edit_time_added").val(penalty.time_added || 0);
    $("#edit_positions").val(penalty.positions || 0);
    $("#edit_licence_points").val(penalty.licence_points || 0);
    $("#edit_championship_points").val(penalty.championship_points || 0);
    $("#edit_disqualified").val(penalty.disqualified || 0);

    // Hide list view and show edit form
    $("#penalties_list_view").hide();
    $("#filter_table").parent().hide();
    $("#edit_penalty_form").show();
} //showEditForm

function hideEditForm() {
    currentEditingPenalty = null;

    // Show list view and hide edit form
    $("#edit_penalty_form").hide();
    $("#penalties_list_view").show();
    $("#filter_table").parent().show();
} //hideEditForm

function updatePenalty(updatedPenalty) {
    console.log("Updating penalty ", updatedPenalty);
    fetch('./updatepenalty', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedPenalty)
    })
        .then(res => res.json())
        .then(data => {
            console.log("Response from update penalty :", data);
            if (data.confirmation == "ok") {
                // Update the local penalty object
                const penaltyIndex = penalties.findIndex(p => p.penalty_id === updatedPenalty.penalty_id);
                if (penaltyIndex !== -1) {
                    penalties[penaltyIndex] = updatedPenalty;
                }
                const filteredIndex = penalties_filtered.findIndex(p => p.penalty_id === updatedPenalty.penalty_id);
                if (filteredIndex !== -1) {
                    penalties_filtered[filteredIndex] = updatedPenalty;
                }
                hideEditForm();
                displayPenalties();
                showModal("Success", "Penalty updated successfully", "success");
            } else {
                showModal("Error", "There was a problem updating the penalty", "error");
            }
        })
        .catch(error => {
            console.log(error);
            showModal("Error", "Error updating penalty: " + error, "error");
        });
} //updatePenalty

$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
    getDrivers();
    getRounds();
    getPenalties();
    setFilters();
    displayPenalties();

    // Cancel edit button handler
    $("#cancel_edit_btn").on("click", function () {
        hideEditForm();
    });

    // Modal close button handler
    $("#modal-btn").on("click", function () {
        hideModal();
    });

    // Close modal when clicking overlay
    $("#modal-overlay").on("click", function (e) {
        if (e.target === this) {
            hideModal();
        }
    });

    // Close confirm modal when clicking overlay
    $("#confirm-modal-overlay").on("click", function (e) {
        if (e.target === this) {
            hideConfirm();
        }
    });

    // Save penalty button handler
    $("#save_penalty_btn").on("click", function () {
        if (!currentEditingPenalty) {
            showModal("Error", "No penalty is being edited", "error");
            return;
        }

        // Gather updated penalty data
        var updatedPenalty = {
            penalty_id: currentEditingPenalty.penalty_id,
            cust_id: currentEditingPenalty.cust_id,
            display_name: currentEditingPenalty.display_name,
            round_no: currentEditingPenalty.round_no,
            round_name: currentEditingPenalty.round_name,
            score_event: currentEditingPenalty.score_event,
            session_no: currentEditingPenalty.session_no,
            protesting_driver_name: currentEditingPenalty.protesting_driver_name,
            lap: $("#edit_lap").val(),
            corner: $("#edit_corner").val(),
            driver_statement: $("#edit_driver_statement").val(),
            stewards_decision: $("#edit_stewards_decision").val(),
            stewards_comments: $("#edit_stewards_comments").val(),
            time_added: parseInt($("#edit_time_added").val()) || 0,
            positions: parseInt($("#edit_positions").val()) || 0,
            licence_points: parseInt($("#edit_licence_points").val()) || 0,
            championship_points: parseInt($("#edit_championship_points").val()) || 0,
            disqualified: parseInt($("#edit_disqualified").val()) || 0,
            timestamp: currentEditingPenalty.timestamp
        };

        updatePenalty(updatedPenalty);
    });
}); //document is ready
