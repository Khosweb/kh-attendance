const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET;

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader ? authHeader.split(' ')[1] : null;
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid' });
  }
};

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute(
      `SELECT p.*, d.HR_DEPARTMENT_NAME 
       FROM hr_person p 
       LEFT JOIN hr_department d ON p.HR_DEPARTMENT_ID = d.HR_DEPARTMENT_ID 
       WHERE p.HR_USERNAME = ?`, [email]
    );
    
    if (rows.length === 0) return res.status(400).json({ message: 'User not found' });
    
    const user = rows[0];
    const inputMD5 = crypto.createHash('md5').update(password).digest('hex');
    const storedPassword = user.HR_PASSWORD || '';
    
    if (password === storedPassword || inputMD5 === storedPassword.toLowerCase()) {
        const token = jwt.sign({ id: user.ID }, JWT_SECRET, { expiresIn: '8h' });
        return res.json({ 
            user: { 
                id: user.ID, 
                name: user.HR_FNAME, 
                department: user.HR_DEPARTMENT_NAME || 'ไม่ระบุแผนก' 
            }, 
            token 
        });
    }
    return res.status(400).json({ message: 'Invalid credentials' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, d.HR_DEPARTMENT_NAME 
       FROM hr_person p 
       LEFT JOIN hr_department d ON p.HR_DEPARTMENT_ID = d.HR_DEPARTMENT_ID 
       WHERE p.ID = ?`, [req.user.id]
    );
    
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    
    const user = rows[0];
    res.json({ 
      id: user.ID, 
      name: user.HR_FNAME, 
      department: user.HR_DEPARTMENT_NAME || 'ไม่ระบุแผนก' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/departments', auth, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT HR_DEPARTMENT_ID, HR_DEPARTMENT_NAME FROM hr_department');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/staff-types', auth, async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT HR_PERSON_TYPE_ID, HR_PERSON_TYPE_NAME FROM hr_person_type');
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/time-templates', auth, async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT ID, HILING_TIME_NAME FROM hiling_time_template');
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/shifts', auth, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT p.ID, p.HR_FNAME, p.HR_LNAME, d.HR_DEPARTMENT_NAME, hpht.TEMPLATE_ID
            FROM hr_person p
            LEFT JOIN hr_person_hiling_time hpht ON p.ID = hpht.HR_PERSON_ID
            LEFT JOIN hr_department d ON p.HR_DEPARTMENT_ID = d.HR_DEPARTMENT_ID
            WHERE p.HR_STATUS_ID = '01'
            ORDER BY p.HR_FNAME
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/shifts', auth, async (req, res) => {
    try {
        const { personId, templateId } = req.body;
        
        // Check if assignment exists
        const [existing] = await db.execute('SELECT ID FROM hr_person_hiling_time WHERE HR_PERSON_ID = ?', [personId]);
        
        if (existing.length > 0) {
            await db.execute('UPDATE hr_person_hiling_time SET TEMPLATE_ID = ? WHERE HR_PERSON_ID = ?', [templateId, personId]);
        } else {
            await db.execute('INSERT INTO hr_person_hiling_time (HR_PERSON_ID, TEMPLATE_ID) VALUES (?, ?)', [personId, templateId]);
        }
        
        res.json({ message: 'Shift updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/attendance/history', auth, async (req, res) => {
  try {
    const { month, year, departmentId, staffTypeId, templateId, personId } = req.query;
    if (!month || !year) return res.status(400).json({ message: 'Month and year required' });
    
    const formattedMonth = month.toString().padStart(2, '0');
    const datePattern = `${year}-${formattedMonth}-%`;

    // 1. Get Attendance Data
    let attendanceQuery = `
      SELECT 
        p.ID, p.HR_FNAME, p.HR_LNAME, d.HR_DEPARTMENT_NAME, pt.HR_PERSON_TYPE_NAME,
        CAST(h.AccessDate AS CHAR) as date,
        LEFT(MAX(CASE WHEN h.AccessTime BETWEEN '05:00:00' AND '10:00:00' AND h.AttendanceStatus = 'i' THEN h.AccessTime END), 5) as check_in,
        LEFT(MAX(CASE WHEN h.AccessTime BETWEEN '15:30:00' AND '22:00:00' AND h.AttendanceStatus = 'o' THEN h.AccessTime END), 5) as check_out,
        LEFT(MAX(CASE WHEN h.AccessTime BETWEEN '05:00:00' AND '10:00:00' AND h.AttendanceStatus = 'i' THEN h.AccessTime END), 5) as shift_m_in,
        LEFT(MAX(CASE WHEN h.AccessTime BETWEEN '14:00:00' AND '17:00:00' AND h.AttendanceStatus = 'o' THEN h.AccessTime END), 5) as shift_m_out,
        LEFT(MAX(CASE WHEN h.AccessTime BETWEEN '15:00:00' AND '17:00:00' AND h.AttendanceStatus = 'i' THEN h.AccessTime END), 5) as shift_a_in,
        LEFT(MAX(CASE WHEN h.AccessTime BETWEEN '21:00:00' AND '23:59:59' AND h.AttendanceStatus = 'o' THEN h.AccessTime END), 5) as shift_a_out,
        LEFT(MAX(CASE WHEN (h.AccessTime BETWEEN '21:00:00' AND '23:59:59' OR h.AccessTime BETWEEN '00:00:00' AND '01:30:00') AND h.AttendanceStatus = 'i' THEN h.AccessTime END), 5) as shift_n_in,
        LEFT(MAX(CASE WHEN h.AccessTime BETWEEN '06:00:00' AND '09:30:00' AND h.AttendanceStatus = 'o' THEN h.AccessTime END), 5) as shift_n_out
      FROM hr_person p
      JOIN hikvision h ON p.FINGLE_ID = h.EmployeeID
      LEFT JOIN hr_department d ON p.HR_DEPARTMENT_ID = d.HR_DEPARTMENT_ID
      LEFT JOIN hr_person_type pt ON p.HR_PERSON_TYPE_ID = pt.HR_PERSON_TYPE_ID
      LEFT JOIN hr_person_hiling_time hpht ON p.ID = hpht.HR_PERSON_ID
      WHERE h.AccessDate LIKE ?
    `;
    const params = [datePattern];
    if (departmentId && departmentId !== 'all') {
      attendanceQuery += ` AND p.HR_DEPARTMENT_ID = ?`;
      params.push(departmentId);
    }
    if (staffTypeId && staffTypeId !== 'all') {
        attendanceQuery += ` AND p.HR_PERSON_TYPE_ID = ?`;
        params.push(staffTypeId);
    }
    if (templateId && templateId !== 'all') {
        attendanceQuery += ` AND hpht.TEMPLATE_ID = ?`;
        params.push(templateId);
    }
    if (personId && personId !== 'all') {
        attendanceQuery += ` AND p.ID = ?`;
        params.push(personId);
    }
    attendanceQuery += ` GROUP BY p.ID, h.AccessDate`;

    const [attendanceRows] = await db.execute(attendanceQuery, params);

    // 2. Get Leave Data
    let leaveQuery = `
      SELECT 
      lr.LEAVE_PERSON_ID as ID, lr.LEAVE_DATE_BEGIN, lr.LEAVE_DATE_END, lt.LEAVE_TYPE_NAME as LEAVE_BECAUSE, lr.DAY_TYPE_ID
      FROM leave_register lr
			LEFT JOIN leave_type lt on  lt.LEAVE_TYPE_ID = lr.LEAVE_TYPE_CODE
      WHERE (lr.LEAVE_DATE_BEGIN LIKE ? OR lr.LEAVE_DATE_END LIKE ?)
      AND lr.LEAVE_CANCEL_STATUS = 'False'
    `;
    const leaveParams = [datePattern, datePattern];
    if (personId && personId !== 'all') {
        leaveQuery += ` AND lr.LEAVE_PERSON_ID = ?`;
        leaveParams.push(personId);
    }
    const [leaveRows] = await db.execute(leaveQuery, leaveParams);

    // 3. Get Official Business Data (Going Out)
    let officialQuery = `
      SELECT 
        rip.HR_PERSON_ID as ID, ri.DATE_GO, ri.DATE_BACK, 'ไปราชการ' as official_head, ri.DAY_TYPE_ID
      FROM record_index_person rip
      JOIN record_index ri ON rip.RECORD_ID = ri.ID
      WHERE (ri.DATE_GO LIKE ? OR ri.DATE_BACK LIKE ?)
      AND (ri.CANCEL_STATUS IS NULL OR ri.CANCEL_STATUS = '')
    `;
    const officialParams = [datePattern, datePattern];
    if (personId && personId !== 'all') {
        officialQuery += ` AND rip.HR_PERSON_ID = ?`;
        officialParams.push(personId);
    }
    const [officialRows] = await db.execute(officialQuery, officialParams);

    // 4. Get Holidays
    const [holidayRows] = await db.execute(
        'SELECT holiday_date as date, day_name FROM holiday WHERE holiday_date LIKE ?',
        [datePattern]
    );

    // 5. Merge Data
    const finalRecords = [...attendanceRows];
    
    const userMap = {}; 
    attendanceRows.forEach(r => {
        userMap[r.ID] = { HR_FNAME: r.HR_FNAME, HR_LNAME: r.HR_LNAME, HR_DEPARTMENT_NAME: r.HR_DEPARTMENT_NAME, HR_PERSON_TYPE_NAME: r.HR_PERSON_TYPE_NAME };
    });

    // Merge Holidays into records
    holidayRows.forEach(h => {
        const dStr = formatDate(h.date);
        finalRecords.forEach(r => {
            if (r.date == dStr) r.holiday = h.day_name;
        });
        if (!finalRecords.some(r => r.date == dStr)) {
            finalRecords.push({ date: dStr, holiday: h.day_name, is_system: true });
        }
    });

    // Process Leaves
    leaveRows.forEach(l => {
        let current = new Date(l.LEAVE_DATE_BEGIN);
        const end = new Date(l.LEAVE_DATE_END);
        while (current <= end) {
            const dStr = formatDate(current);
            if (dStr.startsWith(`${year}-${formattedMonth}`)) {
                let rec = finalRecords.find(r => r.ID == l.ID && r.date == dStr);
                if (rec) {
                    rec.leave = l.LEAVE_BECAUSE;
                    rec.leave_type = l.DAY_TYPE_ID;
                } else if (userMap[l.ID]) {
                    finalRecords.push({
                        ...userMap[l.ID],
                        ID: l.ID,
                        date: dStr,
                        leave: l.LEAVE_BECAUSE,
                        leave_type: l.DAY_TYPE_ID
                    });
                }
            }
            current.setDate(current.getDate() + 1);
        }
    });

    // Process Official Business
    officialRows.forEach(o => {
        let current = new Date(o.DATE_GO);
        const end = new Date(o.DATE_BACK);
        while (current <= end) {
            const dStr = formatDate(current);
            if (dStr.startsWith(`${year}-${formattedMonth}`)) {
                let rec = finalRecords.find(r => r.ID == o.ID && r.date == dStr);
                if (rec) {
                    rec.official = o.official_head;
                    rec.official_type = o.DAY_TYPE_ID;
                } else if (userMap[o.ID]) {
                    finalRecords.push({
                        ...userMap[o.ID],
                        ID: o.ID,
                        date: dStr,
                        official: o.official_head,
                        official_type: o.DAY_TYPE_ID
                    });
                }
            }
            current.setDate(current.getDate() + 1);
        }
    });

    res.json(finalRecords);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the process using it and try again.`);
  } else {
    console.error('Server error:', err);
  }
});
