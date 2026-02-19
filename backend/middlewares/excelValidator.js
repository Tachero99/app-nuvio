// backend/middlewares/excelValidator.js
import XLSX from "xlsx";

/**
 * Valida que el archivo Excel no sea malicioso
 * Límites razonables para prevenir DoS
 */
export function validateExcelSafety(buffer) {
  const MAX_ROWS = 10000;      // Máximo 10k filas
  const MAX_COLUMNS = 100;      // Máximo 100 columnas
  const MAX_SHEETS = 10;        // Máximo 10 hojas
  
  try {
    const workbook = XLSX.read(buffer, { 
      type: "buffer",
      // IMPORTANTE: No evaluar fórmulas ni macros
      bookVBA: false,
      cellFormula: false,
      cellHTML: false,
      cellNF: false,
      cellStyles: false,
      sheetStubs: false,
    });
    
    // Validar número de hojas
    if (workbook.SheetNames.length > MAX_SHEETS) {
      throw new Error(`Archivo con demasiadas hojas. Máximo ${MAX_SHEETS}`);
    }
    
    // Validar primera hoja (la que usamos)
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    
    const rowCount = range.e.r - range.s.r + 1;
    const colCount = range.e.c - range.s.c + 1;
    
    if (rowCount > MAX_ROWS) {
      throw new Error(`Archivo con demasiadas filas. Máximo ${MAX_ROWS}`);
    }
    
    if (colCount > MAX_COLUMNS) {
      throw new Error(`Archivo con demasiadas columnas. Máximo ${MAX_COLUMNS}`);
    }
    
    return { valid: true, workbook };
    
  } catch (error) {
    throw new Error(`Archivo Excel inválido: ${error.message}`);
  }
}