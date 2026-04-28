import React, { useState, useEffect } from 'react';
import { studentsAPI, evaluationsAPI, evaluationCriteriaAPI } from '../services/api';
import { 
  User, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Calculator, 
  Save, 
  X,
  Award,
  Info
} from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  group: string;
  attendancePercentage: number;
  workbookProgress: number;
  trainingHours: number;
  clinic: string;
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

interface StudentEvaluationProps {
  studentId: string;
  clinicName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const StudentEvaluation: React.FC<StudentEvaluationProps> = ({
  studentId,
  clinicName,
  onClose,
  onSuccess,
}) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriteria>({
    workbookActivitiesMax: 26,
    trainingHoursMax: 30,
    workbookMultiplier: parseFloat((100 / 26).toFixed(2)),
    trainingMultiplier: parseFloat((100 / 30).toFixed(2)),
    attendanceDaysMax: 25,
    performanceMax: 100,
    presentationMax: 100,
  });

  // Log initial criteria
  console.log('🎯 Initial criteria state:', criteria);
  const [formData, setFormData] = useState({
    performance: '',
    presentation: '',
    workbookActivities: '',
    trainingHours: '',
  });
  const [calculatedMetrics, setCalculatedMetrics] = useState({
    attendance: 0,
    workbook: 0,
    constantTraining: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudent();
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (student) {
      fetchCriteria();
    }
  }, [student]); // eslint-disable-line react-hooks/exhaustive-deps

  // Force refresh criteria on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (student) {
        console.log('🔄 Force refreshing criteria on mount...');
        fetchCriteria();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add event listener for criteria changes
  useEffect(() => {
    const handleCriteriaUpdate = (event: any) => {
      console.log('🔔 criteriaUpdated event received:', event.detail);
      console.log('🔔 Current student clinic ID:', typeof student?.clinic === 'string' ? student.clinic : (student?.clinic as any)?._id);
      console.log('🔔 Event clinic ID:', event.detail.clinicId);
      
      // Check if the event is for the same clinic
      const currentClinicId = typeof student?.clinic === 'string' ? student.clinic : (student?.clinic as any)?._id;
      if (event.detail.clinicId === currentClinicId) {
        console.log('🔔 Clinic IDs match, fetching new criteria...');
        fetchCriteria();
      } else {
        console.log('🔔 Clinic IDs do not match, ignoring event');
      }
    };

    console.log('Setting up criteriaUpdated event listener');
    window.addEventListener('criteriaUpdated', handleCriteriaUpdate);
    return () => {
      console.log('Cleaning up criteriaUpdated event listener');
      window.removeEventListener('criteriaUpdated', handleCriteriaUpdate);
    };
  }, [student]); // eslint-disable-line react-hooks/exhaustive-deps

  // Also add a periodic refresh as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (student) {
        fetchCriteria();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [student]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    calculateMetrics();
  }, [formData, student, criteria]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStudent = async () => {
    try {
      const response = await studentsAPI.getById(studentId);
      const studentData = response.data;
      setStudent(studentData);
      
      // Load existing evaluation data into form
      setFormData({
        performance: studentData.performance?.toString() || '',
        presentation: studentData.presentation?.toString() || '',
        workbookActivities: studentData.workbookProgress?.toString() || '',
        trainingHours: studentData.trainingHours?.toString() || '',
      });
      
      console.log('📝 Form data loaded from student:', {
        performance: studentData.performance,
        presentation: studentData.presentation,
        workbookProgress: studentData.workbookProgress,
        trainingHours: studentData.trainingHours
      });
    } catch (err: any) {
      setError('Error al cargar los datos del alumno');
    }
  };

  const fetchCriteria = async () => {
    try {
      const clinicId = typeof student?.clinic === 'string' ? student.clinic : (student?.clinic as any)?._id;
      console.log('Fetching criteria for clinic:', clinicId);
      console.log('Student data:', student);
      const response = await evaluationCriteriaAPI.getByClinic(clinicId || '');
      console.log('API Response:', response);
      console.log('Criteria received:', response.data);
      
      // Force update criteria state
      const newCriteria = response.data;
      console.log('🔄 Updating criteria state to:', newCriteria);
      setCriteria(newCriteria);
      console.log('✅ Criteria state updated');
      console.log('📊 New values:', {
        attendanceDaysMax: newCriteria.attendanceDaysMax,
        workbookActivitiesMax: newCriteria.workbookActivitiesMax,
        trainingHoursMax: newCriteria.trainingHoursMax
      });
      
      // Force a re-render to update the UI
      setTimeout(() => {
        console.log('🔄 Forcing UI update with criteria:', {
          attendanceDaysMax: newCriteria.attendanceDaysMax,
          workbookActivitiesMax: newCriteria.workbookActivitiesMax,
          trainingHoursMax: newCriteria.trainingHoursMax
        });
      }, 100);
      
      // Recalculate metrics with new criteria
      if (formData.workbookActivities || formData.trainingHours) {
        setTimeout(() => {
          calculateMetrics();
        }, 100);
      }
    } catch (err: any) {
      console.error('Error loading criteria:', err);
      console.error('Error details:', err.response?.data);
      // Use default criteria if API fails
    }
  };

  const calculateMetrics = () => {
    if (!student) return;

    const attendance = student.attendancePercentage;
    const workbook = Math.min(100, (Number(formData.workbookActivities) || 0) * criteria.workbookMultiplier);
    const constantTraining = Math.min(100, (Number(formData.trainingHours) || 0) * criteria.trainingMultiplier);

    console.log('Calculating metrics:', {
      workbookActivities: formData.workbookActivities,
      trainingHours: formData.trainingHours,
      workbookMultiplier: criteria.workbookMultiplier,
      trainingMultiplier: criteria.trainingMultiplier,
      workbook,
      constantTraining
    });

    setCalculatedMetrics({ attendance, workbook, constantTraining });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setIsLoading(true);
    setError('');

    try {
      await evaluationsAPI.create({
        student: studentId,
        clinic: student.clinic,
        performance: Number(formData.performance),
        presentation: Number(formData.presentation),
        workbookActivities: Number(formData.workbookActivities),
        trainingHours: Number(formData.trainingHours),
        ...calculatedMetrics,
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la evaluación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : Math.max(0, Math.min(100, Number(value)));
    setFormData({ ...formData, [name]: numValue });
  };

  if (!student) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="text-center text-gray-600">Cargando datos del alumno...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {clinicName} - Evaluación del alumno
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">{student.name}</h3>
            <p className="text-sm text-gray-600">Grupo: {student.group}</p>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Info size={16} />
                Criterios de Evaluación Activos
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={14} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Asistencia</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">{criteria.attendanceDaysMax}</div>
                  <div className="text-xs text-gray-600">días = 100%</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={14} className="text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Desempeño</span>
                  </div>
                  <div className="text-lg font-bold text-orange-600">{criteria.performanceMax}</div>
                  <div className="text-xs text-gray-600">puntos = 100%</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center gap-2 mb-1">
                    <Award size={14} className="text-pink-600" />
                    <span className="text-sm font-medium text-gray-700">Presentación</span>
                  </div>
                  <div className="text-lg font-bold text-pink-600">{criteria.presentationMax}</div>
                  <div className="text-xs text-gray-600">puntos = 100%</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen size={14} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Actividades del Cuadernillo</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{criteria.workbookActivitiesMax}</div>
                  <div className="text-xs text-gray-600">actividades = 100%</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Horas de Capacitación</span>
                  </div>
                  <div className="text-lg font-bold text-purple-600">{criteria.trainingHoursMax}</div>
                  <div className="text-xs text-gray-600">horas = 100%</div>
                </div>
              </div>
              <div className="mt-3 p-2 bg-white rounded border text-xs text-gray-500">
                💡 Estos criterios se actualizan automáticamente desde la configuración de la clínica
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desempeño (0-100)
                </label>
                <input
                  type="number"
                  name="performance"
                  value={formData.performance}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presentación (0-100)
                </label>
                <input
                  type="number"
                  name="presentation"
                  value={formData.presentation}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actividades del cuadernillo
                </label>
                <input
                  type="number"
                  name="workbookActivities"
                  value={formData.workbookActivities}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Número de actividades"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horas de capacitación
                </label>
                <input
                  type="number"
                  name="trainingHours"
                  value={formData.trainingHours}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Total de horas"
                  required
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calculator size={20} />
                Resultados automáticos
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Asistencia</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {calculatedMetrics.attendance}%
                  </div>
                  <div className="text-xs text-gray-600">Basado en registros de asistencia</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Cuadernillo</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {calculatedMetrics.workbook}%
                  </div>
                  <div className="text-xs text-gray-600">{criteria.workbookActivitiesMax} actividades = 100%</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Capacitación</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {calculatedMetrics.constantTraining}%
                  </div>
                  <div className="text-xs text-gray-600">{criteria.trainingHoursMax} horas = 100%</div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Save size={20} />
                {isLoading ? 'Guardando...' : 'Guardar evaluación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentEvaluation;
