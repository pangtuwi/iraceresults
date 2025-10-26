var protests = [];
var protests_filtered = [];

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
                var statusSelect = $("#status_select");
                filter_status = statusSelect[0].value;
                filterProtests(filter_round_no, filter_cust_id, filter_status);

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
                console.log("no rounds are listed");
            }
        })
        .catch(error => console.log(error))
}//getRounds

function getProtests() {
    console.log("fetching protests");

    fetch('./allprotests')
        .then(res => res.json())
        .then(data => {
            console.log("protest list data received :", data);
            protests = data;
            protests_filtered = protests;
            displayProtests();

        });
}//getProtests

function filterProtests(filter_round_no, filter_cust_id, filter_status) {
    console.log("Filtering protests - round:", filter_round_no, "driver:", filter_cust_id, "status:", filter_status);

    // Start with all protests
    protests_filtered = protests;

    // Filter by round
    if (filter_round_no != 0) {
        protests_filtered = protests_filtered.filter(protest => protest.round_no == filter_round_no);
    }

    // Filter by driver (either protesting or protested)
    if (filter_cust_id != 0) {
        protests_filtered = protests_filtered.filter(protest =>
            protest.protesting_driver_id == filter_cust_id ||
            protest.protested_driver_id == filter_cust_id
        );
    }

    // Filter by status
    if (filter_status !== "all") {
        protests_filtered = protests_filtered.filter(protest => protest.resolved == filter_status);
    }

    displayProtests();
}//filterProtests

function setFilters() {
    var roundSelect = $("#round_select");
    roundSelect.on("change", function (event) {
        console.log("Filtering by Round = ", this.value);
        filter_round_no = this.value;
        var driverSelect = $("#driver_select");
        filter_cust_id = driverSelect[0].value;
        var statusSelect = $("#status_select");
        filter_status = statusSelect[0].value;
        filterProtests(filter_round_no, filter_cust_id, filter_status);
    });

    var driverSelect = $("#driver_select");
    driverSelect.on("change", function (event) {
        console.log("Filtering by Driver = ", this.value)
        filter_cust_id = this.value;
        var roundSelect = $("#round_select");
        filter_round_no = roundSelect[0].value;
        var statusSelect = $("#status_select");
        filter_status = statusSelect[0].value;
        filterProtests(filter_round_no, filter_cust_id, filter_status);
    });

    var statusSelect = $("#status_select");
    statusSelect.on("change", function (event) {
        console.log("Filtering by Status = ", this.value)
        filter_status = this.value;
        var roundSelect = $("#round_select");
        filter_round_no = roundSelect[0].value;
        var driverSelect = $("#driver_select");
        filter_cust_id = driverSelect[0].value;
        filterProtests(filter_round_no, filter_cust_id, filter_status);
    });
} //setFilters

function unresolveProtest(protest_id) {
    console.log("Unresolving protest ", protest_id);
    const unresolveData = { protest_id: protest_id };
    fetch('./unresolveprotest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(unresolveData)
    })
        .then(res => res.json())
        .then(data => {
            console.log("Response from unresolve protest :", data);
            if (data.confirmation == "ok") {
                //update protest in local list
                const protestIndex = protests.findIndex(p => p.protest_id == protest_id);
                if (protestIndex !== -1) {
                    protests[protestIndex].resolved = 0;
                }
                const filteredIndex = protests_filtered.findIndex(p => p.protest_id == protest_id);
                if (filteredIndex !== -1) {
                    protests_filtered[filteredIndex].resolved = 0;
                }
                displayProtests();
            } else {
                alert("There was a problem unresolving the protest");
            }
        })
        .catch(error => console.log(error))
} //unresolveProtest

function resolveProtest(protest_id) {
    console.log("Resolving protest ", protest_id);
    const resolveData = { protest_id: protest_id };
    fetch('./resolveprotest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(resolveData)
    })
        .then(res => res.json())
        .then(data => {
            console.log("Response from resolve protest :", data);
            if (data.confirmation == "ok") {
                //update protest in local list
                const protestIndex = protests.findIndex(p => p.protest_id == protest_id);
                if (protestIndex !== -1) {
                    protests[protestIndex].resolved = 1;
                }
                const filteredIndex = protests_filtered.findIndex(p => p.protest_id == protest_id);
                if (filteredIndex !== -1) {
                    protests_filtered[filteredIndex].resolved = 1;
                }
                displayProtests();
            } else {
                alert("There was a problem resolving the protest");
            }
        })
        .catch(error => console.log(error))
} //resolveProtest

function limitString(string = '', limit = 0) {
    if (string.length <= limit) {
        return string
    } else {
        return string.substring(0, limit) + "...";
    }
} //limitString

function displayProtests() {
    var tableTopHtml = '<div class="row header">' +
        '<div class="cell row header blue" data-title="Row">ID</div>' +
        '<div class="cell row header blue" data-title="Row">Round</div>' +
        '<div class="cell row header blue" data-title="Row">Event</div>' +
        '<div class="cell row header blue" data-title="Row">Protesting Driver</div>' +
        '<div class="cell row header blue" data-title="Row">Protested Driver</div>' +
        '<div class="cell row header blue" data-title="Row">Lap</div>' +
        '<div class="cell row header blue" data-title="Row">Corner</div>' +
        '<div class="cell row header blue" data-title="Row">Driver Statement</div>' +
        '<div class="cell row header blue" data-title="Row">Status</div>' +
        '<div class="cell row header blue" data-title="Row">Action</div>' +
        '</div>';
    var tableHTML = tableTopHtml;
    var rowcounter = 0;

    protests_filtered.forEach(protest => {
        const statusText = protest.resolved == 1 ? "Resolved" : "Unresolved";
        const actionButton = protest.resolved == 1 ?
            '<div class="cell" data-title="Row" style="cursor: pointer" id="unresolve_protest_' + protest.protest_id + '"><b>Unresolve</b></div>' :
            '<div class="cell" data-title="Row" style="cursor: pointer" id="resolve_protest_' + protest.protest_id + '"><b>Resolve</b></div>';

        var rowHTML = '<div class="row" id="' + protest.protest_id + '" >' +
            '<div class="cell" data-title="Row">' + protest.protest_id + '</div>' +
            '<div class="cell" data-title="Row">' + protest.round_name + '</div>' +
            '<div class="cell" data-title="Row">' + protest.score_event + '</div>' +
            '<div class="cell" data-title="Row">' + protest.protesting_driver_name + '</div>' +
            '<div class="cell" data-title="Row">' + (protest.protested_driver_name || 'N/A') + '</div>' +
            '<div class="cell" data-title="Row">' + protest.lap + '</div>' +
            '<div class="cell" data-title="Row">' + protest.corner + '</div>' +
            '<div class="cell" data-title="Row">' + limitString(protest.driver_statement, 100) + '</div>' +
            '<div class="cell" data-title="Row">' + statusText + '</div>' +
            actionButton +
            '</div>';
        //replace any undefined values with &nbsp;
        rowHTML = rowHTML.replace(/undefined/g, "&nbsp;");

        tableHTML = tableHTML + rowHTML;
        rowcounter += 1;
    });
    $("#protests_displayed").html(tableHTML);

    // Add click handlers for unresolve and resolve buttons
    protests_filtered.forEach(protest => {
        if (protest.resolved == 1) {
            $("#unresolve_protest_" + protest.protest_id).on("click", function () {
                console.log("Clicked Unresolve for Protest " + protest.protest_id);
                if (confirm("Are you sure you want to unresolve protest " + protest.protest_id + "?")) {
                    console.log("User confirmed unresolve");
                    unresolveProtest(protest.protest_id);
                } else {
                    console.log("User cancelled unresolve");
                    return;
                }
            });
        } else {
            $("#resolve_protest_" + protest.protest_id).on("click", function () {
                console.log("Clicked Resolve for Protest " + protest.protest_id);
                if (confirm("Are you sure you want to resolve protest " + protest.protest_id + "?")) {
                    console.log("User confirmed resolve");
                    resolveProtest(protest.protest_id);
                } else {
                    console.log("User cancelled resolve");
                    return;
                }
            });
        }
    });

} //displayProtests

$(function () {  //document is ready    see  https://www.w3schools.com/jquery/jquery_syntax.asp
    getDrivers();
    getRounds();
    getProtests();
    setFilters();
    displayProtests();
}); //document is ready
