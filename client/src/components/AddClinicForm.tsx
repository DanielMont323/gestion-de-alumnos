import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { clinicsAPI } from '../services/api';

interface Group {
  name: string;
  days: string[];
  duration: string;
  activities: number;
}

interface AddClinicFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddClinicForm: React.FC<AddClinicFormProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [groups, setGroups] = useState<Group[]>([
    { name: '', days: [], duration: '', activities: 0 }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const availableDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const handleAddGroup = () => {
    setGroups([...groups, { name: '', days: [], duration: '', activities: 0 }]);
  };

  const handleRemoveGroup = (index: number) => {
    if (groups.length > 1) {
      setGroups(groups.filter((_, i) => i !== index));
    }
  };

  const handleGroupChange = (index: number, field: keyof Group, value: any) => {
    const newGroups = [...groups];
    newGroups[index] = { ...newGroups[index], [field]: value };
    setGroups(newGroups);
  };

  const handleDayToggle = (groupIndex: number, day: string) => {
    const newGroups = [...groups];
    const currentDays = newGroups[groupIndex].days;
    if (currentDays.includes(day)) {
      newGroups[groupIndex].days = currentDays.filter(d => d !== day);
    } else {
      newGroups[groupIndex].days = [...currentDays, day];
    }
    setGroups(newGroups);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!name || !address) {
      setError('Por favor complete el nombre y la dirección');
      setIsLoading(false);
      return;
    }

    if (groups.some(g => !g.name || g.days.length === 0)) {
      setError('Cada grupo debe tener un nombre y al menos un día asignado');
      setIsLoading(false);
      return;
    }

    try {
      await clinicsAPI.create({
        name,
        address,
        groups
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la clínica');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">Agregar Nueva Clínica</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Clínica</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej. Clínica San Rafael"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Calle #123, Ciudad"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Grupos de Práctica</h3>
              <button
                type="button"
                onClick={handleAddGroup}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
              >
                <Plus size={16} />
                Añadir Grupo
              </button>
            </div>

            {groups.map((group, index) => (
              <div key={index} className="p-4 border rounded-xl bg-gray-50 relative space-y-4">
                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGroup(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del Grupo</label>
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => handleGroupChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg bg-white"
                      placeholder="Ej. Lunes a Miércoles (Mañana)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Duración</label>
                    <input
                      type="text"
                      value={group.duration}
                      onChange={(e) => handleGroupChange(index, 'duration', e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg bg-white"
                      placeholder="Ej. 4 semanas"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Días de Práctica</label>
                  <div className="flex flex-wrap gap-2">
                    {availableDays.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(index, day)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          group.days.includes(day)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 border'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Total de Actividades</label>
                  <input
                    type="number"
                    value={group.activities}
                    onChange={(e) => handleGroupChange(index, 'activities', parseInt(e.target.value) || 0)}
                    className="w-32 px-3 py-1.5 border rounded-lg bg-white"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t sticky bottom-0 bg-white">
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border rounded-xl hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {isLoading ? 'Creando...' : 'Crear Clínica'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClinicForm;
