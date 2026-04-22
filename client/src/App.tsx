import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ClinicsList from './components/ClinicsList';
import StudentsList from './components/StudentsList';
import AddStudentForm from './components/AddStudentForm';
import AttendanceTracking from './components/AttendanceTracking';
import StudentProgress from './components/StudentProgress';
import AttendanceHistory from './components/AttendanceHistory';
import StudentEvaluation from './components/StudentEvaluation';
import Reports from './components/Reports';
import './App.css';

interface Clinic {
  _id: string;
  name: string;
}

interface Student {
  _id: string;
  name: string;
}

const StudentProgressWrapper: React.FC<{ clinicName: string }> = ({ clinicName }) => {
  const { studentId } = useParams<{ studentId: string }>();
  return <StudentProgress studentId={studentId || ''} clinicName={clinicName} />;
};

const AttendanceHistoryWrapper: React.FC<{ clinicName: string }> = ({ clinicName }) => {
  const { studentId } = useParams<{ studentId: string }>();
  return (
    <AttendanceHistory 
      studentId={studentId || ''} 
      studentName="Alumno" 
      studentGroup="Grupo" 
      clinicName={clinicName} 
    />
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(() => {
    const saved = localStorage.getItem('selectedClinic');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showStudentEvaluation, setShowStudentEvaluation] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  const handleSelectClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    localStorage.setItem('selectedClinic', JSON.stringify(clinic));
    navigate('/students');
  };

  const handleAddStudent = () => {
    setShowAddStudent(true);
  };

  const handleCloseAddStudent = () => {
    setShowAddStudent(false);
  };

  const handleStudentSuccess = () => {
    // Refrescar
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    window.location.href = `/student/${student._id}/progress`;
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentEvaluation(true);
  };

  const handleCloseStudentEvaluation = () => {
    setShowStudentEvaluation(false);
    setSelectedStudent(null);
  };

  const handleEvaluationSuccess = () => {
    // Refrescar
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentClinic={selectedClinic?.name} />
      
      <div className="flex-1 overflow-auto main-content">
        <Routes>
          <Route path="/clinics" element={<ClinicsList onSelectClinic={handleSelectClinic} />} />
          
          <Route path="/students" element={
            selectedClinic ? (
              <>
                <StudentsList
                  clinicId={selectedClinic?._id || ''}
                  clinicName={selectedClinic?.name || ''}
                  onAddStudent={handleAddStudent}
                  onViewStudent={handleViewStudent}
                  onEditStudent={handleEditStudent}
                />
                {showAddStudent && (
                  <AddStudentForm
                    clinicId={selectedClinic?._id || ''}
                    clinicName={selectedClinic?.name || ''}
                    onClose={handleCloseAddStudent}
                    onSuccess={handleStudentSuccess}
                  />
                )}
                {showStudentEvaluation && selectedStudent && (
                  <StudentEvaluation
                    studentId={selectedStudent._id}
                    clinicName={selectedClinic?.name || ''}
                    onClose={handleCloseStudentEvaluation}
                    onSuccess={handleEvaluationSuccess}
                  />
                )}
              </>
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="/attendance" element={
            selectedClinic ? (
              <AttendanceTracking
                clinicId={selectedClinic?._id || ''}
                clinicName={selectedClinic?.name || ''}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="/evaluations" element={
            selectedClinic ? (
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                  Evaluaciones - {selectedClinic?.name}
                </h1>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-gray-600">
                    Seleccione un alumno desde la lista de alumnos para ver su progreso o realizar una evaluación.
                  </p>
                </div>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="/student/:studentId/progress" element={
            <StudentProgressWrapper clinicName={selectedClinic?.name || ''} />
          } />

          <Route path="/student/:studentId/attendance" element={
            <AttendanceHistoryWrapper clinicName={selectedClinic?.name || ''} />
          } />

          <Route path="/reports" element={<Reports />} />

          <Route path="/dashboard" element={
            selectedClinic ? (
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  Bienvenido a {selectedClinic?.name}
                </h1>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="/" element={<ClinicsList onSelectClinic={handleSelectClinic} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
