const pool = require('../db');
const { sendSMS } = require('./notification');

// Exactly 10 ACTIVE farmers are kept in the rolling buffer for a centre/date.
async function promoteNextWaiting(connection, centreId, bookingDate) {
  const [activeRows] = await connection.execute(
    `SELECT COUNT(*) AS count FROM bookings
     WHERE centre_id=? AND booking_date=? AND status IN ('ACTIVE','AT_CENTRE')`,
    [centreId, bookingDate]
  );
  const activeCount = activeRows[0].count;
  const freeSlots = Math.max(0, 10 - activeCount);
  if (freeSlots === 0) return [];

  const [waiting] = await connection.execute(
    `SELECT b.id,b.token,b.queue_number,f.mobile,f.name,b.heads_up_minutes
     FROM bookings b JOIN farmers f ON f.id=b.farmer_id
     WHERE b.centre_id=? AND b.booking_date=? AND b.status='WAITING'
     ORDER BY b.queue_number ASC LIMIT ${freeSlots} FOR UPDATE`,
    [centreId, bookingDate]
  );

  const promoted = [];
  for (const row of waiting) {
    await connection.execute(`UPDATE bookings SET status='ACTIVE' WHERE id=?`, [row.id]);
    promoted.push(row);
  }
  return promoted;
}

async function promoteAndNotify(centreId, bookingDate) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const promoted = await promoteNextWaiting(connection, centreId, bookingDate);
    await connection.commit();
    connection.release();

    for (const b of promoted) {
      await sendSMS(b.id, b.mobile, `KrishiPath: Token ${b.token} is now ACTIVE. Please plan your travel. Your queue turn is ready.`);
    }
    return promoted;
  } catch (e) {
    await connection.rollback();
    connection.release();
    throw e;
  }
}

async function completeBooking(token) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT b.*, f.mobile, f.name FROM bookings b JOIN farmers f ON f.id=b.farmer_id WHERE b.token=? FOR UPDATE`,
      [token]
    );
    if (!rows.length) throw new Error('Token not found');
    const b = rows[0];
    if (b.status === 'COMPLETED') {
      await connection.rollback(); connection.release();
      return b;
    }
    await connection.execute(`UPDATE bookings SET status='COMPLETED', completed_at=NOW() WHERE id=?`, [b.id]);
    const promoted = await promoteNextWaiting(connection, b.centre_id, b.booking_date);
    await connection.commit();
    connection.release();

    await sendSMS(b.id, b.mobile, `KrishiPath: Token ${b.token} procurement has been completed successfully.`);
    for (const p of promoted) {
      await sendSMS(p.id, p.mobile, `KrishiPath: Token ${p.token} is now ACTIVE. A slot has opened and you have moved into the 10-slot buffer.`);
    }
    return { completed: b, promoted };
  } catch (e) {
    await connection.rollback();
    connection.release();
    throw e;
  }
}

module.exports = { promoteAndNotify, completeBooking };
