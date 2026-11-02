import { useState } from "react";
import { Copy, Check, Download, FileSpreadsheet, FileText } from "lucide-react";

export default function TableExportActions({ headers = [], rows = [], tableName = "crm-bi-table" }) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const cleanCellText = (cell) => {
    if (cell == null) return "";
    return String(cell).replace(/\*\*/g, "").replace(/\*/g, "").trim();
  };

  const handleCopyTable = async () => {
    try {
      const headerLine = headers.map(cleanCellText).join("\t");
      const rowLines = rows.map((r) => r.map(cleanCellText).join("\t"));
      const tsv = [headerLine, ...rowLines].join("\n");
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy table:", err);
    }
  };

  const handleDownloadCSV = () => {
    try {
      const cleanHeaders = headers.map(cleanCellText);
      const cleanRows = rows.map((r) => r.map(cleanCellText));

      const csvContent = [
        cleanHeaders.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
        ...cleanRows.map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\r\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${tableName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export CSV:", err);
    }
  };

  const handleDownloadXLSX = async () => {
    try {
      setIsExporting(true);
      // Dynamic import so xlsx is not loaded into the initial bundle
      const XLSX = await import("xlsx");
      const cleanHeaders = headers.map(cleanCellText);
      const cleanRows = rows.map((r) => r.map(cleanCellText));

      const worksheetData = [cleanHeaders, ...cleanRows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "BI Report");
      XLSX.writeFile(workbook, `${tableName}.xlsx`);
    } catch (err) {
      console.error("Failed to export XLSX:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-1 text-[11px] font-medium text-text-secondary">
      <button
        type="button"
        onClick={handleCopyTable}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-purple-500"
        title="Copy table to clipboard (TSV format for Excel/Sheets)"
        aria-label="Copy table data"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-semibold">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleDownloadCSV}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-purple-500"
        title="Download table as CSV file"
        aria-label="Download CSV"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>CSV</span>
      </button>

      <button
        type="button"
        onClick={handleDownloadXLSX}
        disabled={isExporting}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-bg-secondary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-purple-500"
        title="Download table as Excel spreadsheet (XLSX)"
        aria-label="Download Excel XLSX"
      >
        {isExporting ? (
          <Download className="w-3.5 h-3.5 animate-bounce" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        )}
        <span>{isExporting ? "Saving..." : "Excel"}</span>
      </button>
    </div>
  );
}
