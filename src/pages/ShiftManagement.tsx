import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, X } from 'lucide-react';
import { API_URL } from '../utils/constant';

interface ShiftAssignment {
    ID: string;
    HR_FNAME: string;
    HR_LNAME: string;
    HR_DEPARTMENT_NAME: string;
    TEMPLATE_ID: string | null;
}

interface Template {
    ID: string;
    HILING_TIME_NAME: string;
}

const ShiftManagement: React.FC = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` };
            try {
                const [shiftRes, tempRes] = await Promise.all([
                    fetch(`${API_URL}/shifts`, { headers }),
                    fetch(`${API_URL}/time-templates`, { headers })
                ]);
                const shiftData = await shiftRes.json();
                const tempData = await tempRes.json();
                if (Array.isArray(shiftData)) setAssignments(shiftData);
                if (Array.isArray(tempData)) setTemplates(tempData);
            } catch (err) {
                console.error('ShiftManagement: Failed to fetch data', err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchData();
    }, [user]);

    const handleUpdate = async (personId: string, templateId: string) => {
        const headers = { 
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        };
        try {
            await fetch(`${API_URL}/shifts`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ personId, templateId })
            });
            setAssignments(prev => prev.map(a => a.ID === personId ? {...a, TEMPLATE_ID: templateId} : a));
        } catch (err) {
            console.error('ShiftManagement: Failed to update shift', err);
        }
    };

    const filteredAssignments = assignments.filter(a => {
        const fullName = `${a.HR_FNAME} ${a.HR_LNAME}`.toLowerCase();
        const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        return searchTerms.every(term => fullName.includes(term));
    });

    if (loading) return (
        <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
            <div style={{ color: 'var(--primary-pink)', fontSize: '18px' }}>กำลังโหลดข้อมูล...</div>
        </div>
    );

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
            <div className="report-card">
                <div style={{ 
                    padding: '24px', 
                    background: 'white', 
                    borderBottom: '1px solid var(--soft-pink)',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap',
                    gap: '16px'
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.6rem', color: 'var(--dark-pink)', fontWeight: 600, margin: 0 }}>
                            ตั้งค่าเวรปฏิบัติราชการ
                        </h2>
                        <p style={{ fontSize: '16px', color: '#062ef4', marginTop: '4px' }}>
                            จัดการและเลือกเวลาปฏิบัติงานสำหรับบุคลากรแต่ละท่าน
                        </p>
                    </div>
                    <div style={{ position: 'relative', width: '350px' }}>
                        <input 
                            type="text"
                            placeholder="ค้นหาชื่อ หรือ นามสกุล..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '12px 40px 12px 16px', 
                                borderRadius: '12px', 
                                border: '2px solid var(--soft-pink)', 
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'all 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-pink)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--soft-pink)'}
                        />
                        <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-pink)' }}>
                            {searchQuery ? (
                                <X size={20} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
                            ) : (
                                <Search size={20} />
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th style={{ width: '25%',fontSize: '16px', }}>ชื่อ - สกุล</th>
                                <th style={{ width: '30%',fontSize: '16px', }}>แผนก</th>
                                <th style={{ width: '25%',fontSize: '16px', }}>เลือกเวลาปฏิบัติราชการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAssignments.length > 0 ? (
                                filteredAssignments.map(a => (
                                    <tr key={a.ID}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#333' }}>
                                                {a.HR_FNAME} {a.HR_LNAME}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ 
                                                padding: '4px 10px', 
                                                background: '#ecf3f6', 
                                                borderRadius: '6px', 
                                                fontSize: '14px',
                                                color: '#1d0eee'
                                            }}>
                                                {a.HR_DEPARTMENT_NAME || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="shift-btn-group">
                                                {templates.map(t => (
                                                    <button
                                                        key={t.ID}
                                                        className={`shift-btn ${a.TEMPLATE_ID === t.ID ? 'active' : ''}`}
                                                        onClick={() => handleUpdate(a.ID, t.ID)}
                                                    >
                                                        {t.HILING_TIME_NAME}
                                                    </button>
                                                ))}
                                                {templates.length === 0 && <span style={{ color: '#999', fontSize: '13px' }}>ไม่มีข้อมูลเวร</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                        <div style={{ fontSize: '16px' }}>ไม่พบรายชื่อบุคลากรที่คุณค้นหา</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ShiftManagement;
