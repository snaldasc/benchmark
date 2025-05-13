CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    latitude DOUBLE,
    longitude DOUBLE
);

INSERT INTO locations (name, latitude, longitude) VALUES
('Ort A', 53.34, 9.40),
('Ort B', 52.520008, 13.404954),
('Ort C', 50.110924, 8.682127);


