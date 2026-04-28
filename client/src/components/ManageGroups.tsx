import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calendar, Clock, Activity } from 'lucide-react';
import { clinicsAPI } from '../services/api';

interface Group {
  _id?: string;
  name: string;
  days: string[];
  duration: string;
  activities: number;
}

interface ManageGroupsProps {
  clinic: {
    _id: string;
    name: string;
    groups: Group[];
  };
  onUpdate: () => void;
  onClose: () => void;
}

const ManageGroups: React.FC<ManageGroupsProps> = ({ clinic, onUpdate, onClose }) => {
  const [groups, setGroups] = useState<Group[]>(clinic.groups);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [newGroup, setNewGroup] = useState<Group>({
    name: '',
    days: [],
    duration: '',
    activities: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const availableDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const handleAddGroup = async () => {
    if (!newGroup.name || newGroup.days.length === 0) {
      setError('Por favor complete el nombre y seleccione al menos un día');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await clinicsAPI.addGroup(clinic._id, newGroup);
      setNewGroup({ name: '', days: [], duration: '', activities: 0 });
      setIsAddingGroup(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al agregar grupo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGroup = async (group: Group) => {
    if (!group._id) return;

    setIsLoading(true);
    setError('');

    try {
      await clinicsAPI.updateGroup(clinic._id, group._id, group);
      setEditingGroup(null);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar grupo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar el grupo "${groupName}"?`)) {
      try {
        await clinicsAPI.deleteGroup(clinic._id, groupId);
        onUpdate();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al eliminar grupo');
      }
    }
  };

  const handleDayToggle = (group: Group, day: string, isNewGroup = false) => {
    if (isNewGroup) {
      const currentDays = newGroup.days;
      if (currentDays.includes(day)) {
        setNewGroup({ ...newGroup, days: currentDays.filter(d => d !== day) });
      } else {
        setNewGroup({ ...newGroup, days: [...currentDays, day] });
      }
    } else {
      const currentDays = group.days;
      if (currentDays.includes(day)) {
        const updatedGroup = { ...group, days: currentDays.filter(d => d !== day) };
        if (editingGroup && editingGroup._id === group._id) {
          setEditingGroup(updatedGroup);
        }
        setGroups(groups.map(g => g._id === group._id ? updatedGroup : g));
      } else {
        const updatedGroup = { ...group, days: [...currentDays, day] };
        if (editingGroup && editingGroup._id === group._id) {
          setEditingGroup(updatedGroup);
        }
        setGroups(groups.map(g => g._id === group._id ? updatedGroup : g));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Gestionar Grupos</h2>
            <p className="text-sm text-gray-600 mt-1">{clinic.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <span className="sr-only">Cerrar</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Grupos Existentes</h3>
            <button
              onClick={() => setIsAddingGroup(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Agregar Grupo
            </button>
          </div>

          {/* Existing Groups */}
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <div key={group._id} className="border rounded-xl p-4 bg-gray-50">
                {editingGroup && editingGroup._id === group._id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Grupo</label>
                      <input
                        type="text"
                        value={editingGroup.name}
                        onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
                      <input
                        type="text"
                        value={editingGroup.duration}
                        onChange={(e) => setEditingGroup({ ...editingGroup, duration: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Días</label>
                      <div className="flex flex-wrap gap-2">
                        {availableDays.map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const currentDays = editingGroup.days;
                              if (currentDays.includes(day)) {
                                setEditingGroup({ ...editingGroup, days: currentDays.filter(d => d !== day) });
                              } else {
                                setEditingGroup({ ...editingGroup, days: [...currentDays, day] });
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              editingGroup.days.includes(day)
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Actividades</label>
                      <input
                        type="number"
                        value={editingGroup.activities}
                        onChange={(e) => setEditingGroup({ ...editingGroup, activities: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateGroup(editingGroup)}
                        disabled={isLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingGroup(null)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-800">{group.name}</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingGroup(group)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          title="Editar grupo"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group._id!, group.name)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Eliminar grupo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={14} />
                        <span>{group.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={14} />
                        <span>{group.days.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Activity size={14} />
                        <span>{group.activities} actividades</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add New Group */}
          {isAddingGroup && (
            <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 bg-blue-50">
              <h4 className="font-semibold text-gray-800 mb-4">Nuevo Grupo</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Grupo</label>
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ej. Lunes a Miércoles (Tarde)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
                  <input
                    type="text"
                    value={newGroup.duration}
                    onChange={(e) => setNewGroup({ ...newGroup, duration: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ej. 4 semanas"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Días de Práctica</label>
                <div className="flex flex-wrap gap-2">
                  {availableDays.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(newGroup, day, true)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        newGroup.days.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 border'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Total de Actividades</label>
                <input
                  type="number"
                  value={newGroup.activities}
                  onChange={(e) => setNewGroup({ ...newGroup, activities: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddGroup}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Agregando...' : 'Agregar Grupo'}
                </button>
                <button
                  onClick={() => {
                    setIsAddingGroup(false);
                    setNewGroup({ name: '', days: [], duration: '', activities: 0 });
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {groups.length === 0 && !isAddingGroup && (
            <div className="text-center py-8 text-gray-500">
              No hay grupos configurados. Agregue un nuevo grupo para comenzar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageGroups;
