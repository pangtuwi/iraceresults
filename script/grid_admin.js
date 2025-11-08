var leagueid = "";
var gridData = [];

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

// Fetch grid data from server
function fetchGridData() {
    fetch('./griddata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log("Grid data received:", data);
        gridData = data;
        displayGridData(data);
    })
    .catch(error => {
        console.error("Error fetching grid data:", error);
        showMessage("Error fetching grid data", "error");
    });
}

// Display grid data in table
function displayGridData(data) {
    const tbody = document.getElementById('grid-tbody');
    tbody.innerHTML = ''; // Clear existing data

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No grid data available</td></tr>';
        return;
    }

    let currentClass = null;

    data.forEach((entry, index) => {
        // Add class header row if class changes
        if (entry.classname !== currentClass) {
            currentClass = entry.classname;
            const classRow = document.createElement('tr');
            classRow.className = 'class-header';
            classRow.innerHTML = `<td colspan="7">${entry.classname}</td>`;
            tbody.appendChild(classRow);
        }

        // Add driver row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.gridPosition}</td>
            <td>${entry.classname}</td>
            <td>${entry.classPosition}</td>
            <td>${entry.driverName}</td>
            <td>${entry.championshipPosition}</td>
            <td>${entry.championshipPoints}</td>
            <td>${entry.previousRaceParticipation}</td>
        `;
        tbody.appendChild(row);
    });
}

// Convert grid data to CSV
function convertToCSV(data) {
    if (!data || data.length === 0) {
        return '';
    }

    // CSV Headers
    const headers = ['Grid Position', 'Class', 'Class Position', 'Driver Name', 'Championship Position', 'Championship Points', 'Previous Race Participation'];

    // Create CSV content
    let csv = headers.join(',') + '\n';

    data.forEach(entry => {
        const row = [
            entry.gridPosition,
            entry.classname,
            entry.classPosition,
            entry.driverName,
            entry.championshipPosition,
            entry.championshipPoints,
            entry.previousRaceParticipation
        ];
        csv += row.join(',') + '\n';
    });

    return csv;
}

// Download CSV
function downloadCSV() {
    if (!gridData || gridData.length === 0) {
        showMessage("No grid data available to download", "error");
        return;
    }

    const csv = convertToCSV(gridData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'grid_order.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showMessage("Grid order CSV downloaded successfully", "success");
}

// Initialize on page load
$(document).ready(function () {
    // Fetch grid data when page loads
    fetchGridData();

    // Attach download handler
    document.getElementById('download-csv').addEventListener('click', function(e) {
        e.preventDefault();
        downloadCSV();
    });
});
