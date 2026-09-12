require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const pool = require('./db');
const { promoteAndNotify, completeBooking } = require('./services/queue');
const { sendSMS } = require('./services/notification');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function travelMinutes(distanceKm) { return Math.max(7, Math.round(distanceKm * 2.05)); }
function headsUp(distanceKm) {
  if (distanceKm < 5) return 15;
  if (distanceKm < 15) return 30;
  if (distanceKm < 30) return 60;
  return 90;
}
function token() { return 'KP-' + crypto.randomInt(100000, 1000000); }

app.get('/api/health', async (req,res) => {
  try { await pool.query('SELECT 1'); res.json({ok:true, service:'KrishiPath backend'}); }
  catch(e) { res.status(500).json({ok:false,error:e.message}); }
});

// 1. Register farmer
app.post('/api/farmers/register', async (req,res) => {
  try {
    const {name,mobile,aadhaar,village} = req.body;
    if (!name || !/^\d{10}$/.test(mobile) || !/^\d{12}$/.test(aadhaar) || !village)
      return res.status(400).json({error:'Invalid registration data'});
    const aadhaarHash = crypto.createHash('sha256').update(aadhaar).digest('hex');
    const [existing] = await pool.execute('SELECT id FROM farmers WHERE mobile=?',[mobile]);
    if (existing.length) {
      await pool.execute('UPDATE farmers SET name=?,aadhaar_hash=?,village=? WHERE id=?',[name,aadhaarHash,village,existing[0].id]);
      return res.json({farmerId:existing[0].id,message:'Farmer updated'});
    }
    const [r] = await pool.execute('INSERT INTO farmers(name,mobile,aadhaar_hash,village) VALUES (?,?,?,?)',[name,mobile,aadhaarHash,village]);
    res.status(201).json({farmerId:r.insertId,message:'Farmer registered'});
  } catch(e) { res.status(500).json({error:e.message}); }
});

// 2. Find nearest procurement centre and calculate travel-aware alert
app.post('/api/centres/nearest', async (req,res) => {
  try {
    const {latitude,longitude} = req.body;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return res.status(400).json({error:'Latitude and longitude are required'});
    const [centres] = await pool.query('SELECT * FROM centres WHERE active=1');
    if (!centres.length) return res.status(404).json({error:'No active procurement centre'});
    let best = null;
    for (const c of centres) {
      const d = haversine(latitude,longitude,Number(c.latitude),Number(c.longitude));
      if (!best || d < best.distance) best = {...c,distance:d};
    }
    const distanceKm = Number(best.distance.toFixed(2));
    res.json({
      centre:{id:best.id,name:best.name,address:best.address,district:best.district,taluk:best.taluk},
      distanceKm,
      travelMinutes:travelMinutes(distanceKm),
      headsUpMinutes:headsUp(distanceKm),
      userLocation:{latitude,longitude}
    });
  } catch(e) { res.status(500).json({error:e.message}); }
});

// 3. Return available slots and current rolling buffer count
app.get('/api/slots', async (req,res) => {
  try {
    const {centreId,date} = req.query;
    if (!centreId || !date) return res.status(400).json({error:'centreId and date are required'});
    const [rows] = await pool.execute(
      `SELECT slot_time, COUNT(*) booked FROM bookings WHERE centre_id=? AND booking_date=? AND status<>'CANCELLED' GROUP BY slot_time ORDER BY slot_time`,
      [centreId,date]
    );
    const [active] = await pool.execute(
      `SELECT COUNT(*) count FROM bookings WHERE centre_id=? AND booking_date=? AND status IN ('ACTIVE','AT_CENTRE')`, [centreId,date]
    );
    res.json({buffer:{active:Number(active[0].count),capacity:10},slots:rows});
  } catch(e) { res.status(500).json({error:e.message}); }
});

// 4. Book slot + join queue. First 10 become ACTIVE; 11th+ WAITING.
app.post('/api/bookings', async (req,res) => {
  const connection = await pool.getConnection();
  try {
    const {farmerId,centreId,crop,quantity,unit,quality,date,slotTime,distanceKm,travelMinutes:tm,headsUpMinutes:hu} = req.body;
    if (!farmerId || !centreId || !crop || !Number(quantity) || !unit || !quality || !date || !slotTime)
      return res.status(400).json({error:'Missing booking data'});
    await connection.beginTransaction();
    const [centre] = await connection.execute('SELECT id FROM centres WHERE id=? AND active=1 FOR UPDATE',[centreId]);
    if (!centre.length) throw new Error('Centre not found');
    const [last] = await connection.execute('SELECT COALESCE(MAX(queue_number),0)+1 nextQueue FROM bookings WHERE centre_id=? AND booking_date=? FOR UPDATE',[centreId,date]);
    const queueNumber = Number(last[0].nextQueue);
    const [active] = await connection.execute(`SELECT COUNT(*) count FROM bookings WHERE centre_id=? AND booking_date=? AND status IN ('ACTIVE','AT_CENTRE')`,[centreId,date]);
    const status = Number(active[0].count) < 10 ? 'ACTIVE' : 'WAITING';
    let tk = token();
    while (true) { const [x]=await connection.execute('SELECT id FROM bookings WHERE token=?',[tk]); if(!x.length) break; tk=token(); }
    const [r] = await connection.execute(
      `INSERT INTO bookings(token,farmer_id,centre_id,crop,quantity,unit,quality,booking_date,slot_time,distance_km,travel_minutes,heads_up_minutes,queue_number,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [tk,farmerId,centreId,crop,quantity,unit,quality,date,slotTime,Number(distanceKm||0),Number(tm||0),Number(hu||0),queueNumber,status]
    );
    await connection.commit(); connection.release();
    const [rows] = await pool.execute(`SELECT b.*,c.name centre_name,f.name farmer_name,f.mobile FROM bookings b JOIN centres c ON c.id=b.centre_id JOIN farmers f ON f.id=b.farmer_id WHERE b.id=?`,[r.insertId]);
    const b=rows[0];
    await sendSMS(b.id,b.mobile, status==='ACTIVE' ? `KrishiPath: Token ${b.token} is active. Your queue position is ${b.queue_number}.` : `KrishiPath: Token ${b.token} booked. You are in the waiting queue and will enter the 10-slot buffer automatically when a slot opens.`);
    res.status(201).json(formatBooking(b));
  } catch(e) {
    try { await connection.rollback(); } catch(_) {}
    connection.release(); res.status(500).json({error:e.message});
  }
});

function formatBooking(b) {
  return {
    token:b.token, farmer:b.farmer_name, crop:b.crop, quantity:b.quantity, unit:b.unit,
    date:b.booking_date, slot:b.slot_time, centre:b.centre_name, status:b.status,
    queuePosition:b.queue_number, distanceKm:Number(b.distance_km), travelMinutes:b.travel_minutes,
    headsUpMinutes:b.heads_up_minutes, waitMinutes:Math.max(0,(b.queue_number-1)*3), bufferCapacity:10
  };
}

// 5. Live queue state
app.get('/api/bookings/:token', async (req,res) => {
  try {
    const [rows] = await pool.execute(`SELECT b.*,c.name centre_name,f.name farmer_name,f.mobile FROM bookings b JOIN centres c ON c.id=b.centre_id JOIN farmers f ON f.id=b.farmer_id WHERE b.token=?`,[req.params.token]);
    if (!rows.length) return res.status(404).json({error:'Token not found'});
    const b=rows[0];
    const [ahead] = await pool.execute(`SELECT COUNT(*) count FROM bookings WHERE centre_id=? AND booking_date=? AND queue_number < ? AND status IN ('WAITING','ACTIVE','AT_CENTRE')`,[b.centre_id,b.booking_date,b.queue_number]);
    res.json({...formatBooking(b),farmersAhead:Number(ahead[0].count),buffer:{active:(await activeCount(b.centre_id,b.booking_date)),capacity:10}});
  } catch(e) { res.status(500).json({error:e.message}); }
});
async function activeCount(centreId,date){const [r]=await pool.execute(`SELECT COUNT(*) count FROM bookings WHERE centre_id=? AND booking_date=? AND status IN ('ACTIVE','AT_CENTRE')`,[centreId,date]);return Number(r[0].count);}

// 6. Refresh/promote queue. This also fills any accidental gap in the 10-slot buffer.
app.post('/api/queue/refresh/:token', async (req,res) => {
  try {
    const [rows]=await pool.execute('SELECT centre_id,booking_date FROM bookings WHERE token=?',[req.params.token]);
    if(!rows.length) return res.status(404).json({error:'Token not found'});
    await promoteAndNotify(rows[0].centre_id,rows[0].booking_date);
    const [b]=await pool.execute(`SELECT b.*,c.name centre_name,f.name farmer_name,f.mobile FROM bookings b JOIN centres c ON c.id=b.centre_id JOIN farmers f ON f.id=b.farmer_id WHERE b.token=?`,[req.params.token]);
    const [a]=await pool.execute(`SELECT COUNT(*) count FROM bookings WHERE centre_id=? AND booking_date=? AND queue_number < ? AND status IN ('WAITING','ACTIVE','AT_CENTRE')`,[b[0].centre_id,b[0].booking_date,b[0].queue_number]);
    res.json({...formatBooking(b[0]),farmersAhead:Number(a[0].count),buffer:{active:await activeCount(b[0].centre_id,b[0].booking_date),capacity:10}});
  } catch(e){res.status(500).json({error:e.message});}
});

// 7. QR/centre confirmation: complete current farmer and immediately promote next waiting farmer.
app.post('/api/bookings/:token/complete', async (req,res) => {
  try {
    const result=await completeBooking(req.params.token);
    res.json({message:'Procurement completed',completed:result.completed.token,promoted:result.promoted.map(x=>x.token)});
  } catch(e){res.status(500).json({error:e.message});}
});

// 8. Manual SMS endpoint for demo/admin testing
app.post('/api/notifications/test', async (req,res)=>{
  try { const {bookingId,mobile,message}=req.body; const status=await sendSMS(bookingId,mobile,message); res.json({status}); }
  catch(e){res.status(500).json({error:e.message});}
});

app.listen(PORT,()=>console.log(`KrishiPath backend running on http://localhost:${PORT}`));
