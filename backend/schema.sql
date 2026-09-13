CREATE DATABASE IF NOT EXISTS krishipath;
USE krishipath;

CREATE TABLE IF NOT EXISTS farmers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  mobile VARCHAR(10) NOT NULL UNIQUE,
  aadhaar_hash CHAR(64) NULL,
  village VARCHAR(160) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS centres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  address VARCHAR(255) NOT NULL,
  district VARCHAR(100) NOT NULL,
  taluk VARCHAR(100) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  opening_time TIME DEFAULT '08:00:00',
  closing_time TIME DEFAULT '18:00:00',
  active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(20) NOT NULL UNIQUE,
  farmer_id INT NOT NULL,
  centre_id INT NOT NULL,
  crop VARCHAR(80) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  quality VARCHAR(30) NOT NULL,
  booking_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  distance_km DECIMAL(8,2) NOT NULL,
  travel_minutes INT NOT NULL,
  heads_up_minutes INT NOT NULL,
  queue_number INT NOT NULL,
  status ENUM('WAITING','ACTIVE','AT_CENTRE','COMPLETED','CANCELLED') DEFAULT 'WAITING',
  notification_sent TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id),
  FOREIGN KEY (centre_id) REFERENCES centres(id),
  INDEX idx_queue (centre_id, booking_date, status, queue_number),
  INDEX idx_slot (centre_id, booking_date, slot_time)
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  type ENUM('SMS','SYSTEM') NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(30) NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

INSERT INTO centres (name,address,district,taluk,latitude,longitude)
SELECT 'Greenfield Procurement Centre','Main Market Road','Sample District','Sample Taluk',28.6139000,77.2090000
WHERE NOT EXISTS (SELECT 1 FROM centres LIMIT 1);
