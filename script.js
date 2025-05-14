const map = L.map('map').setView([53.5716, 9.674], 14);
let userLatLng = null;
let allLocations = [];

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap-Mitwirkende'
}).addTo(map);

// Menü toggle
const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
const mapContainer = document.getElementById("map");

menuToggle.addEventListener("click", () => {
  sideMenu.classList.toggle("open");
  // Wenn das Menü geöffnet ist, wird der Hintergrund der Karte unscharf
  if (sideMenu.classList.contains("open")) {
    mapContainer.style.filter = "blur(5px)";
  } else {
    mapContainer.style.filter = "none";
  }
});

// Geolocation
navigator.geolocation.getCurrentPosition(
  pos => {
    userLatLng = L.latLng(pos.coords.latitude, pos.coords.longitude);
    map.setView(userLatLng, 14);
  },
  () => console.warn("Standort nicht verfügbar.")
);

// Distanzen berechnen
function getDistance(a, b) {
  return a.distanceTo(b);
}

// Popup-Inhalt für Marker
function createPopupContent(loc) {
  return `
    <strong>${loc.name}</strong><br />
    <p>${loc.description}</p>
    <img src="${loc.image}" alt="${loc.name}" style="max-width: 100%; height: auto;" />
  `;
}

// Marker rendern
function renderMarkers(locations) {
  document.getElementById("locationList").innerHTML = "";
  locations.forEach(loc => {
    const marker = L.circle([loc.latitude, loc.longitude], {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.5,
      radius: 100,
    }).addTo(map);
    marker.bindPopup(createPopupContent(loc));

    const li = document.createElement("li");
    li.textContent = loc.name;
    li.addEventListener("click", () => {
      map.setView([loc.latitude, loc.longitude], 15);
      marker.openPopup();
    });
    document.getElementById("locationList").appendChild(li);
  });
}

// Filter anwenden
function applyFilter() {
  const tag = document.getElementById("tagSelect").value;
  const filtered = tag === "all" ? allLocations : allLocations.filter(l => l.tags.includes(tag));
  renderMarkers(filtered);
}

// Dropdown mit Tags füllen
function populateTags(locations) {
  const tags = new Set();
  locations.forEach(loc => loc.tags.forEach(tag => tags.add(tag)));
  const tagSelect = document.getElementById("tagSelect");
  tags.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagSelect.appendChild(option);
  });
}

document.getElementById("tagSelect").addEventListener("change", applyFilter);

// Daten laden
fetch("https://raw.githubusercontent.com/snaldasc/benchmark/main/locations.json")
  .then(res => res.json())
  .then(data => {
    allLocations = data;
    populateTags(data);
    if (userLatLng) {
      allLocations.sort((a, b) => getDistance(userLatLng, L.latLng(a.latitude, a.longitude)) - getDistance(userLatLng, L.latLng(b.latitude, b.longitude)));
    }
    renderMarkers(allLocations);
  })
  .catch(err => console.error("Fehler beim Laden der Daten:", err));

document.getElementById("resetMap").addEventListener("click", () => {
  if (userLatLng) {
    map.setView(userLatLng, 14);
  }
});

document.getElementById("openSubmitForm").addEventListener("click", () => {
  document.getElementById("submitForm").classList.remove("hidden");
});

document.getElementById("cancelSubmit").addEventListener("click", () => {
  document.getElementById("submitForm").classList.add("hidden");
});

// Standort einreichen
document.getElementById("locationForm").addEventListener("submit", e => {
  e.preventDefault();

  const newLocation = {
    name: document.getElementById("name").value,
    description: document.getElementById("description").value,
    latitude: parseFloat(document.getElementById("latitude").value),
    longitude: parseFloat(document.getElementById("longitude").value),
    image: document.getElementById("image").value,
    tags: document.getElementById("tags").value.split(",").map(tag => tag.trim()),
  };

  allLocations.push(newLocation);
  renderMarkers(allLocations);
  applyFilter();

  document.getElementById("submitForm").classList.add("hidden");
  document.getElementById("locationForm").reset();
});
