'use client';

import React, { useEffect, useState, useRef } from 'react';
import api from '../../../lib/api';
import { useAuth } from '../../../components/AuthProvider';
import { Student, User, ContactStatus, SupportStatus, VoteStatus } from '../../../types';
import {
  Search,
  Filter,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Trash2,
  Edit,
  X,
  Check,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';

export default function VotersPage() {
  const { user } = useAuth();
  const isEditorOrAdmin = user?.role === 'Admin' || user?.role === 'Editor';
  const isWatcher = user?.role === 'Watcher';
  const isMarker = user?.role === 'Marker';

  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Queries
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters State
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [contactFilter, setContactFilter] = useState('');
  const [supportFilter, setSupportFilter] = useState('');
  const [voteFilter, setVoteFilter] = useState('');
  const [volunteerFilter, setVolunteerFilter] = useState('');
  const [admissionYearFilter, setAdmissionYearFilter] = useState('');
  const [passOutYearFilter, setPassOutYearFilter] = useState('');
  const [degreeTypeFilter, setDegreeTypeFilter] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Panels
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  // Bulk Updates State
  const [bulkContactStatus, setBulkContactStatus] = useState<ContactStatus | ''>('');
  const [bulkSupportStatus, setBulkSupportStatus] = useState<SupportStatus | ''>('');
  const [bulkVoteStatus, setBulkVoteStatus] = useState<VoteStatus | ''>('');
  const [bulkVolunteerId, setBulkVolunteerId] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch voters list
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      };

      if (deptFilter) params.department = deptFilter;
      if (yearFilter) params.year = yearFilter;
      if (contactFilter) params.contactStatus = contactFilter;
      if (supportFilter) params.supportStatus = supportFilter;
      if (voteFilter) params.voteStatus = voteFilter;
      if (volunteerFilter) params.assignedVolunteer = volunteerFilter;
      if (admissionYearFilter) params.admissionYear = admissionYearFilter;
      if (passOutYearFilter) params.passOutYear = passOutYearFilter;
      if (degreeTypeFilter) params.degreeType = degreeTypeFilter;

      const res = await api.get('/students', { params });
      setStudents(res.data.students);
      setTotalPages(res.data.pages);
      setTotalRecords(res.data.total);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch volunteers list for assign options
  const fetchVolunteers = async () => {
    try {
      const res = await api.get('/volunteers');
      setVolunteers(res.data);
    } catch (err) {
      console.error('Error fetching volunteers:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get<string[]>('/students/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchVolunteers();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchStudents();
    setSelectedIds([]);
  }, [page, limit, sortBy, sortOrder, deptFilter, yearFilter, contactFilter, supportFilter, voteFilter, volunteerFilter, admissionYearFilter, passOutYearFilter, degreeTypeFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStudents();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Toggle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(students.map((s) => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Sort click helper
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Export current list to CSV
  const handleExport = async () => {
    try {
      const params: any = {};
      if (deptFilter) params.department = deptFilter;
      if (yearFilter) params.year = yearFilter;
      if (contactFilter) params.contactStatus = contactFilter;
      if (supportFilter) params.supportStatus = supportFilter;
      if (voteFilter) params.voteStatus = voteFilter;

      const response = await api.get('/students/export', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Voters_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV file.');
    }
  };

  // Handle CSV file upload & parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      setImportMessage(`Loaded CSV file (${file.name}). Ready to import.`);
    };
    reader.readAsText(file);
  };

  // Submit CSV import to backend
  const handleImportSubmit = async () => {
    if (!csvText.trim()) {
      setImportMessage('Please select a file or paste CSV text first.');
      return;
    }

    setIsImporting(true);
    setImportMessage('Uploading and parsing CSV records...');
    try {
      const res = await api.post('/students/import', { csvText });
      setImportMessage(res.data.message);
      fetchStudents();
      setTimeout(() => {
        setShowImportModal(false);
        setCsvText('');
        setImportMessage('');
      }, 3000);
    } catch (err: any) {
      setImportMessage(err.response?.data?.message || 'Error occurred during import.');
    } finally {
      setIsImporting(false);
    }
  };

  // Bulk update submit
  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) return;
    
    const updates: any = {};
    if (bulkContactStatus) updates.contactStatus = bulkContactStatus;
    if (bulkSupportStatus) updates.supportStatus = bulkSupportStatus;
    if (bulkVoteStatus) updates.voteStatus = bulkVoteStatus;
    if (bulkVolunteerId) updates.assignedVolunteer = bulkVolunteerId;

    if (Object.keys(updates).length === 0) {
      alert('Please specify at least one status to update.');
      return;
    }

    try {
      await api.patch('/students/bulk', {
        studentIds: selectedIds,
        updates,
      });
      fetchStudents();
      setSelectedIds([]);
      setShowBulkPanel(false);
      // Reset values
      setBulkContactStatus('');
      setBulkSupportStatus('');
      setBulkVoteStatus('');
      setBulkVolunteerId('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating student records.');
    }
  };

  // Single edit submit
  const handleSingleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const res = await api.patch(`/students/${editingStudent._id}`, editingStudent);
      setStudents(students.map((s) => (s._id === editingStudent._id ? res.data : s)));
      setEditingStudent(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update student record.');
    }
  };

  // Delete single student
  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student record?')) return;
    try {
      await api.delete(`/students/${id}`);
      setStudents(students.filter((s) => s._id !== id));
      setTotalRecords(totalRecords - 1);
    } catch (err) {
      alert('Failed to delete student.');
    }
  };

  // Color mappings
  const getContactBadge = (status: ContactStatus) => {
    switch (status) {
      case 'Contacted':
        return <span className="inline-flex items-center text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full"><Check className="h-3.5 w-3.5 mr-0.5" /> Contacted</span>;
      case 'Follow-up Required':
        return <span className="inline-flex items-center text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full"><Clock className="h-3.5 w-3.5 mr-0.5" /> Follow-up</span>;
      default:
        return <span className="inline-flex items-center text-xs font-semibold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-full"><X className="h-3.5 w-3.5 mr-0.5" /> Uncontacted</span>;
    }
  };

  const getSupportBadge = (status: SupportStatus) => {
    switch (status) {
      case 'Fully in our favour':
        return <span className="inline-flex items-center text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Fully Favour</span>;
      case 'Leaning towards us':
        return <span className="inline-flex items-center text-xs font-semibold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded">Leaning</span>;
      case 'Dicey':
        return <span className="inline-flex items-center text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Dicey</span>;
      case 'Against us':
        return <span className="inline-flex items-center text-xs font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">Against</span>;
      default:
        return <span className="inline-flex items-center text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">Unknown</span>;
    }
  };

  // departments state loaded dynamically from the backend

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Student Voter Pool</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and update {totalRecords} student voter profiles.</p>
        </div>
        
        {/* Actions panel */}
        <div className="flex items-center gap-3">
          {isEditorOrAdmin && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center space-x-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground px-4 py-2.5 text-sm font-semibold transition-colors"
              >
                <Upload className="h-4.5 w-4.5" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center space-x-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground px-4 py-2.5 text-sm font-semibold transition-colors"
              >
                <Download className="h-4.5 w-4.5" />
                <span>Export CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Query Filter and Search Dashboard */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Search by student name, admission number, or mobile number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 shrink-0"><Filter className="h-4 w-4" /> FILTERS</span>
            <button
              onClick={() => {
                setDeptFilter('');
                setYearFilter('');
                setContactFilter('');
                setSupportFilter('');
                setVoteFilter('');
                setVolunteerFilter('');
                setAdmissionYearFilter('');
                setPassOutYearFilter('');
                setDegreeTypeFilter('');
                setSearch('');
                setPage(1);
              }}
              className="text-xs font-semibold text-primary hover:underline shrink-0"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Dropdowns grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-border bg-card p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-border bg-card p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
            <option value="5">5th Year</option>
          </select>

          <select
            value={admissionYearFilter}
            onChange={(e) => { setAdmissionYearFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-border bg-card p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="">All Adm. Years</option>
            <option value="2021">2021 (Adm)</option>
            <option value="2022">2022 (Adm)</option>
            <option value="2023">2023 (Adm)</option>
            <option value="2024">2024 (Adm)</option>
            <option value="2025">2025 (Adm)</option>
          </select>

          <select
            value={passOutYearFilter}
            onChange={(e) => { setPassOutYearFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-border bg-card p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="">All Passout Years</option>
            <option value="2025">2025 (Pass)</option>
            <option value="2026">2026 (Pass)</option>
            <option value="2027">2027 (Pass)</option>
            <option value="2028">2028 (Pass)</option>
            <option value="2029">2029 (Pass)</option>
            <option value="2030">2030 (Pass)</option>
          </select>

          <select
            value={degreeTypeFilter}
            onChange={(e) => { setDegreeTypeFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-border bg-card p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="">All Program Types</option>
            <option value="U">B.Tech (U)</option>
            <option value="I">Integrated (I)</option>
          </select>

          <select
            value={contactFilter}
            onChange={(e) => { setContactFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-border bg-card p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="">All Contacts</option>
            <option value="Contacted">Contacted</option>
            <option value="Not Contacted">Uncontacted</option>
            <option value="Follow-up Required">Follow-up Required</option>
          </select>

          <select
            value={supportFilter}
            onChange={(e) => { setSupportFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-border bg-card p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="">All Support Levels</option>
            <option value="Fully in our favour">Fully in favour</option>
            <option value="Leaning towards us">Leaning</option>
            <option value="Dicey">Dicey</option>
            <option value="Against us">Against</option>
            <option value="Unknown">Unknown</option>
          </select>

          <select
            value={voteFilter}
            onChange={(e) => { setVoteFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-border bg-card p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="">All Vote Status</option>
            <option value="Voted">Voted</option>
            <option value="Not Voted">Not Voted</option>
          </select>

          <select
            value={volunteerFilter}
            onChange={(e) => { setVolunteerFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-border bg-card p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="">All Assigned Volunteers</option>
            <option value="null">Unassigned</option>
            {volunteers.map((v) => <option key={v._id || v.id} value={v._id || v.id}>{v.username}</option>)}
          </select>
        </div>
      </div>

      {/* Selected Row Bulk Operations Bar */}
      {selectedIds.length > 0 && isEditorOrAdmin && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-foreground animate-fade-in shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm">{selectedIds.length} voters selected</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={bulkContactStatus}
              onChange={(e) => setBulkContactStatus(e.target.value as ContactStatus)}
              className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="">Set Contact Status</option>
              <option value="Contacted">Contacted</option>
              <option value="Not Contacted">Uncontacted</option>
              <option value="Follow-up Required">Follow-up Required</option>
            </select>

            <select
              value={bulkSupportStatus}
              onChange={(e) => setBulkSupportStatus(e.target.value as SupportStatus)}
              className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="">Set Support Status</option>
              <option value="Fully in our favour">Fully in favour</option>
              <option value="Leaning towards us">Leaning</option>
              <option value="Dicey">Dicey</option>
              <option value="Against us">Against</option>
              <option value="Unknown">Unknown</option>
            </select>

            <select
              value={bulkVoteStatus}
              onChange={(e) => setBulkVoteStatus(e.target.value as VoteStatus)}
              className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="">Set Vote Status</option>
              <option value="Voted">Voted</option>
              <option value="Not Voted">Not Voted</option>
            </select>

            <select
              value={bulkVolunteerId}
              onChange={(e) => setBulkVolunteerId(e.target.value)}
              className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="">Assign Volunteer</option>
              <option value="null">Remove Volunteer</option>
              {volunteers.map((v) => <option key={v._id || v.id} value={v._id || v.id}>{v.username}</option>)}
            </select>

            <button
              onClick={handleBulkUpdate}
              className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90"
            >
              Apply Updates
            </button>
          </div>
        </div>
      )}

      {/* Voters Table Panel */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider sticky top-0 z-10">
              <tr>
                {isEditorOrAdmin && (
                  <th className="px-3 md:px-6 py-4 w-4 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-border focus:ring-primary"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === students.length && students.length > 0}
                    />
                  </th>
                )}
                <th className="px-3 md:px-6 py-4 cursor-pointer hover:bg-muted-foreground/10" onClick={() => handleSort('name')}>Name</th>
                <th className="px-3 md:px-6 py-4 cursor-pointer hover:bg-muted-foreground/10" onClick={() => handleSort('admissionNumber')}>Admission No</th>
                <th className="hidden md:table-cell px-6 py-4">Mobile</th>
                <th className="hidden lg:table-cell px-6 py-4 cursor-pointer hover:bg-muted-foreground/10" onClick={() => handleSort('department')}>Department</th>
                <th className="hidden md:table-cell px-6 py-4 text-center cursor-pointer hover:bg-muted-foreground/10" onClick={() => handleSort('year')}>Year</th>
                <th className="hidden md:table-cell px-6 py-4 text-center cursor-pointer hover:bg-muted-foreground/10" onClick={() => handleSort('contactStatus')}>Contact Status</th>
                <th className="hidden md:table-cell px-6 py-4 text-center cursor-pointer hover:bg-muted-foreground/10" onClick={() => handleSort('supportStatus')}>Support Level</th>
                <th className="hidden lg:table-cell px-6 py-4 text-center cursor-pointer hover:bg-muted-foreground/10" onClick={() => handleSort('probabilityScore')}>Prob %</th>
                <th className="px-3 md:px-6 py-4 text-center cursor-pointer hover:bg-muted-foreground/10" onClick={() => handleSort('voteStatus')}>Voted</th>
                <th className="hidden md:table-cell px-6 py-4">Volunteer</th>
                <th className="px-3 md:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-24 text-center text-muted-foreground">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2"></div>
                    Loading Voter Pool...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-24 text-center text-muted-foreground">
                    No student records found matching the query.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  let rowBg = 'hover:bg-muted/10';
                  if (student.supportStatus === 'Fully in our favour') {
                    rowBg = 'bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30';
                  } else if (student.supportStatus === 'Against us') {
                    rowBg = 'bg-rose-500/10 hover:bg-rose-500/15 dark:bg-rose-950/20 dark:hover:bg-rose-950/30';
                  } else if (student.supportStatus === 'Dicey' || student.supportStatus === 'Leaning towards us') {
                    rowBg = 'bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-950/20 dark:hover:bg-amber-950/30';
                  }

                  const isImportant = student.influenceScore > 0;
                  const rowGlow = isImportant
                    ? 'shadow-[inset_0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/25 border-y-amber-500/30'
                    : '';

                  return (
                    <tr key={student._id} className={`${rowBg} ${rowGlow} transition-colors`}>
                      {isEditorOrAdmin && (
                        <td className="px-3 md:px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-border focus:ring-primary"
                            checked={selectedIds.includes(student._id)}
                            onChange={() => handleSelectRow(student._id)}
                          />
                        </td>
                      )}
                      <td className="px-3 md:px-6 py-4 font-semibold text-foreground truncate max-w-[120px] md:max-w-[180px]">
                        <div className="flex items-center gap-1.5">
                          <span className={isImportant ? 'text-amber-500 font-extrabold drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]' : ''}>
                            {student.name}
                          </span>
                          {isImportant && (
                            <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-ping" title="Influential VIP" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 font-mono text-xs">{student.admissionNumber}</td>
                      <td className="hidden md:table-cell px-6 py-4 font-mono text-xs">{student.mobileNumber || '-'}</td>
                      <td className="hidden lg:table-cell px-6 py-4 truncate max-w-[180px]">{student.department}</td>
                      <td className="hidden md:table-cell px-6 py-4 text-center">Yr {student.year}</td>
                      <td className="hidden md:table-cell px-6 py-4 text-center whitespace-nowrap">{getContactBadge(student.contactStatus)}</td>
                      <td className="hidden md:table-cell px-6 py-4 text-center whitespace-nowrap">{getSupportBadge(student.supportStatus)}</td>
                      <td className="hidden lg:table-cell px-6 py-4 text-center font-bold">{student.probabilityScore}%</td>
                      <td className="px-3 md:px-6 py-4 text-center">
                        <button
                          onClick={async () => {
                            if (isWatcher) return;
                            try {
                              const newStatus = student.voteStatus === 'Voted' ? 'Not Voted' : 'Voted';
                              const res = await api.patch(`/students/${student._id}`, { voteStatus: newStatus });
                              // Update local list
                              setStudents(students.map((s) => s._id === student._id ? res.data : s));
                            } catch (err) {
                              console.error('Error toggling vote status:', err);
                            }
                          }}
                          disabled={isWatcher}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                            student.voteStatus === 'Voted'
                              ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                          }`}
                          title={isWatcher ? 'Vote Status' : 'Tap to toggle vote status'}
                        >
                          {student.voteStatus === 'Voted' ? 'Yes' : 'No'}
                        </button>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 truncate max-w-[120px] text-xs font-semibold">
                        {student.assignedVolunteer ? (
                          <span className="text-primary">{student.assignedVolunteer.username}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 md:px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setEditingStudent(student)}
                            className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title="Edit Voter Details"
                          >
                            <Edit className="h-4.5 w-4.5" />
                          </button>
                          {isEditorOrAdmin && (
                            <button
                              onClick={() => handleDeleteStudent(student._id)}
                              className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-danger transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card text-xs">
          <div className="text-muted-foreground">
            Showing <strong className="text-foreground">{students.length}</strong> of <strong className="text-foreground">{totalRecords}</strong> voters
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="text-muted-foreground">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                className="rounded-lg border border-border bg-card p-1 focus:outline-none"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-muted-foreground">Page <strong className="text-foreground">{page}</strong> of {totalPages}</span>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Drawer Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingStudent(null)} />

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-card border-l border-border h-full flex flex-col shadow-2xl p-6 overflow-y-auto z-10">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-card-foreground">Voter Profile Profile</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Admin: {editingStudent.admissionNumber}</p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSingleUpdate} className="flex-1 space-y-6">
              {/* Profile Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Student Name</label>
                  <input
                    type="text"
                    required
                    disabled={isMarker || isWatcher}
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="block w-full rounded-lg border border-border bg-background p-2.5 text-sm mt-1 focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Mobile Number</label>
                    <input
                      type="text"
                      disabled={isWatcher}
                      value={editingStudent.mobileNumber || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, mobileNumber: e.target.value })}
                      className="block w-full rounded-lg border border-border bg-background p-2.5 text-sm mt-1 focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Hostel / Hall</label>
                    <input
                      type="text"
                      disabled={isMarker || isWatcher}
                      value={editingStudent.hostel || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, hostel: e.target.value })}
                      className="block w-full rounded-lg border border-border bg-background p-2.5 text-sm mt-1 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Department</label>
                    <select
                      disabled={isMarker || isWatcher}
                      value={editingStudent.department}
                      onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })}
                      className="block w-full rounded-lg border border-border bg-background p-2.5 text-sm mt-1 focus:outline-none disabled:opacity-60"
                    >
                      {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Academic Year</label>
                    <select
                      disabled={isMarker || isWatcher}
                      value={editingStudent.year}
                      onChange={(e) => setEditingStudent({ ...editingStudent, year: parseInt(e.target.value) })}
                      className="block w-full rounded-lg border border-border bg-background p-2.5 text-sm mt-1 focus:outline-none disabled:opacity-60"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status fields */}
              <div className="space-y-4 border-t border-border pt-4">
                <h4 className="text-sm font-bold text-foreground mb-2">Campaign Outreach Status</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Contact Status</label>
                    <select
                      disabled={isWatcher}
                      value={editingStudent.contactStatus}
                      onChange={(e) => setEditingStudent({ ...editingStudent, contactStatus: e.target.value as ContactStatus })}
                      className="block w-full rounded-lg border border-border bg-background p-2.5 text-sm mt-1 focus:outline-none disabled:opacity-60"
                    >
                      <option value="Contacted">Contacted</option>
                      <option value="Not Contacted">Uncontacted</option>
                      <option value="Follow-up Required">Follow-up Required</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Support level</label>
                    <select
                      disabled={isMarker || isWatcher}
                      value={editingStudent.supportStatus}
                      onChange={(e) => setEditingStudent({ ...editingStudent, supportStatus: e.target.value as SupportStatus })}
                      className="block w-full rounded-lg border border-border bg-background p-2.5 text-sm mt-1 focus:outline-none disabled:opacity-60"
                    >
                      <option value="Fully in our favour">Fully in favour</option>
                      <option value="Leaning towards us">Leaning</option>
                      <option value="Dicey">Dicey</option>
                      <option value="Against us">Against</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Vote Casted Status</label>
                    <select
                      disabled={isWatcher}
                      value={editingStudent.voteStatus}
                      onChange={(e) => setEditingStudent({ ...editingStudent, voteStatus: e.target.value as VoteStatus })}
                      className="block w-full rounded-lg border border-border bg-background p-2.5 text-sm mt-1 focus:outline-none disabled:opacity-60"
                    >
                      <option value="Voted">Voted</option>
                      <option value="Not Voted">Not Voted</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Assigned Volunteer</label>
                    <select
                      disabled={isMarker || isWatcher}
                      value={editingStudent.assignedVolunteer?._id || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const vol = volunteers.find((x) => x._id === val || x.id === val);
                        setEditingStudent({
                          ...editingStudent,
                          assignedVolunteer: val ? { _id: val, username: vol?.username || '', role: 'Volunteer' } as any : null,
                        });
                      }}
                      className="block w-full rounded-lg border border-border bg-background p-2.5 text-sm mt-1 focus:outline-none disabled:opacity-60"
                    >
                      <option value="">Unassigned</option>
                      {volunteers.map((v) => <option key={v._id || v.id} value={v._id || v.id}>{v.username}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Influence Score Checklist */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-sm font-bold text-foreground">Influence Score Checklist</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-muted/40 hover:bg-muted border border-border/40 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isMarker || isWatcher}
                      checked={editingStudent.isCR}
                      onChange={(e) => setEditingStudent({ ...editingStudent, isCR: e.target.checked })}
                      className="rounded border-border focus:ring-primary text-primary"
                    />
                    <span>Class Representative (CR)</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-muted/40 hover:bg-muted border border-border/40 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isMarker || isWatcher}
                      checked={editingStudent.isClubLeader}
                      onChange={(e) => setEditingStudent({ ...editingStudent, isClubLeader: e.target.checked })}
                      className="rounded border-border focus:ring-primary text-primary"
                    />
                    <span>Club Leadership / Board</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-muted/40 hover:bg-muted border border-border/40 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isMarker || isWatcher}
                      checked={editingStudent.isHostelRep}
                      onChange={(e) => setEditingStudent({ ...editingStudent, isHostelRep: e.target.checked })}
                      className="rounded border-border focus:ring-primary text-primary"
                    />
                    <span>Hostel Representative</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-muted/40 hover:bg-muted border border-border/40 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isMarker || isWatcher}
                      checked={editingStudent.isSportsCaptain}
                      onChange={(e) => setEditingStudent({ ...editingStudent, isSportsCaptain: e.target.checked })}
                      className="rounded border-border focus:ring-primary text-primary"
                    />
                    <span>Sports Captain / Vice</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-muted/40 hover:bg-muted border border-border/40 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isMarker || isWatcher}
                      checked={editingStudent.isEventOrganizer}
                      onChange={(e) => setEditingStudent({ ...editingStudent, isEventOrganizer: e.target.checked })}
                      className="rounded border-border focus:ring-primary text-primary"
                    />
                    <span>Fest / Event Organizer</span>
                  </label>

                  <label className="flex items-center space-x-2 p-2 rounded-lg bg-muted/40 hover:bg-muted border border-border/40 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isMarker || isWatcher}
                      checked={editingStudent.isPopular}
                      onChange={(e) => setEditingStudent({ ...editingStudent, isPopular: e.target.checked })}
                      className="rounded border-border focus:ring-primary text-primary"
                    />
                    <span>High Popularity Student</span>
                  </label>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2 border-t border-border pt-4">
                <label className="text-xs font-bold text-muted-foreground uppercase">Remarks & Context Notes</label>
                <textarea
                  rows={3}
                  disabled={isWatcher}
                  value={editingStudent.remarks || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, remarks: e.target.value })}
                  placeholder="Enter contact feedback details or remarks..."
                  className="block w-full rounded-lg border border-border bg-background p-2.5 text-sm mt-1 focus:outline-none disabled:opacity-60"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-6 border-t border-border">
                {!isWatcher && (
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Save Profile Changes
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 bg-muted hover:bg-muted-foreground/10 text-foreground py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  {isWatcher ? 'Close Profile' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />

          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Import Voter Roster CSV
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-xs font-medium text-foreground">Upload your voter list spreadsheet</p>
                <p className="text-[10px] text-muted-foreground">Supported formats: Standard CSV. First row must contain column headers.</p>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex rounded-lg bg-muted hover:bg-muted-foreground/10 text-foreground px-3 py-1.5 text-xs font-semibold mt-2"
                >
                  Browse Files
                </button>
              </div>

              {/* CSV Text Area fallback */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Or Paste Raw CSV Data</label>
                <textarea
                  rows={5}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="name,admissionNumber,department,year,contactStatus,supportStatus,voteStatus..."
                  className="block w-full rounded-lg border border-border bg-background p-2.5 text-xs mt-1 font-mono focus:outline-none"
                />
              </div>

              {importMessage && (
                <div className="rounded-lg bg-muted p-3 text-xs text-foreground font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                  <span>{importMessage}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4 border-t border-border justify-end">
              <button
                onClick={handleImportSubmit}
                disabled={isImporting}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Start Import'}
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="bg-muted hover:bg-muted-foreground/10 text-foreground px-5 py-2 rounded-xl text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
