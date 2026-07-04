import ExcelJS from 'exceljs';

export async function generateListExcel(
  title: string,
  columns: string[],
  rows: (string | number)[][],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title.slice(0, 31));
  const headerRow = sheet.addRow(columns);
  headerRow.font = { bold: true };
  rows.forEach((r) => sheet.addRow(r));
  sheet.columns.forEach((col) => {
    col.width = 22;
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
