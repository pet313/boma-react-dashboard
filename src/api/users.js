
import{apiClient}from"./client";
export const usersApi={
  getAll:()=>apiClient.get("/users"),
  create:(b)=>apiClient.post("/users",b),
  delete:(id)=>apiClient.delete(`/users/${id}`),
  toggle:(id)=>apiClient.put(`/users/${id}/toggle`,{}),
  setManualWeight:(id,v)=>apiClient.put(`/users/${id}/manual-weight`,{can_manual_weight:v}),
  updateRole:(id,role)=>apiClient.put(`/users/${id}/role`,{role}),
  resetPassword:(id,password)=>apiClient.put(`/users/${id}/password`,{password}),
};
