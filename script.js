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

function getDistance(a, b) {
  return a.distanceTo(b);
}

function createPopupContent(loc) {
  return `
    <strong>${loc.name}</strong><br />
    <p>${loc.description}</p>
    <img src="${loc.image}" alt="${loc.name}" style="max-width: 100%; height: auto;" />
  `;
}

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

function applyFilter() {
  const tag = document.getElementById("tagSelect").value;
  const filtered = tag === "all"
    ? allLocations
    : allLocations.filter((l) => l.tags.includes(tag));
  renderMarkers(filtered);
}

document.getElementById("tagSelect").addEventListener("change", applyFilter);

fetch("https://raw.githubusercontent.com/snaldasc/benchmark/main/locations.json")
  .then((r) => r.json())
  .then((data) => {
    allLocations = data;
    if (userLatLng) {
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

// Submit-Formular
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
    tags: document.getElementById("tags").value.split(",").map(t => t.trim())
  };
  allLocations.push(loc);
  applyFilter();
  document.getElementById("submitForm").classList.add("hidden");
});


// Modal-Elemente referenzieren
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImg");
const closeBtn = document.querySelector("#imageModal .close");

// Wenn ein Popup-Bild geklickt wird, öffne Modal
document.addEventListener("click", e => {
  if (e.target.classList.contains("popup-img")) {
    modal.classList.remove("hidden");
    modal.style.display = "block";
    modalImg.src = e.target.src;
    modalImg.classList.remove("zoomed");
  }
});

// Klick auf Bild zum Zoomen / Vergrößern
modalImg.addEventListener("click", () => {
  modalImg.classList.toggle("zoomed");
});

// Modal schließen
closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  modal.style.display = "none";
  modalImg.classList.remove("zoomed");
  modalImg.src = "";
});

// Klick außerhalb des Bildes schließt Modal
modal.addEventListener("click", e => {
  if (e.target === modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
    modalImg.classList.remove("zoomed");
    modalImg.src = "";
  }
});

// ESC-Taste schließt Modal
window.addEventListener("keydown", e => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    modal.classList.add("hidden");
    modal.style.display = "none";
    modalImg.classList.remove("zoomed");
    modalImg.src = "";
  }
});
