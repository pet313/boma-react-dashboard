
import{API_BASE_URL,TOKEN_KEY}from"../utils/constants";
async function request(method,path,body=null){
  const token=localStorage.getItem(TOKEN_KEY)||"";
  const headers={"Content-Type":"application/json"};
  if(token)headers["Authorization"]=`Bearer ${token}`;
  const opts={method,headers};
  if(body)opts.body=JSON.stringify(body);

  try {
    const res=await fetch(`${API_BASE_URL}${path}`,opts);
    if(res.status===401){localStorage.removeItem(TOKEN_KEY);window.location.href="/";return;}

    const text=await res.text();
    let data={};

    if(text){
      try{data=JSON.parse(text);}catch{data={message:text};}
    }

    if(!res.ok)throw new Error(data?.message||data?.error||`HTTP ${res.status}`);
    return data;
  } catch (error) {
    if(error instanceof TypeError){throw new Error("Network error. Check the API server and connection.");}
    throw error;
  }
}
export const apiClient={
  get:(p)=>request("GET",p),
  post:(p,b)=>request("POST",p,b),
  put:(p,b)=>request("PUT",p,b),
  delete:(p)=>request("DELETE",p),
};
