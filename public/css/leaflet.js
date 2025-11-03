const map = L.map('map', {
  center: [37.7749, -122.4194],
  zoom: 3,
  minZoom: 3, // Prevent excessive zooming out
  maxZoom: 19,
  maxBounds: [
    [-90, -180],
    [90, 180]
  ],
  maxBoundsViscosity: 1.0,
  worldCopyJump: false, // Disable infinite horizontal wrapping
  noWrap: true // <--- Prevents duplicate tiles
});

// Add the tile layer with noWrap and bounds set
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  noWrap: true,  // Prevent horizontal repeat
  bounds: [
    [-85, -180],
    [85, 180]
  ]
}).addTo(map);

// Custom pin with hover image
function addCustomPin(lat, lon, trip) {
  const icon = L.divIcon({
    className: 'travel-pin',
    html: `
        <svg class="pin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="#d00" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
        <a href="travel/${trip}.html" class="polaroid travel-icon">
            <img src="images/${trip}button.jpg">
        </a>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 25] // The anchor point needs to be at the bottom tip of the marker
  });

  L.marker([lat, lon], { icon }).addTo(map);
}

// Add some sample pins
addCustomPin(52.382798, 4.901887, 'amsterdam2024');
addCustomPin(41.388977, 2.168278, 'spain2024');
addCustomPin(41.840110, 23.48554, 'bulgaria2025');
addCustomPin(57.477497, -4.22460, 'scotland2025');
addCustomPin(64.147393, -21.9396, 'iceland2025');
addCustomPin(51.676467, -4.91703, 'wales2025');
addCustomPin(45.469687, 9.181162, 'milan2025');
addCustomPin(40.626341, 14.37566, 'sorrento2025');
addCustomPin(52.545138, 13.35851, 'germany2025');
addCustomPin(48.401877, 2.696770, 'fontainebleau2025');
addCustomPin(39.627760, 19.89939, 'greece2025');
addCustomPin(41.324557, 19.81912, 'albania2025');
