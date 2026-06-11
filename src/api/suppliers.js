
import{apiClient}from"./client";
export const suppliersApi={
  getAll:(s="")=>apiClient.get(`/suppliers${s?`?search=${encodeURIComponent(s)}`:""}`),
};
