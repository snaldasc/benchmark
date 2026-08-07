// https://discord.gg/m9X98E2z discord server backup

document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // KARTE
  // ------------------------------------------------------------

  const GERMANY_CENTER = [51.1657, 10.4515];
  const GERMANY_ZOOM = 6;
  const USER_ZOOM = 14;
  const SHARED_SPOT_ZOOM = 16;

  const map = L.map("map").setView(GERMANY_CENTER, GERMANY_ZOOM);

  let userLatLng = null;
  let markers = [];
  let userMarker = null;

  // ------------------------------------------------------------
  // GETEILTEN SPOT AUS URL ERKENNEN
  // Beispiel:
  // https://spotscout.org/?lat=51.123&lng=7.456
  // ------------------------------------------------------------

  const urlParams = new URLSearchParams(window.location.search);

  const sharedLat = parseFloat(urlParams.get("lat"));
  const sharedLng = parseFloat(urlParams.get("lng"));

  const hasSharedSpot =
    Number.isFinite(sharedLat) &&
    Number.isFinite(sharedLng);

  // ------------------------------------------------------------
  // LAYER
  // ------------------------------------------------------------

  const osmLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "&copy; OpenStreetMap-Mitwirkende",
    }
  );

  const esriSatLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles © Esri",
    }
  );

  osmLayer.addTo(map);

  map.zoomControl.remove();

  // ------------------------------------------------------------
  // SATELLITEN-KNOPF
  // ------------------------------------------------------------

  let isSatellite = false;

  const toggleLayerButton = document.getElementById("toggleLayer");

  if (toggleLayerButton) {
    // Verhindert, dass der Klick an Leaflet weitergegeben wird
    L.DomEvent.disableClickPropagation(toggleLayerButton);
    L.DomEvent.disableScrollPropagation(toggleLayerButton);

    toggleLayerButton.addEventListener("click", (event) => {
      event.stopPropagation();

      if (isSatellite) {
        map.removeLayer(esriSatLayer);
        map.addLayer(osmLayer);
      } else {
        map.removeLayer(osmLayer);
        map.addLayer(esriSatLayer);
      }

      isSatellite = !isSatellite;
    });
  }

  // ------------------------------------------------------------
  // MENÜ-KNOPF
  // ------------------------------------------------------------

  const menuToggle = document.getElementById("menuToggle");

  if (menuToggle) {
    L.DomEvent.disableClickPropagation(menuToggle);
    L.DomEvent.disableScrollPropagation(menuToggle);

    menuToggle.addEventListener("click", (event) => {
      event.stopPropagation();

      const sideMenu = document.getElementById("sideMenu");

      if (sideMenu) {
        sideMenu.classList.toggle("hidden");
      }
    });
  }

  // ------------------------------------------------------------
  // BENUTZERPOSITION
  // ------------------------------------------------------------

  // Wenn ein Spot geteilt wurde, soll zunächst NICHT zum Benutzer
  // geflogen werden. Stattdessen soll der geteilte Spot geöffnet werden.
  if (!hasSharedSpot) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLatLng = [
          pos.coords.latitude,
          pos.coords.longitude
        ];

        // Langsam von Deutschland zum Standort des Nutzers fliegen
        map.flyTo(userLatLng, USER_ZOOM, {
          animate: true,
          duration: 8
        });

        userMarker = L.marker(userLatLng, {
          icon: L.icon({
            iconUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          }),
        })
          .addTo(map)
          .bindPopup("You are here");
      },
      () => {
        console.log("Position not available");

        // Deutschland bleibt sichtbar
        map.setView(GERMANY_CENTER, GERMANY_ZOOM);
      }
    );
  }

  // ------------------------------------------------------------
  // LOCATIONS LADEN
  // ------------------------------------------------------------

  fetch(
    "https://raw.githubusercontent.com/snaldasc/benchmark/main/locations.json"
  )
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
            loc.tags.some(
              (tag) => tag.toLowerCase() === selectedTag
            );

          const typeMatch =
            selectedType === "all" ||
            (loc.type &&
              loc.type.toLowerCase() === selectedType);

          const countryMatch =
            selectedCountry === "all" ||
            (loc.country &&
              loc.country.toLowerCase() === selectedCountry);

          return tagMatch && typeMatch && countryMatch;
        });

        renderMarkers(filtered);
        updateLocationCount(filtered.length);
      }

      if (tagFilter) {
        tagFilter.addEventListener("change", applyFilters);
      }

      if (typeFilter) {
        typeFilter.addEventListener("change", applyFilters);
      }

      if (countryFilter) {
        countryFilter.addEventListener(
          "change",
          applyFilters
        );
      }

      // --------------------------------------------------------
      // GETEILTEN SPOT ÖFFNEN
      // --------------------------------------------------------

      if (hasSharedSpot) {
        const matchingSpot = data.find((loc) => {
          const lat = Number(loc.latitude);
          const lng = Number(loc.longitude);

          return (
            Math.abs(lat - sharedLat) < 0.000001 &&
            Math.abs(lng - sharedLng) < 0.000001
          );
        });

        if (matchingSpot) {
          // Kurz warten, damit die Marker sicher erstellt wurden
          setTimeout(() => {
            const matchingMarker = markers.find((marker) => {
              const markerLatLng = marker.getLatLng();

              return (
                Math.abs(markerLatLng.lat - sharedLat) <
                  0.000001 &&
                Math.abs(markerLatLng.lng - sharedLng) <
                  0.000001
              );
            });

            map.flyTo(
              [sharedLat, sharedLng],
              SHARED_SPOT_ZOOM,
              {
                animate: true,
                duration: 3
              }
            );

            if (matchingMarker) {
              setTimeout(() => {
                matchingMarker.openPopup();
              }, 3000);
            }
          }, 500);
        } else {
          // Falls der Spot nicht mehr in locations.json existiert
          map.setView(GERMANY_CENTER, GERMANY_ZOOM);
        }
      }
    })
    .catch((error) => {
      console.error(
        "Locations konnten nicht geladen werden:",
        error
      );
    });

  // ------------------------------------------------------------
  // MARKER RENDERN
  // ------------------------------------------------------------

  function renderMarkers(locations) {
    markers.forEach((m) => map.removeLayer(m));

    markers = [];

    const list = document.getElementById("locationList");

    if (!list) return;

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

      // --------------------------------------------------------
      // SHARE URL
      //
      // Wir verwenden die Koordinaten statt einer ID.
      // Dadurch müssen locations.json und bestehende Spots
      // nicht geändert werden.
      // --------------------------------------------------------

      const shareUrl =
        `${window.location.origin}${window.location.pathname}` +
        `?lat=${encodeURIComponent(loc.latitude)}` +
        `&lng=${encodeURIComponent(loc.longitude)}`;

      // --------------------------------------------------------
      // MARKER
      // --------------------------------------------------------

      const marker = L.marker(
        [loc.latitude, loc.longitude],
        { icon: redIcon }
      ).addTo(map);

      // --------------------------------------------------------
      // POPUP
      // --------------------------------------------------------

      const popupContent = `
        <strong>${loc.name}</strong><br>

        <img
          src="${loc.image}"
          alt="${loc.name}"
          class="popup-img"
          style="width:100%;max-width:200px;cursor:pointer;"
        ><br>

        <p>${loc.description || ""}</p>

        <p>Submitted by:</p>
        <p>${loc.user || "-"}</p>

        <a
          href="https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}"
          target="_blank"
          style="color:blue;font-weight:bold;text-decoration:underline;"
        >
          ➤ Route in Google Maps
        </a>

        <br><br>

        <button
          class="shareSpotButton"
          data-share-url="${shareUrl}"
          type="button"
        >
          ↗ Spot teilen
        </button>
      `;

      marker.bindPopup(popupContent);

      markers.push(marker);

      // --------------------------------------------------------
      // LISTE
      // --------------------------------------------------------

      const li = document.createElement("li");

      li.textContent = loc.name;

      li.addEventListener("click", () => {
        map.setView(
          [loc.latitude, loc.longitude],
          16
        );

        marker.openPopup();
      });

      list.appendChild(li);
    });
  }

  // ------------------------------------------------------------
  // SHARE BUTTON
  // ------------------------------------------------------------

  // Event Delegation:
  // Funktioniert auch für Buttons, die erst später durch
  // Leaflet-Popups erzeugt werden.
  document.addEventListener("click", async (event) => {
    const shareButton =
      event.target.closest(".shareSpotButton");

    if (!shareButton) return;

    // Wichtig:
    // Verhindert, dass der Klick gleichzeitig als Kartenklick
    // interpretiert wird.
    event.preventDefault();
    event.stopPropagation();

    const shareUrl =
      shareButton.dataset.shareUrl;

    if (!shareUrl) {
      alert("❌ Share-Link konnte nicht erstellt werden.");
      return;
    }

    // ----------------------------------------------------------
    // MOBIL: natives Teilen
    // ----------------------------------------------------------

    if (navigator.share) {
      try {
        await navigator.share({
          title: "SpotScout",
          text: "Schau dir diesen Spot auf SpotScout an!",
          url: shareUrl
        });

        return;
      } catch (error) {
        // Benutzer hat Teilen geschlossen.
        // Keine Fehlermeldung anzeigen.
        if (error.name === "AbortError") {
          return;
        }
      }
    }

    // ----------------------------------------------------------
    // DESKTOP / FALLBACK: LINK KOPIEREN
    // ----------------------------------------------------------

    try {
      await navigator.clipboard.writeText(shareUrl);

      alert("🔗 Spot-Link kopiert!");
    } catch (error) {
      // Letzter Fallback für ältere Browser
      window.prompt(
        "Spot-Link kopieren:",
        shareUrl
      );
    }
  });

  // ------------------------------------------------------------
  // TAG FILTER
  // ------------------------------------------------------------

  function initializeTagFilter(data) {
    const tagFilter =
      document.getElementById("tagFilter");

    if (!tagFilter) return;

    const allTags = new Set();

    data.forEach((loc) => {
      if (!Array.isArray(loc.tags)) return;

      loc.tags.forEach((tag) =>
        allTags.add(tag.toLowerCase())
      );
    });

    allTags.forEach((tag) => {
      const option =
        document.createElement("option");

      option.value = tag;
      option.textContent = tag;

      tagFilter.appendChild(option);
    });
  }

  // ------------------------------------------------------------
  // TYPE FILTER
  // ------------------------------------------------------------

  function initializeTypeFilter(data) {
    const typeFilter =
      document.getElementById("typeFilter");

    if (!typeFilter) return;

    const allTypes = new Set();

    data.forEach((loc) => {
      if (loc.type) {
        allTypes.add(
          loc.type.toLowerCase()
        );
      }
    });

    allTypes.forEach((type) => {
      const option =
        document.createElement("option");

      option.value = type;
      option.textContent = type;

      typeFilter.appendChild(option);
    });
  }

  // ------------------------------------------------------------
  // COUNTRY FILTER
  // ------------------------------------------------------------

  function initializeCountryFilter(data) {
    const countrySelect =
      document.getElementById("countrySelect");

    if (!countrySelect) return;

    const countries = new Set();

    data.forEach((loc) => {
      if (loc.country) {
        countries.add(loc.country);
      }
    });

    Array.from(countries)
      .sort()
      .forEach((country) => {
        const option =
          document.createElement("option");

        option.value =
          country.toLowerCase();

        option.textContent = country;

        countrySelect.appendChild(option);
      });
  }

  // ------------------------------------------------------------
  // LOCATION COUNT
  // ------------------------------------------------------------

  function updateLocationCount(count) {
    const locationCount =
      document.getElementById("locationCount");

    if (locationCount) {
      locationCount.textContent = count;
    }
  }

  // ------------------------------------------------------------
  // RESET MAP
  // ------------------------------------------------------------

  const resetMap =
    document.getElementById("resetMap");

  if (resetMap) {
    resetMap.addEventListener("click", (event) => {
      event.stopPropagation();

      if (userLatLng) {
        map.flyTo(
          userLatLng,
          USER_ZOOM,
          {
            animate: true,
            duration: 2
          }
        );
      } else {
        map.flyTo(
          GERMANY_CENTER,
          GERMANY_ZOOM,
          {
            animate: true,
            duration: 2
          }
        );
      }
    });

    L.DomEvent.disableClickPropagation(resetMap);
  }

  // ------------------------------------------------------------
  // SPOT HINZUFÜGEN DURCH KLICK
  // ------------------------------------------------------------

  map.on("click", function (e) {
    const { lat, lng } = e.latlng;

    const popupForm = `
      <form id="spotForm">

        <strong>📌 Submit new Spot</strong><br>

        <input
          name="title"
          placeholder="Name"
          required
          style="width: 100%; margin: 4px 0;"
        /><br />

        <textarea
          name="description"
          placeholder="Description"
          style="width: 100%; margin: 4px 0;"
        ></textarea><br />

        <input
          id="imageUploadField"
          type="file"
          name="imageFile"
          accept="image/*"
          style="width: 100%; margin: 4px 0;"
        />

        <img
          id="imagePreview"
          src=""
          style="
            display:none;
            width:90px;
            height:auto;
            margin-top:6px;
            border-radius:4px;
            border:1px solid #aaa;
          "
        />

        <input
          name="tags"
          placeholder="Tags (water,Skate,etc)"
          style="width: 100%; margin: 4px 0;"
        /><br />

        <input
          name="type"
          placeholder="Type (bench, picknick,etc)"
          style="width: 100%; margin: 4px 0;"
        /><br />

        <input
          name="user"
          placeholder="your name (optional)"
          style="width: 100%; margin: 4px 0;"
        ><br />

        <input
          type="hidden"
          name="lat"
          value="${lat}"
        />

        <input
          type="hidden"
          name="lng"
          value="${lng}"
        />

        <button
          type="submit"
          style="margin-top: 4px;"
        >
          ✅ Absenden
        </button>

      </form>
    `;

    L.popup()
      .setLatLng([lat, lng])
      .setContent(popupForm)
      .openOn(map);
  });

  // ------------------------------------------------------------
  // BILD PREVIEW
  // ------------------------------------------------------------

  document.addEventListener(
    "change",
    function (e) {
      if (
        e.target.id !==
        "imageUploadField"
      ) {
        return;
      }

      const fileInput = e.target;

      const preview =
        document.getElementById(
          "imagePreview"
        );

      if (!preview) return;

      if (
        fileInput.files &&
        fileInput.files[0]
      ) {
        const file =
          fileInput.files[0];

        const reader =
          new FileReader();

        reader.onload = function (ev) {
          preview.src =
            ev.target.result;

          preview.style.display =
            "block";
        };

        reader.readAsDataURL(file);

        fileInput.style.border =
          "2px solid #00c851";

        fileInput.style.background =
          "#ccffdd";

        fileInput.style.color =
          "#006622";

        fileInput.title =
          "Image selected";
      } else {
        preview.src = "";

        preview.style.display =
          "none";

        fileInput.style.border = "";
        fileInput.style.background = "";
        fileInput.style.color = "";
        fileInput.title = "";
      }
    }
  );

  // ------------------------------------------------------------
  // NEUEN SPOT VIA DISCORD WEBHOOK
  // ------------------------------------------------------------

  document.addEventListener(
    "submit",
    async (e) => {
      if (
        e.target.id !==
        "spotForm"
      ) {
        return;
      }

      e.preventDefault();

      const formData =
        new FormData(e.target);

      const title =
        formData.get("title");

      const description =
        formData.get(
          "description"
        );

      const tags =
        formData.get("tags");

      const type =
        formData.get("type");

      const user =
        formData.get("user") ||
        "-";

      const lat =
        formData.get("lat");

      const lng =
        formData.get("lng");

      let imageUrl = "-";

      const imageFile =
        formData.get(
          "imageFile"
        );

      // --------------------------------------------------------
      // BILD HOCHLADEN
      // --------------------------------------------------------

      if (
        imageFile &&
        imageFile.size > 0
      ) {
        const uploadForm =
          new FormData();

        uploadForm.append(
          "image",
          imageFile
        );

        try {
          const uploadResponse =
            await fetch(
              "https://api.imgbb.com/1/upload?key=f64bb7ebe09ca4cc1cb5fa32b550cf26",
              {
                method: "POST",
                body: uploadForm,
              }
            );

          const uploadResult =
            await uploadResponse.json();

          if (
            uploadResult.success
          ) {
            imageUrl =
              uploadResult.data.url;
          } else {
            alert(
              "⚠️ Bild konnte nicht hochgeladen werden."
            );
          }
        } catch (err) {
          alert(
            "❌ Fehler beim Hochladen des Bildes."
          );

          return;
        }
      }

      // --------------------------------------------------------
      // DISCORD WEBHOOK
      // --------------------------------------------------------
      //
      // HIER DEINE BISHERIGE WEBHOOK-URL EINSETZEN.
      //
      // Wichtig: Diese URL ist momentan öffentlich in deinem
      // Frontend-Code sichtbar und sollte langfristig durch
      // einen Server/Serverless-Endpoint ersetzt werden.
      //
      // --------------------------------------------------------

      const webhookUrl =
        "https://discord.com/api/webhooks/1462500180204064809/46nzOHR7FxgSEJRIPd1E7g7Wv5maOM2avt3NZhEIzs_olyiYlkFs3IR_wnH3Yqr7BBkL";

      const payload = {
        username:
          "SpotScout locations",

        embeds: [
          {
            title:
              "📍 Neuer Spot eingereicht",

            color: 0x00b0f4,

            fields: [
              {
                name: "Name",
                value:
                  title || "-"
              },

              {
                name:
                  "Beschreibung",
                value:
                  description || "-"
              },

              {
                name:
                  "Bild-Link",
                value:
                  imageUrl
              },

              {
                name: "Tags",
                value:
                  tags || "-"
              },

              {
                name: "Typ",
                value:
                  type || "-"
              },

              {
                name:
                  "Koordinaten",
                value:
                  `${lat}, ${lng}`
              },

              {
                name: "User",
                value:
                  user
              },
            ],

            footer: {
              text:
                "Eingereicht über SpotScout Map"
            },
          },
        ],
      };

      try {
        const response =
          await fetch(
            webhookUrl,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        if (response.ok) {
          alert(
            "🎉 Danke! Dein Spot wurde gesendet."
          );
        } else {
          alert(
            "❌ Fehler beim Senden. Bitte erneut versuchen."
          );
        }
      } catch (err) {
        alert(
          "❌ Verbindung fehlgeschlagen."
        );
      }

      map.closePopup();
    }
  );

  // ------------------------------------------------------------
  // MODAL BILDANZEIGE
  // ------------------------------------------------------------

  const modal =
    document.getElementById(
      "imageModal"
    );

  const modalImg =
    document.getElementById(
      "modalImg"
    );

  const closeBtn =
    document.querySelector(
      "#imageModal .close"
    );

  document.addEventListener(
    "click",
    (e) => {
      if (
        e.target.classList.contains(
          "popup-img"
        )
      ) {
        if (!modal || !modalImg) {
          return;
        }

        modal.style.display =
          "block";

        modal.classList.remove(
          "hidden"
        );

        modalImg.src =
          e.target.src;
      }
    }
  );

  if (closeBtn) {
    closeBtn.addEventListener(
      "click",
      () => {
        if (!modal || !modalImg) {
          return;
        }

        modal.style.display =
          "none";

        modal.classList.add(
          "hidden"
        );

        modalImg.src = "";
      }
    );
  }
});
