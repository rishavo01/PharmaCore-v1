import api from "./api.js";

export interface ReportSummary {
  revenue: number;
  revenueDelta: number;
  sales: number;
  salesDelta: number;
  profit: number;
  profitDelta: number;
}

export interface ChartPayload {
  period: string;
  labels: string[];
  revenue: number[];
}

export interface CategoryData {
  label: string;
  value: string;
  color: string;
}

export interface TopMedicineData {
  name: string;
  units: string;
  revenue: number;
  growth: string;
  status: string;
  color: string;
  bg: string;
}

export const getReportSummary = async (period: string): Promise<ReportSummary> => {
  const { data } = await api.get("/reports/summary", { params: { period } });
  return data;
};

export const getReportChart = async (period: string): Promise<ChartPayload> => {
  const { data } = await api.get("/reports/chart", { params: { period } });
  return data;
};

export const getReportCategories = async (period: string): Promise<CategoryData[]> => {
  const { data } = await api.get("/reports/categories", { params: { period } });
  return data;
};

export const getReportTopMedicines = async (period: string, search: string = ""): Promise<TopMedicineData[]> => {
  const { data } = await api.get("/reports/top-medicines", { params: { period, search } });
  return data;
};

export const getReportExportUrl = (format: "pdf" | "csv" | "xlsx", period: string): string => {
  return `http://localhost:5000/api/reports/export?format=${format}&period=${period}`;
};
