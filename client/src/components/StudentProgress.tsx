import React, { useState, useEffect } from 'react';
import { studentsAPI, evaluationsAPI, attendanceAPI, evaluationCriteriaAPI } from '../services/api';
import { User, Calendar, Target, TrendingUp, Award, BookOpen, Clock, CheckSquare } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  group: string;
  startDate: string;
  attendancePercentage: number;
  performance: number;
  presentation: number;
  workbookProgress: number;
  trainingHours: number;
}

interface Evaluation {
  performance: number;
  presentation: number;
  attendance: number;
  workbook: number;
  constantTraining: number;
}

interface GroupInfo {
  name: string;
  days: string[];
  duration: string;
  activities: number;
}

interface EvaluationCriteria {
  workbookActivitiesMax: number;
  trainingHoursMax: number;
  workbookMultiplier: number;
  trainingMultiplier: number;
  attendanceDaysMax: number;
  performanceMax: number;
  presentationMax: number;
}

interface StudentProgressProps {
  studentId: string;
  clinicName: string;
}

const StudentProgress: React.FC<StudentProgressProps> = ({ studentId, clinicName }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriteria>({
    workbookActivitiesMax: 39,
    trainingHoursMax: 55,
    workbookMultiplier: 2.56,
    trainingMultiplier: 1.82,
    attendanceDaysMax: 39,
    performanceMax: 100,
    presentationMax: 100,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchCriteria = async () => {
    try {
      const studentResponse = await studentsAPI.getById(studentId);
      const studentData = studentResponse.data;
      const clinicId = typeof studentData.clinic === 'string' ? studentData.clinic : (studentData.clinic as any)?._id;
      
      const criteriaResponse = await evaluationCriteriaAPI.getByClinic(clinicId || '');
      console.log('📊 StudentProgress - Criteria loaded:', criteriaResponse.data);
      setCriteria(criteriaResponse.data);
    } catch (err: any) {
      console.error('Error loading criteria:', err);
    }
  };

  const fetchStudentData = async () => {
    try {
      const studentResponse = await studentsAPI.getById(studentId);
      await fetchCriteria(); // Load criteria after getting student data
      setStudent(studentResponse.data);

      const evaluationResponse = await evaluationsAPI.getLatestByStudent(studentId);
      if (evaluationResponse.data) {
        setEvaluation(evaluationResponse.data);
      }
    } catch (err: any) {
      setError('Error al cargar los datos del alumno');
      console.error('Error fetching student data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        Alumno no encontrado
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {clinicName} - Evaluación / Progreso
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="bg-gray-200 w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User size={40} className="text-gray-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">{student.name}</h2>
              <p className="text-gray-600">{student.group}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Fecha de inicio</p>
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(student.startDate).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Información General</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total de días del grupo</p>
                <p className="text-lg font-medium text-gray-800">{criteria.attendanceDaysMax} días</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Total de actividades</p>
                <p className="text-lg font-medium text-gray-800">{criteria.workbookActivitiesMax} actividades</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Meta capacitación</p>
                <p className="text-lg font-medium text-gray-800">{criteria.trainingHoursMax} horas</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Horas completadas</p>
                <p className="text-lg font-medium text-gray-800">{student.trainingHours} horas</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-6">Progreso</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Asistencia</span>
                  </div>
                  <span className={`text-sm font-bold ${getProgressTextColor(student.attendancePercentage)}`}>
                    {student.attendancePercentage}% ({Math.round(student.attendancePercentage * criteria.attendanceDaysMax / 100)}/{criteria.attendanceDaysMax})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(student.attendancePercentage)}`}
                    style={{ width: `${student.attendancePercentage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Desempeño</span>
                  </div>
                  <span className={`text-sm font-bold ${getProgressTextColor(student.performance)}`}>
                    {student.performance}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(student.performance)}`}
                    style={{ width: `${student.performance}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Presentación</span>
                  </div>
                  <span className={`text-sm font-bold ${getProgressTextColor(student.presentation)}`}>
                    {student.presentation}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(student.presentation)}`}
                    style={{ width: `${student.presentation}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Cuadernillo</span>
                  </div>
                  <span className={`text-sm font-bold ${getProgressTextColor(student.workbookProgress)}`}>
                    {student.workbookProgress}% ({Math.round(student.workbookProgress * criteria.workbookActivitiesMax / 100)}/{criteria.workbookActivitiesMax})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(student.workbookProgress)}`}
                    style={{ width: `${student.workbookProgress}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Capacitación constante</span>
                  </div>
                  <span className={`text-sm font-bold ${getProgressTextColor(Math.min(100, student.trainingHours * 100 / criteria.trainingHoursMax))}`}>
                    {Math.min(100, Math.round(student.trainingHours * 100 / criteria.trainingHoursMax))}% ({student.trainingHours}/{criteria.trainingHoursMax}h)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(Math.min(100, Math.round(student.trainingHours * 100 / criteria.trainingHoursMax)))}`}
                    style={{ width: `${Math.min(100, Math.round(student.trainingHours * 100 / criteria.trainingHoursMax))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgress;
