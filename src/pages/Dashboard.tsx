import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Printer } from 'lucide-react';

interface RawRecord {
  ID: string;
  HR_FNAME: string;
  HR_LNAME: string;
  HR_DEPARTMENT_NAME: string;
  HR_PERSON_TYPE_NAME: string;
  date: string;
  check_in: string;
  check_out: string;
  leave?: string;
  leave_type?: string;
  official?: string;
  official_type?: string;
  holiday?: string;
  is_system?: boolean;
}

interface DashboardProps {
  selectedMonth: number;
  selectedYear: number;
  selectedDepartment: string;
  selectedStaffType: string;
  selectedTemplate: string;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedMonth, selectedYear, selectedDepartment, selectedStaffType, selectedTemplate }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<RawRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/attendance/history?month=${selectedMonth}&year=${selectedYear}&departmentId=${selectedDepartment}&staffTypeId=${selectedStaffType}&templateId=${selectedTemplate}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedDepartment, selectedStaffType, selectedTemplate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const daysInMonth = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: date }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  // Map of day -> holidayName
  const holidayMap = useMemo(() => {
    const map: Record<number, string> = {};
    history.forEach(r => {
      if (r.holiday && r.date) {
        const d = parseInt(r.date.split('-')[2]);
        if (!map[d]) map[d] = r.holiday;
      }
    });
    return map;
  }, [history]);

  // Group data by Employee (excluding system records)
  const groupedData = useMemo(() => {
    const map: Record<string, any> = {}
    history.forEach(r => {
      if (r.is_system) return;
      if (!map[r.ID]) map[r.ID] = { 
          name: `${r.HR_FNAME} ${r.HR_LNAME}`, 
          department: r.HR_DEPARTMENT_NAME || '-', 
          person_type: r.HR_PERSON_TYPE_NAME || '-',
          id: r.ID, 
          days: {} 
      }
      // Parse date 'YYYY-MM-DD'
      if (r.date) { 
        const d = parseInt(r.date.split('-')[2]);
        map[r.ID].days[d] = {
            in: r.check_in,
            out: r.check_out,
            leave: r.leave,
            leave_type: r.leave_type,
            official: r.official,
            official_type: r.official_type,
            holiday: r.holiday
        }
      }
    });
    return Object.values(map);
  }, [history]);

  const handlePrint = () => window.print();

  return (
    <div className="dashboard-container attendance-mode">
      
      <div className="report-container">
        <div className="card-header no-print">
          <div className="title-area">
            <BarChart3 className="header-icon" />
            <h2>รายงานการปฏิบัติงาน</h2>
          </div>
          <button onClick={handlePrint} className="print-btn"><Printer size={20} /></button>
        </div>

        <div className="table-container">
          <table className="horizontal-report">
            <thead>
              <tr>
                <th rowSpan={3} className="sticky-col-1">ชื่อ - สกุล</th>
                <th rowSpan={3} className="sticky-col-2">รหัส</th>
                <th rowSpan={3} className="sticky-col-3">แผนก</th>
                {daysInMonth.map(d => {
                  const date = new Date(selectedYear, selectedMonth - 1, d);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const holidayName = holidayMap[d];
                  return (
                    <th key={d} colSpan={2} style={{ textAlign: 'center', backgroundColor: holidayName ? '#FCE4EC' : undefined }} className={isWeekend ? 'weekend-header' : ''}>
                        <div style={{ fontSize: '14px' }}>วันที่ {d}</div>
                        {holidayName && (
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#eb1443', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px', margin: '0 auto' }}>
                                {holidayName}
                            </div>
                        )}
                    </th>
                  );
                })}
              </tr>
              <tr>
                {daysInMonth.map(d => {
                  const date = new Date(selectedYear, selectedMonth - 1, d);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const holidayName = holidayMap[d];
                  return (
                    <React.Fragment key={d}>
                      <th style={{ fontSize: '14px', backgroundColor: holidayName ? '#FCE4EC' : undefined }} className={isWeekend ? 'weekend-header' : ''}>เช้า</th>
                      <th style={{ fontSize: '14px', backgroundColor: holidayName ? '#FCE4EC' : undefined }} className={isWeekend ? 'weekend-header' : ''}>บ่าย</th>
                    </React.Fragment>                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groupedData.map((emp: any) => (
                <tr key={emp.id}>
                  <td className="sticky-col-1">{emp.name}</td>
                  <td className="sticky-col-2">{emp.id}</td>
                  <td className="sticky-col-3">{emp.department}</td>
                  {daysInMonth.map(d => {
                    const dateObj = new Date(selectedYear, selectedMonth - 1, d);
                    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                    const data = emp.days[d];
                    
                    const isHoliday = !!data?.holiday;
                    
                    // Determine what to show in "In" slot
                    let inContent: React.ReactNode = data?.in || '-';
                    let inStyle: React.CSSProperties = {};
                    let inColSpan = 1;

                    // Determine what to show in "Out" slot
                    let outContent: React.ReactNode = data?.out || '-';
                    let outStyle: React.CSSProperties = {};
                    let showOut = true;

                    // Handle Leave Logic
                    if (data?.leave) {
                        const style = { color: '#ef4444', fontWeight: 600, fontSize: '14px', backgroundColor: '#fef9c3' };
                        if (data.leave_type === '01') { // Full
                            inContent = data.leave;
                            inStyle = style;
                            inColSpan = 2;
                            showOut = false;
                        } else if (data.leave_type === '02') { // Morning
                            inContent = data.leave;
                            inStyle = style;
                        } else if (data.leave_type === '03') { // Afternoon
                            outContent = data.leave;
                            outStyle = style;
                        }
                    }

                    // Handle Official Logic
                    if (data?.official && inColSpan === 1) {
                        const style = { color: '#3b82f6', fontWeight: 600, fontSize: '14px', backgroundColor: '#fef9c3' };
                        if (data.official_type === '01') { // Full
                            inContent = data.official;
                            inStyle = style;
                            inColSpan = 2;
                            showOut = false;
                        } else if (data.official_type === '02') { // Morning
                            inContent = data.official;
                            inStyle = style;
                        } else if (data.official_type === '03') { // Afternoon
                            outContent = data.official;
                            outStyle = style;
                        }
                    }

                    return (
                      <React.Fragment key={d}>
                        <td 
                          className={`time-cell in ${isWeekend ? 'weekend-cell' : ''} ${isHoliday ? 'holiday-cell' : ''}`}
                          style={{ 
                            backgroundColor: isHoliday ? '#FCE4EC' : undefined,
                            ...inStyle
                          }}
                          colSpan={inColSpan}
                        >
                          {inContent}
                        </td>
                        {showOut && (
                          <td 
                            className={`time-cell out ${isWeekend ? 'weekend-cell' : ''} ${isHoliday ? 'holiday-cell' : ''}`}
                            style={{ 
                                backgroundColor: isHoliday ? '#FCE4EC' : undefined,
                                ...outStyle
                            }}
                          >
                            {outContent}
                          </td>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
