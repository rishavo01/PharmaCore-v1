import api from "./api.js";

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerLookupResponse {
  exists: boolean;
  customer?: Customer;
}

export const getCustomerByPhone = async (phone: string): Promise<CustomerLookupResponse> => {
  const { data } = await api.get(`/customers/phone/${phone}`);
  return data;
};

export const getCustomerById = async (id: number): Promise<Customer> => {
  const { data } = await api.get(`/customers/${id}`);
  return data;
};

export const createCustomer = async (input: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}): Promise<Customer> => {
  const { data } = await api.post("/customers", input);
  return data;
};

export const updateCustomer = async (
  id: number,
  input: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  }
): Promise<Customer> => {
  const { data } = await api.put(`/customers/${id}`, input);
  return data;
};
