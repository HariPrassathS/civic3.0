'use client';

// =============================================================================
// CivicConnect TN — Executive Governance Reporting & Export Portal
// =============================================================================
// Generates official Government of Tamil Nadu formatted PDF, Excel (.xlsx), and CSV
// reports from live database data with real-time preview, multi-dimensional filters,
// and zero-crash guarantees.

import React, { useState, useEffect, useTransition } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Clock,
  ShieldAlert,
  Filter,
  Calendar,
  Building2,
  MapPin,
  RotateCcw,
  Sparkles,
  Layers,
  Flame,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { CitizenHeader } from '@/components/citizen/citizen-header';
import { CitizenBottomNav } from '@/components/citizen/bottom-nav';
import { ReportType, ExportFormat, TimeRangePreset, ReportDataPayload } from '@/lib/reports/types';
import { MASTER_DEPARTMENTS, MASTER_CATEGORIES } from '@/lib/complaints/categories';

interface ReportOption {
  type: ReportType;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  badgeColor: string;
  recommendedFormat: ExportFormat;
}

const REPORT_CATALOG: ReportOption[] = [
  {
    type: 'complaint_summary',
    title: 'Executive Complaint Summary',
    subtitle: 'Consolidated public grievances & intake analysis',
    description: 'High-level grievance volume, priority allocation, category breakdown, and district distributions.',
    icon: FileText,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    recommendedFormat: 'pdf',
  },
  {
    type: 'department_performance',
    title: 'Department Performance & Efficiency',
    subtitle: 'Inter-agency operational benchmarks & TAT',
    description: 'Turnaround time (TAT), resolution rate, active backlog, and citizen satisfaction ratings per department.',
    icon: Building2,
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    recommendedFormat: 'excel',
  },
  {
    type: 'sla_performance',
    title: 'SLA Compliance & Breach Register',
    subtitle: 'Statutory turnaround & 75% threshold tracking',
    description: 'Priority-wise SLA adherence, active breaches, imminent warnings, and benchmark comparisons.',
    icon: Clock,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    recommendedFormat: 'excel',
  },
  {
    type: 'escalation_report',
    title: 'Grievance Escalation & Oversight Log',
    subtitle: 'Multi-tier escalation triggers (L1 / L2 / L3)',
    description: 'Root cause analysis for supervisory interventions, overdue backlogs, and Collector escalations.',
    icon: ShieldAlert,
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    recommendedFormat: 'pdf',
  },
  {
    type: 'resolution_report',
    title: 'Resolution Quality & Verification Audit',
    subtitle: 'Ground execution proof & citizen OTP confirmations',
    description: 'Citizen geo-verification rates, reopen percentages, before/after photographic compliance, and feedback.',
    icon: CheckCircle2,
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    recommendedFormat: 'pdf',
  },
  {
    type: 'dmt_report',
    title: 'Data Mining & Spatial Clusters (DBSCAN)',
    subtitle: 'Computational density & cluster discovery',
    description: 'Spatial-temporal density clusters, core points vs noise, cluster density, and common issue groupings.',
    icon: Layers,
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    recommendedFormat: 'excel',
  },
  {
    type: 'hotspot_report',
    title: 'Municipal Hotspots & Recurrence Risk',
    subtitle: 'High-density infrastructure stress nodes',
    description: 'Chronic infrastructure failure zones, micro-ward hotspot rankings, and actionable engineering directives.',
    icon: Flame,
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    recommendedFormat: 'pdf',
  },
  {
    type: 'predictive_insight_report',
    title: 'Predictive Risk & Early Warning AI',
    subtitle: 'Forward-looking failure models & climate multipliers',
    description: 'Probabilistic risk scores, failure trajectories, seasonal climate correlation, and preventative work orders.',
    icon: Sparkles,
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    recommendedFormat: 'pdf',
  },
];

const TAMIL_NADU_DISTRICTS = [
  'All Districts',
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Tiruchirappalli',
  'Salem',
  'Tirunelveli',
  'Tiruppur',
  'Vellore',
  'Erode',
  'Thanjavur',
  'Dindigul',
  'Kanchipuram',
  'Chengalpattu',
  'Cuddalore',
];

export default function ReportsPortalPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('complaint_summary');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departmentId, setDepartmentId] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [district, setDistrict] = useState('All Districts');
  const [ward, setWard] = useState('');
  const [priority, setPriority] = useState('all');
  const [status, setStatus] = useState('all');

  // Preview State
  const [previewData, setPreviewData] = useState<ReportDataPayload | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  // Fetch Preview Data
  const fetchPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const params = new URLSearchParams();
      params.set('type', selectedReport);
      params.set('time_range', timeRange);
      if (timeRange === 'custom' && startDate) params.set('start_date', startDate);
      if (timeRange === 'custom' && endDate) params.set('end_date', endDate);
      if (departmentId !== 'all') params.set('department_id', departmentId);
      if (categoryId !== 'all') params.set('category_id', categoryId);
      if (district !== 'All Districts') params.set('district', district);
      if (ward) params.set('ward', ward);
      if (priority !== 'all') params.set('priority', priority);
      if (status !== 'all') params.set('status', status);

      const res = await fetch(`/api/reports/preview?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPreviewData(json.data);
      }
    } catch (err) {
      console.error('Failed to load report preview:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview();
    setCurrentPage(1);
  }, [selectedReport, timeRange, startDate, endDate, departmentId, categoryId, district, ward, priority, status]);

  // Trigger File Download
  const handleExportDownload = async (formatOverride?: ExportFormat) => {
    const fmt = formatOverride || selectedFormat;
    setIsExporting(true);

    try {
      const params = new URLSearchParams();
      params.set('type', selectedReport);
      params.set('format', fmt);
      params.set('time_range', timeRange);
      if (timeRange === 'custom' && startDate) params.set('start_date', startDate);
      if (timeRange === 'custom' && endDate) params.set('end_date', endDate);
      if (departmentId !== 'all') params.set('department_id', departmentId);
      if (categoryId !== 'all') params.set('category_id', categoryId);
      if (district !== 'All Districts') params.set('district', district);
      if (ward) params.set('ward', ward);
      if (priority !== 'all') params.set('priority', priority);
      if (status !== 'all') params.set('status', status);

      const downloadUrl = `/api/reports/generate?${params.toString()}`;

      // Create a temporary link element to trigger browser download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute(
        'download',
        `${selectedReport}_${new Date().toISOString().slice(0, 10)}.${fmt === 'excel' ? 'xlsx' : fmt}`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const currentReportMeta = REPORT_CATALOG.find((r) => r.type === selectedReport);
      setExportNotification(
        `Successfully generated and downloaded ${currentReportMeta?.title} in ${fmt.toUpperCase()} format.`
      );
      setTimeout(() => setExportNotification(null), 5000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Quick Preset Handlers
  const applyPreset = (preset: 'briefing' | 'sla' | 'monsoon') => {
    if (preset === 'briefing') {
      setSelectedReport('complaint_summary');
      setSelectedFormat('pdf');
      setTimeRange('7d');
      setDepartmentId('all');
      setDistrict('All Districts');
    } else if (preset === 'sla') {
      setSelectedReport('sla_performance');
      setSelectedFormat('excel');
      setTimeRange('30d');
      setDepartmentId('all');
      setDistrict('All Districts');
    } else if (preset === 'monsoon') {
      setSelectedReport('predictive_insight_report');
      setSelectedFormat('pdf');
      setTimeRange('90d');
      setDepartmentId('all');
      setDistrict('All Districts');
    }
  };

  const resetFilters = () => {
    setTimeRange('30d');
    setStartDate('');
    setEndDate('');
    setDepartmentId('all');
    setCategoryId('all');
    setDistrict('All Districts');
    setWard('');
    setPriority('all');
    setStatus('all');
  };

  const activeReportObj = REPORT_CATALOG.find((r) => r.type === selectedReport) || REPORT_CATALOG[0];

  // Filter preview rows by search
  const filteredRows = previewData?.rows
    ? previewData.rows.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : [];

  const rowsPerPage = 10;
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      <CitizenHeader />

      {/* Top Government Title Banner */}
      <div className="border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                தமிழ்நாடு அரசு • Government of Tamil Nadu
              </span>
              <span className="text-xs text-slate-400">CivicConnect TN v3.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-7 h-7 text-emerald-400" />
              Executive Governance Reporting Portal
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Generate official, multi-format administrative briefing documents (PDF, Excel, CSV) from real database
              grievance records, SLA metrics, DBSCAN clusters, and predictive early warnings.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleExportDownload('pdf')}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Quick PDF
            </button>
            <button
              onClick={() => handleExportDownload('excel')}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Quick Excel
            </button>
            <button
              onClick={() => handleExportDownload('csv')}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5" />
              Quick CSV
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {exportNotification && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportNotification}</span>
            </div>
            <button onClick={() => setExportNotification(null)} className="text-emerald-400 hover:text-emerald-200 font-bold ml-4">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Quick Workflow Presets Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">Recommended Executive Workflows:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset('briefing')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3 h-3 text-emerald-400" />
              Morning Executive Briefing (7d)
            </button>
            <button
              onClick={() => applyPreset('sla')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              Monthly SLA Audit (30d)
            </button>
            <button
              onClick={() => applyPreset('monsoon')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Flame className="w-3 h-3 text-rose-400" />
              Monsoon Hazard & Flood Register
            </button>
          </div>
        </div>

        {/* STEP 1: REPORT SELECTOR GRID */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-xs font-bold">
                1
              </span>
              Select Report Domain ({REPORT_CATALOG.length} Available)
            </h2>
            <span className="text-xs text-slate-400">All reports execute real database queries</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {REPORT_CATALOG.map((report) => {
              const Icon = report.icon;
              const isSelected = selectedReport === report.type;

              return (
                <button
                  key={report.type}
                  onClick={() => setSelectedReport(report.type)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${report.badgeColor}`}>
                        {report.recommendedFormat.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white tracking-tight">{report.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{report.description}</p>
                  </div>

                  {isSelected && (
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Active Selection
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: FORMAT SELECTION & GLOBAL FILTERS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Format Selector Column */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  2
                </span>
                Output Format
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedFormat('pdf')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedFormat === 'pdf'
                    ? 'bg-rose-500/10 border-rose-500 text-rose-400 ring-1 ring-rose-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileText className="w-5 h-5 mx-auto mb-1 text-rose-400" />
                <span className="text-xs font-bold block">PDF Document</span>
                <span className="text-[10px] opacity-75 block">Executive Layout</span>
              </button>

              <button
                onClick={() => setSelectedFormat('excel')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedFormat === 'excel'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                <span className="text-xs font-bold block">Excel (.xlsx)</span>
                <span className="text-[10px] opacity-75 block">Multi-Tab Sheet</span>
              </button>

              <button
                onClick={() => setSelectedFormat('csv')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedFormat === 'csv'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400 ring-1 ring-blue-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileCode className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                <span className="text-xs font-bold block">CSV Data</span>
                <span className="text-[10px] opacity-75 block">UTF-8 Raw Stream</span>
              </button>
            </div>

            {/* Export Call To Action Button */}
            <button
              onClick={() => handleExportDownload()}
              disabled={isExporting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating {selectedFormat.toUpperCase()} Document...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download {activeReportObj.title} ({selectedFormat.toUpperCase()})
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Direct streaming download • Bounded memory safety
            </div>
          </div>

          {/* Filters Column (Span 2) */}
          <div className="lg:col-span-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  3
                </span>
                Multi-Dimensional Scope Filters
              </h3>
              <button
                onClick={resetFilters}
                className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All Filters
              </button>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Time Range Preset */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Time Range</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRangePreset)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="today">Today (Last 24 Hours)</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days (Standard)</option>
                  <option value="90d">Last 90 Days (Quarterly)</option>
                  <option value="1y">Last 1 Year (Annual)</option>
                  <option value="all">All Time Records</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Departments</option>
                  {MASTER_DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name.split('(')[0].trim()}
                    </option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {TAMIL_NADU_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward Number */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Ward Number</label>
                <input
                  type="number"
                  placeholder="e.g. 5 (Leave blank for all)"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent (12h SLA)</option>
                  <option value="high">High (24h SLA)</option>
                  <option value="medium">Medium (48h SLA)</option>
                  <option value="low">Low (72h SLA)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="verified">Verified (OTP)</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Custom Date Pickers (Shown only when custom is selected) */}
            {timeRange === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STEP 3: REAL-TIME EXECUTIVE SUMMARY & DATA PREVIEW */}
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">{previewData?.metadata.title || activeReportObj.title}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Scope: {previewData?.metadata.departmentScope} • {previewData?.metadata.districtScope} • Date:{' '}
                {previewData?.metadata.dateScope} • Total Records: {previewData?.metadata.totalRecords ?? '...'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchPreview}
                disabled={isLoadingPreview}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                Refresh Preview
              </button>
            </div>
          </div>

          {/* KPI Summary Cards Strip */}
          {previewData?.kpis && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {previewData.kpis.map((kpi) => {
                let toneBorder = 'border-slate-800';
                let toneText = 'text-slate-200';
                if (kpi.tone === 'success') {
                  toneBorder = 'border-emerald-500/40 bg-emerald-950/20';
                  toneText = 'text-emerald-400';
                } else if (kpi.tone === 'danger') {
                  toneBorder = 'border-rose-500/40 bg-rose-950/20';
                  toneText = 'text-rose-400';
                } else if (kpi.tone === 'warning') {
                  toneBorder = 'border-amber-500/40 bg-amber-950/20';
                  toneText = 'text-amber-400';
                } else if (kpi.tone === 'info') {
                  toneBorder = 'border-blue-500/40 bg-blue-950/20';
                  toneText = 'text-blue-400';
                }

                return (
                  <div key={kpi.key} className={`p-3 rounded-xl border ${toneBorder} bg-slate-900/80`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      {kpi.label}
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-xl font-bold ${toneText}`}>{kpi.value}</span>
                      {kpi.unit && <span className="text-xs text-slate-400">{kpi.unit}</span>}
                    </div>
                    {kpi.subtext && <span className="text-[10px] text-slate-500 block mt-0.5">{kpi.subtext}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Interactive Table Preview */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-300">
                Data Register Preview ({filteredRows.length} matching rows)
              </div>
              <input
                type="text"
                placeholder="Search preview rows..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
              />
            </div>

            {isLoadingPreview ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                Aggregating real database data for {activeReportObj.title}...
              </div>
            ) : paginatedRows.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
                No matching records found for current filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300 font-semibold">
                      {previewData?.columns.map((col) => (
                        <th key={col.key} className="px-3.5 py-2.5 whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {paginatedRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/50 transition-colors">
                        {previewData?.columns.map((col) => {
                          const val = row[col.key] ?? '—';
                          const valStr = String(val).toUpperCase();

                          let pillStyle = '';
                          if (valStr === 'URGENT' || valStr === 'BREACHED' || valStr === 'CRITICAL') {
                            pillStyle = 'text-rose-400 font-semibold';
                          } else if (valStr === 'HIGH' || valStr === '75% WARNING' || valStr === 'L2 DEPT HEAD') {
                            pillStyle = 'text-amber-400 font-semibold';
                          } else if (
                            valStr === 'RESOLVED' ||
                            valStr === 'VERIFIED' ||
                            valStr === 'MET ON TIME' ||
                            valStr === 'HIGH DENSITY'
                          ) {
                            pillStyle = 'text-emerald-400 font-semibold';
                          }

                          return (
                            <td key={col.key} className={`px-3.5 py-2 whitespace-nowrap text-slate-300 ${pillStyle}`}>
                              {String(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <CitizenBottomNav />
    </div>
  );
}
