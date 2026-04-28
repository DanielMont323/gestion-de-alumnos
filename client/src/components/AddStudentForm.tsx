import React, { useState, useEffect } from 'react';
import { studentsAPI, clinicsAPI } from '../services/api';
import { X, Calendar, Clock, Target } from 'lucide-react';

interface Group {
  name: string;
  days: string[];
  duration: string;
  activities: number;
}

interface Clinic {
  _id: string;
  name: string;
  groups: Group[];
}

interface AddStudentFormProps {
  clinicId: string;
  clinicName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({
  clinicId,
  clinicName,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    group: '',
    startDate: '',
    notes: '',
  });
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClinic();
  }, [clinicId]);

  const fetchClinic = async () => {
    try {
      const response = await clinicsAPI.getById(clinicId);
      setClinic(response.data);
      if (response.data.groups.length > 0) {
        setFormData(prev => ({ ...prev, group: response.data.groups[0].name }));
      }
    } catch (err: any) {
      setError('Error al cargar la información de la clínica');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Fix timezone issue by creating date at noon in local timezone
      console.log('Frontend formData.startDate:', formData.startDate);
      
      // Parse the date correctly to avoid timezone issues
      const dateParts = formData.startDate.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
      const day = parseInt(dateParts[2]);
      
      const startDate = new Date(year, month, day, 12, 0, 0, 0); // Local time at noon
      console.log('Frontend created Date:', startDate);
      console.log('Frontend Date after setting hours:', startDate.toString());
      
      // Send as YYYY-MM-DD string
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      console.log('Frontend sending to API:', dateString);
      
      await studentsAPI.create({
        ...formData,
        clinic: clinicId,
        startDate: dateString, // Send as YYYY-MM-DD string
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el alumno');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {clinicName} - Agregar nuevo alumno
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Datos del alumno
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Ingrese el nombre completo del alumno"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grupo *
                  </label>
                  <select
                    name="group"
                    value={formData.group}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Seleccione un grupo</option>
                    {clinic?.groups.map((group) => (
                      <option key={group.name} value={group.name}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de inicio *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Notas adicionales sobre el alumno"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock size={20} />
                Información del grupo
              </h3>
              
              <div className="space-y-4">
                {clinic?.groups.map((group) => (
                  <div
                    key={group.name}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.group === group.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData({ ...formData, group: group.name })}
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {group.name}
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{group.days.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{group.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target size={14} />
                        <span>{group.activities} actividades</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-3 justify-end">
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Guardando...' : 'Guardar alumno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentForm;
