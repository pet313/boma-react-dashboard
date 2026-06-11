
import{API_BASE_URL,TOKEN_KEY}from"../utils/constants";
async function request(method,path,body=null){
  const token=localStorage.getItem(TOKEN_KEY)||"";
  const headers={"Content-Type":"application/json"};
  if(token)headers["Authorization"]=`Bearer ${token}`;
  const opts={method,headers};
  if(body)opts.body=JSON.stringify(body);
  const res=await fetch(`${API_BASE_URL}${path}`,opts);
  if(res.status===401){localStorage.removeItem(TOKEN_KEY);window.location.href="/";return;}
  const text=await res.text();
  const data=text?JSON.parse(text):{};
  if(!res.ok)throw new Error(data?.message||`HTTP ${res.status}`);
  return data;
}
export const apiClient={
  get:(p)=>request("GET",p),
  post:(p,b)=>request("POST",p,b),
  put:(p,b)=>request("PUT",p,b),
  delete:(p)=>request("DELETE",p),
};
