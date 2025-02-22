document.addEventListener("DOMContentLoaded", function () {
    var map = L.map('map').setView([39.8283, -98.5795], 4); // Center of the USA

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Google Sheets CSV URL (Replace with your own URL)
    const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFo-fDrzdfv_RJDR_c7zSAY9RynfmgPgcLjqvfg0s0v9jaZU7tr152LCAuCNK9IGT6splkGnW_uAnx/pub?output=csv";

    fetch(sheetURL)
        .then(response => response.text())
        .then(csvText => {
            const rows = csvText.split("\n").slice(1); // Skip header row
            rows.forEach(row => {
                const cols = row.split(",");
                if (cols.length < 4) return;

                const name = cols[0].trim();
                const lat = parseFloat(cols[1]);
                const lon = parseFloat(cols[2]);
                const species = cols[3].trim();
                const notes = cols[4] ? cols[4].trim() : "No additional info";

                if (!isNaN(lat) && !isNaN(lon)) {
                    L.marker([lat, lon])
                        .addTo(map)
                        .bindPopup(`<b>${name}</b><br>🍄 ${species}<br>${notes}`);
                }
            });
        })
        .catch(error => console.error("Error loading CSV:", error));

    // Search Functionality
    document.getElementById("search").addEventListener("keyup", function () {
        let searchValue = this.value.toLowerCase();
        let markers = map.eachLayer(layer => {
            if (layer instanceof L.Marker) map.removeLayer(layer);
        });

        fetch(sheetURL)
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.split("\n").slice(1);
                rows.forEach(row => {
                    const cols = row.split(",");
                    if (cols.length < 4) return;

                    const name = cols[0].trim();
                    const lat = parseFloat(cols[1]);
                    const lon = parseFloat(cols[2]);
                    const species = cols[3].trim();

                    if (name.toLowerCase().includes(searchValue)) {
                        L.marker([lat, lon])
                            .addTo(map)
                            .bindPopup(`<b>${name}</b><br>🍄 ${species}`);
                    }
                });
            })
            .catch(error => console.error("Error loading search results:", error));
    });
});
