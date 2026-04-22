import React, { useState, useEffect } from 'react';
import { clinicsAPI } from '../services/api';
import { Building2, MapPin, Users, ChevronRight, Sun, Moon, Coffee, Plus } from 'lucide-react';
import AddClinicForm from './AddClinicForm';

interface Clinic {
  _id: string;
  name: string;
  address: string;
  totalStudents: number;
  groups: Array<{
    name: string;
    days: string[];
    duration: string;
    activities: number;
  }>;
}

interface ClinicsListProps {
  onSelectClinic: (clinic: Clinic) => void;
}

const ClinicsList: React.FC<ClinicsListProps> = ({ onSelectClinic }) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState<React.ReactNode>(null);
  const [showAddClinic, setShowAddClinic] = useState(false);

  useEffect(() => {
    fetchClinics();
    updateGreeting();
  }, []);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('¡Buenos días, Jordana!');
      setGreetingIcon(<Coffee className="text-amber-500" size={24} />);
    } else if (hour >= 12 && hour < 19) {
      setGreeting('¡Buenas tardes, Jordana!');
      setGreetingIcon(<Sun className="text-orange-500" size={24} />);
    } else {
      setGreeting('¡Buenas noches, Jordana!');
      setGreetingIcon(<Moon className="text-indigo-400" size={24} />);
    }
  };

  const fetchClinics = async () => {
    try {
      const response = await clinicsAPI.getAll();
      setClinics(response.data);
    } catch (err: any) {
      setError('Error al cargar las clínicas');
      console.error('Error fetching clinics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClinicSuccess = () => {
    fetchClinics();
  };

  const getDayName = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date().getDay()];
  };

  const getClinicsForToday = () => {
    const today = getDayName();
    return clinics.filter(clinic => 
      clinic.groups.some(group => group.days.includes(today))
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const todayClinics = getClinicsForToday();

  return (
    <div className="p-4 md:p-6">
      {/* Bienvenida personalizada */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-4 md:p-8 mb-8 overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10">
          <div className="w-40 h-40 md:w-64 md:h-64 relative flex-shrink-0">
            <div className="absolute inset-0 bg-blue-50 rounded-full animate-pulse opacity-50"></div>
            <img 
              src="/nurse.png" 
              alt="Bienvenida Jordana" 
              className="w-full h-full object-contain relative z-10 rounded-full"
            />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              {greetingIcon}
              <h1 className="text-2xl md:text-4xl font-bold text-gray-800">
                {greeting}
              </h1>
            </div>
            
            <p className="text-base md:text-lg text-gray-600 mb-6">
              La ruta programada para hoy, <span className="font-semibold text-blue-600">{getDayName()}</span>, es la siguiente:
            </p>

            {todayClinics.length > 0 ? (
              <div className="space-y-3">
                {todayClinics.map((clinic, idx) => (
                  <div key={clinic._id} className="flex items-center gap-3 bg-blue-50 p-3 md:p-4 rounded-xl border border-blue-100 text-left">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">{clinic.name}</h3>
                      <p className="text-xs md:text-sm text-gray-500 line-clamp-1">{clinic.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200 text-gray-600 italic text-sm md:text-base">
                No tienes clínicas programadas para el día de hoy. ¡Aprovecha para poner al día tus reportes!
              </div>
            )}
          </div>
        </div>
        
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-48 h-48 md:w-64 md:h-64 bg-blue-50 rounded-full opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-32 h-32 md:w-48 md:h-48 bg-blue-50 rounded-full opacity-30"></div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1 md:mb-2">Todas Mis Clínicas</h2>
          <p className="text-sm md:text-gray-600">Acceso rápido a la gestión de todos tus centros</p>
        </div>
        <button
          onClick={() => setShowAddClinic(true)}
          className="w-full md:w-auto bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={20} />
          Agregar Clínica
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clinics.map((clinic) => (
          <div
            key={clinic._id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Building2 className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{clinic.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <MapPin size={14} />
                    <span>{clinic.address}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={16} />
                <span>{clinic.totalStudents} alumnos</span>
              </div>
              <div className="text-sm text-gray-500">
                {clinic.groups.length} grupos
              </div>
            </div>

            <button
              onClick={() => onSelectClinic(clinic)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Seleccionar
              <ChevronRight size={16} />
            </button>
          </div>
        ))}
      </div>

      {showAddClinic && (
        <AddClinicForm
          onClose={() => setShowAddClinic(false)}
          onSuccess={handleClinicSuccess}
        />
      )}

      {clinics.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No hay clínicas registradas
          </h3>
          <p className="text-gray-500">
            Contacte al administrador para agregar clínicas al sistema
          </p>
        </div>
      )}
    </div>
  );
};

export default ClinicsList;
