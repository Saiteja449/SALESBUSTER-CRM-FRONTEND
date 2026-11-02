/**
 * Parses numeric cell values, extracting floats from currency or percent strings.
 * e.g., "$12,450" -> 12450, "45.2%" -> 45.2, "₹1,20,000" -> 120000
 */
export function parseNumericValue(val) {
  if (val == null) return null;
  const str = String(val).replace(/,/g, "").trim();
  const match = str.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return isNaN(num) ? null : num;
}

export function detectChartableData(headers, rows) {
  if (!headers || headers.length < 2 || !rows || rows.length === 0) {
    return null;
  }

  // Find column types based on row values
  const columnTypes = headers.map((_, colIdx) => {
    let numericCount = 0;
    let totalNonEmpty = 0;

    rows.forEach((row) => {
      const cell = row[colIdx];
      if (cell != null && String(cell).trim() !== "") {
        totalNonEmpty++;
        if (parseNumericValue(cell) !== null) {
          numericCount++;
        }
      }
    });

    if (totalNonEmpty === 0) return "string";
    return numericCount / totalNonEmpty >= 0.75 ? "numeric" : "string";
  });

  const categoryColIdx = columnTypes.indexOf("string");
  const numericColIndices = [];
  columnTypes.forEach((type, idx) => {
    if (type === "numeric" && numericColIndices.length < 2) {
      numericColIndices.push(idx);
    }
  });

  if (categoryColIdx === -1 || numericColIndices.length === 0) {
    return null;
  }

  const chartData = rows.map((row) => {
    const rawCat = row[categoryColIdx] || "";
    const cleanCat = String(rawCat).replace(/\*\*/g, "").trim();
    const point = { name: cleanCat };

    numericColIndices.forEach((nIdx) => {
      const colName = String(headers[nIdx] || `Metric ${nIdx}`).replace(/\*\*/g, "").trim();
      point[colName] = parseNumericValue(row[nIdx]) ?? 0;
    });

    return point;
  });

  const metricKeys = numericColIndices.map((nIdx) =>
    String(headers[nIdx] || `Metric ${nIdx}`).replace(/\*\*/g, "").trim()
  );

  return {
    categoryKey: "name",
    metricKeys,
    data: chartData,
  };
}

