const map = L.map("map").setView([53.5716, 9.674], 14);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap-Mitwirkende",
}).addTo(map);

let userLatLng = null;
let allLocations = [];

// Geoposition holen
navigator.geolocation.getCurrentPosition(
  (position) => {
    userLatLng = L.latLng(position.coords.latitude, position.coords.longitude);
  },
  () => {
    console.warn("Standort nicht verfügbar.");
  }
);

function getDistance(a, b) {
  return a.distanceTo(b);
}

function createPopupContent(loc) {
  return `
    <strong>${loc.name}</strong><br />
    <p>${loc.description}</p>
    <img class="popup-img" src="${loc.image}" alt="${loc.name}" style="max-width: 100%; height: auto;" />
  `;
}

function renderMarkers(locations) {
  document.getElementById("locationList").innerHTML = "";
  map.eachLayer((layer) => {
    if (layer instanceof L.Circle) {
      map.removeLayer(layer);
    }
  });

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

function applyFilter() {
  const tag = document.getElementById("tagSelect").value;
  const country = document.getElementById("countrySelect").value;

  const filtered = allLocations.filter((l) => {
    const tagMatch = tag === "all" || l.tags.includes(tag);
    // country ist String, also genau vergleichen:
    const countryMatch = country === "all" || l.country === country;
    return tagMatch && countryMatch;
  });

  renderMarkers(filtered);
}

// Dropdown mit Ländern füllen
function populateCountryDropdown(locations) {
  const countrySelect = document.getElementById("countrySelect");
  const countries = new Set();

  locations.forEach(loc => {
    if (loc.country) countries.add(loc.country);
  });

  // Sortieren für bessere Übersicht
  const sortedCountries = Array.from(countries).sort();

  sortedCountries.forEach(country => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    countrySelect.appendChild(option);
  });
}

// Event Listener registrieren
document.getElementById("tagSelect").addEventListener("change", applyFilter);
document.getElementById("countrySelect").addEventListener("change", applyFilter);

fetch("https://raw.githubusercontent.com/snaldasc/benchmark/main/locations.json")
  .then((r) => r.json())
  .then((data) => {
    allLocations = data;
    populateCountryDropdown(allLocations);

    if (userLatLng) {
      allLocations.sort((a, b) => {
        return (
          getDistance(userLatLng, L.latLng(a.latitude, a.longitude)) -
          getDistance(userLatLng, L.latLng(b.latitude, b.longitude))
        );
      });
    }
    renderMarkers(allLocations);
  });

// Hamburger Menu
const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
menuToggle.addEventListener("click", () => {
  sideMenu.classList.toggle("hidden");
});

// Formular öffnen/schließen
document.getElementById("openSubmitForm").addEventListener("click", () => {
  document.getElementById("submitForm").classList.remove("hidden");
});
document.getElementById("cancelSubmit").addEventListener("click", () => {
  document.getElementById("submitForm").classList.add("hidden");
});

document.getElementById("locationForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const loc = {
    name: document.getElementById("name").value,
    description: document.getElementById("description").value,
    latitude: parseFloat(document.getElementById("latitude").value),
    longitude: parseFloat(document.getElementById("longitude").value),
    image: document.getElementById("image").value,
    tags: document.getElementById("tags").value.split(",").map((t) => t.trim()),
    country: document.getElementById("country").value // Formularfeld notwendig!
  };
  allLocations.push(loc);
  applyFilter();
  document.getElementById("submitForm").classList.add("hidden");
});

// Modal-Handling bleibt unverändert...
