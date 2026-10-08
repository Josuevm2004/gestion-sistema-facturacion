/**
 * Utilidad profesional para exportación de tablas a formato Excel (XML Spreadsheet 2003 / .xls)
 * Compatible al 100% con Microsoft Excel sin dependencias externas.
 */

export interface ExportColumn<T = any> {
  header: string;
  key: string;
  width?: number;
  type?: 'string' | 'number' | 'date';
  align?: 'left' | 'center' | 'right';
  getValue?: (item: T, index: number) => string | number;
}

export function exportTableToExcel<T = any>({
  filename,
  sheetName = 'Reporte',
  reportTitle,
  reportSubtitle,
  columns,
  data,
}: {
  filename: string;
  sheetName?: string;
  reportTitle: string;
  reportSubtitle?: string;
  columns: ExportColumn<T>[];
  data: T[];
}) {
  const sanitize = (val: any): string => {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalCols = columns.length;

  // Filas del encabezado visual del reporte
  let headerRowsXml = '';
  headerRowsXml += `
  <Row ss:Height="28">
    <Cell ss:MergeAcross="${totalCols - 1}" ss:StyleID="TitleStyle">
      <Data ss:Type="String">${sanitize(reportTitle.toUpperCase())}</Data>
    </Cell>
  </Row>`;

  const subtitleText = reportSubtitle
    ? `${reportSubtitle} | Generado el ${dateFormatted} a las ${timeFormatted} | Total Registros: ${data.length}`
    : `Generado el ${dateFormatted} a las ${timeFormatted} | Total Registros: ${data.length}`;

  headerRowsXml += `
  <Row ss:Height="18">
    <Cell ss:MergeAcross="${totalCols - 1}" ss:StyleID="SubtitleStyle">
      <Data ss:Type="String">${sanitize(subtitleText)}</Data>
    </Cell>
  </Row>
  <Row ss:Height="8"/>`;

  // Fila de encabezados de columna
  const colHeadersXml = columns
    .map(
      (c) =>
        `<Cell ss:StyleID="ColHeaderStyle"><Data ss:Type="String">${sanitize(c.header)}</Data></Cell>`
    )
    .join('');
  headerRowsXml += `<Row ss:Height="22">${colHeadersXml}</Row>`;

  // Filas de datos
  let totalNumericCols: Record<string, number> = {};
  const dataRowsXml = data
    .map((item, rowIdx) => {
      const isEven = rowIdx % 2 === 0;
      const cellsXml = columns
        .map((col) => {
          let val: any = col.getValue
            ? col.getValue(item, rowIdx)
            : (item as any)[col.key];

          const isNum = col.type === 'number';
          if (isNum) {
            const numVal = Number(val || 0);
            totalNumericCols[col.key] = (totalNumericCols[col.key] || 0) + numVal;
            const style = isEven ? 'NumEvenStyle' : 'NumOddStyle';
            return `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${numVal.toFixed(2)}</Data></Cell>`;
          }

          const align = col.align || 'left';
          let style = isEven ? 'TextEvenStyle' : 'TextOddStyle';
          if (align === 'center') style = isEven ? 'CenterEvenStyle' : 'CenterOddStyle';
          if (align === 'right') style = isEven ? 'RightEvenStyle' : 'RightOddStyle';

          return `<Cell ss:StyleID="${style}"><Data ss:Type="String">${sanitize(val)}</Data></Cell>`;
        })
        .join('');
      return `<Row ss:Height="19">${cellsXml}</Row>`;
    })
    .join('');

  // Fila de totales si hay columnas numéricas
  let totalRowXml = '';
  const hasNumeric = columns.some((c) => c.type === 'number');
  if (hasNumeric && data.length > 0) {
    const totalCellsXml = columns
      .map((col, idx) => {
        if (idx === 0) {
          return `<Cell ss:StyleID="TotalLabelStyle"><Data ss:Type="String">TOTALES</Data></Cell>`;
        }
        if (col.type === 'number') {
          const totalVal = totalNumericCols[col.key] || 0;
          return `<Cell ss:StyleID="TotalNumStyle"><Data ss:Type="Number">${totalVal.toFixed(2)}</Data></Cell>`;
        }
        return `<Cell ss:StyleID="TotalLabelStyle"><Data ss:Type="String">-</Data></Cell>`;
      })
      .join('');
    totalRowXml = `<Row ss:Height="22">${totalCellsXml}</Row>`;
  }

  // Definición de anchos de columna
  const colDefsXml = columns
    .map((c) => {
      const w = c.width || (c.type === 'number' ? 100 : 130);
      return `<Column ss:Width="${w}"/>`;
    })
    .join('');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SubtitleStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#64748B"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="ColHeaderStyle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1D4ED8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C5FD"/>
   </Borders>
  </Style>
  <Style ss:ID="TextEvenStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#1E293B"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="TextOddStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#1E293B"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CenterEvenStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#1E293B"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CenterOddStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#F8FAFC"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="RightEvenStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#1E293B"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="RightOddStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#1E293B"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="NumEvenStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="NumOddStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalLabelStyle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563EB"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalNumStyle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563EB"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sanitize(sheetName)}">
  <Table ss:DefaultRowHeight="18">
   ${colDefsXml}
   ${headerRowsXml}
   ${dataRowsXml}
   ${totalRowXml}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFilename = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
