import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, UserCircle } from 'lucide-react';

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

    useEffect(() => {
        const fetchData = async () => {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` };
            const [shiftRes, tempRes] = await Promise.all([
                fetch('http://localhost:5001/api/shifts', { headers }),
                fetch('http://localhost:5001/api/time-templates', { headers })
            ]);
            setAssignments(await shiftRes.json());
            setTemplates(await tempRes.json());
            setLoading(false);
        };
        if (user) fetchData();
    }, [user]);

    const handleUpdate = async (personId: string, templateId: string) => {
        const headers = { 
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
        };
        await fetch('http://localhost:5001/api/shifts', {
            method: 'POST',
            headers,
            body: JSON.stringify({ personId, templateId })
        });
        setAssignments(prev => prev.map(a => a.ID === personId ? {...a, TEMPLATE_ID: templateId} : a));
    };

    if (loading) return <div className="container" style={{ paddingTop: '100px' }}>Loading...</div>;

    return (
        <div className="container" style={{ paddingTop: '100px' }}>
            <div className="report-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>ตั้งค่าเวรปฏิบัติราชการ</h2>
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
                        {assignments.map(a => (
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
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ShiftManagement;
