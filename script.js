document.addEventListener("DOMContentLoaded", function () {
    // Initialize Map
    var map = L.map('map').setView([39.8283, -98.5795], 4); // Default view: Center of USA

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Sample foraging locations (we will load more dynamically later)
    var locations = [
        { name: "Shenandoah National Park", lat: 38.53, lon: -78.35, species: "Morel, Chicken of the Woods" },
        { name: "Olympic National Park", lat: 47.97, lon: -123.50, species: "Chanterelles, Matsutake" }
    ];

    // Add markers to map
    locations.forEach(loc => {
        L.marker([loc.lat, loc.lon])
            .addTo(map)
            .bindPopup(`<b>${loc.name}</b><br>${loc.species}`);
    });

    // Search functionality
    document.getElementById("search").addEventListener("keyup", function () {
        let searchValue = this.value.toLowerCase();
        let filteredLocations = locations.filter(loc => loc.name.toLowerCase().includes(searchValue));

        // Clear old markers
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // Add new markers
        filteredLocations.forEach(loc => {
            L.marker([loc.lat, loc.lon])
                .addTo(map)
                .bindPopup(`<b>${loc.name}</b><br>${loc.species}`);
        });
    });
});
