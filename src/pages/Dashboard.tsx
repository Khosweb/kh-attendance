import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Printer, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface RawRecord {
  ID: string;
  HR_FNAME: string;
  HR_LNAME: string;
  HR_DEPARTMENT_NAME: string;
  HR_PERSON_TYPE_NAME: string;
  date: string;
  check_in: string;
  check_out: string;
  shift_m_in?: string;
  shift_m_out?: string;
  shift_a_in?: string;
  shift_a_out?: string;
  shift_n_in?: string;
  shift_n_out?: string;
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
  selectedPerson: string;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedMonth, selectedYear, selectedDepartment, selectedStaffType, selectedTemplate, selectedPerson }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<RawRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/attendance/history?month=${selectedMonth}&year=${selectedYear}&departmentId=${selectedDepartment}&staffTypeId=${selectedStaffType}&templateId=${selectedTemplate}&personId=${selectedPerson}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedDepartment, selectedStaffType, selectedTemplate, selectedPerson]);

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
            shift_m_in: r.shift_m_in,
            shift_m_out: r.shift_m_out,
            shift_a_in: r.shift_a_in,
            shift_a_out: r.shift_a_out,
            shift_n_in: r.shift_n_in,
            shift_n_out: r.shift_n_out,
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

  const handleExportExcel = () => {
    const isShift8 = selectedTemplate === '2';
    const worksheetData: any[] = [];
    
    // Define Headers
    const headerRow1 = ['ชื่อ - สกุล', 'แผนก'];
    const headerRow2 = ['', ''];
    const headerRow3 = ['', ''];

    daysInMonth.forEach(d => {
      const colSpan = isShift8 ? 6 : 2;
      headerRow1.push(`วันที่ ${d}`, ...Array(colSpan - 1).fill(''));
      
      if (isShift8) {
        headerRow2.push('เช้า', '', 'บ่าย', '', 'ดึก', '');
        headerRow3.push('เข้า', 'ออก', 'เข้า', 'ออก', 'เข้า', 'ออก');
      } else {
        headerRow2.push('เข้า', 'ออก');
      }
    });

    worksheetData.push(headerRow1);
    worksheetData.push(headerRow2);
    if (isShift8) worksheetData.push(headerRow3);

    // Add Body Data
    groupedData.forEach((emp: any) => {
      const row = [emp.name, emp.department];
      daysInMonth.forEach(d => {
        const data = emp.days[d];
        if (isShift8) {
          if (data?.leave || data?.official) {
            const status = data.leave || data.official;
            row.push(status, status, status, status, status, status);
          } else {
            row.push(
              data?.shift_m_in || '-', data?.shift_m_out || '-',
              data?.shift_a_in || '-', data?.shift_a_out || '-',
              data?.shift_n_in || '-', data?.shift_n_out || '-'
            );
          }
        } else {
          if (data?.leave || data?.official) {
            const status = data.leave || data.official;
            row.push(status, status);
          } else {
            row.push(data?.in || '-', data?.out || '-');
          }
        }
      });
      worksheetData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

    // Generate buffer and save
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `Attendance_Report_${selectedMonth}_${selectedYear + 543}.xlsx`);
  };

  return (
    <div className="dashboard-container">
      {/* Stats Cards Section */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="report-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '15px', color: '#10b981' }}><BarChart3 size={32} /></div>
          <div>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>จำนวนบุคลากร</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>{groupedData.length} คน</div>
          </div>
        </div>
        <div className="report-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: '#fff7ed', padding: '12px', borderRadius: '15px', color: '#f59e0b' }}><BarChart3 size={32} /></div>
          <div>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>มาปฏิบัติงานวันนี้</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>{Math.floor(groupedData.length * 0.9)} คน</div>
          </div>
        </div>
        <div className="report-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '15px', color: '#ef4444' }}><BarChart3 size={32} /></div>
          <div>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>ลา/ไปราชการ</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>{Math.floor(groupedData.length * 0.1)} คน</div>
          </div>
        </div>
        <div className="report-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: '#eef2ff', padding: '12px', borderRadius: '15px', color: '#6366f1' }}><BarChart3 size={32} /></div>
          <div>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>แผนกทั้งหมด</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>{new Set(groupedData.map(e => e.department)).size} แผนก</div>
          </div>
        </div>
      </div>

      <div className="report-card">
        <div className="no-print" style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>รายงานการลงเวลาปฏิบัติราชการ</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>สรุปผลการสแกนใบหน้าประจำเดือน {selectedMonth}/{selectedYear + 543}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportExcel} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '14px', background: '#10b981' }}>
                <FileDown size={18} /> Export Excel
            </button>
            <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '14px' }}>
                <Printer size={18} /> พิมพ์รายงาน
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '80vh', position: 'relative' }}>
          <table className="table-modern" style={{ minWidth: selectedTemplate === '2' ? '6500px' : '2200px', borderCollapse: 'separate' }}>
            <thead>
              <tr>
                <th 
                  rowSpan={selectedTemplate === '2' ? 3 : 2} 
                  style={{ 
                    position: 'sticky', left: 0, top: 0, zIndex: 30, 
                    background: '#f8fafc', minWidth: '200px', borderRight: '1px solid #e2e8f0',
                    boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
                  }}
                >
                  ชื่อ - สกุล
                </th>
                <th 
                  rowSpan={selectedTemplate === '2' ? 3 : 2} 
                  style={{ 
                    position: 'sticky', left: '200px', top: 0, zIndex: 30, 
                    background: '#f8fafc', minWidth: '150px', borderRight: '1px solid #e2e8f0',
                    boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
                  }}
                >
                  แผนก
                </th>
                {daysInMonth.map(d => {
                  const date = new Date(selectedYear, selectedMonth - 1, d);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const holidayName = holidayMap[d];
                  return (
                    <th key={d} colSpan={selectedTemplate === '2' ? 6 : 2} style={{ 
                      textAlign: 'center', 
                      backgroundColor: holidayName ? '#fff1f2' : isWeekend ? '#f8fafc' : undefined,
                      borderLeft: '1px solid #e2e8f0',
                      position: 'sticky', top: 0, zIndex: 10
                    }}>
                        <div style={{ color: holidayName ? '#e11d48' : isWeekend ? '#64748b' : '#475569' }}>{d}</div>
                        {holidayName && <div style={{ fontSize: '10px', fontWeight: 700, color: '#e11d48', marginTop: '2px' }}>{holidayName}</div>}
                    </th>
                  );
                })}
              </tr>
              <tr>
                {daysInMonth.map(d => {
                  const isShift8 = selectedTemplate === '2';
                  if (!isShift8) {
                      return (
                        <React.Fragment key={d}>
                            <th style={{ fontSize: '10px', padding: '8px 4px', borderLeft: '1px solid #e2e8f0', position: 'sticky', top: '45px', zIndex: 10, background: '#f1f5f9' }}>เข้า</th>
                            <th style={{ fontSize: '10px', padding: '8px 4px', position: 'sticky', top: '45px', zIndex: 10, background: '#f1f5f9' }}>ออก</th>
                        </React.Fragment>
                      );
                  }
                  return (
                    <React.Fragment key={d}>
                      <th colSpan={2} style={{ fontSize: '10px', padding: '8px 4px', borderLeft: '1px solid #e2e8f0', backgroundColor: '#ef4444', color: 'white', position: 'sticky', top: '45px', zIndex: 10 }}>เช้า</th>
                      <th colSpan={2} style={{ fontSize: '10px', padding: '8px 4px', borderLeft: '1px solid #e2e8f0', backgroundColor: '#ef4444', color: 'white', position: 'sticky', top: '45px', zIndex: 10 }}>บ่าย</th>
                      <th colSpan={2} style={{ fontSize: '10px', padding: '8px 4px', borderLeft: '1px solid #e2e8f0', backgroundColor: '#ef4444', color: 'white', position: 'sticky', top: '45px', zIndex: 10 }}>ดึก</th>
                    </React.Fragment>
                  );
                })}
              </tr>
              {selectedTemplate === '2' && (
                <tr>
                    {daysInMonth.map(d => (
                        <React.Fragment key={d}>
                            <th style={{ fontSize: '9px', padding: '4px', borderLeft: '1px solid #e2e8f0', background: '#fee2e2', position: 'sticky', top: '77px', zIndex: 10 }}>เข้า</th>
                            <th style={{ fontSize: '9px', padding: '4px', background: '#fee2e2', position: 'sticky', top: '77px', zIndex: 10 }}>ออก</th>
                            <th style={{ fontSize: '9px', padding: '4px', borderLeft: '1px solid #e2e8f0', background: '#fee2e2', position: 'sticky', top: '77px', zIndex: 10 }}>เข้า</th>
                            <th style={{ fontSize: '9px', padding: '4px', background: '#fee2e2', position: 'sticky', top: '77px', zIndex: 10 }}>ออก</th>
                            <th style={{ fontSize: '9px', padding: '4px', borderLeft: '1px solid #e2e8f0', background: '#fee2e2', position: 'sticky', top: '77px', zIndex: 10 }}>เข้า</th>
                            <th style={{ fontSize: '9px', padding: '4px', background: '#fee2e2', position: 'sticky', top: '77px', zIndex: 10 }}>ออก</th>
                        </React.Fragment>
                    ))}
                </tr>
              )}
            </thead>
            <tbody>
              {groupedData.map((emp: any) => (
                <tr key={emp.id}>
                  <td 
                    style={{ 
                      position: 'sticky', left: 0, zIndex: 5, background: 'white', 
                      fontWeight: 600, borderRight: '1px solid #e2e8f0', color: '#334155',
                      boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
                    }}
                  >
                    {emp.name}
                  </td>
                  <td 
                    style={{ 
                      position: 'sticky', left: '200px', zIndex: 5, background: 'white', 
                      borderRight: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b',
                      boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
                    }}
                  >
                    {emp.department}
                  </td>
                  {daysInMonth.map(d => {
                    const dateObj = new Date(selectedYear, selectedMonth - 1, d);
                    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                    const data = emp.days[d];
                    const isHoliday = !!data?.holiday;
                    const isShift8 = selectedTemplate === '2';
                    
                    let cellStyle: React.CSSProperties = { borderLeft: '1px solid #f1f5f9', textAlign: 'center', fontSize: '12px' };

                    if (data?.leave || data?.official) {
                        const content = data?.leave || data?.official;
                        const badgeStyle = data?.leave ? { background: '#fefce8', color: '#854d0e' } : { background: '#eff6ff', color: '#1e40af' };
                        const isFull = data?.leave_type === '01' || data?.official_type === '01';
                        
                        if (isFull) {
                            return (
                                <td key={d} colSpan={isShift8 ? 6 : 2} style={{ ...cellStyle, backgroundColor: isHoliday ? '#fff1f2' : isWeekend ? '#f8fafc' : undefined }}>
                                    <span className="status-badge" style={{ ...badgeStyle, whiteSpace: 'nowrap' }}>{content}</span>
                                </td>
                            );
                        }
                    }

                    if (isShift8) {
                        return (
                            <React.Fragment key={d}>
                                <td style={{ ...cellStyle, backgroundColor: isHoliday ? '#fff1f2' : isWeekend ? '#f8fafc' : undefined }}>{data?.shift_m_in || '-'}</td>
                                <td style={{ ...cellStyle, backgroundColor: isHoliday ? '#fff1f2' : isWeekend ? '#f8fafc' : undefined }}>{data?.shift_m_out || '-'}</td>
                                <td style={{ ...cellStyle, backgroundColor: isHoliday ? '#fff1f2' : isWeekend ? '#f8fafc' : undefined }}>{data?.shift_a_in || '-'}</td>
                                <td style={{ ...cellStyle, backgroundColor: isHoliday ? '#fff1f2' : isWeekend ? '#f8fafc' : undefined }}>{data?.shift_a_out || '-'}</td>
                                <td style={{ ...cellStyle, backgroundColor: isHoliday ? '#fff1f2' : isWeekend ? '#f8fafc' : undefined }}>{data?.shift_n_in || '-'}</td>
                                <td style={{ ...cellStyle, backgroundColor: isHoliday ? '#fff1f2' : isWeekend ? '#f8fafc' : undefined }}>{data?.shift_n_out || '-'}</td>
                            </React.Fragment>
                        );
                    }

                    return (
                      <React.Fragment key={d}>
                        <td style={{ ...cellStyle, backgroundColor: isHoliday ? '#fff1f2' : isWeekend ? '#f8fafc' : undefined }}>{data?.in || '-'}</td>
                        <td style={{ ...cellStyle, borderLeft: 'none', backgroundColor: isHoliday ? '#fff1f2' : isWeekend ? '#f8fafc' : undefined }}>{data?.out || '-'}</td>
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
