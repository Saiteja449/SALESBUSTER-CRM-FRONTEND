import React, { useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Users,
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { API_ENDPOINTS } from "../../utils/constants.js";
import { useLeads } from "../../context/LeadsContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ImportLeadsModal({ isOpen, onClose, onImportSuccess }) {
  const { activeServices } = useLeads();
  const { allUsers } = useAuth();
  const fileInputRef = useRef(null);

  const MAX_LEADS_LIMIT = 300;

  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [detectedColumns, setDetectedColumns] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    city: "",
    company: "",
    notes: "",
  });

  const [batchTag, setBatchTag] = useState(
    `Excel-Import-${new Date().toISOString().slice(0, 10)}`
  );
  const [assignedTo, setAssignedTo] = useState("Unassigned");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  // Auto-detect header column names
  const autoDetectColumns = (headers) => {
    const mapping = {
      name: "",
      phone: "",
      email: "",
      service: "",
      city: "",
      company: "",
      notes: "",
    };

    const matchHeader = (candidates) => {
      for (const h of headers) {
        const cleanH = String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const c of candidates) {
          const cleanC = c.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (cleanH === cleanC) return h;
        }
      }
      return "";
    };

    mapping.name = matchHeader([
      "name",
      "fullname",
      "customername",
      "leadname",
      "clientname",
      "contactname",
    ]);
    mapping.phone = matchHeader([
      "phone",
      "mobile",
      "mobilenumber",
      "contact",
      "contactnumber",
      "phonenumber",
      "whatsappnumber",
      "whatsapp",
    ]);
    mapping.email = matchHeader(["email", "emailaddress", "mail"]);
    mapping.service = matchHeader([
      "service",
      "product",
      "serviceproduct",
      "category",
      "inquiryfor",
    ]);
    mapping.city = matchHeader(["city", "location", "area", "address"]);
    mapping.company = matchHeader([
      "company",
      "organization",
      "business",
      "companyname",
    ]);
    mapping.notes = matchHeader([
      "notes",
      "remarks",
      "comment",
      "description",
      "message",
    ]);

    setColumnMapping(mapping);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processFile(dropped);
    }
  };

  const processFile = (fileObj) => {
    setError("");
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (rows.length === 0) {
          setError("The selected file contains no data rows.");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        if (rows.length > MAX_LEADS_LIMIT) {
          setError(
            `Limit Exceeded: The selected file contains ${rows.length} leads. A maximum of ${MAX_LEADS_LIMIT} leads can be added at once. Please split your file or keep up to ${MAX_LEADS_LIMIT} leads.`
          );
          setFile(null);
          setParsedRows([]);
          setDetectedColumns([]);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        setFile(fileObj);
        const headers = Object.keys(rows[0] || {});
        setDetectedColumns(headers);
        autoDetectColumns(headers);
        setParsedRows(rows);
      } catch (err) {
        console.error("Error parsing spreadsheet:", err);
        setError("Failed to parse spreadsheet. Please ensure it is a valid Excel or CSV file.");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(fileObj);
  };

  // Download Sample Excel Template
  const handleDownloadSample = () => {
    const sampleData = [
      {
        "Full Name": "Rajesh Kumar",
        "Mobile Number": "9876543210",
        "Email Address": "rajesh.kumar@example.com",
        "Service": "General Enquiry",
        "City": "Hyderabad",
        "Company": "Kumar Enterprises",
        "Notes": "Met at trade expo, interested in quotation",
      },
      {
        "Full Name": "Priya Sharma",
        "Mobile Number": "9123456780",
        "Email Address": "priya.s@example.com",
        "Service": "General Enquiry",
        "City": "Bengaluru",
        "Company": "Sharma Logistics",
        "Notes": "Requires bulk consultation for project",
      },
      {
        "Full Name": "Anand Varma",
        "Mobile Number": "9845012345",
        "Email Address": "anand.v@example.com",
        "Service": "General Enquiry",
        "City": "Chennai",
        "Company": "Apex Developers",
        "Notes": "Immediate requirement for upcoming facility",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample Leads");
    XLSX.writeFile(workbook, "SalesBuster_Leads_Import_Template.xlsx");
  };

  // Submit parsed leads to backend
  const handleImport = async () => {
    if (!file || parsedRows.length === 0) {
      setError("Please select and upload a valid Excel or CSV file.");
      return;
    }

    if (parsedRows.length > MAX_LEADS_LIMIT) {
      setError(`Cannot import more than ${MAX_LEADS_LIMIT} leads at once. Found ${parsedRows.length} rows.`);
      return;
    }

    if (!columnMapping.phone) {
      setError("Please select which column contains the Phone / Mobile Number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Map rows using chosen column mapping
      const mappedLeads = parsedRows.map((r) => ({
        name: columnMapping.name ? String(r[columnMapping.name] || "").trim() : "",
        phone: columnMapping.phone ? String(r[columnMapping.phone] || "").trim() : "",
        email: columnMapping.email ? String(r[columnMapping.email] || "").trim() : "",
        service: columnMapping.service
          ? String(r[columnMapping.service] || "").trim()
          : "General Enquiry",
        city: columnMapping.city ? String(r[columnMapping.city] || "").trim() : "",
        company: columnMapping.company ? String(r[columnMapping.company] || "").trim() : "",
        notes: columnMapping.notes ? String(r[columnMapping.notes] || "").trim() : "",
      }));

      const res = await axios.post(API_ENDPOINTS.LEADS.IMPORT_EXCEL, {
        leads: mappedLeads,
        batchTag: batchTag.trim(),
        assignedTo,
        skipDuplicates,
      });

      if (res.data.success) {
        setImportResult(res.data);
        if (onImportSuccess) {
          onImportSuccess(res.data);
        }
      }
    } catch (err) {
      console.error("Import error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to import leads. Please verify column formatting."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setDetectedColumns([]);
    setImportResult(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Import Leads from Excel / CSV
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Max 300 leads
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bulk upload contacts into <span className="font-semibold text-purple-600 dark:text-purple-400">Old Leads</span> for WhatsApp Campaigns
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                {error}
              </div>
            </div>
          )}

          {/* Result State View */}
          {importResult ? (
            <div
              className={`p-6 rounded-2xl border text-center space-y-4 animate-fadeIn ${
                importResult.importedCount > 0
                  ? "bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20"
                  : "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg ${
                  importResult.importedCount > 0
                    ? "bg-emerald-500 text-white shadow-emerald-500/30"
                    : "bg-amber-500 text-white shadow-amber-500/30"
                }`}
              >
                {importResult.importedCount > 0 ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <AlertCircle className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {importResult.importedCount > 0
                    ? "Import Successful!"
                    : "No New Leads Imported"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {importResult.importedCount > 0
                    ? "Your leads have been added to Old Leads and tagged for WhatsApp campaigns."
                    : importResult.skippedDuplicates > 0
                    ? `All ${importResult.skippedDuplicates} contacts in the file already exist in your CRM database.`
                    : importResult.invalidCount > 0
                    ? `All ${importResult.invalidCount} rows contained invalid phone numbers.`
                    : importResult.message || "No leads could be imported."}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                <div
                  className={`p-3 rounded-xl bg-white dark:bg-slate-800 border shadow-xs ${
                    importResult.importedCount > 0
                      ? "border-emerald-500/20"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-bold block ${
                      importResult.importedCount > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400"
                    }`}
                  >
                    Imported
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {importResult.importedCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Duplicates Skipped
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {importResult.skippedDuplicates || 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Invalid Phone
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {importResult.invalidCount || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Import Another File
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>View in Old Leads</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* File Drop Area */}
              {!file ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Click to browse or drag & drop spreadsheet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-2">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/70 text-[11px] font-medium text-purple-700 dark:text-purple-300 mb-4">
                    <span>Maximum 300 leads per import batch</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSample();
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500/50 text-slate-700 dark:text-slate-300 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-500" />
                    <span>Download Sample Excel Template</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{file.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            parsedRows.length > MAX_LEADS_LIMIT
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                          }`}
                        >
                          {parsedRows.length} / {MAX_LEADS_LIMIT} Leads
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {(file.size / 1024).toFixed(1)} KB • {detectedColumns.length} Columns
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    Change File
                  </button>
                </div>
              )}

              {/* Column Mapping Section (Visible after file loaded) */}
              {file && parsedRows.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Column Mapping
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Confirm which Excel column maps to each Lead field
                      </p>
                    </div>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-md">
                      Auto-detected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    {/* Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name
                      </label>
                      <select
                        value={columnMapping.name}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, name: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="">-- Leave Blank (Default Name) --</option>
                        {detectedColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Phone (Required) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Phone / WhatsApp *</span>
                        <span className="text-[10px] text-purple-600 font-semibold">Required</span>
                      </label>
                      <select
                        required
                        value={columnMapping.phone}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, phone: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-600 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="">-- Select Phone Column --</option>
                        {detectedColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address
                      </label>
                      <select
                        value={columnMapping.email}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, email: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="">-- Not Provided --</option>
                        {detectedColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Service */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Service / Product
                      </label>
                      <select
                        value={columnMapping.service}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, service: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="">-- Default: General Enquiry --</option>
                        {detectedColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        City / Location
                      </label>
                      <select
                        value={columnMapping.city}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, city: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="">-- Not Provided --</option>
                        {detectedColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Company */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Company / Business
                      </label>
                      <select
                        value={columnMapping.company}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, company: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="">-- Not Provided --</option>
                        {detectedColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preview Table of First 3 Rows */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        First 3 Rows Preview
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Total {parsedRows.length} of max {MAX_LEADS_LIMIT} records ready to import
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Phone</th>
                            <th className="p-2.5">Email</th>
                            <th className="p-2.5">Service</th>
                            <th className="p-2.5">City</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {parsedRows.slice(0, 3).map((r, i) => {
                            const nameVal = columnMapping.name ? r[columnMapping.name] : "--";
                            const phoneVal = columnMapping.phone ? String(r[columnMapping.phone] || "") : "";
                            const cleanPhone = phoneVal.replace(/\D/g, "");
                            const isValid = cleanPhone.length >= 10;

                            return (
                              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                                  {nameVal || `Lead ${i + 1}`}
                                </td>
                                <td className="p-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isValid ? "bg-emerald-500" : "bg-rose-500"
                                      }`}
                                    />
                                    <span className="font-mono text-[11px]">
                                      {phoneVal || "Empty"}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-slate-500 dark:text-slate-400">
                                  {columnMapping.email && r[columnMapping.email]
                                    ? r[columnMapping.email]
                                    : "--"}
                                </td>
                                <td className="p-2.5 text-slate-500 dark:text-slate-400">
                                  {columnMapping.service && r[columnMapping.service]
                                    ? r[columnMapping.service]
                                    : "General Enquiry"}
                                </td>
                                <td className="p-2.5 text-slate-500 dark:text-slate-400">
                                  {columnMapping.city && r[columnMapping.city]
                                    ? r[columnMapping.city]
                                    : "--"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Batch Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Batch Identifier Tag
                      </label>
                      <input
                        type="text"
                        value={batchTag}
                        onChange={(e) => setBatchTag(e.target.value)}
                        placeholder="e.g. Excel-March-2026"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Assign Telecaller
                      </label>
                      <select
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="Unassigned">Unassigned (Round-Robin Auto Assign)</option>
                        {(allUsers || []).map((u) => (
                          <option key={u.id || u._id} value={u.id || u._id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/50 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>Skip duplicate leads if phone number already exists in CRM</span>
                    </label>

                    <div className="flex items-center gap-2 text-[11px] text-purple-700 dark:text-purple-300">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
                      <span>
                        All leads will be marked as <strong>Old Leads</strong> with verified WhatsApp consent for broadcast campaigns.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!importResult && (
          <div className="flex items-center justify-between p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            {file && parsedRows.length > 0 && (
              <button
                type="button"
                disabled={loading || !columnMapping.phone || parsedRows.length > MAX_LEADS_LIMIT}
                onClick={handleImport}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {loading
                    ? "Importing Leads..."
                    : `Import ${parsedRows.length} Leads to Old Leads`}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
