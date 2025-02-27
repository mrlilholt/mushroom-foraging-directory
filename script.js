document.addEventListener("DOMContentLoaded", function () {
    var map = L.map('map').setView([39.8283, -98.5795], 4); // Center of the USA

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Google Sheets CSV URL (Replace with your own URL)
    const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRZvwRsHw2ysaXiRQmu6kcc2M-S6XwmLAgeEnQmfE5MADXtll3ahcFBi8jNhHDO1f-edo2FDAvVilTl/pub?output=csv";

    fetch(sheetURL)
        .then(response => response.text())
        .then(csvText => {
            const rows = csvText.split("\n").slice(1); // Skip header row
            rows.forEach(row => {
                const cols = row.split(",");

                if (cols.length < 5) return; // Ensure all required fields exist

                const name = cols[1].trim(); // Location Name
                const lat = parseFloat(cols[2]); // Latitude
                const lon = parseFloat(cols[3]); // Longitude
                const species = cols[4].trim(); // Mushroom Species Found
                const notes = cols.length > 5 ? cols[5].trim() : "No additional info"; // Optional notes

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

        fetch(sheetURL)
            .then(response => response.text())
            .then(csvText => {
                const rows = csvText.split("\n").slice(1);
                
                map.eachLayer(layer => {
                    if (layer instanceof L.Marker) map.removeLayer(layer);
                });

                rows.forEach(row => {
                    const cols = row.split(",");
                    if (cols.length < 5) return;

                    const name = cols[1].trim();
                    const lat = parseFloat(cols[2]);
                    const lon = parseFloat(cols[3]);
                    const species = cols[4].trim();

                    if (!isNaN(lat) && !isNaN(lon) && name.toLowerCase().includes(searchValue)) {
                        L.marker([lat, lon])
                            .addTo(map)
                            .bindPopup(`<b>${name}</b><br>🍄 ${species}`);
                    }
                });
            })
            .catch(error => console.error("Error loading search results:", error));
    });
    
    // Fetch iNaturalist Mushroom Data and Add to Map
// Function to Fetch iNaturalist Data Based on Selected Species
function fetchINaturalistData(taxonID) {
    const iNatURL = `https://api.inaturalist.org/v1/observations?taxon_id=${taxonID}&geo=true&per_page=200`;

    fetch(iNatURL)
        .then(response => response.json())
        .then(data => {
            map.eachLayer(layer => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

            data.results.forEach(obs => {
                if (obs.geojson) {
                    const lat = obs.geojson.coordinates[1];
                    const lon = obs.geojson.coordinates[0];
                    const species = obs.taxon ? obs.taxon.name : "Unknown species";
                    const image = obs.photos.length > 0 ? obs.photos[0].url : "";

                    let marker = L.marker([lat, lon]).addTo(map);
                    let popupContent = `<b>${species}</b><br>From iNaturalist`;

                    if (image) {
                        popupContent += `<br><img src="${image}" width="100px">`;
                    }

                    marker.bindPopup(popupContent);
                }
            });
        })
        .catch(error => console.error("Error fetching iNaturalist data:", error));
}

// Event Listener for Dropdown Change
document.getElementById("mushroom-select").addEventListener("change", function () {
    fetchINaturalistData(this.value);
});

// Load Default (All Mushrooms) on Page Load
fetchINaturalistData("47170");

});
