/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, 
  Users, 
  Calendar, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  Trash2, 
  Search, 
  Plus,
  CheckCircle2,
  AlertCircle,
  School
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, endOfYear, isSameDay, isWithinInterval, addDays, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Teacher {
  id: string;
  name: string;
}

interface AbsenceRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  startDate: string;
  days: number;
  reason: string;
  needRelief: boolean;
  remarks: string;
  createdAt: string;
}

// --- Constants ---
const INITIAL_TEACHERS = [
  "Cg. Azman bin Mohd Nor @ Harun", "Cg. Wan Johari bin Wan Gati", "Cg. Abdullah bin Ab Rahman",
  "Cg. Shaylatulazwin binti Abdul Wahid", "Cg. Anuar Ruddin bin Salleh", "Cg. Zalina binti Omar",
  "Cg. Mohd Kamal bin Harun", "Cg. Mohd Shamsuddin bin Othman", "Cg. Alimien bin Muda",
  "Ust. Ismail bin Salleh", "Cg. Mohammad Syafiq bin Abdul Majeed", "Cg. Mohd Hamidi bin Mohd Noor",
  "Cg. Dul – Rosidi bin Ahmad", "Cg. Mohd Khalis bin Abd. Malik", "Cg. Amirul Shahadam bin Suhasmadi",
  "Cg. Mohd Rizuan bin Ibrahim", "Cg. Nasharuddin bin Ngah", "Cg. Mohd Faizal bin Mohd Noor",
  "Cg. Mohd Shufian bin Abdul Kadir", "Cg. Nor Azimah binti Rokman", "Cg. Farida Hamimi binti Muhamad Saidi",
  "Ustz. Hasni binti Baba", "Cg. Juliani binti Mansor", "Cg. Kartini binti Abdul Rahim",
  "Cg. Noordiana binti Abdul Aziz", "Cg. Nor Hamiza binti Ramli", "Cg. Noorazlina binti Ismail",
  "Cg. Norul Hazlinda bt. Romli", "Cg. Hibatul ’ Atikah binti Khairul Anuar", "Cg. Nur Faizzatul Ain binti Othman",
  "Cg. Rosharizam binti Abd. Ghani", "Ustz. Rosmawati binti Mamat", "Cg. Rusmaniza binti Jusoh",
  "Cg. Sazilawati binti Yusof", "Cg. Saidatul Asima binti Kamarulzaman Shah", "Cg. Siti Halimah binti Ab. Halim",
  "Cg. Siti Saniah binti Idris", "Cg. Suriani binti Muda", "Ustz Rohana binti Awang",
  "Cg. Wan Nor Azlinda bt. Wan Abd. Aziz", "Cg. Amirah Nasuha binti Suhaimi", "Cg. Suhaila Afiqah binti Mohd Nasir",
  "Cg. Nurul Najibah binti Musameh", "Cg. Iza Amirah binti Muhamad Zawahir", "Cg. Nurzahidatullazura binti Amzah",
  "Cg. Azizah binti Ismail"
];

const REASONS = [
  "CUTI REHAT", "CUTI REHAT KHAS", "CUTI SAKIT", "TEMUJANJI DOKTOR", "URUSAN PPD/JPN/KPM",
  "MESYUARAT", "CUTI KUARANTIN", "CUTI TANPA REKOD", "CUTI BERSALIN",
  "TAKLIMAT/BENGKEL", "GURU PENGIRING", "PETUGAS PEPERIKSAAN", "LAIN-LAIN"
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function App() {
  const [activeTab, setActiveTab] = useState('absence');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [searchDate, setSearchDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Load Data
  const fetchData = async () => {
    try {
      const [teachersRes, recordsRes] = await Promise.all([
        fetch('/api/teachers'),
        fetch('/api/records')
      ]);
      
      const teachersData = await teachersRes.json();
      const recordsData = await recordsRes.json();
      
      setTeachers(teachersData);
      setRecords(recordsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // --- Handlers ---
  const addRecord = async (newRecord: Omit<AbsenceRecord, 'id' | 'createdAt'>) => {
    const record: AbsenceRecord = {
      ...newRecord,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    
    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      setRecords(prev => [record, ...prev]);
    } catch (error) {
      console.error('Failed to add record:', error);
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      await fetch(`/api/records/${id}`, { method: 'DELETE' });
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  const addTeacher = async (name: string) => {
    if (!name.trim()) return;
    const newTeacher = { id: Math.random().toString(36).substr(2, 9), name };
    
    try {
      await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeacher)
      });
      setTeachers(prev => [...prev, newTeacher]);
    } catch (error) {
      console.error('Failed to add teacher:', error);
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
      setTeachers(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete teacher:', error);
    }
  };

  // --- Computed Stats ---
  const todayRecords = useMemo(() => {
    const today = startOfDay(new Date());
    return records.filter(r => {
      const start = parseISO(r.startDate);
      const end = addDays(start, r.days - 1);
      return isWithinInterval(today, { start, end });
    });
  }, [records]);

  const reliefNeededCount = useMemo(() => {
    return todayRecords.filter(r => r.needRelief).length;
  }, [todayRecords]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center gap-6 relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center"
          >
            <img src="https://i.imgur.com/r6TqmA5.png" alt="Logo Sekolah" className="max-w-full max-h-full object-contain" />
          </motion.div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">SISTEM e-KEBERADAAN GURU SEMELAND</h1>
            <p className="text-blue-100 mt-1 font-medium text-lg">SMK LANDAS, 21820 AJIL, TERENGGANU</p>
            <div className="mt-3 inline-block bg-blue-400/30 backdrop-blur-md px-4 py-1 rounded-full border border-white/20">
              <span className="text-sm font-semibold tracking-wide italic">“CERIA UNTUK TENANG EMOSI, SEMELAND CUTE”</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-4 -mt-6 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl p-2 flex flex-wrap gap-2">
          <TabButton 
            active={activeTab === 'absence'} 
            onClick={() => setActiveTab('absence')}
            icon={<Calendar className="w-5 h-5" />}
            label="Ketidakhadiran Guru"
            color="blue"
          />
          <TabButton 
            active={activeTab === 'records'} 
            onClick={() => setActiveTab('records')}
            icon={<ClipboardList className="w-5 h-5" />}
            label="Rekod Ketidakhadiran"
            color="emerald"
          />
          <TabButton 
            active={activeTab === 'analysis'} 
            onClick={() => setActiveTab('analysis')}
            icon={<BarChart3 className="w-5 h-5" />}
            label="Analisis Keberadaan"
            color="amber"
          />
          <TabButton 
            active={activeTab === 'management'} 
            onClick={() => setActiveTab('management')}
            icon={<Settings className="w-5 h-5" />}
            label="Pengurusan Data"
            color="rose"
          />
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'absence' && (
            <motion.div 
              key="absence"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid md:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="md:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                      <Plus className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Borang Ketidakhadiran</h2>
                  </div>
                  <AbsenceForm teachers={teachers} onSubmit={addRecord} />
                </div>

                {/* Quick Stats Section */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-8 text-slate-900 shadow-lg shadow-amber-100">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="w-8 h-8 opacity-80" />
                      <span className="text-xs font-bold uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full">Hari Ini</span>
                    </div>
                    <div className="text-5xl font-black mb-2">{todayRecords.length}</div>
                    <div className="text-amber-900/70 font-bold">Guru Tiada di Sekolah</div>
                  </div>

                  <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl p-8 text-white shadow-lg shadow-red-200">
                    <div className="flex items-center justify-between mb-4">
                      <AlertCircle className="w-8 h-8 opacity-80" />
                      <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Relief</span>
                    </div>
                    <div className="text-5xl font-black mb-2">{reliefNeededCount}</div>
                    <div className="text-rose-100 font-medium">Memerlukan Relief</div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      Status Sistem
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Jumlah Guru Berdaftar</span>
                        <span className="font-bold text-slate-700">{teachers.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Rekod Keseluruhan</span>
                        <span className="font-bold text-slate-700">{records.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'records' && (
            <motion.div 
              key="records"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="p-8 border-bottom border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Rekod Ketidakhadiran</h2>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                  <Search className="w-5 h-5 text-slate-400 ml-2" />
                  <input 
                    type="date" 
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-slate-700 font-medium"
                  />
                </div>
              </div>
              <RecordsTable records={records} searchDate={searchDate} onDelete={deleteRecord} />
            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Analisis Bulanan</h3>
                  <div className="h-[400px]">
                    <MonthlyChart records={records} />
                  </div>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Top 10 Ketidakhadiran (Tahunan)</h3>
                  <div className="h-[400px]">
                    <TopTeachersChart records={records} />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Pecahan Sebab Ketidakhadiran</h3>
                <div className="h-[400px]">
                  <ReasonPieChart records={records} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'management' && (
            <motion.div 
              key="management"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Pengurusan Nama Guru</h2>
                </div>
                
                <AddTeacherForm onAdd={addTeacher} />
                
                <div className="mt-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-700">Senarai Guru ({teachers.length})</h3>
                    <span className="text-xs text-slate-400">Klik ikon tong sampah untuk padam</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {teachers.sort((a, b) => a.name.localeCompare(b.name)).map((teacher) => (
                      <div key={teacher.id} className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-rose-50 rounded-2xl border border-slate-100 transition-all">
                        <span className="text-slate-700 font-medium">{teacher.name}</span>
                        <button 
                          onClick={() => deleteTeacher(teacher.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400 text-sm border-t border-slate-200 mt-12">
        <p>© {new Date().getFullYear()} Sistem e-Keberadaan Guru SEMELAND. Hak Cipta Terpelihara.</p>
        <p className="mt-1 italic">SMK Landas - Ceria Untuk Tenang Emosi</p>
      </footer>
    </div>
  );
}

// --- Components ---

function TabButton({ active, onClick, icon, label, color }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color: 'blue' | 'emerald' | 'amber' | 'rose' }) {
  const colorClasses = {
    blue: active ? 'bg-blue-600 text-white shadow-blue-200' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600',
    emerald: active ? 'bg-emerald-600 text-white shadow-emerald-200' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600',
    amber: active ? 'bg-amber-500 text-white shadow-amber-200' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600',
    rose: active ? 'bg-rose-600 text-white shadow-rose-200' : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600',
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200",
        colorClasses[color],
        active && "shadow-lg scale-105"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function AbsenceForm({ teachers, onSubmit }: { teachers: Teacher[], onSubmit: (record: any) => void }) {
  const [formData, setFormData] = useState({
    teacherId: '',
    startDate: '',
    days: '',
    reason: '',
    needRelief: false,
    remarks: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherId) return alert('Sila pilih nama guru');
    if (!formData.startDate) return alert('Sila pilih tarikh mula');
    if (!formData.days) return alert('Sila pilih bilangan hari');
    if (!formData.reason) return alert('Sila pilih sebab');
    
    const teacher = teachers.find(t => t.id === formData.teacherId);
    onSubmit({
      ...formData,
      days: Number(formData.days),
      teacherName: teacher?.name || ''
    });
    
    // Reset form
    setFormData({
      teacherId: '',
      startDate: '',
      days: '',
      reason: '',
      needRelief: false,
      remarks: ''
    });
    alert('Rekod berjaya ditambah!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-600 ml-1">Nama Guru</label>
          <select 
            required
            value={formData.teacherId}
            onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
            className="w-full bg-slate-50 border-slate-200 rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">-- Pilih Guru --</option>
            {teachers.sort((a, b) => a.name.localeCompare(b.name)).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-600 ml-1">Tarikh Mula</label>
          <input 
            type="date"
            required
            placeholder="Pilih Tarikh"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full bg-slate-50 border-slate-200 rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-600 ml-1">Bilangan Hari</label>
          <select 
            required
            value={formData.days}
            onChange={(e) => setFormData(prev => ({ ...prev, days: e.target.value }))}
            className="w-full bg-slate-50 border-slate-200 rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">-- Pilih Bilangan Hari --</option>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>{num} Hari</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-600 ml-1">Sebab</label>
          <select 
            required
            value={formData.reason}
            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            className="w-full bg-slate-50 border-slate-200 rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">-- Pilih Sebab --</option>
            {REASONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-600 ml-1">Perlu Relief?</label>
        <div className="flex gap-4">
          <label className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all border-slate-100 bg-slate-50 hover:bg-white has-[:checked]:border-red-500 has-[:checked]:bg-red-50 has-[:checked]:text-red-700">
            <input 
              type="radio" 
              name="relief" 
              className="hidden" 
              checked={formData.needRelief}
              onChange={() => setFormData(prev => ({ ...prev, needRelief: true }))}
            />
            <span className="font-bold">YA</span>
          </label>
          <label className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all border-slate-100 bg-slate-50 hover:bg-white has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700">
            <input 
              type="radio" 
              name="relief" 
              className="hidden" 
              checked={!formData.needRelief}
              onChange={() => setFormData(prev => ({ ...prev, needRelief: false }))}
            />
            <span className="font-bold">TIDAK</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-600 ml-1">Catatan</label>
        <textarea 
          placeholder="Nyatakan secara jelas sebab tiada di sekolah atau masa perlu relief..."
          value={formData.remarks}
          onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
          className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
        />
      </div>

      <button 
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
      >
        <Plus className="w-6 h-6" />
        HANTAR REKOD
      </button>
    </form>
  );
}

function RecordsTable({ records, searchDate, onDelete }: { records: AbsenceRecord[], searchDate: string, onDelete: (id: string) => void }) {
  const filteredRecords = useMemo(() => {
    if (!searchDate) return [];
    const selectedDate = startOfDay(parseISO(searchDate));
    return records.filter(r => {
      const start = parseISO(r.startDate);
      const end = addDays(start, r.days - 1);
      return isWithinInterval(selectedDate, { start, end });
    });
  }, [records, searchDate]);

  if (filteredRecords.length === 0) {
    return (
      <div className="p-20 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-slate-400 font-medium">Tiada rekod ketidakhadiran pada tarikh ini.</h3>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-y border-slate-100">
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bil</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Guru</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tarikh Mula</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bil Hari</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sebab</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Relief</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Catatan</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tindakan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredRecords.map((record, index) => (
            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 text-sm text-slate-500">{index + 1}</td>
              <td className="px-6 py-4 font-bold text-slate-800">{record.teacherName}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{format(parseISO(record.startDate), 'dd/MM/yyyy')}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{record.days} Hari</td>
              <td className="px-6 py-4">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                  {record.reason}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                {record.needRelief ? (
                  <span className="text-rose-600 font-black text-xs bg-rose-50 px-3 py-1 rounded-full border border-rose-200 shadow-[0_0_12px_rgba(225,29,72,0.4)] animate-pulse">
                    YA
                  </span>
                ) : (
                  <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    TIDAK
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-slate-500 min-w-[200px] whitespace-normal">
                {record.remarks || '-'}
              </td>
              <td className="px-6 py-4 text-center">
                <button 
                  onClick={() => {
                    if (confirm('Padam rekod ini?')) onDelete(record.id);
                  }}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonthlyChart({ records }: { records: AbsenceRecord[] }) {
  const data = useMemo(() => {
    const months = eachMonthOfInterval({
      start: startOfYear(new Date()),
      end: endOfYear(new Date())
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      let totalDays = 0;
      records.forEach(r => {
        const start = parseISO(r.startDate);
        const end = addDays(start, r.days - 1);
        
        // Calculate overlap between [start, end] and [monthStart, monthEnd]
        const overlapStart = start > monthStart ? start : monthStart;
        const overlapEnd = end < monthEnd ? end : monthEnd;
        
        if (overlapStart <= overlapEnd) {
          // Difference in days + 1
          const diffTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          totalDays += diffDays;
        }
      });

      return {
        name: format(month, 'MMM'),
        count: totalDays
      };
    });
  }, [records]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <Tooltip 
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TopTeachersChart({ records }: { records: AbsenceRecord[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => {
      counts[r.teacherName] = (counts[r.teacherName] || 0) + r.days;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [records]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" hide />
        <YAxis 
          dataKey="name" 
          type="category" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
          width={150}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ReasonPieChart({ records }: { records: AbsenceRecord[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => {
      counts[r.reason] = (counts[r.reason] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records]);

  if (data.length === 0) return <div className="flex items-center justify-center h-full text-slate-300 italic">Tiada data untuk dipaparkan</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function AddTeacherForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(name);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4">
      <input 
        type="text" 
        placeholder="Masukkan nama guru baru..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 bg-slate-50 border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
      />
      <button 
        type="submit"
        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 rounded-2xl shadow-lg shadow-rose-100 transition-all flex items-center gap-2 whitespace-nowrap"
      >
        <Plus className="w-5 h-5" />
        Tambah Guru
      </button>
    </form>
  );
}
