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
    function fetchINaturalistData(taxonID, lat, lng) {
        // Build API URL with optional lat, lng, and a radius (in km)
        let iNatURL = `https://api.inaturalist.org/v1/observations?taxon_id=${taxonID}&geo=true&per_page=200`;
        if (lat && lng) {
            iNatURL += `&lat=${lat}&lng=${lng}&radius=10`;
        }

        fetch(iNatURL)
            .then(response => response.json())
            .then(data => {
                // Remove existing markers from the map
                map.eachLayer(layer => {
                    if (layer instanceof L.Marker) {
                        map.removeLayer(layer);
                    }
                });

                // Loop through observations and add markers
                data.results.forEach(obs => {
                    if (obs.geojson) {
                        const lat = obs.geojson.coordinates[1];
                        const lon = obs.geojson.coordinates[0];
                        const species = obs.taxon ? obs.taxon.name : "Unknown species";
                        const image = obs.photos.length > 0 ? obs.photos[0].url : "";

                        // Create a marker and bind a default popup
                        let marker = L.marker([lat, lon]).addTo(map).bindPopup("Loading address…");

                        // Use reverse geocoding to update the popup content
                        reverseGeocode(lat, lon, function(address) {
                            let popupContent = `<b>${species}</b><br>Location: ${address}`;
                            if (image) {
                                popupContent += `<br><img src="${image}" width="100px">`;
                            }
                            marker.getPopup().setContent(popupContent);
                        });
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

    const searchInput = document.getElementById("search");

    // Listen for the Enter key on the search box
    searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            const zip = searchInput.value.trim();
            if (zip) {
                geocodeZip(zip);
            }
        }
    });

    // Geocode ZIP code using Zippopotam.us API with HTTPS
    function geocodeZip(zip) {
        fetch(`https://api.zippopotam.us/us/${zip}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Invalid ZIP code");
                }
                return response.json();
            })
            .then(data => {
                const place = data.places[0];
                const lat = parseFloat(place.latitude);
                const lng = parseFloat(place.longitude);

                // Update map view based on geocoded coordinates
                map.setView([lat, lng], 10);

                // Fetch iNaturalist data for the selected species near the ZIP location
                const selectedTaxonID = document.getElementById("mushroom-select").value;
                fetchINaturalistData(selectedTaxonID, lat, lng);
            })
            .catch(error => {
                console.error("Error geocoding ZIP:", error);
                alert("Unable to locate ZIP code. Please try a valid ZIP code.");
            });
    }

    // New function for reverse geocoding using Nominatim
    function reverseGeocode(lat, lng, callback) {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                // If an address is found, pass it to the callback; otherwise, use fallback text.
                let address = data.address ? data.display_name : "No street address available";
                callback(address);
            })
            .catch(error => {
                console.error("Reverse geocoding error:", error);
                callback("Address lookup failed");
            });
    }

});
