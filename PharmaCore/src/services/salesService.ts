import api from "./api.js";

export interface SaleItem {
  id: number;
  saleId: number;
  medicineId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  medicine?: {
    id: number;
    name: string;
    category: string;
    quantity: number;
    buyPrice: number;
    sellPrice: number;
    expiryDate: string;
  };
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  customerName: string;
  paymentMethod: string;
  status: "Completed" | "Pending" | "Cancelled";
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  clinicalNotes?: string;
  items?: SaleItem[];
  customer?: {
    id: number;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
  };
}

export interface SalesResponse {
  sales: Sale[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SalesStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowthPercentage: number;
}

export interface ChartData {
  label: string;
  value: number;
}

export interface CreateSaleInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  paymentMethod: string;
  status?: string;
  discount?: number;
  taxRate?: number;
  clinicalNotes?: string;
  items: {
    medicineId: number;
    quantity: number;
  }[];
}

export const getSales = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}): Promise<SalesResponse> => {
  const { data } = await api.get("/sales", { params });
  return data;
};

export const getSale = async (id: number): Promise<Sale> => {
  const { data } = await api.get(`/sales/${id}`);
  return data;
};

export const createSale = async (input: CreateSaleInput): Promise<Sale> => {
  const { data } = await api.post("/sales", input);
  return data;
};

export const updateSale = async (id: number, input: Partial<CreateSaleInput>): Promise<Sale> => {
  const { data } = await api.put(`/sales/${id}`, input);
  return data;
};

export const deleteSale = async (id: number): Promise<{ success: boolean; message: string }> => {
  const { data } = await api.delete(`/sales/${id}`);
  return data;
};

export const cancelSale = async (id: number): Promise<Sale> => {
  const { data } = await api.post(`/sales/${id}/cancel`);
  return data;
};

export const getStats = async (): Promise<SalesStats> => {
  const { data } = await api.get("/sales/stats");
  return data;
};

export const getChart = async (period: "today" | "weekly" | "monthly"): Promise<ChartData[]> => {
  const { data } = await api.get("/sales/chart", { params: { period } });
  return data;
};

export const exportCSV = (): void => {
  window.open("http://localhost:5000/api/sales/export/csv", "_blank");
};
