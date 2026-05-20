import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { API_URL } from '../utils/constant';

interface Department {
  HR_DEPARTMENT_ID: string;
  HR_DEPARTMENT_NAME: string;
}

interface StaffType {
    HR_PERSON_TYPE_ID: string;
    HR_PERSON_TYPE_NAME: string;
}

interface Person {
    ID: string;
    HR_FNAME: string;
    HR_LNAME: string;
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
  selectedPerson?: string;
  setSelectedPerson?: React.Dispatch<React.SetStateAction<string>>;
}

const Navbar: React.FC<NavbarProps> = ({ 
    selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
    selectedDepartment, setSelectedDepartment,
    selectedStaffType, setSelectedStaffType,
    selectedTemplate, setSelectedTemplate,
    selectedPerson, setSelectedPerson
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffTypes, setStaffTypes] = useState<StaffType[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [personSearch, setPersonSearch] = useState('');
  const [showPersonDropdown, setShowPersonList] = useState(false);
  const personDropdownRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (personDropdownRef.current && !personDropdownRef.current.contains(event.target as Node)) {
        setShowPersonList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` };

            const [depRes, typeRes] = await Promise.all([
                fetch(`${API_URL}/departments`, { headers }),
                fetch(`${API_URL}/staff-types`, { headers })
            ]);

            const [depData, typeData] = await Promise.all([
                depRes.json(),
                typeRes.json()
            ]);

            if (Array.isArray(depData)) setDepartments(depData);
            if (Array.isArray(typeData)) setStaffTypes(typeData);
        } catch (err) {
            console.error('Navbar: Failed to fetch filter data', err);
        }
    };
    if (user) fetchData();
  }, [user]);
  useEffect(() => {
    const fetchPersons = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` };
            const res = await fetch(`${API_URL}/persons?departmentId=${selectedDepartment}`, { headers });
            const data = await res.json();
            if (Array.isArray(data)) setPersons(data);
        } catch (err) {
            console.error('Navbar: Failed to fetch persons', err);
        }
    };
    if (user) {
        fetchPersons();
        if (setSelectedPerson) setSelectedPerson('all');
        setPersonSearch('');
    }
  }, [user, selectedDepartment, setSelectedPerson]);

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

  const filteredPersons = persons.filter(p => {
    const fullName = `${p.HR_FNAME} ${p.HR_LNAME}`.toLowerCase();
    const searchTerms = personSearch.toLowerCase().split(/\s+/).filter(Boolean);
    return searchTerms.every(term => fullName.includes(term));
  });

  const selectedPersonName = persons.find(p => p.ID === selectedPerson);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, width: '100%',
      padding: scrolled ? '15px 0' : '20px 0',
      backgroundColor: scrolled ? 'var(--white)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      boxShadow: scrolled ? '0 2px 10px rgba(0,0,0,0.05)' : 'none',
      transition: 'all 0.3s', zIndex: 1000
    }}>
      <div className="container" style={{ maxWidth: '98%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-pink)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            ATTENDANCE<span style={{ color: 'var(--deep-grey)' }}> :: K H O S</span>
          </Link>
          
          {isDashboard && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '15px', borderLeft: '1px solid #e5e7eb', color: '#374151', fontWeight: 600 }}>
              
              {/* Template Buttons */}
              <div style={{ display: 'flex', gap: '3px', background: '#f3f4f6', padding: '3px', borderRadius: '8px' }}>
                <button 
                  onClick={() => setSelectedTemplate && setSelectedTemplate('1')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    backgroundColor: selectedTemplate === '1' ? 'var(--primary-pink)' : 'transparent',
                    color: selectedTemplate === '1' ? 'white' : '#6b7280'
                  }}
                >
                  เวรปกติ
                </button>
                <button 
                  onClick={() => setSelectedTemplate && setSelectedTemplate('2')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    backgroundColor: selectedTemplate === '2' ? 'var(--primary-pink)' : 'transparent',
                    color: selectedTemplate === '2' ? 'white' : '#6b7280'
                  }}
                >
                  เวร 8 ชม.
                </button>
              </div>

              {/* Staff Type Dropdown */}
              <select value={selectedStaffType} onChange={(e) => setSelectedStaffType && setSelectedStaffType(e.target.value)}
                style={{ padding: '6px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f3f4f6', fontSize: '14px' }}>
                <option value="all">ทุกประเภท</option>
                {staffTypes.map(t => (
                    <option key={t.HR_PERSON_TYPE_ID} value={t.HR_PERSON_TYPE_ID}>{t.HR_PERSON_TYPE_NAME}</option>
                ))}
              </select>

              {/* Department Dropdown */}
              <select value={selectedDepartment} onChange={(e) => setSelectedDepartment && setSelectedDepartment(e.target.value)}
                style={{ padding: '6px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f3f4f6', fontSize: '14px', maxWidth: '150px' }}>
                <option value="all">ทุกแผนก</option>
                {departments.map(d => (
                    <option key={d.HR_DEPARTMENT_ID} value={d.HR_DEPARTMENT_ID}>{d.HR_DEPARTMENT_NAME}</option>
                ))}
              </select>

              {/* Searchable Person Dropdown */}
              <div ref={personDropdownRef} style={{ position: 'relative', width: '200px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                        type="text"
                        placeholder={selectedPerson === 'all' ? "รายบุคคล (ทุกคน)" : `${selectedPersonName?.HR_FNAME} ${selectedPersonName?.HR_LNAME}`}
                        value={personSearch}
                        onChange={(e) => {
                            setPersonSearch(e.target.value);
                            setShowPersonList(true);
                        }}
                        onFocus={() => setShowPersonList(true)}
                        style={{ 
                            width: '100%', 
                            padding: '6px 30px 6px 10px', 
                            borderRadius: '8px', 
                            border: '1px solid #e5e7eb', 
                            background: '#f3f4f6', 
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                    <div style={{ position: 'absolute', right: '8px', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                        {personSearch || selectedPerson !== 'all' ? (
                            <X size={14} style={{ cursor: 'pointer' }} onClick={() => {
                                setPersonSearch('');
                                if (setSelectedPerson) setSelectedPerson('all');
                            }} />
                        ) : (
                            <Search size={14} />
                        )}
                    </div>
                </div>
                
                {showPersonDropdown && (
                    <div style={{ 
                        position: 'absolute', top: '100%', left: 0, width: '100%', 
                        background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '4px',
                        maxHeight: '300px', overflowY: 'auto', zIndex: 1001
                    }}>
                        <div 
                            onClick={() => {
                                if (setSelectedPerson) setSelectedPerson('all');
                                setPersonSearch('');
                                setShowPersonList(false);
                            }}
                            style={{ 
                                padding: '8px 12px', cursor: 'pointer', fontSize: '14px',
                                background: selectedPerson === 'all' ? '#f3f4f6' : 'transparent',
                                borderBottom: '1px solid #f3f4f6'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = selectedPerson === 'all' ? '#f3f4f6' : 'transparent'}
                        >
                            ทุกคน
                        </div>
                        {filteredPersons.length > 0 ? (
                            filteredPersons.map(p => (
                                <div 
                                    key={p.ID}
                                    onClick={() => {
                                        if (setSelectedPerson) setSelectedPerson(p.ID);
                                        setPersonSearch('');
                                        setShowPersonList(false);
                                    }}
                                    style={{ 
                                        padding: '8px 12px', cursor: 'pointer', fontSize: '14px',
                                        background: selectedPerson === p.ID ? '#f3f4f6' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = selectedPerson === p.ID ? '#f3f4f6' : 'transparent'}
                                >
                                    {p.HR_FNAME} {p.HR_LNAME}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '8px 12px', color: '#9ca3af', fontSize: '13px' }}>ไม่พบรายชื่อ</div>
                        )}
                    </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#f3f4f6', padding: '3px 8px', borderRadius: '8px' }}>
                <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={14} /></button>
                <span style={{ fontSize: '14px' }}>{months[selectedMonth! - 1]}</span>
                <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight size={14} /></button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#f3f4f6', padding: '3px 8px', borderRadius: '8px' }}>
                <button onClick={() => changeYear(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={14} /></button>
                <span style={{ fontSize: '14px' }}>พ.ศ. {selectedYear! + 543}</span>
                <button onClick={() => changeYear(1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>

        <ul style={{ display: 'flex', gap: '20px', fontWeight: 500, alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><Link to="/" style={{ color: 'var(--deep-grey)', textDecoration: 'none', fontSize: '14px' }}>Home</Link></li>
          {user ? (
            <>
              <li><Link to="/dashboard" style={{ color: 'var(--deep-grey)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}><User size={16} />Dashboard</Link></li>
              <li><Link to="/shift-management" style={{ color: 'var(--deep-grey)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}><User size={16} />ตั้งค่าเวร</Link></li>
              <li><button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--deep-grey)', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}><LogOut size={16} />Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login" style={{ color: 'var(--deep-grey)', textDecoration: 'none', fontSize: '14px' }}>Login</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
