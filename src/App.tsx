import { useState, useEffect, useRef, FormEvent } from 'react';
import { Chart } from 'chart.js/auto';
import {
  TrendingUp,
  RotateCcw,
  Presentation,
  Share2,
  SlidersHorizontal,
  LayoutDashboard,
  DollarSign,
  Truck,
  AlertTriangle,
  Calculator,
  Filter,
  Info,
  BadgeDollarSign,
  ClipboardList,
  Sparkles,
  Clock,
  ArrowUpRight,
  Database,
  CheckCircle,
  XCircle,
  Repeat,
  MapPin,
  CheckSquare,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  FileText,
  Star,
  RefreshCw,
  Search
} from 'lucide-react';
import { SheetRow, FilterState, WhatIfState } from './utils/types';
import { generateMockData } from './utils/mockData';
import { fetchGoogleSheet } from './utils/sheetParser';

const DEMO_SHEET_URL = "https://docs.google.com/spreadsheets/d/1v-97YJ4f2T15uH6hIas9b_U3qM1JscqE-H0vR_Hbe8A/edit";
const DEMO_SHEETS_TAB = "BI-PestControl";

const getSpeakerNotes = (slideNum: number) => {
  switch (slideNum) {
    case 1:
      return (
        <>
          <p className="font-bold text-white mb-2">Puntos clave para iniciar la junta:</p>
          <ul className="space-y-2 text-slate-300 list-disc pl-4 leading-relaxed">
            <li>Comience felicitando por la base de datos: <strong>145 servicios limpios</strong> es un volumen comercial muy fuerte.</li>
            <li>Destaque la cifra estrella: <strong>$20,822,384</strong> de facturación consolidada.</li>
            <li>Explique que el ticket promedio es alto ($210,327) pero advierte que la mediana es menor ($125,300), lo que muestra dependencia comercial de cuentas grandes.</li>
          </ul>
        </>
      );
    case 2:
      return (
        <>
          <p className="font-bold text-white mb-2">Diálogo de advertencia:</p>
          <ul className="space-y-2 text-slate-300 list-disc pl-4 leading-relaxed">
            <li>Aquí debe cambiar el tono a preocupado: "Colegas, <strong>el 31.7% de nuestro trabajo técnico no rinde dinero</strong>".</li>
            <li>Indique que 40 repasos sin costo están colapsando la logística sin generar ingresos directos.</li>
            <li>Apunte a <strong>Distribuidoras</strong>: Tienen más visitas gratis que pagadas. Hay que renegociar contratos.</li>
          </ul>
        </>
      );
    case 3:
      return (
        <>
          <p className="font-bold text-white mb-2">Explicación logística:</p>
          <ul className="space-y-2 text-slate-300 list-disc pl-4 leading-relaxed">
            <li>Muestre cómo la mañana concentra casi todo el esfuerzo operativo.</li>
            <li>Proponga distribuir tareas: "Los técnicos viajan más de lo necesario porque concentramos Canning, Lomas y Guillón en las mismas mañanas".</li>
            <li>Proponga escalonamiento y ruteo estratégico.</li>
          </ul>
        </>
      );
    case 4:
      return (
        <>
          <p className="font-bold text-white mb-2">Cierre comercial y compromisos:</p>
          <ul className="space-y-2 text-slate-300 list-disc pl-4 leading-relaxed">
            <li>Presente las 3 medidas correctivas como mandatos urgentes.</li>
            <li><strong>Cobranza prioritaria:</strong> Rescatar los $1.95M pendientes.</li>
            <li><strong>Tope a repasos:</strong> Proponer un anexo contractual para cobrar repasos excesivos.</li>
          </ul>
        </>
      );
    default:
      return null;
  }
};

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<'resumen' | 'financiero' | 'operativo' | 'diagnostico' | 'whatif'>('resumen');
  const [showPresentation, setShowPresentation] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [toastText, setToastText] = useState<string | null>(null);

  // Spreadsheet URL input states
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetName, setSheetName] = useState(DEMO_SHEETS_TAB);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Core Data source state
  const [allData, setAllData] = useState<SheetRow[]>([]);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    startDate: '2026-04-20',
    endDate: '2026-05-20',
    rubro: 'All',
    maxBilling: 1375000,
    zona: 'All',
    chkFacturable: true,
    chkRepaso: true,
    chkInvalido: true,
  });

  // What-if Simulator State
  const [whatIf, setWhatIf] = useState<WhatIfState>({
    repasoPercent: 0,
    repasoPrice: 75000,
    cobroPercent: 50,
  });

  // Load baseline mock data on mount
  useEffect(() => {
    const baseline = generateMockData();
    setAllData(baseline);
  }, []);

  // Compute maximum amount in active sheet dynamically to adjust filter range
  const dynamicMaxAmount = Math.max(...allData.map(item => item.monto), 1375000);

  // Sync maximum amount slider when data source updates
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      maxBilling: dynamicMaxAmount
    }));
  }, [allData]);

  // Apply filters to construct standard analytics data
  const filteredData = allData.filter(item => {
    // 1. Date Check
    if (item.date < filters.startDate || item.date > filters.endDate) return false;

    // 2. Rubro Check
    if (filters.rubro !== 'All') {
      if (filters.rubro === 'Otros') {
        const standardRubros = ["Distribuidora", "Particular", "Institución", "Depósito", "Carnicería", "Restaurante", "Laboratorio"];
        if (standardRubros.includes(item.rubro)) return false;
      } else if (item.rubro !== filters.rubro) {
        return false;
      }
    }

    // 3. Max Amount check
    if (item.monto > filters.maxBilling) return false;

    // 4. Covered Zone check
    if (filters.zona !== 'All' && item.zona !== filters.zona) return false;

    // 5. Financial type check
    if (item.tipo === 'Facturable' && !filters.chkFacturable) return false;
    if (item.tipo === 'Repaso' && !filters.chkRepaso) return false;
    if (item.tipo === 'Monto Vacío' && !filters.chkInvalido) return false;

    // Exclude cancelled entries globally from executive counters as specified
    if (item.tipo === 'Cancelado') return false;

    return true;
  });

  // Re-compute standard KPI values
  let totalBilling = 0;
  let billableCount = 0;
  let repasoCount = 0;
  let invalidCount = 0;
  const billsList: number[] = [];

  filteredData.forEach(item => {
    if (item.tipo === 'Facturable') {
      totalBilling += item.monto;
      billableCount++;
      billsList.push(item.monto);
    } else if (item.tipo === 'Repaso') {
      repasoCount++;
    } else if (item.tipo === 'Monto Vacío') {
      invalidCount++;
    }
  });

  const averageBill = billableCount > 0 ? Math.round(totalBilling / billableCount) : 0;

  // Mediana calculation
  let mediaBill = 0;
  if (billsList.length > 0) {
    const sorted = [...billsList].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    mediaBill = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  const totalNonBilled = repasoCount + invalidCount;
  const nonBilledRatioPercent = filteredData.length > 0 ? Math.round((totalNonBilled / filteredData.length) * 100) : 0;

  // Pending Debts (9.4% base proportion synced visually)
  const dynamicPendingDebt = Math.round(1954200 * (totalBilling / 20822384));

  // Visual/Charts canvas DOM bindings refs
  const chartTrendRef = useRef<HTMLCanvasElement | null>(null);
  const chartCompRef = useRef<HTMLCanvasElement | null>(null);
  const chartRubrosRef = useRef<HTMLCanvasElement | null>(null);
  const chartZonasRef = useRef<HTMLCanvasElement | null>(null);
  const chartServicesRef = useRef<HTMLCanvasElement | null>(null);
  const chartHoursRef = useRef<HTMLCanvasElement | null>(null);

  // Retain active Chart definitions to destroy on update
  const chartInstances = useRef<{ [key: string]: Chart | null }>({
    trend: null,
    comp: null,
    rubros: null,
    zonas: null,
    services: null,
    hours: null,
  });

  // Standard cleanup on re-render
  useEffect(() => {
    // Clear and dispose of any outstanding charts
    Object.keys(chartInstances.current).forEach(key => {
      if (chartInstances.current[key]) {
        chartInstances.current[key]?.destroy();
        chartInstances.current[key] = null;
      }
    });

    // 1. Core Trend Chart: Daily Commercial vs Operational Volume
    if (chartTrendRef.current) {
      const dateMap: { [key: string]: { billing: number; count: number } } = {};
      let curr = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      let safetyGuard = 0;
      while (curr <= end && safetyGuard < 100) {
        const dStr = curr.toISOString().split('T')[0];
        dateMap[dStr] = { billing: 0, count: 0 };
        curr.setDate(curr.getDate() + 1);
        safetyGuard++;
      }

      filteredData.forEach(item => {
        if (dateMap[item.date]) {
          dateMap[item.date].count++;
          if (item.tipo === 'Facturable') {
            dateMap[item.date].billing += item.monto;
          }
        }
      });

      const sortedDates = Object.keys(dateMap).sort();
      const billingData = sortedDates.map(d => dateMap[d].billing);
      const volumeData = sortedDates.map(d => dateMap[d].count);

      chartInstances.current.trend = new Chart(chartTrendRef.current, {
        type: 'line',
        data: {
          labels: sortedDates.map(d => d.slice(5)), // Simplified mm-dd labels
          datasets: [
            {
              label: 'Facturación ($)',
              data: billingData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              fill: true,
              yAxisID: 'y',
              tension: 0.35,
              borderWidth: 3,
            },
            {
              label: 'Carga de Servicios (Visitas)',
              data: volumeData,
              borderColor: '#3b82f6',
              backgroundColor: 'transparent',
              fill: false,
              yAxisID: 'y1',
              tension: 0.2,
              borderWidth: 1.5,
              borderDash: [5, 5],
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: { color: '#3b82f6', font: { size: 10 } }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 9 } }
            }
          },
          plugins: {
            legend: { labels: { color: '#cbd5e1', font: { size: 11 } } }
          }
        }
      });
    }

    // 2. Composition Donut
    if (chartCompRef.current) {
      chartInstances.current.comp = new Chart(chartCompRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Facturables', 'Repasos gratis', 'Vacíos / Nulos'],
          datasets: [{
            data: [billableCount, repasoCount, invalidCount],
            backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
            borderWidth: 2,
            borderColor: '#0f172a'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 11 } } }
          },
          cutout: '70%'
        }
      });
    }

    // 3. Rubros bar Chart
    if (chartRubrosRef.current) {
      const rubroMap: { [key: string]: number } = {};
      filteredData.forEach(item => {
        if (item.tipo === 'Facturable') {
          rubroMap[item.rubro] = (rubroMap[item.rubro] || 0) + item.monto;
        }
      });
      const rubrosSorted = Object.keys(rubroMap).sort((a, b) => rubroMap[b] - rubroMap[a]).slice(0, 5);
      const rubrosValues = rubrosSorted.map(r => rubroMap[r]);

      chartInstances.current.rubros = new Chart(chartRubrosRef.current, {
        type: 'bar',
        data: {
          labels: rubrosSorted,
          datasets: [{
            label: 'Ingresos por Rubro ($)',
            data: rubrosValues,
            backgroundColor: '#10b981',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            y: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { size: 11 } } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    // 4. Zonas bar Chart
    if (chartZonasRef.current) {
      const zonaMap: { [key: string]: number } = {};
      filteredData.forEach(item => {
        if (item.tipo === 'Facturable') {
          zonaMap[item.zona] = (zonaMap[item.zona] || 0) + item.monto;
        }
      });
      const zonasSorted = Object.keys(zonaMap).sort((a, b) => zonaMap[b] - zonaMap[a]).slice(0, 5);
      const zonasValues = zonasSorted.map(z => zonaMap[z]);

      chartInstances.current.zonas = new Chart(chartZonasRef.current, {
        type: 'bar',
        data: {
          labels: zonasSorted,
          datasets: [{
            label: 'Facturación ($)',
            data: zonasValues,
            backgroundColor: '#3b82f6',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { size: 11 } } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    // 5. Types of Service Bar Chart
    if (chartServicesRef.current) {
      const serviceTypeMap: { [key: string]: number } = {};
      filteredData.forEach(item => {
        if (item.tipo === 'Facturable') {
          serviceTypeMap[item.servicio] = (serviceTypeMap[item.servicio] || 0) + item.monto;
        }
      });
      const servicesSorted = Object.keys(serviceTypeMap).sort((a, b) => serviceTypeMap[b] - serviceTypeMap[a]).slice(0, 5);
      const servicesValues = servicesSorted.map(s => serviceTypeMap[s]);

      chartInstances.current.services = new Chart(chartServicesRef.current, {
        type: 'bar',
        data: {
          labels: servicesSorted,
          datasets: [{
            label: 'Facturación ($)',
            data: servicesValues,
            backgroundColor: '#8b5cf6',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            y: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { size: 10 } } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    // 6. Hourly Peaks Peak Chart
    if (chartHoursRef.current) {
      const hoursOrder = ["08:00", "09:00", "10:00", "11:00", "12:00"];
      const hoursCount = [0, 0, 0, 0, 0];
      filteredData.forEach(item => {
        const idx = hoursOrder.indexOf(item.hora);
        if (idx !== -1) {
          hoursCount[idx]++;
        }
      });

      chartInstances.current.hours = new Chart(chartHoursRef.current, {
        type: 'line',
        data: {
          labels: hoursOrder,
          datasets: [{
            label: 'Servicios Simultáneos',
            data: hoursCount,
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#cbd5e1' } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    return () => {
      Object.keys(chartInstances.current).forEach(key => {
        if (chartInstances.current[key]) {
          chartInstances.current[key]?.destroy();
          chartInstances.current[key] = null;
        }
      });
    };
  }, [filteredData, activeTab]);

  // Handle active filters detection to display visual banner
  const hasActiveFilters = (
    filters.startDate !== '2026-04-20' ||
    filters.endDate !== '2026-05-20' ||
    filters.rubro !== 'All' ||
    filters.maxBilling < dynamicMaxAmount ||
    filters.zona !== 'All' ||
    !filters.chkFacturable ||
    !filters.chkRepaso ||
    !filters.chkInvalido
  );

  const resetFilters = () => {
    setFilters({
      startDate: '2026-04-20',
      endDate: '2026-05-20',
      rubro: 'All',
      maxBilling: dynamicMaxAmount,
      zona: 'All',
      chkFacturable: true,
      chkRepaso: true,
      chkInvalido: true,
    });
    setToastText("Filtros restablecidos correctamente");
  };

  // Google Sheets integration routine
  const handleSheetSync = async (e: FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) return;

    setIsSyncing(true);
    setSyncStatus('idle');
    setSyncError(null);

    try {
      const rows = await fetchGoogleSheet(sheetUrl, sheetName);
      setAllData(rows);
      setSyncStatus('success');
      setToastText(`¡Sincronización exitosa! Cargadas ${rows.length} filas.`);
    } catch (err: any) {
      setSyncStatus('error');
      setSyncError(err.message || 'Error al conectar con Google Sheets');
      setToastText('Error en la sincronización. Verifique el panel.');
    } finally {
      setIsSyncing(false);
    }
  };

  // One-click demo loader action
  const loadDemoSheet = () => {
    setSheetUrl(DEMO_SHEET_URL);
    setSheetName(DEMO_SHEETS_TAB);
    setToastText("Cargados parámetros demo. Pulse 'Sincronizar' para probar.");
  };

  // Copy synthesis text to clipboard
  const exportToClipboard = () => {
    const text = `SÍNTESIS GERENCIAL BI-PESTCONTROL\n` + 
                 `===============================\n` +
                 `Periodo: ${filters.startDate} al ${filters.endDate}\n` +
                 `Facturación Computable: $${totalBilling.toLocaleString('es-AR')}\n` +
                 `Ticket Promedio: $${averageBill.toLocaleString('es-AR')} (Mediana: $${mediaBill.toLocaleString('es-AR')})\n` +
                 `Carga Operativa: ${filteredData.length} Servicios (${repasoCount} repasos sin costo)\n` +
                 `Eficiencia Operativa: ${nonBilledRatioPercent}% de visitas sin ingreso técnico.\n\n` +
                 `Plan estratégico: Reclamo activo de pendientes ($${dynamicPendingDebt.toLocaleString('es-AR')}) y control de repasos.`;
    
    navigator.clipboard.writeText(text);
    setToastText("¡Síntesis copiada al portapapeles!");
  };

  // Export filtered dataset to a well-formatted CSV file
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      setToastText("No hay datos filtrados para exportar");
      return;
    }

    const headers = ["Fecha", "Cliente / Identificador", "Rubro", "Zona", "Servicio", "Facturación", "Estado", "Tipo Financiero", "Hora"];
    const rows = filteredData.map(item => [
      item.date,
      item.client,
      item.rubro,
      item.zona,
      item.servicio,
      item.monto,
      item.estado,
      item.tipo,
      item.hora
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => {
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(","))
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.style.display = "none";
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_operativo_pestcontrol_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastText("¡Reporte CSV descargado con éxito!");
  };

  // Reset toast triggers
  useEffect(() => {
    if (toastText) {
      const t = setTimeout(() => setToastText(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastText]);

  // What-if simulator calculations
  const simulatedRepasosRecovery = Math.round(40 * (whatIf.repasoPercent / 100) * whatIf.repasoPrice);
  const simulatedDebtsRecovery = Math.round(1954200 * (whatIf.cobroPercent / 100));
  const baseFacturation = 20822384;
  const optimizedFacturation = baseFacturation + simulatedRepasosRecovery + simulatedDebtsRecovery;
  const incrementRatioMultiplier = ((optimizedFacturation - baseFacturation) / baseFacturation) * 100;

  return (
    <div className="h-full flex flex-col overflow-hidden font-sans bg-slate-950 text-slate-100">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center shrink-0 gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg border border-emerald-500/30">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              BI-PestControl <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium">Dashboard Ejecutivo</span>
            </h1>
            <p className="text-xs text-slate-400">Análisis Operativo Financiero ({filters.startDate} - {filters.endDate})</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={resetFilters} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition flex items-center gap-1.5 border border-slate-700">
            <RotateCcw className="w-4 h-4" />
            Restablecer Filtros
          </button>
          
          <button onClick={() => { setShowPresentation(true); setCurrentSlide(1); }} className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-950/40 transition flex items-center gap-1.5">
            <Presentation className="w-4 h-4" />
            Modo Presentación
          </button>
          
          <button onClick={exportToClipboard} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition flex items-center gap-1.5 border border-slate-700">
            <Share2 className="w-4 h-4" />
            Exportar Síntesis
          </button>

          <button onClick={exportToCSV} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-950/40 transition flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Exportar Reporte
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar Control Panel */}
        <aside className="w-80 bg-slate-900/50 border-r border-slate-800 p-5 flex flex-col space-y-5 overflow-y-auto shrink-0">
          
          {/* Sincronización Google Sheets */}
          <div className="bg-slate-900 border border-dashed border-emerald-500/20 rounded-xl p-4 space-y-3 shadow-md">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4" /> Conectar Google Sheets
              </span>
              <button 
                type="button" 
                onClick={loadDemoSheet} 
                className="text-[10px] text-zinc-400 hover:text-emerald-400 underline transition"
                title="Genera campos demo autocompletados"
              >
                Cargar Demo
              </button>
            </div>
            
            <form onSubmit={handleSheetSync} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold block">Enlace público de la Hoja</label>
                <input 
                  type="text" 
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold block">Nombre de Pestaña (Sheet)</label>
                <input 
                  type="text" 
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="Ej: BI-PestControl" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSyncing || !sheetUrl} 
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sincronizar Hoja
                  </>
                )}
              </button>
            </form>

            {/* Sync status messages */}
            {syncStatus === 'success' && (
              <div className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 p-2 rounded text-center">
                ✓ Hoja conectada en tiempo real.
              </div>
            )}
            {syncStatus === 'error' && (
              <div className="text-[10px] text-rose-400 bg-rose-950/20 border border-rose-900/50 p-2 rounded max-h-24 overflow-y-auto">
                ⚠️ {syncError}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              Filtros de Control
            </h3>
            <p className="text-[11px] text-slate-500">Afecta en tiempo real todos los KPIs, gráficos e informes del panel.</p>
          </div>

          {/* Date range filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Rango de Fecha</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Desde</span>
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md p-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Hasta</span>
                <input 
                  type="date" 
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md p-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Rubro Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block flex justify-between">
              <span>Rubro del Cliente</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold">{filters.rubro === 'All' ? 'Todos' : filters.rubro}</span>
            </label>
            <select 
              value={filters.rubro}
              onChange={(e) => setFilters(prev => ({ ...prev, rubro: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">-- Todos los rubros --</option>
              <option value="Distribuidora">Distribuidora</option>
              <option value="Particular">Particular</option>
              <option value="Institución">Institución</option>
              <option value="Depósito">Depósito</option>
              <option value="Carnicería">Carnicería</option>
              <option value="Restaurante">Restaurante</option>
              <option value="Laboratorio">Laboratorio</option>
              <option value="Otros">Otros rubros</option>
            </select>
          </div>

          {/* Billing Range Filter */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Facturación Máxima</label>
              <span className="text-xs font-bold text-emerald-400">${filters.maxBilling.toLocaleString()}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max={dynamicMaxAmount} 
              step="25000"
              value={filters.maxBilling}
              onChange={(e) => setFilters(prev => ({ ...prev, maxBilling: Number(e.target.value) }))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>$0</span>
              <span>${Math.round(dynamicMaxAmount / 2).toLocaleString()}</span>
              <span>${dynamicMaxAmount.toLocaleString()}+</span>
            </div>
          </div>

          {/* Zone Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Zona de Cobertura</label>
            <select 
              value={filters.zona}
              onChange={(e) => setFilters(prev => ({ ...prev, zona: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">-- Todas las zonas --</option>
              <option value="Canning">Canning</option>
              <option value="Lomas de Zamora">Lomas de Zamora</option>
              <option value="Luis Guillón">Luis Guillón</option>
              <option value="Villa Fiorito">Villa Fiorito</option>
              <option value="Monte Grande">Monte Grande</option>
              <option value="Adrogué">Adrogué</option>
              <option value="Banfield">Banfield</option>
            </select>
          </div>

          {/* Status Checkbox filters */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Tipo Financiero del Servicio</label>
            <div className="space-y-1.5 pt-0.5">
              <label className="flex items-center text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                <input 
                  type="checkbox" 
                  checked={filters.chkFacturable}
                  onChange={(e) => setFilters(prev => ({ ...prev, chkFacturable: e.target.checked }))}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 mr-2 h-4 w-4"
                />
                <span className="flex-1">Servicios Facturables</span>
              </label>
              <label className="flex items-center text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                <input 
                  type="checkbox" 
                  checked={filters.chkRepaso}
                  onChange={(e) => setFilters(prev => ({ ...prev, chkRepaso: e.target.checked }))}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 mr-2 h-4 w-4"
                />
                <span className="flex-1">Repasos Sin Costo</span>
              </label>
              <label className="flex items-center text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                <input 
                  type="checkbox" 
                  checked={filters.chkInvalido}
                  onChange={(e) => setFilters(prev => ({ ...prev, chkInvalido: e.target.checked }))}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 mr-2 h-4 w-4"
                />
                <span className="flex-1">Montos Vacíos / Nulos</span>
              </label>
            </div>
          </div>

          {/* Strategic Notes Widget */}
          <div className="border-t border-slate-800 pt-4 flex-1 flex flex-col justify-end">
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
              <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                Criterio Estratégico
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Los repasos sin costo cuentan como carga operativa real (agenda/logística) pero se han aislado a nivel facturación para no distorsionar el ticket promedio comercial.
              </p>
            </div>
          </div>
        </aside>

        {/* Dashboard Viewport */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-6 relative">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 mb-6 shrink-0 space-x-2">
            <button 
              onClick={() => setActiveTab('resumen')} 
              className={`px-4 py-2 border-b-2 font-semibold text-sm transition flex items-center gap-2 ${activeTab === 'resumen' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Resumen Ejecutivo
            </button>
            <button 
              onClick={() => setActiveTab('financiero')} 
              className={`px-4 py-2 border-b-2 font-semibold text-sm transition flex items-center gap-2 ${activeTab === 'financiero' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <DollarSign className="w-4 h-4" /> Análisis Financiero
            </button>
            <button 
              onClick={() => setActiveTab('operativo')} 
              className={`px-4 py-2 border-b-2 font-semibold text-sm transition flex items-center gap-2 ${activeTab === 'operativo' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Truck className="w-4 h-4" /> Eficiencia Operativa
            </button>
            <button 
              onClick={() => setActiveTab('diagnostico')} 
              className={`px-4 py-2 border-b-2 font-semibold text-sm transition flex items-center gap-2 ${activeTab === 'diagnostico' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <AlertTriangle className="w-4 h-4" /> Cuellos de Botella y Fugas
            </button>
            <button 
              onClick={() => setActiveTab('whatif')} 
              className={`px-4 py-2 border-b-2 font-semibold text-sm transition flex items-center gap-2 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-t-lg ${activeTab === 'whatif' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400'}`}
            >
              <Calculator className="w-4 h-4 text-emerald-400" /> Simulador Gerencial
            </button>
          </div>

          {/* Banner notification for actively applied filters */}
          {hasActiveFilters && (
            <div className="mb-4 bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 rounded-lg px-4 py-2 text-xs flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                Se están aplicando filtros sobre los datos. Los indicadores y gráficos reflejan la segmentación activa.
              </span>
              <button onClick={resetFilters} className="underline font-bold hover:text-white">Ver todos los datos</button>
            </div>
          )}

          {/* ================= TAB: RESUMEN EJECUTIVO ================= */}
          <div className={`${activeTab === 'resumen' ? 'block' : 'hidden'} space-y-6`}>
            
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {/* KPI 1 */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
                  <TrendingUp className="w-16 h-16 -mr-2 -mt-2" />
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Facturación Computable</div>
                <div className="text-2xl font-bold text-white tracking-tight">${totalBilling.toLocaleString('es-AR')}</div>
                <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" /> 90.6%
                  </span>
                  Cobrado o computable
                </div>
              </div>

              {/* KPI 2 */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
                  <BadgeDollarSign className="w-16 h-16 -mr-2 -mt-2" />
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ticket Promedio</div>
                <div className="text-2xl font-bold text-white tracking-tight">${averageBill.toLocaleString('es-AR')}</div>
                <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  Mediana: <span className="font-bold text-slate-300">${mediaBill.toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
                  <ClipboardList className="w-16 h-16 -mr-2 -mt-2" />
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Carga Operativa</div>
                <div className="text-2xl font-bold text-white tracking-tight">{filteredData.length} visitas</div>
                <div className="text-xs text-slate-400 mt-2">
                  <span className="text-amber-400 font-semibold">{repasoCount} repasos</span> sin cobro directo
                </div>
              </div>

              {/* KPI 4 */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 text-amber-500/10 group-hover:text-amber-500/20 transition-colors">
                  <Sparkles className="w-16 h-16 -mr-2 -mt-2" />
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">% Operación No Facturaba</div>
                <div className="text-2xl font-bold text-amber-400 tracking-tight">{nonBilledRatioPercent}%</div>
                <div className="text-xs text-slate-400 mt-2">
                  <span className="text-amber-500 font-bold">{totalNonBilled} servicios</span> sin cobro
                </div>
              </div>

              {/* KPI 5 */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 text-red-500/10 group-hover:text-red-500/20 transition-colors">
                  <Clock className="w-16 h-16 -mr-2 -mt-2" />
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pendiente de Cobro</div>
                <div className="text-2xl font-bold text-rose-400 tracking-tight">${dynamicPendingDebt.toLocaleString('es-AR')}</div>
                <div className="text-xs text-slate-400 mt-2">
                  Gestión activa recomendada
                </div>
              </div>
            </div>

            {/* Core Visual Trends Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Commerical Trend Line */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Evolución Comercial y Carga Operativa Diaria
                    </h3>
                    <p className="text-xs text-slate-500 font-normal">Comparativa temporal de ingresos facturados y volumen de visitas técnicas realizadas.</p>
                  </div>
                </div>
                <div className="h-80 w-full relative">
                  <canvas ref={chartTrendRef}></canvas>
                </div>
              </div>

              {/* Composition Donut */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Composición de Servicios
                  </h3>
                  <p className="text-xs text-slate-500">Separación porcentual por tipo financiero del servicio realizado.</p>
                </div>
                <div className="h-64 w-full relative">
                  <canvas ref={chartCompRef}></canvas>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t border-slate-800 text-xs mt-3">
                  <div>
                    <div className="font-bold text-emerald-400">{billableCount}</div>
                    <div className="text-[10px] text-slate-500">Cobrados</div>
                  </div>
                  <div>
                    <div className="font-bold text-amber-400">{repasoCount}</div>
                    <div className="text-[10px] text-slate-500">Repasos</div>
                  </div>
                  <div>
                    <div className="font-bold text-rose-400">{invalidCount}</div>
                    <div className="text-[10px] text-slate-500">Vacíos</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-side Pareto Ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Pareto Section 1: Rubros */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                      Facturación por Rubro (Dominio de Mercado)
                    </h3>
                    <p className="text-xs text-slate-500">Desglose de los principales sectores comerciales ordenados por volumen monetario.</p>
                  </div>
                </div>
                <div className="h-64 w-full relative">
                  <canvas ref={chartRubrosRef}></canvas>
                </div>
              </div>

              {/* Pareto Section 2: Zonas */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      Top Zonas por Facturación
                    </h3>
                    <p className="text-xs text-slate-500">Distribución de ingresos generados geográficamente en zonas de cobertura.</p>
                  </div>
                </div>
                <div className="h-64 w-full relative">
                  <canvas ref={chartZonasRef}></canvas>
                </div>
              </div>
            </div>
          </div>

          {/* ================= TAB: ANALISIS FINANCIERO ================= */}
          <div className={`${activeTab === 'financiero' ? 'block' : 'hidden'} space-y-6`}>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Estructura de Ventas y Pareto Financiero
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  La diferencia de ticket promedio comercial (${averageBill.toLocaleString('es-AR')}) vs mediana de ventas (${mediaBill.toLocaleString('es-AR')}) advierte sobre la alta concentración de la rentabilidad en un número reducido de cuentas corporativas insignias.
                </p>
              </div>
              <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-lg shrink-0">
                <div className="text-xs text-slate-400">Servicio de Mayor Ticket</div>
                <div className="text-lg font-bold text-emerald-400">$1,375,000</div>
                <div className="text-[10px] text-slate-500">Canchas de pádel (Canning)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Type breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  Análisis por Tipo de Servicio
                </h3>
                <div className="h-72 w-full relative">
                  <canvas ref={chartServicesRef}></canvas>
                </div>
              </div>

              {/* Critial Debts table list */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-400" />
                  Pendientes de Cobro Críticos
                </h3>
                <p className="text-xs text-slate-500 mb-4">Cartera vencida que requiere gestión directa e inmediata.</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-white">Fundación Argeninta</div>
                      <div className="text-[10px] text-slate-500">Servicio Completo</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-rose-400">$750,000</div>
                      <span className="text-[8px] bg-rose-500/10 text-rose-400 px-1 rounded uppercase font-bold">Vencido</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-white">Area 54</div>
                      <div className="text-[10px] text-slate-500">Desratización</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-rose-400">$644,400</div>
                      <span className="text-[8px] bg-rose-500/10 text-rose-400 px-1 rounded uppercase font-bold">Vencido</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-white">Concesionarias Lanús</div>
                      <div className="text-[10px] text-slate-500">Desinsectación</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-rose-400">$411,400</div>
                      <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1 rounded uppercase font-bold">Seguimiento</span>
                    </div>
                  </div>
                </div>

                <button onClick={() => setActiveTab('whatif')} className="w-full mt-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition text-center block border border-slate-700">
                  Simular Cobranza Estratégica
                </button>
              </div>
            </div>
          </div>

          {/* ================= TAB: OPERATIVIDAD EFECTIVA ================= */}
          <div className={`${activeTab === 'operativo' ? 'block' : 'hidden'} space-y-6`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily hours peak distributions line */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      Concentración Horaria de Servicios
                    </h3>
                    <p className="text-xs text-slate-500">Análisis logístico de densidad de visitas simultáneas por hora.</p>
                  </div>
                  <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20 font-semibold">Hora Pico: 10:00</span>
                </div>
                <div className="h-72 w-full relative">
                  <canvas ref={chartHoursRef}></canvas>
                </div>
              </div>

              {/* Day distribution summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-emerald-400" />
                    Distribución por Día de la Semana
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Miércoles y Jueves sostienen más del 50% de la facturación y visitas.</p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="font-semibold text-slate-300">Jueves</span>
                      <span className="text-slate-400">32 visitas</span>
                      <span className="font-bold text-emerald-400">$5,745,608</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="font-semibold text-slate-300">Miércoles</span>
                      <span className="text-slate-400">37 visitas</span>
                      <span className="font-bold text-emerald-400">$5,251,831</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="font-semibold text-slate-300">Martes</span>
                      <span className="text-slate-400">31 visitas</span>
                      <span className="font-bold text-emerald-400">$4,167,445</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-emerald-950/20 border border-emerald-800/30 rounded text-[11px] text-emerald-300 leading-normal">
                  <strong>Tip Gerencial:</strong> Redirija visitas de repasos no urgentes a los viernes para desatorar el pico logístico de los miércoles/jueves.
                </div>
              </div>
            </div>

            {/* Recurrences Cards */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Repeat className="w-4 h-4 text-emerald-400" />
                Estructura de Recurrencia del Servicio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block pb-1">Mensual</span>
                  <div className="text-lg font-bold text-white">$9,871,959</div>
                  <span className="text-[10px] text-slate-500 leading-snug">72 servicios. Eje central contractual.</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-blue-400 block pb-1">Particular</span>
                  <div className="text-lg font-bold text-white">$3,174,655</div>
                  <span className="text-[10px] text-slate-500 leading-snug">21 servicios para necesidades individuales.</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block pb-1">Semanal</span>
                  <div className="text-lg font-bold text-amber-400">$2,418,000</div>
                  <span className="text-[10px] text-amber-500/80 leading-snug">20 visitas. Alta carga operativa.</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block pb-1">Quincenal</span>
                  <div className="text-lg font-bold text-white">$2,324,000</div>
                  <span className="text-[10px] text-slate-500 leading-snug">14 servicios programados quincenalmente.</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-purple-400 block pb-1">Semestral</span>
                  <div className="text-lg font-bold text-white">$1,819,100</div>
                  <span className="text-[10px] text-slate-500 leading-snug">3 visitas especiales de excelente volumen comercial.</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= TAB: DIAGNOSTICO Y ACCION ================= */}
          <div className={`${activeTab === 'diagnostico' ? 'block' : 'hidden'} space-y-6`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Leaks diagnostics review */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  Diagnóstico de Fugas Operativas
                </h3>
                
                <div className="space-y-4 text-sm">
                  <div className="border-l-2 border-amber-500 pl-4 py-1">
                    <div className="font-bold text-slate-200 text-xs uppercase tracking-wide">1. Alta Carga No Facturada (31.7%)</div>
                    <p className="text-xs text-slate-400 mt-1 leading-normal">
                      40 repasos sin costo consumen casi 1 de cada 3 visitas del equipo técnico. Si esto no está perfectamente cubierto por contratos fijos, representa una severa merma en combustible, personal y vehículos.
                    </p>
                  </div>

                  <div className="border-l-2 border-rose-500 pl-4 py-1">
                    <div className="font-bold text-slate-200 text-xs uppercase tracking-wide">2. Exceso de dependencia en Distribuidora</div>
                    <p className="text-xs text-slate-400 mt-1 leading-normal">
                      Distribuidora genera el 32.9% de toda la facturación, pero el 51.5% de sus visitas (17 de 33) fueron repasos no cobrados. El rubro estrella es a la vez el mayor consumidor de postventa gratis.
                    </p>
                  </div>

                  <div className="border-l-2 border-red-500 pl-4 py-1">
                    <div className="font-bold text-slate-200 text-xs uppercase tracking-wide">3. Registros de Datos Deficientes</div>
                    <p className="text-xs text-slate-400 mt-1 leading-normal">
                      Hay 6 registros operativos clave ingresados con montos nulos, vacíos o "#" que impiden auditar el ingreso y la cobranza en el sistema.
                    </p>
                  </div>
                </div>
              </div>

              {/* Checklist form panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                    Plan de Acción Recomendado (Checklist)
                  </h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-start p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                      <input type="checkbox" defaultChecked className="mt-0.5 rounded bg-slate-800 border-slate-700 text-emerald-500 mr-3 h-4 w-4" />
                      <div className="text-xs leading-normal">
                        <span className="font-bold text-slate-200 block">Separar KPIs en 3 dimensiones obligatorias</span>
                        <span className="text-slate-400 block mt-0.5">Visitas operativas, Visitas facturables y Repasos sin ingreso. (Implementado en este panel).</span>
                      </div>
                    </label>

                    <label className="flex items-start p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                      <input type="checkbox" className="mt-0.5 rounded bg-slate-800 border-slate-700 text-emerald-500 mr-3 h-4 w-4" />
                      <div className="text-xs leading-normal">
                        <span className="font-bold text-slate-200 block">Auditar contratos del Rubro Distribuidora</span>
                        <span className="text-slate-400 block mt-0.5">Analizar si los 17 repasos se justifican comercialmente o corresponden a fallas de servicio técnico.</span>
                      </div>
                    </label>

                    <label className="flex items-start p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                      <input type="checkbox" className="mt-0.5 rounded bg-slate-800 border-slate-700 text-emerald-500 mr-3 h-4 w-4" />
                      <div className="text-xs leading-normal">
                        <span className="font-bold text-slate-200 block">Campaña de Cobranza Directa</span>
                        <span className="text-slate-400 block mt-0.5">Efectuar reclamo formal inmediato a los 4 clientes con deudas críticas.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg mt-4 text-xs text-center flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Progreso del plan estratégico:</span>
                  <span className="text-emerald-400 font-extrabold bg-emerald-500/15 px-2 py-0.5 rounded">33% completado</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= TAB: WHAT IF SIMULATOR ================= */}
          <div className={`${activeTab === 'whatif' ? 'block' : 'hidden'} space-y-6`}>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-4xl mx-auto space-y-6 shadow-xl">
              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">Herramienta Gerencial de Simulación</span>
                <h2 className="text-lg font-bold text-white mt-2">Modelo de Optimización de Ingresos "What-If"</h2>
                <p className="text-xs text-slate-400 font-normal">Configure escenarios hipotéticos para proyectar la rentabilidad si se aplican mejoras comerciales.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                
                {/* Inputs */}
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                    Parámetros de Simulación
                  </h3>

                  {/* Input 1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">% de Cobro de Repasos</span>
                      <span className="text-emerald-400 font-bold">{whatIf.repasoPercent}% cobrados</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="10"
                      value={whatIf.repasoPercent}
                      onChange={(e) => setWhatIf(prev => ({ ...prev, repasoPercent: Number(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500">¿Qué porcentaje de los 40 repasos sin costo podríamos cobrar como visitas de mantenimiento?</p>
                  </div>

                  {/* Input 2 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">Precio Promedio de Mantenimiento</span>
                      <span className="text-emerald-400 font-bold">${whatIf.repasoPrice.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="30000" 
                      max="150000" 
                      step="5000"
                      value={whatIf.repasoPrice}
                      onChange={(e) => setWhatIf(prev => ({ ...prev, repasoPrice: Number(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Input 3 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">% Recobro de Cartera Vencida</span>
                      <span className="text-emerald-400 font-bold">{whatIf.cobroPercent}% recuperado</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="10"
                      value={whatIf.cobroPercent}
                      onChange={(e) => setWhatIf(prev => ({ ...prev, cobroPercent: Number(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500">Efectividad esperada de la campaña sobre deudores críticos ($1.95M en deuda).</p>
                  </div>
                </div>

                {/* Projections Outputs */}
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col justify-between space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Ingresos Adicionales Proyectados</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Por cobro de mantenimiento preventivo</span>
                        <div className="text-2xl font-bold text-white">+{simulatedRepasosRecovery > 0 ? `$${simulatedRepasosRecovery.toLocaleString('es-AR')}` : "$0"}</div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Por rescate de cartera deudora</span>
                        <div className="text-2xl font-bold text-white">+{simulatedDebtsRecovery > 0 ? `$${simulatedDebtsRecovery.toLocaleString('es-AR')}` : "$0"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 block mb-1">Impacto Final Proyectado</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-emerald-400">${optimizedFacturation.toLocaleString('es-AR')}</span>
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">+{incrementRatioMultiplier.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Bottom Table: Real Data Explorer */}
          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shrink-0">
            <div className="p-5 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Explorador de Servicios Realizados (Registros del Período)
                </h3>
                <p className="text-xs text-slate-500">Muestra los registros crudos activos en tiempo real. Utilice el panel de control de la izquierda para filtrar.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
                  Registros en vista: <span className="font-bold text-white">{filteredData.length}</span> analizados
                </div>
                <button onClick={exportToCSV} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow">
                  <FileText className="w-3.5 h-3.5" />
                  Exportar Reporte (.csv)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Cliente / Identificador</th>
                    <th className="p-4">Rubro</th>
                    <th className="p-4">Zona</th>
                    <th className="p-4">Servicio</th>
                    <th className="p-4 text-right">Facturación</th>
                    <th className="p-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Ningún servicio coincide con los filtros aplicados. Intente restablecer los filtros.
                      </td>
                    </tr>
                  ) : (
                    filteredData.slice(0, 15).map((row, idx) => {
                      let badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                      if (row.tipo === 'Repaso') badgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                      if (row.tipo === 'Monto Vacío') badgeClass = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                      if (row.estado.toLowerCase().includes("pendiente")) badgeClass = "bg-red-500/10 text-red-400 border border-red-500/20";

                      return (
                        <tr key={idx} className="hover:bg-slate-900/60 transition">
                          <td className="p-4 font-mono text-slate-400">{row.date}</td>
                          <td className="p-4 font-semibold text-white">{row.client}</td>
                          <td className="p-4 text-slate-400">{row.rubro}</td>
                          <td className="p-4 text-slate-400">{row.zona}</td>
                          <td className="p-4 text-slate-400">{row.servicio}</td>
                          <td className="p-4 text-right font-bold text-white font-mono">
                            {row.monto > 0 ? `$${row.monto.toLocaleString('es-AR')}` : "-"}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeClass}`}>
                              {row.estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {filteredData.length > 15 && (
                    <tr>
                      <td colSpan={7} className="p-3 text-center text-xs text-slate-500 bg-slate-950/40">
                        Mostrando los primeros 15 registros. Modifique los filtros de la izquierda para acotar los resultados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* Presentation Mode Slideshow Overlay */}
      {showPresentation && (
        <div className="fixed inset-0 bg-slate-950 z-50 overflow-y-auto flex flex-col">
          {/* Slideshow Header */}
          <header className="bg-slate-900 border-b border-slate-800 px-8 py-4 flex justify-between items-center shrink-0">
            <span className="text-xs font-extrabold uppercase text-slate-400 tracking-widest bg-slate-800 px-3 py-1 rounded border border-slate-700">Slide {currentSlide} de 4</span>
            <div className="text-center">
              <h1 className="text-base font-extrabold text-white">REUNIÓN DE DIRECTORIO PEST-CONTROL 2026</h1>
              <p className="text-[10px] text-slate-400 font-normal">Presentación Gerencial Interactiva</p>
            </div>
            <button onClick={() => setShowPresentation(false)} className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded text-xs transition font-semibold flex items-center gap-1.5 border border-rose-800/40">
              <XCircle className="w-4 h-4" /> Salir de Presentación
            </button>
          </header>

          {/* Slides Content Grid */}
          <div className="flex-1 flex flex-col md:flex-row p-8 gap-8 items-stretch overflow-hidden">
            
            {/* Visualizer card on the Left */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between overflow-y-auto">
              
              {currentSlide === 1 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Slide 1: Introducción & Resumen Ejecutivo</span>
                    <h2 className="text-2xl font-extrabold text-white">Desempeño Comercial del Período Analizado</h2>
                    <p className="text-xs text-slate-400">Resumen y estado de la facturación global y la masa operativa para la gerencia.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-center">
                      <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-1">Facturación Computable</span>
                      <span className="text-4xl font-extrabold text-emerald-400">$20.8M</span>
                      <span className="text-[10px] text-slate-500 block mt-1">Con IVA incluido (supuesto de 21%)</span>
                    </div>
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-center">
                      <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-1">Masa Operativa Real</span>
                      <span className="text-4xl font-extrabold text-blue-400">{filteredData.length} visitas</span>
                      <span className="text-[10px] text-slate-500 block mt-1">Excluye cancelaciones definitivamente</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400" />
                      Hitos de Rendimiento Destacados
                    </h4>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
                      <li>El mayor servicio individual ascendió a <span className="font-bold text-white">$1,375,000</span> (Canchas de pádel, Canning).</li>
                      <li>La zona de <span className="font-bold text-white">Canning</span> aportó el <span className="font-bold text-white">18.4%</span> de la facturación total con solo 17 visitas.</li>
                      <li>El rubro de <span className="font-bold text-white">Distribuidoras</span> generó un enorme <span className="font-bold text-white">32.9%</span> de toda la rentabilidad ($6.8M).</li>
                    </ul>
                  </div>
                </div>
              )}

              {currentSlide === 2 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">Slide 2: Cuello de Botella Operativo</span>
                    <h2 className="text-2xl font-extrabold text-white">La Carga No Monetizada (Repasos sin Costo)</h2>
                    <p className="text-xs text-slate-400">Análisis del consumo de técnicos, movilidad y agenda que no produce facturación directa.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-center">
                      <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-1">Tasa de Repasos sin Costo</span>
                      <span className="text-4xl font-extrabold text-amber-400">{nonBilledRatioPercent}%</span>
                      <span className="text-[10px] text-slate-500 block mt-1">{repasoCount} repasos sobre visitas totales</span>
                    </div>
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-center">
                      <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-1">Carga Financiera Nula</span>
                      <span className="text-4xl font-extrabold text-red-400">{totalNonBilled} visitas</span>
                      <span className="text-[10px] text-slate-500 block mt-1">Si sumamos los montos nulos/vacíos</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-300">
                    <strong className="text-white block mb-1">Hallazgo Crítico de Pareto:</strong>
                    En el rubro <strong>Distribuidoras</strong>, se realizaron 33 servicios pero solo 16 fueron facturables y 17 correspondieron a repasos sin costo. La postventa gratuita está absorbiendo los márgenes comerciales de nuestro rubro estrella.
                  </div>
                </div>
              )}

              {currentSlide === 3 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider block">Slide 3: Logística y Agenda</span>
                    <h2 className="text-2xl font-extrabold text-white">Saturación Horaria y Días Críticos</h2>
                    <p className="text-xs text-slate-400">Análisis logístico de franja horaria para mitigar cuellos de botella técnicos de campo.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block">Concentración de Mañanas (08:00 - 12:00)</span>
                        <span className="text-slate-400 mt-1 block">Sostiene la mayor carga operativa con gran volumen de visitas técnicas simultáneas.</span>
                      </div>
                      <span className="text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full font-bold">Crítico</span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block">La Paradoja de Volumen vs Facturación</span>
                        <span className="text-slate-400 mt-1 block">El volumen de ruteo semanal no siempre correlaciona linealmente con la facturación comercial. Algunas visitas de alto ticket requieren menos soporte físico postventa.</span>
                      </div>
                      <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold">Oportunidad</span>
                    </div>
                  </div>
                </div>
              )}

              {currentSlide === 4 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Slide 4: Plan de Acción Comercial</span>
                    <h2 className="text-2xl font-extrabold text-white">Recomendaciones y Siguiente Paso Comercial</h2>
                    <p className="text-xs text-slate-400 font-normal">Medidas correctivas estratégicas de inmediata ejecución para la gerencia.</p>
                  </div>

                  <div className="space-y-3 text-xs leading-normal">
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="font-bold text-emerald-400 block mb-0.5">1. Saneamiento Financiero</span>
                      <span className="text-slate-400">Iniciar reclamos de deudas activas vencidas clave: Fundación Argeninta, Area 54 y Concesionarias Lanús por un acumulado crítico.</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="font-bold text-amber-400 block mb-0.5">2. Cláusula de Repasos Máximos</span>
                      <span className="text-slate-400">Implementar contractualmente un tope de 1 repaso de garantía sin cargo por mes por cliente. Todo rrepaso extra debe cobrarse con tarifa reducida de mantenimiento.</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="font-bold text-blue-400 block mb-0.5">3. Optimización Geográfica Viernes</span>
                      <span className="text-slate-400">Utilizar los viernes exclusivamente para raleos y traslados de mantenimiento no críticos, liberando los días pico de la semana técnica.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Slide controls */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800 mt-6 shrink-0">
                <button 
                  onClick={() => currentSlide > 1 && setCurrentSlide(prev => prev - 1)} 
                  disabled={currentSlide === 1}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Anterior
                </button>
                <div className="flex space-x-1.5">
                  {[1, 2, 3, 4].map(idx => (
                    <span 
                      key={idx} 
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-emerald-500 scale-125' : 'bg-slate-700'}`}
                    ></span>
                  ))}
                </div>
                <button 
                  onClick={() => currentSlide < 4 && setCurrentSlide(prev => prev + 1)} 
                  disabled={currentSlide === 4}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs transition flex items-center gap-1.5"
                >
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Presenter speaker notes on Right */}
            <div className="w-full md:w-96 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Guía de Discurso para el Ponente
                </h3>
                <p className="text-[11px] text-slate-500 mb-4 leading-normal">Use estos puntos de diálogo sugeridos cuando proyecte esta diapositiva al directorio.</p>
                
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 min-h-[300px]">
                  {getSpeakerNotes(currentSlide)}
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-300 leading-normal">
                <strong>Consejo Directivo:</strong> Permita que los asesores hagan comentarios de la junta directiva antes de revelar el plan de saneamiento para lograr un impacto analítico mayor.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Alert Toast message */}
      {toastText && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-emerald-500 text-slate-100 px-4 py-3 rounded-xl shadow-2xl shadow-emerald-950/40 text-xs flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle className="text-emerald-400 w-5 h-5 flex-shrink-0" />
          <span>{toastText}</span>
        </div>
      )}

    </div>
  );
}
