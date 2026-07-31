import * as xlsx from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Exports an array of JSON objects to an Excel (XLSX) file
 */
export function exportToExcel(data: any[], fileName: string) {
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Report');
  
  // Use highly compatible array type + Blob to avoid file corruption on modern browsers/WPS
  const wbout = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Captures a DOM element by ID and exports it as a PDF document
 */
export async function exportToPDF(elementId: string, fileName: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID ${elementId} not found`);
    return;
  }

  try {
    // scale: 2 increases the resolution of the captured canvas
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate aspect ratio for A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Failed to generate PDF', error);
  }
}
