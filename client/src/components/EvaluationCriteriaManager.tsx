import React, { useState, useEffect } from 'react';
import { evaluationCriteriaAPI } from '../services/api';
import { X, Save, Settings, Calculator, BookOpen, Clock, Calendar, TrendingUp, Award } from 'lucide-react';

interface EvaluationCriteria {
  workbookActivitiesMax: number;
  trainingHoursMax: number;
  workbookMultiplier: number;
  trainingMultiplier: number;
  attendanceDaysMax: number;
  performanceMax: number;
  presentationMax: number;
}

interface EvaluationCriteriaManagerProps {
  clinicId: string;
  clinicName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const EvaluationCriteriaManager: React.FC<EvaluationCriteriaManagerProps> = ({
  clinicId,
  clinicName,
  onClose,
  onSuccess,
}) => {
  const [criteria, setCriteria] = useState<EvaluationCriteria>({
    workbookActivitiesMax: 26,
    trainingHoursMax: 30,
    workbookMultiplier: 3.85,
    trainingMultiplier: 3.33,
    attendanceDaysMax: 25,
    performanceMax: 100,
    presentationMax: 100,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCriteria();
  }, [clinicId]);

  const fetchCriteria = async () => {
    try {
      setIsLoading(true);
      const response = await evaluationCriteriaAPI.getByClinic(clinicId);
      setCriteria(response.data);
    } catch (err: any) {
      setError('Error al cargar los criterios de evaluación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      await evaluationCriteriaAPI.updateByClinic(clinicId, {
        workbookActivitiesMax: criteria.workbookActivitiesMax,
        trainingHoursMax: criteria.trainingHoursMax,
        attendanceDaysMax: criteria.attendanceDaysMax,
        performanceMax: criteria.performanceMax,
        presentationMax: criteria.presentationMax,
      });
      
      // Emit event to notify other components
      console.log('Emitting criteriaUpdated event for clinic:', clinicId);
      window.dispatchEvent(new CustomEvent('criteriaUpdated', { 
        detail: { clinicId } 
      }));
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar los criterios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = Number(value);
    
    setCriteria(prev => ({
      ...prev,
      [name]: numValue,
      // Update multipliers automatically
      ...(name === 'workbookActivitiesMax' && {
        workbookMultiplier: parseFloat((100 / numValue).toFixed(2))
      }),
      ...(name === 'trainingHoursMax' && {
        trainingMultiplier: parseFloat((100 / numValue).toFixed(2))
      })
    }));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="text-center text-gray-600">Cargando criterios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Settings size={24} />
            {clinicName} - Criterios de Evaluación
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Calculator size={20} />
                Configuración de Criterios
              </h3>
              <p className="text-sm text-gray-600">
                Define cuántas actividades o horas equivalen al 100% en cada categoría.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={20} className="text-green-600" />
                  <h4 className="font-semibold text-gray-800">Actividades del Cuadernillo</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Actividades para 100%
                    </label>
                    <input
                      type="number"
                      name="workbookActivitiesMax"
                      value={criteria.workbookActivitiesMax}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Fórmula actual:</div>
                    <div className="font-mono text-sm">
                      {criteria.workbookActivitiesMax} actividades = 100%
                    </div>
                    <div className="font-mono text-xs text-gray-500 mt-1">
                      Multiplicador: {criteria.workbookMultiplier.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={20} className="text-blue-600" />
                  <h4 className="font-semibold text-gray-800">Días de Asistencia</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días para 100%
                    </label>
                    <input
                      type="number"
                      name="attendanceDaysMax"
                      value={criteria.attendanceDaysMax}
                      onChange={handleChange}
                      min="1"
                      max="365"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Fórmula actual:</div>
                    <div className="font-mono text-sm">
                      {criteria.attendanceDaysMax} días = 100%
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-orange-600" />
                  <h4 className="font-semibold text-gray-800">Desempeño</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puntos para 100%
                    </label>
                    <input
                      type="number"
                      name="performanceMax"
                      value={criteria.performanceMax}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Fórmula actual:</div>
                    <div className="font-mono text-sm">
                      {criteria.performanceMax} puntos = 100%
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Award size={20} className="text-pink-600" />
                  <h4 className="font-semibold text-gray-800">Presentación</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puntos para 100%
                    </label>
                    <input
                      type="number"
                      name="presentationMax"
                      value={criteria.presentationMax}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Fórmula actual:</div>
                    <div className="font-mono text-sm">
                      {criteria.presentationMax} puntos = 100%
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={20} className="text-purple-600" />
                  <h4 className="font-semibold text-gray-800">Horas de Capacitación</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horas para 100%
                    </label>
                    <input
                      type="number"
                      name="trainingHoursMax"
                      value={criteria.trainingHoursMax}
                      onChange={handleChange}
                      min="1"
                      max="200"
                      step="0.5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Fórmula actual:</div>
                    <div className="font-mono text-sm">
                      {criteria.trainingHoursMax} horas = 100%
                    </div>
                    <div className="font-mono text-xs text-gray-500 mt-1">
                      Multiplicador: {criteria.trainingMultiplier.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Ejemplos de cálculo:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Cuadernillo:</div>
                  <div className="text-gray-600">
                    Si un alumno completa {Math.round(criteria.workbookActivitiesMax * 0.8)} actividades, 
                    obtendrá {Math.round(80)}%
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Capacitación:</div>
                  <div className="text-gray-600">
                    Si un alumno completa {Math.round(criteria.trainingHoursMax * 0.6)} horas, 
                    obtendrá {Math.round(60)}%
                  </div>
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
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Save size={20} />
                {isSaving ? 'Guardando...' : 'Guardar criterios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EvaluationCriteriaManager;
