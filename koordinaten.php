<?php
// Datenbankverbindung
$pdo = new PDO('mysql:host=localhost;dbname=deine_datenbank', 'benutzername', 'passwort');

// Abruf der Standortdaten
$stmt = $pdo->query('SELECT latitude, longitude FROM standorte');
$standorte = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Ausgabe als JSON
header('Content-Type: application/json');
echo json_encode($standorte);
?>
