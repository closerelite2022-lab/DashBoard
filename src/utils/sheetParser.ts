import { SheetRow } from './types';

export function extractSpreadsheetId(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.includes('/') && trimmed.length >= 30) {
    return trimmed; // Direct ID pasted
  }
  const regExp = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  return "";
}

export function parseTableGviz(table: any): SheetRow[] {
  const cols = table.cols;
  const rows = table.rows;
  
  if (!cols || !rows) {
    return [];
  }

  // Maps indexes
  let dateIdx = -1;
  let clientIdx = -1;
  let rubroIdx = -1;
  let zonaIdx = -1;
  let servicioIdx = -1;
  let montoIdx = -1;
  let estadoIdx = -1;
  let horaIdx = -1;

  cols.forEach((col: any, idx: number) => {
    const rawLabel = col.label || col.id || "";
    const label = String(rawLabel).toLowerCase().trim();
    if (label.includes("fecha") || label.includes("date") || label.includes("dia")) {
      dateIdx = idx;
    } else if (label.includes("cliente") || label.includes("client") || label.includes("customer") || label.includes("nombre") || label.includes("empresa")) {
      clientIdx = idx;
    } else if (label.includes("rubro") || label.includes("category") || label.includes("sector") || label.includes("rubros")) {
      rubroIdx = idx;
    } else if (label.includes("zona") || label.includes("zone") || label.includes("cobertura") || label.includes("ubicacion") || label.includes("ciudad")) {
      zonaIdx = idx;
    } else if (label.includes("servicio") || label.includes("service") || label.includes("tarea") || label.includes("descripcion")) {
      servicioIdx = idx;
    } else if (label.includes("monto") || label.includes("facturacion") || label.includes("billing") || label.includes("precio") || label.includes("costo") || label.includes("total") || label.includes("importe") || label.includes("cobro")) {
      montoIdx = idx;
    } else if (label.includes("estado") || label.includes("status") || label.includes("pago") || label.includes("condicion")) {
      estadoIdx = idx;
    } else if (label.includes("hora") || label.includes("hour") || label.includes("time") || label.includes("bloque") || label.includes("horario")) {
      horaIdx = idx;
    }
  });

  // Fallback defaults if columns not identified by headers
  if (dateIdx === -1) dateIdx = 0;
  if (clientIdx === -1) clientIdx = cols.length > 1 ? 1 : 0;
  if (rubroIdx === -1) rubroIdx = cols.length > 2 ? 2 : 0;
  if (zonaIdx === -1) zonaIdx = cols.length > 3 ? 3 : 0;
  if (servicioIdx === -1) servicioIdx = cols.length > 4 ? 4 : 0;
  if (montoIdx === -1) montoIdx = cols.length > 5 ? 5 : 0;
  if (estadoIdx === -1) estadoIdx = cols.length > 6 ? 6 : 0;
  if (horaIdx === -1) horaIdx = cols.length > 7 ? 7 : 0;

  const parsedRows: SheetRow[] = [];

  rows.forEach((row: any, rIdx: number) => {
    if (!row || !row.c) return;

    const parseCellString = (idx: number): string => {
      const cell = row.c[idx];
      if (!cell) return "";
      const val = cell.v;
      if (val === null || val === undefined) return "";

      // Convert format Date(yyyy, m, d) to yyyy-mm-dd
      if (typeof val === 'string' && val.startsWith('Date(')) {
        const parts = val.substring(5, val.length - 1).split(',');
        if (parts.length >= 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) + 1; // Google visualization dates are 0-indexed month
          const d = parseInt(parts[2], 10);
          return `${y}-${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`;
        }
      }
      return String(val);
    };

    const parseCellNumber = (idx: number): number => {
      const cell = row.c[idx];
      if (!cell) return 0;
      const val = cell.v;
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    };

    const rawMonto = parseCellNumber(montoIdx);
    const est = parseCellString(estadoIdx) || "Pagado";
    const cl = parseCellString(clientIdx) || `Cliente #${rIdx + 1}`;
    const srv = parseCellString(servicioIdx) || "Servicio General";
    const rub = parseCellString(rubroIdx) || "Particular";
    const zon = parseCellString(zonaIdx) || "Lomas de Zamora";
    const hor = parseCellString(horaIdx) || "10:00";
    const dt = parseCellString(dateIdx) || "2026-05-01";

    let tipo: 'Facturable' | 'Repaso' | 'Monto Vacío' | 'Cancelado' = 'Facturable';
    const estLower = est.toLowerCase();

    if (estLower.includes("cancelado")) {
      tipo = 'Cancelado';
    } else if (estLower.includes("repaso") || estLower.includes("sin costo") || estLower.includes("gratis")) {
      tipo = 'Repaso';
    } else if (rawMonto <= 0 && (estLower.includes("monto vacío") || estLower.includes("nulo") || est === "Monto Vacío")) {
      tipo = 'Monto Vacío';
    } else if (rawMonto === 0) {
      tipo = 'Repaso';
    }

    parsedRows.push({
      date: dt,
      client: cl,
      rubro: rub,
      zona: zon,
      servicio: srv,
      monto: rawMonto,
      estado: est,
      tipo: tipo,
      hora: hor
    });
  });

  return parsedRows;
}

export async function fetchGoogleSheet(urlInput: string, sheetName: string): Promise<SheetRow[]> {
  const id = extractSpreadsheetId(urlInput);
  if (!id) {
    throw new Error("URL de Google Sheet inválida. Introduzca un formato correcto (ej: https://docs.google.com/spreadsheets/d/...)");
  }
  const encodedName = encodeURIComponent(sheetName.trim());
  const queryUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json${encodedName ? '&sheet=' + encodedName : ''}`;

  const res = await fetch(queryUrl);
  if (!res.ok) {
    throw new Error(`Fallo en el servidor al intentar recuperar la hoja pública (${res.status})`);
  }

  const rawText = await res.text();
  const match = rawText.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/);
  if (!match) {
    throw new Error("El archivo no es una hoja de cálculo pública de Google Sheets en el formato requerido o no tiene los permisos para lectura.");
  }

  const json = JSON.parse(match[1]);
  if (json.status === "error") {
    const errorDetails = json.errors?.[0]?.detailed_message || json.errors?.[0]?.message || "Error al obtener pestaña";
    throw new Error(`Google Sheets: ${errorDetails}`);
  }

  const rows = parseTableGviz(json.table);
  if (rows.length === 0) {
    throw new Error("No se encontraron registros de datos válidos estructurados en el Google Sheet.");
  }
  return rows;
}
