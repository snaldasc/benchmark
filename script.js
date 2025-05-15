const map = L.map('map').setView([53.5716, 9.6740], 14);
let userLatLng = null;
let markers = [];
let userMarker = null;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap-Mitwirkende'
}).addTo(map);

navigator.geolocation.getCurrentPosition(
  pos => {
    userLatLng = [pos.coords.latitude, pos.coords.longitude];
    map.setView(userLatLng, 14);
    userMarker = L.marker(userLatLng).addTo(map)
      .bindPopup("You are here")
      .openPopup();
  },
  () => console.log("Position nicht verfügbar")
);

fetch("https://raw.githubusercontent.com/snaldasc/benchmark/main/locations.json")
  .then(res => res.json())
  .then(data => {
    renderMarkers(data);
    initializeTagFilter(data);
    initializeTypeFilter(data);
    updateLocationCount(data.length);

    const tagFilter = document.getElementById("tagFilter");
    const typeFilter = document.getElementById("typeFilter");

    function applyFilters() {
      const selectedTag = tagFilter.value.toLowerCase();
      const selectedType = typeFilter.value.toLowerCase();

      const filtered = data.filter(loc => {
        const tagMatch = !selectedTag || loc.tags.some(tag => tag.toLowerCase() === selectedTag);
        const typeMatch = !selectedType || loc.type.toLowerCase() === selectedType;
        return tagMatch && typeMatch;
      });

      renderMarkers(filtered);
      updateLocationCount(filtered.length);
    }

    tagFilter.addEventListener("change", applyFilters);
    typeFilter.addEventListener("change", applyFilters);
  });

function renderMarkers(locations) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  const list = document.getElementById("locationList");
  list.innerHTML = "";

  locations.forEach(loc => {
    const marker = L.marker([loc.latitude, loc.longitude], {
      icon: L.icon({
        iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })
    }).addTo(map);

    const googleMapsLink = `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`;
    const popupContent = `
      <strong>${loc.name}</strong><br>
      <img src="${loc.image}" alt="${loc.name}" class="popup-img" style="width:100%;max-width:200px;cursor:pointer;"><br>
      <p>${loc.description}</p>
      <a href="${googleMapsLink}" target="_blank" style="color:blue; font-weight:bold; text-decoration:underline;">
        ➤ Route in Google Maps
      </a>
    `;
    marker.bindPopup(popupContent);
    markers.push(marker);

    const li = document.createElement("li");
    li.textContent = loc.name;
    li.addEventListener("click", () => {
      map.setView([loc.latitude, loc.longitude], 16);
      marker.openPopup();
    });
    list.appendChild(li);
  });
}

function initializeTagFilter(data) {
  const tagFilter = document.getElementById("tagFilter");
  const allTags = new Set();
  data.forEach(loc => loc.tags.forEach(tag => allTags.add(tag.toLowerCase())));
  allTags.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });
}

function initializeTypeFilter(data) {
  const typeFilter = document.getElementById("typeFilter");
  const allTypes = new Set();
  data.forEach(loc => loc.type && allTypes.add(loc.type.toLowerCase()));
  allTypes.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    typeFilter.appendChild(option);
  });
}

function updateLocationCount(count) {
  document.getElementById("locationCount").textContent = count;
}

document.getElementById("resetMap").addEventListener("click", () => {
  map.setView(userLatLng || [40, 10], 14);
});

// Modal Logic
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImg");
const closeBtn = document.querySelector(".modal .close");

document.addEventListener("click", e => {
  if (e.target.classList.contains("popup-img")) {
    modal.classList.remove("hidden");
    modalImg.src = e.target.src;
  }
});

modalImg.addEventListener("click", () => {
  modalImg.classList.toggle("zoomed");
});

closeBtn.addEventListener("click", closeModal);
window.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});
modal.addEventListener("click", e => {
  if (e.target === modal) closeModal();
});

function closeModal() {
  modal.classList.add("hidden");
  modalImg.classList.remove("zoomed");
  modalImg.src = "";
}

// Side Menu Toggle & History
const menu = document.getElementById("sideMenu");
const overlay = document.getElementById("menuOverlay");
const menuToggle = document.getElementById("menuToggle");

function openMenu() {
  menu.classList.add("open");
  overlay.classList.add("active");
  history.pushState({ menuOpen: true }, "");
}

function closeMenu() {
  menu.classList.remove("open");
  overlay.classList.remove("active");
}

menuToggle.addEventListener("click", () => {
  if (menu.classList.contains("open")) {
    closeMenu();
    history.back();
  } else {
    openMenu();
  }
});

overlay.addEventListener("click", () => {
  closeMenu();
  history.back();
});

window.addEventListener("popstate", event => {
  if (!event.state || !event.state.menuOpen) {
    closeMenu();
  }
});
