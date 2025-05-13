<?php
$pdo = new PDO("mysql:host=localhost;dbname=karte", "user", "pass");
$stmt = $pdo->query("SELECT name, latitude, longitude FROM locations");
$locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($locations);
?>
