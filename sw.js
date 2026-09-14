const CACHE="krishipath-v2";
const ASSETS=["./","./index.html","./style.css","./script.js","./operator.html"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>{
  const url=new URL(e.request.url);
  if(url.pathname.startsWith("/api/")){
    e.respondWith(fetch(e.request).catch(()=>new Response(JSON.stringify({error:"offline",offline:true}),{headers:{"Content-Type":"application/json"},status:503})));
    return;
  }

  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{
    const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;
  }).catch(()=>caches.match("./index.html"))));
});