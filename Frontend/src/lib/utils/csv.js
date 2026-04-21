export async function readCsvFile(file) {
  const buffer = await file.arrayBuffer();
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(buffer);
  } catch (e) {
    const decoder = new TextDecoder('windows-1252');
    return decoder.decode(buffer);
  }
}

export function parseCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      const next = lines[i][j + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    data.push(row);
  }
  return data;
}

export function parseConfigCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (lines.length < 2) return {};

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const out = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const sepIndex = line.indexOf(delimiter);
    if (sepIndex === -1) continue;
    const key = line.slice(0, sepIndex).trim();
    let value = line.slice(sepIndex + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/""/g, '"');
    }
    out[key] = value;
  }
  return out;
}
