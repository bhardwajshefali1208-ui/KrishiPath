# KrishiPath Backend

Node.js + Express + MySQL backend for the supplied KrishiPath frontend.

## Features
- Farmer registration
- Nearest procurement centre using GPS coordinates + Haversine distance
- Distance-aware travel time and 15/30/60/90 minute heads-up logic
- Exactly 10 ACTIVE positions in the rolling buffer
- 11th+ farmers remain WAITING and are promoted automatically when a slot opens
- Live queue endpoint
- QR/procurement completion endpoint
- SMS integration through Twilio, with console demo mode if Twilio credentials are absent

## Run
1. Install Node.js LTS and MySQL.
2. Open this backend folder in VS Code.
3. Run `npm install`.
4. Copy `.env.example` to `.env` and enter MySQL credentials.
5. In MySQL Workbench run `schema.sql`.
6. Run `npm start`.
7. Test `http://localhost:5000/api/health`.

## Frontend
The current frontend is static and currently simulates queue movement in `script.js`. To make it real, replace the simulated functions with API calls to this backend. The API endpoints are:

POST `/api/farmers/register`
POST `/api/centres/nearest`
GET `/api/slots?centreId=1&date=2026-09-18`
POST `/api/bookings`
GET `/api/bookings/:token`
POST `/api/queue/refresh/:token`
POST `/api/bookings/:token/complete`
