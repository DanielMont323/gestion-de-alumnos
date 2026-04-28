import React, { useState, useEffect } from 'react';
import { studentsAPI, attendanceAPI, clinicsAPI } from '../services/api';
import { Users, Calendar, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  group: string;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  attended: boolean;
  student: {
    _id: string;
    name: string;
    group: string;
  };
}

interface ClinicGroup {
  name: string;
  days: string[];
  duration: string;
  activities: number;
}

interface GroupStats {
  groupName: string;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  monthlyAttendance: number;
  trend: 'up' | 'down' | 'stable';
}

interface AttendanceByGroupProps {
  clinicId: string;
  clinicName: string;
}

const AttendanceByGroup: React.FC<AttendanceByGroupProps> = ({ clinicId, clinicName }) => {
  const [groupStats, setGroupStats] = useState<GroupStats[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroupStats();
  }, [clinicId, selectedDate, selectedMonth, selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGroupStats = async () => {
    try {
      setIsLoading(true);
      
      // Get clinic data to know the groups
      const clinicResponse = await clinicsAPI.getById(clinicId);
      const groups = clinicResponse.data.groups || [];
      
      // Get all students
      const studentsResponse = await studentsAPI.getByClinic(clinicId);
      const students = studentsResponse.data.students || studentsResponse.data;
      
      // Get attendance for today
      const todayAttendance = await attendanceAPI.getAll({
        clinicId,
        date: selectedDate
      });
      
      // Get attendance for the month
      const monthAttendance = await attendanceAPI.getAll({
        clinicId,
        month: selectedMonth,
        year: selectedYear
      });
      
      // Calculate stats for each group
      const stats: GroupStats[] = groups.map((group: ClinicGroup) => {
        const groupStudents = students.filter((s: Student) => s.group === group.name);
        const totalStudents = groupStudents.length;
        
        // Today's attendance
        const todayRecords = todayAttendance.data.filter((record: AttendanceRecord) => 
          groupStudents.some((s: Student) => s._id === record.student._id)
        );
        const presentToday = todayRecords.filter((r: AttendanceRecord) => r.attended).length;
        const absentToday = totalStudents - presentToday;
        
        // Monthly attendance calculation
        const monthRecords = monthAttendance.data.filter((record: AttendanceRecord) => 
          groupStudents.some((s: Student) => s._id === record.student._id)
        );
        const totalPossible = groupStudents.length * 22; // Approximate 22 days per month
        const attendedCount = monthRecords.filter((r: AttendanceRecord) => r.attended).length;
        const monthlyAttendance = totalPossible > 0 ? Math.round((attendedCount / totalPossible) * 100) : 0;
        
        // Simple trend calculation (compare with previous month if available)
        const trend: 'up' | 'down' | 'stable' = 'stable'; // Simplified for now
        
        return {
          groupName: group.name,
          totalStudents,
          presentToday,
          absentToday,
          monthlyAttendance,
          trend
        };
      });
      
      setGroupStats(stats);
    } catch (err: any) {
      setError('Error al cargar las estadísticas');
      console.error('Error fetching group stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={16} className="text-green-600" />;
      case 'down':
        return <TrendingDown size={16} className="text-red-600" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
          {clinicName} - Asistencia por Grupo
        </h1>
        <p className="text-sm text-gray-600">Estadísticas de asistencia desglosadas por grupo</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-600" />
            <label htmlFor="date" className="text-sm font-medium text-gray-700">
              Fecha:
            </label>
            <input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div className="text-sm text-gray-600 font-medium">
            {formatDate(selectedDate)}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-600" />
            <label htmlFor="month" className="text-sm font-medium text-gray-700">
              Mes:
            </label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="year" className="text-sm font-medium text-gray-700">
              Año:
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupStats.map((stat, index) => (
            <div key={index} className="border rounded-xl p-4 bg-gray-50 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{stat.groupName}</h3>
                {getTrendIcon(stat.trend)}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} />
                  <span>{stat.totalStudents} alumnos</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">Asistencia de hoy</div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-600">{stat.presentToday}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle size={16} className="text-red-600" />
                      <span className="text-sm font-medium text-red-600">{stat.absentToday}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">
                    Asistencia mensual ({monthNames[selectedMonth - 1]})
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getAttendanceColor(stat.monthlyAttendance)}`}>
                    {stat.monthlyAttendance}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {groupStats.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No hay grupos configurados
            </h3>
            <p className="text-gray-500">
              Configure grupos en la clínica para ver las estadísticas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceByGroup;
