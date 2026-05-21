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
    const { user, authenticatedFetch } = useAuth();
    const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [shiftRes, tempRes] = await Promise.all([
                    authenticatedFetch(`${API_URL}/shifts`),
                    authenticatedFetch(`${API_URL}/time-templates`)
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
    }, [user, authenticatedFetch]);

    const handleUpdate = async (personId: string, templateId: string) => {
        try {
            await authenticatedFetch(`${API_URL}/shifts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    if (loading) return <div className="container" style={{ paddingTop: '100px' }}>Loading...</div>;

    return (
        <div className="container" style={{ paddingTop: '100px' }}>
            <div className="report-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>ตั้งค่าเวรปฏิบัติราชการ</h2>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <input 
                            type="text"
                            placeholder="ค้นหาชื่อบุคลากร..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '8px 35px 8px 12px', 
                                borderRadius: '8px', 
                                border: '1px solid #e5e7eb', 
                                fontSize: '14px'
                            }}
                        />
                        <div style={{ position: 'absolute', right: '10px', top: '10px', color: '#9ca3af' }}>
                            {searchQuery ? (
                                <X size={16} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
                            ) : (
                                <Search size={16} />
                            )}
                        </div>
                    </div>
                </div>

                <table className="table-modern" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>ชื่อ - สกุล</th>
                            <th>แผนก</th>
                            <th>เวรปัจจุบัน</th>
                            <th>เปลี่ยนเวร</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssignments.length > 0 ? (
                            filteredAssignments.map(a => (
                                <tr key={a.ID}>
                                    <td>{a.HR_FNAME} {a.HR_LNAME}</td>
                                    <td>{a.HR_DEPARTMENT_NAME || '-'}</td>
                                    <td>{templates.find(t => t.ID === a.TEMPLATE_ID)?.HILING_TIME_NAME || 'ยังไม่ได้กำหนด'}</td>
                                    <td>
                                        <select 
                                            value={a.TEMPLATE_ID || ''} 
                                            onChange={(e) => handleUpdate(a.ID, e.target.value)}
                                            style={{ padding: '5px', borderRadius: '4px' }}
                                        >
                                            <option value="">เลือกเวร</option>
                                            {templates.map(t => <option key={t.ID} value={t.ID}>{t.HILING_TIME_NAME}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>ไม่พบรายชื่อบุคลากร</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ShiftManagement;
