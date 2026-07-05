
import{apiClient}from"./client";
export const mobsApi={
  getAll:(p={})=>{const q=new URLSearchParams(p).toString();return apiClient.get(`/mobs${q?"?"+q:""}`);},
  getById:(id)=>apiClient.get(`/mobs/${id}`),
  close:(id)=>apiClient.post(`/mobs/${id}/close`,{}),
  retryEmail:(id, data = {})=>apiClient.post(`/mobs/${id}/retry-email`, data),
  getGrnData:(id)=>apiClient.get(`/mobs/${id}/grn-data`),
};
