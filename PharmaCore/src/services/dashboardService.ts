import api from "./api.js";

export interface DashboardSummary {
  totalMedicines: number;
  lowStockCount: number;
  expiringCount: number;
  todaySales: number;
  todayRevenue: number;
  todayOrders: number;
  todaySalesDelta: number;
}

export interface RevenueData {
  label: string;
  revenue: number;
}

export interface RecentActivity {
  id: number;
  invoiceNumber: string;
  customerName: string;
  status: "Completed" | "Pending" | "Cancelled";
  itemCount: number;
  totalAmount: number;
  createdAt: string;
}

export interface PriorityAlert {
  id: string;
  name: string;
  detail: string;
  type: "Order" | "Disposal" | "Warning";
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const { data } = await api.get("/dashboard/summary");
  return data;
};

export const getDashboardRevenue = async (period: "weekly" | "monthly"): Promise<RevenueData[]> => {
  const { data } = await api.get("/dashboard/revenue", { params: { period } });
  return data;
};

export const getRecentActivity = async (limit: number = 10): Promise<RecentActivity[]> => {
  const { data } = await api.get("/dashboard/recent-activity", { params: { limit } });
  return data;
};

export const getDashboardAlerts = async (): Promise<PriorityAlert[]> => {
  const { data } = await api.get("/dashboard/alerts");
  return data;
};

export const exportDashboard = (format: "pdf" | "csv" | "xlsx"): void => {
  window.open(`http://localhost:5000/api/dashboard/export?format=${format}`, "_blank");
};
