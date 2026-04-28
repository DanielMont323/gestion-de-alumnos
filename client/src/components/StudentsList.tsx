import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../services/api';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  Printer
} from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  group: string;
  attendancePercentage: number;
  performance: number;
  presentation: number;
  startDate: string;
}

interface StudentsListProps {
  clinicId: string;
  clinicName: string;
  onAddStudent: () => void;
  onViewStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onManageCriteria: () => void;
}

const StudentsList: React.FC<StudentsListProps> = ({
  clinicId,
  clinicName,
  onAddStudent,
  onViewStudent,
  onEditStudent,
  onManageCriteria,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Todos los grupos');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    console.log('StudentsList useEffect triggered:', { clinicId, currentPage, searchTerm, selectedGroup });
    fetchStudents();
  }, [clinicId, currentPage, searchTerm, selectedGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedGroup !== 'Todos los grupos') params.group = selectedGroup;

      console.log('Fetching students with params:', params);
      console.log('Selected group:', selectedGroup);
      console.log('Clinic ID:', clinicId);

      if (!clinicId) {
        console.log('No clinic ID provided, skipping fetch');
        setStudents([]);
        setIsLoading(false);
        return;
      }

      const response = await studentsAPI.getByClinic(clinicId, params);
      console.log('API Response:', response.data);
      
      if (response.data && response.data.students) {
        console.log('Students found:', response.data.students.length);
        setStudents(response.data.students);
        setTotalPages(response.data.totalPages || 1);
      } else {
        console.log('No students found in response');
        setStudents([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      setError('Error al cargar los alumnos');
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este alumno?')) {
      return;
    }

    try {
      await studentsAPI.delete(studentId);
      fetchStudents();
    } catch (err: any) {
      setError('Error al eliminar el alumno');
      console.error('Error deleting student:', err);
    }
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handlePrint = (type: 'clinic' | 'group') => {
    // Get all students for printing (not just current page)
    const fetchAllStudentsForPrint = async () => {
      try {
        const params: any = {};
        
        if (type === 'clinic') {
          // Get all students from clinic
          params.clinicId = clinicId;
          params.limit = 1000; // Large number to get all students
        } else {
          // Get filtered students (current search and group)
          params.clinicId = clinicId;
          params.limit = 1000;
          if (searchTerm) params.search = searchTerm;
          if (selectedGroup !== 'Todos los grupos') params.group = selectedGroup;
        }

        const response = await studentsAPI.getAll(params);
        const studentsToPrint = response.data.students || response.data;
        
        // Create print content
        const printTitle = type === 'clinic' 
          ? `Lista de Alumnos - ${clinicName}` 
          : `Lista de Alumnos - ${clinicName} - ${selectedGroup}`;
        
        const printContent = generatePrintContent(printTitle, studentsToPrint);
        
        // Create print window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(printContent);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }
      } catch (err: any) {
        console.error('Error fetching students for print:', err);
        alert('Error al generar la impresión');
      }
    };

    fetchAllStudentsForPrint();
  };

  const generatePrintContent = (title: string, students: Student[]) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const studentsHTML = students.map(student => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${student.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${student.group}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${student.attendancePercentage}%</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${student.performance}%</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${student.presentation}%</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(student.startDate)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #333; margin-bottom: 20px; }
          .info { margin-bottom: 20px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd; text-align: left; font-weight: bold; }
          td { padding: 8px; border: 1px solid #ddd; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          @media print {
            body { margin: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="info">
          <p><strong>Total de alumnos:</strong> ${students.length}</p>
          <p><strong>Fecha de impresión:</strong> ${new Date().toLocaleDateString('es-MX')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Grupo</th>
              <th>Asistencia</th>
              <th>Desempeño</th>
              <th>Presentación</th>
              <th>Fecha de Inicio</th>
            </tr>
          </thead>
          <tbody>
            ${studentsHTML}
          </tbody>
        </table>
        <div class="footer">
          <p>Sistema de Gestión de Alumnos - Generado el ${new Date().toLocaleString('es-MX')}</p>
        </div>
      </body>
      </html>
    `;
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">{clinicName}</h1>
            <p className="text-sm text-gray-600">Lista de alumnos</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onManageCriteria}
              className="w-full md:w-auto bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              title="Configurar criterios de evaluación"
            >
              <Settings size={20} />
              Criterios
            </button>
            <button
              onClick={onAddStudent}
              className="w-full md:w-auto bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Agregar alumno
            </button>
            <button
              onClick={() => handlePrint('clinic')}
              className="w-full md:w-auto bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              title="Imprimir lista completa de la clínica"
            >
              <Printer size={20} />
              Imprimir Clínica
            </button>
            <button
              onClick={() => handlePrint('group')}
              className="w-full md:w-auto bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              title="Imprimir lista del grupo filtrado"
            >
              <Printer size={20} />
              Imprimir Grupo
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option>Todos los grupos</option>
            <option>Lunes a Miercoles</option>
            <option>Jueves-Viernes</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grupo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asistencia %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Desempeño
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Presentación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{student.group}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getPerformanceColor(student.attendancePercentage)}`}>
                      {student.attendancePercentage}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getPerformanceColor(student.performance)}`}>
                      {student.performance}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getPerformanceColor(student.presentation)}`}>
                      {student.presentation}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewStudent(student)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEditStudent(student)}
                        className="text-green-600 hover:text-green-800"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {students.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No se encontraron alumnos</div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsList;
