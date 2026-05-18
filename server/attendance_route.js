// --- Attendance Routes (Filtering by Time and Status) ---
app.get('/api/attendance/history', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const formattedMonth = month.toString().padStart(2, '0');
    const datePattern = `${year}-${formattedMonth}-%`;

    const [userRows] = await db.execute('SELECT FINGLE_ID FROM hr_person WHERE ID = ?', [req.user.id]);
    const employeeId = userRows[0]?.FINGLE_ID;

    if (!employeeId) return res.json([]);

    // Get Attendance
    const [rows] = await db.execute(
      `SELECT 
        AccessDate as date,
        MAX(CASE WHEN AccessTime BETWEEN '05:00:00' AND '09:00:00' AND AttendanceStatus = 'i' THEN AccessTime END) as check_in,
        MAX(CASE WHEN AccessTime BETWEEN '15:30:00' AND '20:00:00' AND AttendanceStatus = 'o' THEN AccessTime END) as check_out
       FROM hikvision 
       WHERE EmployeeID = ? 
       AND AccessDate LIKE ?
       GROUP BY AccessDate`,
      [employeeId, datePattern]
    );

    // Get Leaves - Assuming LEAVE_TYPE_NAME is in the table or needs a join
    // Adjusting query assuming LEAVE_TYPE_NAME exists directly in leave_register
    const [leaveRows] = await db.execute(
      `SELECT LEAVE_DATE as date, LEAVE_TYPE_NAME as type_name 
       FROM leave_register 
       WHERE PER_ID = ? 
       AND LEAVE_DATE LIKE ?
       AND LEAVE_CANCEL_STATUS = 'False'`,
      [req.user.id, datePattern]
    );

    const attendanceMap = {};
    rows.forEach(r => {
      attendanceMap[r.date] = {
        check_in: r.check_in ? r.check_in.substring(0, 5) : null,
        check_out: r.check_out ? r.check_out.substring(0, 5) : null
      };
    });

    leaveRows.forEach(l => {
      if (!attendanceMap[l.date]) {
        attendanceMap[l.date] = { leave: l.type_name };
      } else {
        // If there's already attendance, maybe append leave type?
        // For now, prioritize attendance
        attendanceMap[l.date].leave = l.type_name;
      }
    });

    const result = Object.keys(attendanceMap).map(date => ({
      id: date,
      ...attendanceMap[date]
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
