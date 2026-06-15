import { SheetRow } from './types';

export function generateMockData(): SheetRow[] {
  const data: SheetRow[] = [];
  
  // 1. Cancelled items (Exactly 5)
  const cancelledClients = ["Consorcio Rivadavia", "Fiambrería El Paso", "Clínica Monte Grande", "Pizzería Nápoles", "Fábrica Lomas"];
  for (let i = 0; i < 5; i++) {
    data.push({
      date: `2026-04-${22 + i}`,
      client: cancelledClients[i],
      rubro: "Particular",
      zona: "Lomas de Zamora",
      servicio: "Desinsectación",
      monto: 0,
      estado: "Cancelado",
      tipo: "Cancelado",
      hora: "11:00"
    });
  }

  // 2. Hardcoded Key Crítical billing & debt items
  data.push({
    date: "2026-05-06",
    client: "Canchas de pádel",
    rubro: "Particular",
    zona: "Canning",
    servicio: "Desratización + Interior y exterior",
    monto: 1375000,
    estado: "Pagado",
    tipo: "Facturable",
    hora: "09:00"
  });

  data.push({
    date: "2026-05-08",
    client: "Fundación Argeninta",
    rubro: "Institución",
    zona: "Canning",
    servicio: "Servicio Completo",
    monto: 750000,
    estado: "Pendiente",
    tipo: "Facturable",
    hora: "10:00"
  });

  data.push({
    date: "2026-05-12",
    client: "Area 54",
    rubro: "Distribuidora",
    zona: "Lomas de Zamora",
    servicio: "Desratización",
    monto: 644400,
    estado: "Pendiente",
    tipo: "Facturable",
    hora: "10:00"
  });

  data.push({
    date: "2026-05-07",
    client: "Concesionarias Lanús",
    rubro: "Distribuidora",
    zona: "Lomas de Zamora",
    servicio: "Desinsectación",
    monto: 411400,
    estado: "Pendiente",
    tipo: "Facturable",
    hora: "11:00"
  });

  data.push({
    date: "2026-05-14",
    client: "La Nueva Cabaña",
    rubro: "Particular",
    zona: "Banfield",
    servicio: "Servicio Completo",
    monto: 148400,
    estado: "Pendiente",
    tipo: "Facturable",
    hora: "08:00"
  });

  // 3. Montos Vacíos / Nulos (Exactly 6 entries)
  const emptyClients = ["Depósito Luis Guillón", "Restaurante Italia", "Panificadora Lomas", "Farma Sur", "Fábrica Temperley", "Distribuidora Canning"];
  const emptyRubros = ["Depósito", "Restaurante", "Particular", "Particular", "Particular", "Distribuidora"];
  const emptyZonas = ["Luis Guillón", "Lomas de Zamora", "Lomas de Zamora", "Adrogué", "Lomas de Zamora", "Canning"];
  for (let i = 0; i < 6; i++) {
    data.push({
      date: `2026-05-${10 + i}`,
      client: emptyClients[i],
      rubro: emptyRubros[i],
      zona: emptyZonas[i],
      servicio: "Desratización",
      monto: 0,
      estado: "Monto Vacío",
      tipo: "Monto Vacío",
      hora: "12:00"
    });
  }

  // 4. Repasos sin costo (Exactly 40 entries)
  const zonesList = ["Canning", "Lomas de Zamora", "Luis Guillón", "Villa Fiorito", "Monte Grande", "Adrogué"];
  const servicesList = ["Desratización", "Desinsectación", "Servicio Completo"];
  const hoursList = ["08:00", "09:00", "10:00", "11:00", "12:00"];
  
  for (let i = 0; i < 40; i++) {
    let rubro = "Particular";
    let name = `Cliente Particular - Repaso #${i+1}`;
    if (i < 17) {
      rubro = "Distribuidora";
      name = `Distribuidora Mayorista - Repaso #${i+1}`;
    } else if (i < 24) {
      rubro = "Semanal";
      name = `Abonado Semanal - Repaso #${i+1}`;
    } else if (i < 30) {
      rubro = "Quincenal";
      name = `Abonado Quincenal - Repaso #${i+1}`;
    }

    data.push({
      date: `2026-04-${20 + (i % 10)}`,
      client: name,
      rubro: rubro,
      zona: zonesList[i % zonesList.length],
      servicio: servicesList[i % servicesList.length],
      monto: 0,
      estado: "Repaso sin Costo",
      tipo: "Repaso",
      hora: hoursList[i % hoursList.length]
    });
  }

  // 5. Fill remaining 94 Facturables to reach 99 billables total (~$17.49M)
  const remainingTarget = 17493184;
  const remainingCount = 94;
  const averageBill = remainingTarget / remainingCount;

  const rubroWeights = [
    { name: "Distribuidora", weight: 0.35 },
    { name: "Particular", weight: 0.20 },
    { name: "Institución", weight: 0.15 },
    { name: "Depósito", weight: 0.10 },
    { name: "Carnicería", weight: 0.10 },
    { name: "Restaurante", weight: 0.05 },
    { name: "Laboratorio", weight: 0.05 }
  ];

  const zoneWeights = [
    { name: "Canning", weight: 0.25 },
    { name: "Lomas de Zamora", weight: 0.35 },
    { name: "Luis Guillón", weight: 0.10 },
    { name: "Villa Fiorito", weight: 0.10 },
    { name: "Monte Grande", weight: 0.10 },
    { name: "Adrogué", weight: 0.10 }
  ];

  const randomClientNames = [
    "Supermercado Toledo", "Química Lanús", "Logística Express", "Clínica del Sur", "Fábrica Metal", 
    "Panadería La Unión", "Fiambrería El Galpón", "Carnes Premium", "Restaurante Plaza", "Laboratorio Medic"
  ];

  function pickWeighted(arr: any[]) {
    let r = Math.random();
    let sum = 0;
    for (let el of arr) {
      sum += el.weight;
      if (r <= sum) return el.name;
    }
    return arr[0].name;
  }

  for (let i = 0; i < remainingCount; i++) {
    let rubro = pickWeighted(rubroWeights);
    let zona = pickWeighted(zoneWeights);
    let service = servicesList[i % servicesList.length];
    
    let basePrice = averageBill * (0.6 + Math.random() * 0.8);
    
    if (rubro === "Distribuidora" && zona === "Canning") {
      basePrice = averageBill * 1.5;
    }

    let finalPrice = Math.round(basePrice / 100) * 100;
    
    let dateDay = 20 + (i % 11);
    let dateStr = `2026-04-${dateDay}`;
    if (i > 45) {
      let mayDay = 1 + (i % 20);
      let mayDayStr = mayDay < 10 ? `0${mayDay}` : mayDay;
      dateStr = `2026-05-${mayDayStr}`;
    }

    data.push({
      date: dateStr,
      client: `${randomClientNames[i % randomClientNames.length]} #${i+1}`,
      rubro: rubro,
      zona: zona,
      servicio: service,
      monto: finalPrice,
      estado: "Pagado",
      tipo: "Facturable",
      hora: hoursList[i % hoursList.length]
    });
  }

  return data;
}
