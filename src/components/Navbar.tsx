import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

interface Department {
  HR_DEPARTMENT_ID: string;
  HR_DEPARTMENT_NAME: string;
}

interface StaffType {
    HR_PERSON_TYPE_ID: string;
    HR_PERSON_TYPE_NAME: string;
}

interface TimeTemplate {
    ID: string;
    HILING_TIME_NAME: string;
}

interface NavbarProps {
  selectedMonth?: number;
  setSelectedMonth?: React.Dispatch<React.SetStateAction<number>>;
  selectedYear?: number;
  setSelectedYear?: React.Dispatch<React.SetStateAction<number>>;
  selectedDepartment?: string;
  setSelectedDepartment?: React.Dispatch<React.SetStateAction<string>>;
  selectedStaffType?: string;
  setSelectedStaffType?: React.Dispatch<React.SetStateAction<string>>;
  selectedTemplate?: string;
  setSelectedTemplate?: React.Dispatch<React.SetStateAction<string>>;
}

const Navbar: React.FC<NavbarProps> = ({ 
    selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
    selectedDepartment, setSelectedDepartment,
    selectedStaffType, setSelectedStaffType,
    selectedTemplate, setSelectedTemplate
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffTypes, setStaffTypes] = useState<StaffType[]>([]);
  const [templates, setTemplates] = useState<TimeTemplate[]>([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` };
            
            const [depRes, typeRes, tempRes] = await Promise.all([
                fetch('http://localhost:5001/api/departments', { headers }),
                fetch('http://localhost:5001/api/staff-types', { headers }),
                fetch('http://localhost:5001/api/time-templates', { headers })
            ]);

            const [depData, typeData, tempData] = await Promise.all([
                depRes.json(),
                typeRes.json(),
                tempRes.json()
            ]);

            if (Array.isArray(depData)) setDepartments(depData);
            if (Array.isArray(typeData)) setStaffTypes(typeData);
            if (Array.isArray(tempData)) setTemplates(tempData);
        } catch (err) {
            console.error('Navbar: Failed to fetch filter data', err);
        }
    };
    if (user) fetchData();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isDashboard = location.pathname === '/dashboard';
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  const changeMonth = (delta: number) => {
    if (!setSelectedMonth || !selectedMonth) return;
    let newMonth = selectedMonth + delta;
    if (newMonth > 12) newMonth = 1;
    else if (newMonth < 1) newMonth = 12;
    setSelectedMonth(newMonth);
  };

  const changeYear = (delta: number) => {
    if (!setSelectedYear || !selectedYear) return;
    setSelectedYear(selectedYear + delta);
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, width: '100%',
      padding: scrolled ? '15px 0' : '20px 0',
      backgroundColor: scrolled ? 'var(--white)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      boxShadow: scrolled ? '0 2px 10px rgba(0,0,0,0.05)' : 'none',
      transition: 'all 0.3s', zIndex: 1000
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-pink)', textDecoration: 'none' }}>
            ATTENDANCE<span style={{ color: 'var(--deep-grey)' }}>  K : H : O : S</span>
          </Link>
          
          {isDashboard && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '20px', borderLeft: '1px solid #e5e7eb', color: '#374151', fontWeight: 600 }}>
              <BarChart3 size={20} />
              
              {/* Template Dropdown */}
              <select value={selectedTemplate} onChange={(e) => setSelectedTemplate && setSelectedTemplate(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fef9c3', fontSize: '14px', fontWeight: 700 }}>
                <option value="all">ทุกรูปแบบเวลา</option>
                {templates.map(t => (
                    <option key={t.ID} value={t.ID}>{t.HILING_TIME_NAME}</option>
                ))}
              </select>

              {/* Staff Type Dropdown */}
              <select value={selectedStaffType} onChange={(e) => setSelectedStaffType && setSelectedStaffType(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f3f4f6', fontSize: '14px' }}>
                <option value="all">ทุกประเภท</option>
                {staffTypes.map(t => (
                    <option key={t.HR_PERSON_TYPE_ID} value={t.HR_PERSON_TYPE_ID}>{t.HR_PERSON_TYPE_NAME}</option>
                ))}
              </select>

              {/* Department Dropdown */}
              <select value={selectedDepartment} onChange={(e) => setSelectedDepartment && setSelectedDepartment(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f3f4f6', fontSize: '14px' }}>
                <option value="all">ทุกแผนก</option>
                {departments.map(d => (
                    <option key={d.HR_DEPARTMENT_ID} value={d.HR_DEPARTMENT_ID}>{d.HR_DEPARTMENT_NAME}</option>
                ))}
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f3f4f6', padding: '5px 10px', borderRadius: '8px' }}>
                <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                <span>{months[selectedMonth! - 1]}</span>
                <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight size={16} /></button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f3f4f6', padding: '5px 10px', borderRadius: '8px' }}>
                <button onClick={() => changeYear(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                <span>พ.ศ. {selectedYear! + 543}</span>
                <button onClick={() => changeYear(1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>

        <ul style={{ display: 'flex', gap: '30px', fontWeight: 500, alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><Link to="/" style={{ color: 'var(--deep-grey)', textDecoration: 'none' }}>Home</Link></li>
          {user ? (
            <>
              <li><Link to="/dashboard" style={{ color: 'var(--deep-grey)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}><User size={18} />Dashboard</Link></li>
              <li><button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--deep-grey)', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem' }}><LogOut size={18} />Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login" style={{ color: 'var(--deep-grey)', textDecoration: 'none' }}>Login</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
