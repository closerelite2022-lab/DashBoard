export interface SheetRow {
  date: string;
  client: string;
  rubro: string;
  zona: string;
  servicio: string;
  monto: number;
  estado: string;
  tipo: 'Facturable' | 'Repaso' | 'Monto Vacío' | 'Cancelado';
  hora: string;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  rubro: string;
  maxBilling: number;
  zona: string;
  chkFacturable: boolean;
  chkRepaso: boolean;
  chkInvalido: boolean;
}

export interface WhatIfState {
  repasoPercent: number;
  repasoPrice: number;
  cobroPercent: number;
}
