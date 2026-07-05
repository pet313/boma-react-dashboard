
import{createContext,useContext,useState,useCallback}from"react";
import{authApi}from"../api/auth";
const AuthContext=createContext(null);
export function AuthProvider({children}){
  const[currentUser,setCurrentUser]=useState(()=>authApi.getCurrentUser());
  const[isAuthenticated,setIsAuthenticated]=useState(()=>authApi.isAuthenticated());
  const login=useCallback(async(eid,pw)=>{
    const d=await authApi.login(eid,pw);
    setCurrentUser(d.user);setIsAuthenticated(true);return d.user;
  },[]);
  const logout=useCallback(async()=>{
    await authApi.logout();setCurrentUser(null);setIsAuthenticated(false);
  },[]);
  return<AuthContext.Provider value={{currentUser,isAuthenticated,login,logout}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>{
  const c=useContext(AuthContext);
  if(!c)throw new Error("useAuth must be inside AuthProvider");
  return c;
};
