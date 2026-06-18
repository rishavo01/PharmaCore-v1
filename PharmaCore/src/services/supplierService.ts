import api from "./api.js";

export interface Supplier {
  id: number;
  supplierCode: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  taxNumber: string;
  website: string;
  status: "ACTIVE" | "INACTIVE";
  notes: string;
  createdAt: string;
  updatedAt: string;
  ordersCount: number;
}

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  pendingOrders: number;
}

export interface RegionalData {
  label: string;
  value: string;
  color: string;
}

export interface StockAlert {
  supplierId: number;
  supplierName: string;
  affectedMedicines: number;
}

export interface SuppliersResponse {
  suppliers: Supplier[];
  total: number;
  page: number;
  totalPages: number;
}

export const getSuppliers = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
  order?: string;
}): Promise<SuppliersResponse> => {
  const { data } = await api.get("/suppliers", { params });
  return data;
};

export const getSupplier = async (id: number): Promise<Supplier> => {
  const { data } = await api.get(`/suppliers/${id}`);
  return data;
};

export const createSupplier = async (input: Partial<Supplier>): Promise<Supplier> => {
  const { data } = await api.post("/suppliers", input);
  return data;
};

export const updateSupplier = async (id: number, input: Partial<Supplier>): Promise<Supplier> => {
  const { data } = await api.put(`/suppliers/${id}`, input);
  return data;
};

export const deleteSupplier = async (id: number): Promise<any> => {
  const { data } = await api.delete(`/suppliers/${id}`);
  return data;
};

export const getSupplierStats = async (): Promise<SupplierStats> => {
  const { data } = await api.get("/suppliers/stats");
  return data;
};

export const getRegionalDistribution = async (): Promise<RegionalData[]> => {
  const { data } = await api.get("/suppliers/regions");
  return data;
};

export const getStockAlerts = async (): Promise<StockAlert[]> => {
  const { data } = await api.get("/suppliers/stock-alerts");
  return data;
};

export const getExportUrl = (format: "csv" | "xlsx" | "pdf", search: string = "", status: string = ""): string => {
  return `http://localhost:5000/api/suppliers/export?format=${format}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`;
};
