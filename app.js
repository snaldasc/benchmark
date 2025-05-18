document.addEventListener("DOMContentLoaded", function () {
  const map = L.map("map").setView([53.5716, 9.6740], 14);

  let userLatLng = null;
  let markers = [];
  let userMarker = null;

  // Layer Definitionen
  const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap-Mitwirkende",
  });

  const esriSatLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles © Esri",
    }
  );

  osmLayer.addTo(map);
  map.zoomControl.remove();

  // Toggle für Layer
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

  document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("sideMenu").classList.toggle("hidden");
  });

  // Benutzerposition
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
        .bindPopup("You are here")
        .openPopup();
    },
    () => console.log("Position not available")
  );

  fetch("https://raw.githubusercontent.com/snaldasc/benchmark/main/locations.json")
    .then((res) => res.json())
    .then((data) => {
      renderMarkers(data);
      initializeTagFilter(data);
      initializeTypeFilter(data);
      initializeCountryFilter(data);
      updateLocationCount(data.length);

      const tagFilter = document.getElementById("tagFilter");
      const typeFilter = document.getElementById("typeFilter");
      const countryFilter = document.getElementById("countrySelect");

      function applyFilters() {
        const selectedTag = tagFilter.value.toLowerCase();
        const selectedType = typeFilter.value.toLowerCase();
        const selectedCountry = countryFilter.value.toLowerCase();

        const filtered = data.filter((loc) => {
          const tagMatch =
            selectedTag === "all" ||
            loc.tags.some((tag) => tag.toLowerCase() === selectedTag);
          const typeMatch =
            selectedType === "all" ||
            (loc.type && loc.type.toLowerCase() === selectedType);
          const countryMatch =
            selectedCountry === "all" ||
            (loc.country && loc.country.toLowerCase() === selectedCountry);
          return tagMatch && typeMatch && countryMatch;
        });

        renderMarkers(filtered);
        updateLocationCount(filtered.length);
      }

      tagFilter.addEventListener("change", applyFilters);
      typeFilter.addEventListener("change", applyFilters);
      countryFilter.addEventListener("change", applyFilters);
    });

  function renderMarkers(locations) {
    markers.forEach((m) => map.removeLayer(m));
    markers = [];
    const list = document.getElementById("locationList");
    list.innerHTML = "";

    locations.forEach((loc) => {
      const redIcon = L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: redIcon }).addTo(map);

      const popupContent = `
        <strong>${loc.name}</strong><br>
        <img src="${loc.image}" alt="${loc.name}" class="popup-img" style="width:100%;max-width:200px;cursor:pointer;"><br>
        <p>${loc.description}</p>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}" target="_blank" style="color:blue;font-weight:bold;text-decoration:underline;">
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
    data.forEach((loc) => loc.tags.forEach((tag) => allTags.add(tag.toLowerCase())));
    allTags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      tagFilter.appendChild(option);
    });
  }

  function initializeTypeFilter(data) {
    const typeFilter = document.getElementById("typeFilter");
    const allTypes = new Set();
    data.forEach((loc) => loc.type && allTypes.add(loc.type.toLowerCase()));
    allTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      typeFilter.appendChild(option);
    });
  }

  function initializeCountryFilter(data) {
    const countrySelect = document.getElementById("countrySelect");
    const countries = new Set();
    data.forEach((loc) => {
      if (loc.country) countries.add(loc.country);
    });
    Array.from(countries)
      .sort()
      .forEach((country) => {
        const option = document.createElement("option");
        option.value = country.toLowerCase();
        option.textContent = country;
        countrySelect.appendChild(option);
      });
  }

  function updateLocationCount(count) {
    document.getElementById("locationCount").textContent = count;
  }

  document.getElementById("resetMap").addEventListener("click", () => {
    if (userLatLng) {
      map.setView(userLatLng, 14);
    } else {
      map.setView([40, 10], 14);
    }
  });

  // Spot hinzufügen durch Klick
  map.on("click", function (e) {
    const { lat, lng } = e.latlng;
    const popupForm = `
      <form id="spotForm">
        <strong>📌 Submit new Spot</strong><br>
        <input name="title" placeholder="Name" required style="width: 100%; margin: 4px 0;" /><br />
        <textarea name="description" placeholder="Description" style="width: 100%; margin: 4px 0;"></textarea><br />
        <input name="image" placeholder="Bild-URL (optional)" style="width: 100%; margin: 4px 0;" /><br />
        <input name="tags" placeholder="Tags (z. B. view description, water, Skate, Lostplace, parkour)" style="width: 100%; margin: 4px 0;" /><br />
        <input name="type" placeholder="Type of location (z. B. bench, picknick, viewpoint etc.)" style="width: 100%; margin: 4px 0;" /><br />
 <input name="user" placeholder="your name (optional)" style="width: 100%; margin: 4px 0;"></textarea><br />


        <input type="hidden" name="lat" value="${lat}" />
        <input type="hidden" name="lng" value="${lng}" />
        <button type="submit" style="margin-top: 4px;">✅ Absenden</button>
      </form>
    `;
    L.popup().setLatLng([lat, lng]).setContent(popupForm).openOn(map);
  });

  // Neuen Spot via Discord Webhook absenden
  document.addEventListener("submit", async (e) => {
    if (e.target.id === "spotForm") {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      const webhookUrl = "https://discord.com/api/webhooks/1372966787578069113/SwKAcsG_BEh3IuP6WHLOOUJI-flnZ-vbWamVuXhPO1CXTUUHsYnpH9RpEXEoB5UzELW5";

      const payload = {
        username: "SpotScout Bot",
        embeds: [
          {
            title: "📍 Neuer Spot eingereicht",
            color: 0x00b0f4,
            fields: [
              { name: "Name", value: data.title || "-" },
              { name: "Beschreibung", value: data.description || "-" },
              { name: "Bild-Link", value: data.image || "-" }, // nur als Text
              { name: "Tags", value: data.tags || "-" },
              { name: "Typ", value: data.type || "-" },
              { name: "Koordinaten", value: `${data.lat}, ${data.lng}` },
            ],
            footer: { text: "Eingereicht über SpotScout Map" },
          },
        ],
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
      } catch (err) {
        alert("❌ Verbindung fehlgeschlagen.");
      }

      map.closePopup();
    }
  });

  // Modal Bildanzeige
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
