import React, { useState, useEffect } from 'react';
import { Clock, Users, Calendar, Download, UserPlus, LogIn, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';

interface Employee {
  id: string;
  name: string;
  email: string;
  employee_id: string;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  check_in: string | null;
  check_out: string | null;
  date: string;
  employees: Employee;
}

function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', employee_id: '' });

  useEffect(() => {
    fetchEmployees();
    fetchAttendanceRecords();
  }, [selectedDate]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          employees (*)
        `)
        .eq('date', selectedDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (employeeId: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: employeeId,
          check_in: now,
          date: selectedDate
        });
      
      if (error) throw error;
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error checking in:', error);
      alert('حدث خطأ في تسجيل الحضور');
    }
  };

  const handleCheckOut = async (recordId: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('attendance_records')
        .update({ check_out: now })
        .eq('id', recordId);
      
      if (error) throw error;
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error checking out:', error);
      alert('حدث خطأ في تسجيل الانصراف');
    }
  };

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('employees')
        .insert([newEmployee]);
      
      if (error) throw error;
      
      setNewEmployee({ name: '', email: '', employee_id: '' });
      setShowAddEmployee(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('حدث خطأ في إضافة الموظف');
    }
  };

  const exportToCSV = () => {
    const headers = ['اسم الموظف', 'رقم الموظف', 'وقت الحضور', 'وقت الانصراف', 'التاريخ'];
    const csvData = attendanceRecords.map(record => [
      record.employees.name,
      record.employees.employee_id,
      record.check_in ? new Date(record.check_in).toLocaleTimeString('ar-SA') : 'لم يسجل',
      record.check_out ? new Date(record.check_out).toLocaleTimeString('ar-SA') : 'لم يسجل',
      new Date(record.date).toLocaleDateString('ar-SA')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_${selectedDate}.csv`;
    link.click();
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'لم يسجل';
    return new Date(timeString).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTodayAttendance = (employeeId: string) => {
    return attendanceRecords.find(record => record.employee_id === employeeId);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Clock className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">نظام الحضور والانصراف</h1>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setShowAddEmployee(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2 space-x-reverse"
              >
                <UserPlus className="h-4 w-4" />
                <span>إضافة موظف</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الموظفين</p>
                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <LogIn className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">الحضور اليوم</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceRecords.filter(r => r.check_in).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <LogOut className="h-8 w-8 text-red-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">الانصراف اليوم</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceRecords.filter(r => r.check_out).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">قائمة الموظفين</h2>
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2 space-x-reverse"
            >
              <Download className="h-4 w-4" />
              <span>تصدير التقرير</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الموظف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الموظف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وقت الحضور
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وقت الانصراف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => {
                  const attendance = getTodayAttendance(employee.id);
                  return (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.employee_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(attendance?.check_in || null)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(attendance?.check_out || null)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                        {!attendance?.check_in ? (
                          <button
                            onClick={() => handleCheckIn(employee.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            تسجيل حضور
                          </button>
                        ) : !attendance?.check_out ? (
                          <button
                            onClick={() => handleCheckOut(attendance.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            تسجيل انصراف
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm">مكتمل</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">إضافة موظف جديد</h3>
            <form onSubmit={addEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الموظف
                </label>
                <input
                  type="text"
                  required
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  required
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الموظف
                </label>
                <input
                  type="text"
                  required
                  value={newEmployee.employee_id}
                  onChange={(e) => setNewEmployee({...newEmployee, employee_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-3 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  إضافة
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEmployee(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;