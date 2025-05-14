const map = L.map("map").setView([53.5716, 9.674], 14);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap-Mitwirkende",
}).addTo(map);

let userLatLng = null;
let allLocations = [];

// Hole Geoposition
navigator.geolocation.getCurrentPosition((position) => {
  userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);
}, () => {
  console.warn("Standort nicht verfügbar.");
});

// Berechne Abstand
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
  locations.forEach((loc) => {
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
  const filtered = tag === "all"
    ? allLocations
    : allLocations.filter((l) => l.tags.includes(tag));
  renderMarkers(filtered);
}

// Event-Listener für den Filter
document.getElementById("tagSelect").addEventListener("change", applyFilter);

// Daten laden
fetch("https://raw.githubusercontent.com/snaldasc/benchmark/main/locations.json")
  .then((r) => r.json())
  .then((data) => {
    allLocations = data;
    if (userLatLng) {
      // Sortiere die Standorte nach Entfernung vom Benutzer
      allLocations.sort((a, b) => {
        return getDistance(userLatLng, L.latLng(a.latitude, a.longitude)) -
               getDistance(userLatLng, L.latLng(b.latitude, b.longitude));
      });
    }
    renderMarkers(allLocations);
  });

// Hamburger Menu
const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
menuToggle.addEventListener("click", () => {
  sideMenu.classList.toggle("open");
});

// Submit-Formular öffnen
document.getElementById("openSubmitForm").addEventListener("click", () => {
  document.getElementById("submitForm").classList.remove("hidden");
});

// Formular abbrechen
document.getElementById("cancelSubmit").addEventListener("click", () => {
  document.getElementById("submitForm").classList.add("hidden");
});

// Formular absenden
document.getElementById("locationForm").addEventListener("submit", (e) => {
  e.preventDefault();
  
  const loc = {
    name: document.getElementById("name").value,
    description: document.getElementById("description").value,
    latitude: parseFloat(document.getElementById("latitude").value),
    longitude: parseFloat(document.getElementById("longitude").value),
    image: document.getElementById("image").value,
    tags: document.getElementById("tags").value.split(",").map(t => t.trim())
  };
  
  allLocations.push(loc);
  applyFilter();
  document.getElementById("submitForm").classList.add("hidden");
});
