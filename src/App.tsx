import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/theme.css';
import './styles/auth.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ShiftManagement from './pages/ShiftManagement';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStaffType, setSelectedStaffType] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState('1');
  const [selectedPerson, setSelectedPerson] = useState('all');

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar 
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            selectedStaffType={selectedStaffType}
            setSelectedStaffType={setSelectedStaffType}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            selectedPerson={selectedPerson}
            setSelectedPerson={setSelectedPerson}
          />
          <main style={{ marginTop: '80px' }}>
            <Routes>
              <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard 
                        selectedMonth={selectedMonth}
                        selectedYear={selectedYear}
                        selectedDepartment={selectedDepartment}
                        selectedStaffType={selectedStaffType}
                        selectedTemplate={selectedTemplate}
                        selectedPerson={selectedPerson}
                    />
                  </ProtectedRoute>
                }
              />
              <Route path="/shift-management"
                element={
                  <ProtectedRoute>
                    <ShiftManagement />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
