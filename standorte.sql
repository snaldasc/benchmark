CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    latitude DOUBLE,
    longitude DOUBLE
);

INSERT INTO locations (name, latitude, longitude) VALUES
('Bank 1', 53,5716087, 9,6740014),
('Ort B', 53,5715442, 9,6743027),
('Ort C', 50.110924, 8.682127);


