# KrishiPath

Farmer procurement journey: live GPS centre matching, **distance-based (Taluk / Jila) notification timing**, a **dynamic 10-slot buffer** that auto-fills the 11th farmer, and **SMS alerts** when the farmer has no internet.

## Run

Java 21+ (JDK) is enough — no Maven or Node required.

Double-click `start.bat`, or from the `KrishiPath` folder:

```bat
cd backend
run.bat
```

Then open [http://localhost:3000](http://localhost:3000) for the farmer journey and [http://localhost:3000/operator](http://localhost:3000/operator) to complete a slot and watch the 11th farmer enter the buffer.

Optional Node API (if you have Node 18+): `cd backend && npm install && npm start`.

## What the backend does

| Problem | Behaviour |
| --- | --- |
| Uncertain wait / no schedule | Token, live queue position, wait estimate, centre tracker |
| Distant vs local farmers | **Taluk** (local) gets a shorter heads-up; **Jila** / out-of-district farmers get a longer heads-up from travel time + zone |
| Idle gaps at the yard | Exactly **10** buffer slots stay loaded; completing one **immediately promotes the 11th** and sends SMS |
| No smartphone data | Booking, buffer-enter, heads-up and confirmation go out as **SMS** (Twilio / MSG91, or logged for demo) |

SMS: copy `backend/.env.example` to `backend/.env` and set `SMS_PROVIDER=twilio` or `msg91`. Default `log` writes messages to `backend/data/sms-log.json` so the flow can be demonstrated without a paid gateway.

## API (short)

- `POST /api/farmers` — register
- `POST /api/location/nearest` — GPS → nearest centre, zone, heads-up minutes
- `GET /api/schedule` — dates, slots, 10-slot buffer
- `POST /api/bookings` — book + SMS
- `GET /api/bookings/:token` — live queue / tracker
- `POST /api/bookings/:token/confirm` — QR complete (promotes 11th)
- `POST /api/operator/complete-next` — yard desk completes current window
- `GET /api/sms` — notification log
