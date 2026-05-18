// --- New: Get All Departments ---
app.get('/api/departments', auth, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT HR_DEPARTMENT_ID, HR_DEPARTMENT_NAME FROM hr_department');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Updated Attendance Route (with department filtering) ---
app.get('/api/attendance/history', auth, async (req, res) => {
  try {
    const { month, year, departmentId } = req.query;
    if (!month || !year) return res.status(400).json({ message: 'Month and year required' });
    
    const formattedMonth = month.toString().padStart(2, '0');
    const datePattern = `${year}-${formattedMonth}-%`;

    // Query to get attendance for ALL users (or filtered by department if provided)
    let query = `
      SELECT 
        p.ID, p.HR_FNAME, p.HR_LNAME, p.FINGLE_ID,
        h.AccessDate as date,
        MAX(CASE WHEN h.AccessTime BETWEEN '05:00:00' AND '09:00:00' AND h.AttendanceStatus = 'i' THEN h.AccessTime END) as check_in,
        MAX(CASE WHEN h.AccessTime BETWEEN '15:30:00' AND '20:00:00' AND h.AttendanceStatus = 'o' THEN AccessTime END) as check_out
      FROM hr_person p
      JOIN hikvision h ON p.FINGLE_ID = h.EmployeeID
      WHERE h.AccessDate LIKE ?
    `;
    const params = [datePattern];

    if (departmentId && departmentId !== 'all') {
      query += ` AND p.HR_DEPARTMENT_ID = ?`;
      params.push(departmentId);
    }
    
    query += ` GROUP BY p.ID, h.AccessDate ORDER BY h.AccessDate DESC`;

    const [rows] = await db.execute(query, params);
    
    // (Note: To keep this simple and avoid overloading the logic here, 
    // I am focusing on the query change. I will need to update the 
    // frontend to handle the list of results mapped by ID.)
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
