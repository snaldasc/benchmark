document.addEventListener("submit", async (e) => {
  if (e.target.id === "spotForm") {
    e.preventDefault();
    const formData = new FormData(e.target);

    const title = formData.get("title");
    const description = formData.get("description");
    const tags = formData.get("tags");
    const type = formData.get("type");
    const lat = formData.get("lat");
    const lng = formData.get("lng");
    const user = formData.get("user") || "-";

    let imageUrl = "-";
    const imageFile = formData.get("imageFile");

    if (imageFile && imageFile.size > 0) {
      const uploadForm = new FormData();
      uploadForm.append("image", imageFile);

      try {
        const uploadResponse = await fetch("https://api.imgbb.com/1/upload?key=f64bb7ebe09ca4cc1cb5fa32b550cf26", {
          method: "POST",
          body: uploadForm,
        });

        const uploadResult = await uploadResponse.json();
        if (uploadResult.success) {
          imageUrl = uploadResult.data.url;
        } else {
          alert("⚠️ Bild konnte nicht hochgeladen werden.");
        }
      } catch (err) {
        alert("❌ Fehler beim Hochladen des Bildes.");
        return;
      }
    }

    // Discord Webhook
    const webhookUrl = "https://discord.com/api/webhooks/1372966787578069113/SwKAcsG_BEh3IuP6WHLOOUJI-flnZ-vbWamVuXhPO1CXTUUHsYnpH9RpEXEoB5UzELW5";

    const payload = {
      username: "SpotScout locations",
      embeds: [
        {
          title: "📍 Neuer Spot eingereicht",
          color: 0x00b0f4,
          fields: [
            { name: "Name", value: title || "-" },
            { name: "Beschreibung", value: description || "-" },
            { name: "Bild-Link", value: imageUrl },
            { name: "Tags", value: tags || "-" },
            { name: "Typ", value: type || "-" },
            { name: "Koordinaten", value: `${lat}, ${lng}` },
            { name: "User", value: user },
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
