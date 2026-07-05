
import{apiClient}from"./client";
import{TOKEN_KEY,USER_KEY}from"../utils/constants";
export const authApi={
  async login(employeeId,password){
    const data=await apiClient.post("/auth/login",{employee_id:employeeId,password});
    if(!data?.token)throw new Error("No token returned.");
    localStorage.setItem(TOKEN_KEY,data.token);
    localStorage.setItem(USER_KEY,JSON.stringify(data.user));
    return data;
  },
  async logout(){try{await apiClient.post("/auth/logout",{});}catch(_){}
    localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(USER_KEY);},
  getCurrentUser(){try{return JSON.parse(localStorage.getItem(USER_KEY));}catch{return null;}},
  isAuthenticated(){return!!localStorage.getItem(TOKEN_KEY);},
};
