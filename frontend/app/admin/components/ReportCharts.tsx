'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, PieChart, BarChart3, AlertCircle } from 'lucide-react';

// Hook para verificar y asegurar que Chart.js esté cargado en window
function useChartJsReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).Chart) {
      setIsReady(true);
      return;
    }

    // Si aún no está en el DOM, inyectar el script de respaldo dinámicamente
    const scriptId = 'chartjs-cdn-umd';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
      scriptEl.async = true;
      scriptEl.onload = () => setIsReady(true);
      document.head.appendChild(scriptEl);
    } else {
      scriptEl.addEventListener('load', () => setIsReady(true));
    }

    const interval = setInterval(() => {
      if ((window as any).Chart) {
        setIsReady(true);
        clearInterval(interval);
      }
    }, 120);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return isReady;
}

// --------------------------------------------------------------------------
// 1. Gráfico de Evolución de Ventas e Ingresos (Líneas Suaves / Área)
// --------------------------------------------------------------------------
interface SalesTimelineChartProps {
  data: { label: string; ventas: number; ingresos: number }[];
}

export function SalesTimelineChart({ data }: SalesTimelineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);
  const isChartReady = useChartJsReady();

  useEffect(() => {
    if (!isChartReady || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Destruir instancia anterior
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (!data || data.length === 0 || (data.length === 1 && data[0].label === 'Sin datos')) {
      return;
    }

    // Gradientes suaves
    const blueGrad = ctx.createLinearGradient(0, 0, 0, 220);
    blueGrad.addColorStop(0, 'rgba(70, 95, 255, 0.24)');
    blueGrad.addColorStop(1, 'rgba(70, 95, 255, 0.00)');

    const greenGrad = ctx.createLinearGradient(0, 0, 0, 220);
    greenGrad.addColorStop(0, 'rgba(18, 183, 106, 0.20)');
    greenGrad.addColorStop(1, 'rgba(18, 183, 106, 0.00)');

    const Chart = (window as any).Chart;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: 'Ventas Totales (S/)',
            data: data.map((d) => d.ventas),
            borderColor: '#465FFF',
            backgroundColor: blueGrad,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: '#465FFF',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Cobranza Efectiva (S/)',
            data: data.map((d) => d.ingresos),
            borderColor: '#12B76A',
            backgroundColor: greenGrad,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: '#12B76A',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            bodyColor: '#E2E8F0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 10,
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 12 },
            callbacks: {
              label: (context: any) => {
                const label = context.dataset.label || '';
                const val = context.parsed.y || 0;
                return ` ${label}: S/ ${Number(val).toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#64748B',
              font: { size: 11, weight: '600' },
              maxRotation: 0,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#F1F5F9',
            },
            ticks: {
              color: '#64748B',
              font: { size: 11 },
              callback: (val: any) => {
                if (val >= 1000) return `S/${(val / 1000).toFixed(1)}k`;
                return `S/${val}`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [data, isChartReady]);

  if (!isChartReady) {
    return (
      <div className="d-flex align-items-center justify-content-center w-100" style={{ height: '220px' }}>
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
        <span className="text-muted small">Cargando gráfico interactivo...</span>
      </div>
    );
  }

  if (!data || data.length === 0 || (data.length === 1 && data[0].label === 'Sin datos')) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted small py-4">
        <TrendingUp size={36} className="text-muted opacity-30 mb-2" />
        <span className="fw-semibold">No hay ventas registradas en el periodo seleccionado</span>
      </div>
    );
  }

  return (
    <div className="w-100 position-relative" style={{ height: '220px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// --------------------------------------------------------------------------
// 2. Gráfico Donut de Distribución por Plan
// --------------------------------------------------------------------------
interface PlanDoughnutChartProps {
  data: { label: string; color: string; amount: number; percentage: string; count: number }[];
  totalVentas: number;
}

export function PlanDoughnutChart({ data, totalVentas }: PlanDoughnutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);
  const isChartReady = useChartJsReady();

  useEffect(() => {
    if (!isChartReady || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (!data || data.length === 0) return;

    const Chart = (window as any).Chart;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            data: data.map((d) => d.amount),
            backgroundColor: data.map((d) => d.color),
            borderWidth: 2,
            borderColor: '#FFFFFF',
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            bodyColor: '#E2E8F0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              label: (context: any) => {
                const item = data[context.dataIndex];
                const val = context.parsed || 0;
                return ` ${item.label}: S/ ${Number(val).toFixed(2)} (${item.percentage}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [data, isChartReady]);

  if (!isChartReady) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ width: '135px', height: '135px' }}>
        <div className="spinner-border spinner-border-sm text-primary" role="status" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted small py-4">
        <PieChart size={36} className="text-muted opacity-30 mb-2" />
        <span className="fw-semibold">Sin planes facturados en el periodo</span>
      </div>
    );
  }

  return (
    <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '135px', height: '135px' }}>
      <canvas ref={canvasRef} />
      {/* Centro métrico */}
      <div
        className="position-absolute top-50 start-50 translate-middle text-center d-flex flex-column align-items-center justify-content-center rounded-circle pointer-events-none"
        style={{ width: '68px', height: '68px', pointerEvents: 'none' }}
      >
        <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.55rem', letterSpacing: '0.5px' }}>Total</span>
        <strong className="text-dark fw-bolder" style={{ fontSize: '0.86rem', lineHeight: '1' }}>
          S/{totalVentas >= 1000 ? `${(totalVentas / 1000).toFixed(1)}k` : totalVentas.toFixed(0)}
        </strong>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 3. Gráfico de Barras de Comisiones por Mes
// --------------------------------------------------------------------------
interface CommissionsBarChartProps {
  data: { month: string; comision: number }[];
}

export function CommissionsBarChart({ data }: CommissionsBarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);
  const isChartReady = useChartJsReady();

  useEffect(() => {
    if (!isChartReady || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (!data || data.length === 0) return;

    const Chart = (window as any).Chart;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.month),
        datasets: [
          {
            label: 'Comisión Ganada (S/)',
            data: data.map((d) => d.comision),
            backgroundColor: data.map((d) => (d.comision > 0 ? '#465FFF' : '#E4E7EC')),
            hoverBackgroundColor: data.map((d) => (d.comision > 0 ? '#3641F5' : '#D0D5DD')),
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 32,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            bodyColor: '#E2E8F0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              label: (context: any) => {
                const val = context.parsed.y || 0;
                const count = val > 0 ? Math.round(val / 9) : 0;
                return ` Comisión: S/ ${Number(val).toFixed(2)} (${count} altas)`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#64748B',
              font: { size: 11, weight: '600' },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#F1F5F9',
            },
            ticks: {
              color: '#64748B',
              font: { size: 11 },
              callback: (val: any) => `S/${val}`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [data, isChartReady]);

  if (!isChartReady) {
    return (
      <div className="d-flex align-items-center justify-content-center w-100" style={{ height: '175px' }}>
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
        <span className="text-muted small">Cargando gráfico interactivo...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted small py-4">
        <BarChart3 size={32} className="text-muted opacity-30 mb-2" />
        <span className="fw-semibold">Sin comisiones registradas en el periodo</span>
      </div>
    );
  }

  return (
    <div className="w-100 position-relative" style={{ height: '175px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// --------------------------------------------------------------------------
// 4. Gráfico Donut de Salud de Cartera y Pérdidas (Cobrado vs Por Cobrar vs Vencido vs Bloqueado)
// --------------------------------------------------------------------------
export interface PortfolioHealthProps {
  cobrado: number;
  porCobrar: number;
  vencido: number;
  bloqueado: number;
}

export function PortfolioHealthChart({ cobrado, porCobrar, vencido, bloqueado }: PortfolioHealthProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);
  const isChartReady = useChartJsReady();

  const total = cobrado + porCobrar + vencido + bloqueado;

  useEffect(() => {
    if (!isChartReady || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (total <= 0) return;

    const Chart = (window as any).Chart;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Cobrado Efectivo', 'Por Cobrar', 'Clientes Vencidos', 'Clientes Bloqueados'],
        datasets: [
          {
            data: [cobrado, porCobrar, vencido, bloqueado],
            backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#64748B'],
            hoverBackgroundColor: ['#059669', '#D97706', '#DC2626', '#475569'],
            borderWidth: 2,
            borderColor: '#FFFFFF',
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            bodyColor: '#E2E8F0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              label: (context: any) => {
                const val = Number(context.parsed || 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return ` ${context.label}: S/ ${val.toFixed(2)} (${pct}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [cobrado, porCobrar, vencido, bloqueado, total, isChartReady]);

  if (!isChartReady) {
    return (
      <div className="d-flex align-items-center justify-content-center w-100" style={{ height: '220px' }}>
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
        <span className="text-muted small">Cargando gráfico...</span>
      </div>
    );
  }

  if (total <= 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted small py-4">
        <PieChart size={36} className="text-muted opacity-30 mb-2" />
        <span className="fw-semibold">Sin datos financieros para graficar</span>
      </div>
    );
  }

  return (
    <div className="w-100 position-relative d-flex align-items-center justify-content-center" style={{ height: '220px' }}>
      <canvas ref={canvasRef} />
      <div
        className="position-absolute text-center d-flex flex-column justify-content-center pointer-events-none"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
      >
        <span className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Total Cartera
        </span>
        <strong className="text-dark fw-bold" style={{ fontSize: '1.05rem', lineHeight: '1.2' }}>
          S/ {total.toFixed(0)}
        </strong>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 5. Gráfico de Barras: Comparativa de Ingresos (Altas vs Renovaciones vs Prorrateos)
// --------------------------------------------------------------------------
export interface RevenueTypeBarChartProps {
  data: Array<{
    period: string;
    altas: number;
    renovaciones: number;
    prorrateos: number;
  }>;
}

export function RevenueTypeBarChart({ data }: RevenueTypeBarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);
  const isChartReady = useChartJsReady();

  useEffect(() => {
    if (!isChartReady || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (!data || data.length === 0) return;

    const Chart = (window as any).Chart;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.period),
        datasets: [
          {
            label: 'Nuevas Altas (S/)',
            data: data.map((d) => d.altas),
            backgroundColor: '#10B981',
            borderRadius: 4,
            maxBarThickness: 18,
          },
          {
            label: 'Renovaciones Mensuales (S/)',
            data: data.map((d) => d.renovaciones),
            backgroundColor: '#465FFF',
            borderRadius: 4,
            maxBarThickness: 18,
          },
          {
            label: 'Prorrateos / Anuales (S/)',
            data: data.map((d) => d.prorrateos),
            backgroundColor: '#8B5CF6',
            borderRadius: 4,
            maxBarThickness: 18,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              font: { size: 11, weight: '500' },
              color: '#475569',
            },
          },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            bodyColor: '#E2E8F0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              label: (context: any) => ` ${context.dataset.label}: S/ ${Number(context.parsed.y || 0).toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { size: 11, weight: '600' } },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#F1F5F9' },
            ticks: {
              color: '#64748B',
              font: { size: 11 },
              callback: (val: any) => `S/${val}`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [data, isChartReady]);

  if (!isChartReady) {
    return (
      <div className="d-flex align-items-center justify-content-center w-100" style={{ height: '220px' }}>
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
        <span className="text-muted small">Cargando gráfico interactivo...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted small py-4">
        <BarChart3 size={32} className="text-muted opacity-30 mb-2" />
        <span className="fw-semibold">Sin datos registrados para graficar</span>
      </div>
    );
  }

  return (
    <div className="w-100 position-relative" style={{ height: '220px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// --------------------------------------------------------------------------
// 6. Gráfico Específico por Categoría: Cantidad (Clientes) vs Monto (S/)
// --------------------------------------------------------------------------
export interface CategoryDualAxisChartProps {
  data: Array<{
    period: string;
    monto: number;
    cantidad: number;
  }>;
  themeColor?: string;
  lineColor?: string;
  cantidadLabel?: string;
  montoLabel?: string;
}

export function CategoryDualAxisChart({
  data,
  themeColor = '#10B981',
  lineColor = '#465FFF',
  cantidadLabel = 'Clientes',
  montoLabel = 'Recaudado (S/)',
}: CategoryDualAxisChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);
  const isChartReady = useChartJsReady();

  useEffect(() => {
    if (!isChartReady || !canvasRef.current) return;
    if (!data || data.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const Chart = (window as any).Chart;

    const labels = data.map((d) => d.period);
    const montos = data.map((d) => d.monto);
    const cantidades = data.map((d) => d.cantidad);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: montoLabel,
            data: montos,
            backgroundColor: `${themeColor}CC`,
            hoverBackgroundColor: themeColor,
            borderRadius: 6,
            yAxisID: 'yMonto',
            order: 2,
          },
          {
            type: 'line',
            label: cantidadLabel,
            data: cantidades,
            borderColor: lineColor,
            backgroundColor: `${lineColor}22`,
            pointBackgroundColor: lineColor,
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false,
            yAxisID: 'yCantidad',
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              font: {
                size: 11,
                family: "'Inter', sans-serif",
                weight: '500',
              },
            },
          },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#F8FAFC',
            bodyColor: '#E2E8F0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              label: (context: any) => {
                const label = context.dataset.label || '';
                const val = Number(context.parsed.y || 0);
                if (context.dataset.yAxisID === 'yMonto') {
                  return `${label}: S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
                return `${label}: ${val} ${val === 1 ? 'cliente' : 'clientes'}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#64748B',
              font: {
                size: 11,
                family: "'Inter', sans-serif",
              },
            },
          },
          yMonto: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: {
              color: '#F1F5F9',
            },
            ticks: {
              color: '#64748B',
              font: {
                size: 10,
                family: "'Inter', sans-serif",
              },
              callback: (val: any) => `S/ ${val}`,
            },
          },
          yCantidad: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              color: '#64748B',
              precision: 0,
              font: {
                size: 10,
                family: "'Inter', sans-serif",
              },
              callback: (val: any) => `${val}`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [data, isChartReady, themeColor, lineColor, cantidadLabel, montoLabel]);

  if (!isChartReady) {
    return (
      <div className="d-flex align-items-center justify-content-center w-100" style={{ height: '230px' }}>
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
        <span className="text-muted small">Cargando gráfico interactivo...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted small py-4">
        <BarChart3 size={32} className="text-muted opacity-30 mb-2" />
        <span className="fw-semibold">Sin datos para graficar en este periodo</span>
      </div>
    );
  }

  return (
    <div className="w-100 position-relative" style={{ height: '230px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
