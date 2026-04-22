import React, { useState, useEffect } from 'react';
import { studentsAPI, attendanceAPI } from '../services/api';
import { Calendar, CheckCircle, XCircle, Save } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  group: string;
}

interface AttendanceRecord {
  studentId: string;
  attended: boolean;
}

interface AttendanceTrackingProps {
  clinicId: string;
  clinicName: string;
}

const AttendanceTracking: React.FC<AttendanceTrackingProps> = ({
  clinicId,
  clinicName,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [clinicId]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await studentsAPI.getByClinic(clinicId);
      const studentsData = response.data.students || response.data;
      setStudents(studentsData);
      setAttendance(studentsData.map((student: Student) => ({
        studentId: student._id,
        attended: false,
      })));
    } catch (err: any) {
      setError('Error al cargar los alumnos');
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: string, attended: boolean) => {
    setAttendance(prev =>
      prev.map(record =>
        record.studentId === studentId ? { ...record, attended } : record
      )
    );
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await attendanceAPI.createBulk({
        clinicId,
        date: selectedDate,
        attendanceRecords: attendance,
      });
      setSuccess('Asistencia guardada exitosamente');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la asistencia');
    } finally {
      setIsSaving(false);
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
          {clinicName} - Pasar lista
        </h1>
        <p className="text-sm text-gray-600">Registre la asistencia de los alumnos</p>
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alumno
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grupo
                </th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asistió
                </th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Faltó
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => {
                const attendanceRecord = attendance.find(
                  (record) => record.studentId === student._id
                );
                
                return (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.name}
                      </div>
                      <div className="md:hidden text-xs text-gray-500">{student.group}</div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{student.group}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="radio"
                          name={`attendance-${student._id}`}
                          checked={attendanceRecord?.attended || false}
                          onChange={() => handleAttendanceChange(student._id, true)}
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                        <CheckCircle
                          size={18}
                          className={`ml-2 ${
                            attendanceRecord?.attended
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}
                        />
                      </label>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="radio"
                          name={`attendance-${student._id}`}
                          checked={attendanceRecord && !attendanceRecord.attended}
                          onChange={() => handleAttendanceChange(student._id, false)}
                          className="w-4 h-4 text-red-600 focus:ring-red-500"
                        />
                        <XCircle
                          size={18}
                          className={`ml-2 ${
                            attendanceRecord && !attendanceRecord.attended
                              ? 'text-red-600'
                              : 'text-gray-400'
                          }`}
                        />
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {students.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No hay alumnos en esta clínica</div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveAttendance}
            disabled={isSaving || students.length === 0}
            className="w-full md:w-auto bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm font-medium"
          >
            <Save size={20} />
            {isSaving ? 'Guardando...' : 'Guardar asistencia'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracking;
