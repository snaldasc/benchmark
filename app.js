document.addEventListener("DOMContentLoaded", function () {
  const map = L.map("map").setView([53.5716, 9.6740], 14);

  let userLatLng = null;
  let markers = [];
  let userMarker = null;

  const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  });

  const esriSatLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri" }
  );

  osmLayer.addTo(map);
  map.zoomControl.remove();

  // Layer toggle
  let isSatellite = false;
  document.getElementById("toggleLayer").addEventListener("click", () => {
    if (isSatellite) {
      map.removeLayer(esriSatLayer);
      map.addLayer(osmLayer);
    } else {
      map.removeLayer(osmLayer);
      map.addLayer(esriSatLayer);
    }
    isSatellite = !isSatellite;
  });

  // Menu toggle
  const menuToggle = document.getElementById("menuToggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      document.getElementById("sideMenu").classList.toggle("hidden");
      document.getElementById("menuOverlay").classList.toggle("hidden");
    });
  }

  // User location
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLatLng = [pos.coords.latitude, pos.coords.longitude];
      map.setView(userLatLng, 14);
      userMarker = L.marker(userLatLng, {
        icon: L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        }),
      })
        .addTo(map)
        .bindPopup("📍 Du bist hier")
        .openPopup();
    },
    () => console.log("Geolocation nicht verfügbar")
  );

  // Filter-Helfer
  function getCheckedValues(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type=checkbox]:checked`);
    return Array.from(checkboxes).map(cb => cb.value.toLowerCase());
  }

  function updateLocationCount(count) {
    document.getElementById("locationCount").textContent = count;
  }

  function applyFilters(data) {
    const selectedTags = getCheckedValues("tagFilters");
    const selectedTypes = getCheckedValues("typeFilters");
    const selectedCountries = getCheckedValues("countryFilters");

    const filtered = data.filter((loc) => {
      const tagMatch = selectedTags.length === 0 || (loc.tags && selectedTags.some(tag => loc.tags.map(t => t.toLowerCase()).includes(tag)));
      const typeMatch = selectedTypes.length === 0 || (loc.type && selectedTypes.includes(loc.type.toLowerCase()));
      const countryMatch = selectedCountries.length === 0 || (loc.country && selectedCountries.includes(loc.country.toLowerCase()));
      return tagMatch && typeMatch && countryMatch;
    });

    renderMarkers(filtered);
    updateLocationCount(filtered.length);
  }

  function renderMarkers(locations) {
    markers.forEach((m) => map.removeLayer(m));
    markers = [];

    locations.forEach((loc) => {
      const icon = L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon }).addTo(map);

      const popupContent = `
        <strong>${loc.name}</strong><br>
        <img src="${loc.image}" alt="${loc.name}" class="popup-img" style="width:100%;max-width:200px;cursor:pointer;"><br>
        <p>${loc.description || ""}</p>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}" target="_blank" style="color:blue;font-weight:bold;text-decoration:underline;">
          ➤ Route in Google Maps
        </a>
      `;
      marker.bindPopup(popupContent);
      markers.push(marker);
    });
  }

  // Daten laden & initialisieren
  fetch("https://raw.githubusercontent.com/snaldasc/benchmark/main/locations.json")
    .then(res => res.json())
    .then(data => {
      renderMarkers(data);
      updateLocationCount(data.length);

      // Filterevents
      const checkboxes = document.querySelectorAll("#sideMenu input[type=checkbox]");
      checkboxes.forEach(cb => cb.addEventListener("change", () => applyFilters(data)));

      // Reset
      const resetBtn = document.getElementById("resetFilters");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          checkboxes.forEach(cb => cb.checked = false);
          renderMarkers(data);
          updateLocationCount(data.length);
        });
      }
    });

  // Reset Map Button
  document.getElementById("resetMap").addEventListener("click", () => {
    if (userLatLng) {
      map.setView(userLatLng, 14);
    }
  });

  // Spot hinzufügen via Karte
  map.on("click", function (e) {
    const { lat, lng } = e.latlng;
    const popupForm = `
      <form id="spotForm">
        <strong>📌 Submit new Spot</strong><br>
        <input name="title" placeholder="Name" required style="width: 100%; margin: 4px 0;" /><br />
        <textarea name="description" placeholder="Description" style="width: 100%; margin: 4px 0;"></textarea><br />
        <input name="image" placeholder="Bild-URL (optional)" style="width: 100%; margin: 4px 0;" /><br />
        <input name="tags" placeholder="Tags (z.B. view, skate, lostplace)" style="width: 100%; margin: 4px 0;" /><br />
        <input name="type" placeholder="Typ (z.B. Bank, Aussichtspunkt)" style="width: 100%; margin: 4px 0;" /><br />
        <input type="hidden" name="lat" value="${lat}" />
        <input type="hidden" name="lng" value="${lng}" />
        <button type="submit" style="margin-top: 4px;">✅ Absenden</button>
      </form>
    `;
    L.popup().setLatLng([lat, lng]).setContent(popupForm).openOn(map);
  });

  // Spot via Discord Webhook senden
  document.addEventListener("submit", async (e) => {
    if (e.target.id === "spotForm") {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      const webhookUrl = "https://discord.com/api/webhooks/1372966787578069113/SwKAcsG_BEh3IuP6WHLOOUJI-flnZ-vbWamVuXhPO1CXTUUHsYnpH9RpEXEoB5UzELW5";

      const payload = {
        username: "SpotScout Bot",
        embeds: [{
          title: "📍 Neuer Spot eingereicht",
          color: 0x00b0f4,
          fields: [
            { name: "Name", value: data.title || "-" },
            { name: "Beschreibung", value: data.description || "-" },
            { name: "Bild-Link", value: data.image || "-" },
            { name: "Tags", value: data.tags || "-" },
            { name: "Typ", value: data.type || "-" },
            { name: "Koordinaten", value: `${data.lat}, ${data.lng}` }
          ],
          footer: { text: "Eingereicht über SpotScout Map" }
        }]
      };

      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          alert("🎉 Danke! Dein Spot wurde gesendet.");
        } else {
          alert("❌ Fehler beim Senden. Bitte erneut versuchen.");
        }
      } catch {
        alert("❌ Verbindung fehlgeschlagen.");
      }

      map.closePopup();
    }
  });

  // Bild-Zoom (Modal)
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImg");
  const closeBtn = document.querySelector("#imageModal .close");

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("popup-img")) {
      modal.style.display = "block";
      modal.classList.remove("hidden");
      modalImg.src = e.target.src;
    }
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    modal.classList.add("hidden");
    modalImg.src = "";
  });
});
