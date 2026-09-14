const API = "http://localhost:5000";

const state={
  step:1, language:"en", registrationCompleted:false, locationDetected:false, centreSelected:false,
  cropCompleted:false, slotBooked:false, tokenGenerated:false, procurementCompleted:false,
  farmer:{name:"",mobile:"",aadhaar:"",village:""}, location:"", centre:"Greenfield Procurement Centre",
  centreId:"greenfield", zone:"", zoneLabel:"",
  distance:0, travelMinutes:0, headsUp:0, crop:"", quantity:"", unit:"", quality:"",
  date:"", dateIso:"", slot:"08:40 AM", token:"",
  queueAhead:12, queuePosition:13, waitMinutes:35, buffer:10, eleventhReady:false,
  smsHint:"Token alerts will be available here."
};
let queueTimer=null, tutorialIndex=0;

const translations={
 en:{
  navJourney:"Journey",navProcurement:"Procurement",navQueue:"Live Queue",navTrack:"Track",startJourney:"Start Journey",
  eyebrow:"SMART PROCUREMENT NETWORK",heroA:"Your harvest.",heroB:"Your slot.",heroC:"Your fair turn.",
  heroText:"One connected journey from your field to procurement — with location-aware alerts, live queue movement and a digital token that travels with you.",
  begin:"Begin procurement",tutorial:"Watch how it works",proof1:"GPS-aware centre",proof2:"10-slot buffer",proof3:"SMS-ready alerts",fieldNode:"FIELD NODE",gpsReady:"GPS ready",digitalToken:"DIGITAL TOKEN",tokenReady:"Generated after booking",queuePulse:"QUEUE PULSE",waitingFarmers:"farmers waiting",
  guidedTour:"A 2-minute guided tour",tourText:"See the entire procurement journey before you start.",fairByDesign:"Fair by design",fairText:"Every movement is timestamped so the farmer always knows what happens next.",
  journeyTitle:"From field to fair turn.",journeyText:"A single visual journey replaces confusing counters, queues and scattered updates.",
  j1:"Register",j1p:"Farmer profile",j2:"Locate",j2p:"Nearest centre",j3:"Crop",j3p:"Details & quality",j4:"Schedule",j4p:"Choose a slot",j5:"Token",j5p:"Digital pass",j6:"Queue",j6p:"Live movement",j7:"Arrive",j7p:"Centre tracking",j8:"Confirm",j8p:"QR completion",
  controlTitle:"Build your journey.",controlText:"Complete each stage once. KrishiPath carries the information forward.",yourJourney:"YOUR JOURNEY",s1:"Registration",s2:"Location",s3:"Centre",s4:"Crop details",s5:"Book slot",s6:"Token",secureFlow:"Connected journey",
  regTitle:"Tell us who is bringing the harvest.",regText:"Your details stay attached to this procurement journey.",name:"Farmer name",mobile:"Mobile number",aadhaar:"Aadhaar number",village:"Village / locality",privacy:"Only the information needed for your procurement journey is collected.",
  locTitle:"Let the route find your nearest centre.",locText:"Use live GPS to calculate the most suitable procurement centre.",detect:"Detect my location",
  centreTitle:"Your closest procurement point.",centreText:"The route is selected using your location.",smartAlert:"TRAVEL-AWARE ALERT",
  cropTitle:"What are you bringing today?",cropText:"Add crop and quantity so the centre can prepare for your arrival.",crop:"Crop",quantity:"Quantity",unit:"Unit",quality:"Quality",
  slotTitle:"Pick the time that works for you.",slotText:"Ten slots stay active in the buffer. When one opens, the next farmer moves in automatically.",
  tokenTitle:"Your procurement pass is ready.",tokenText:"Keep this token available. Queue movement and travel-aware alerts will update around it.",
  queueTitle:"The queue moves with you.",queueText:"A ten-slot rolling buffer keeps the next movement ready instead of leaving capacity idle.",alertTitle:"Distance changes your heads-up.",smsTitle:"Offline-ready notifications",bufferTitle:"10 ready. 11th moves in.",bufferText:"When any active slot closes, the next farmer is automatically pulled into the open position.",
  trackTitle:"Know exactly where your harvest is.",trackText:"Every milestone stays visible until the final QR confirmation.",offlineTitle:"No internet? Your journey doesn't disappear.",offlineText:"The token, latest queue information and essential journey details remain available on the device. SMS notifications keep the farmer informed when data connectivity is unavailable."
 },
 hi:{
  navJourney:"यात्रा",navProcurement:"खरीद",navQueue:"लाइव कतार",navTrack:"स्थिति",startJourney:"यात्रा शुरू करें",
  eyebrow:"स्मार्ट खरीद नेटवर्क",heroA:"आपकी फसल।",heroB:"आपका स्लॉट।",heroC:"आपकी उचित बारी।",
  heroText:"खेत से खरीद केन्द्र तक एक जुड़ी हुई यात्रा — स्थान आधारित अलर्ट, लाइव कतार और डिजिटल टोकन के साथ।",
  begin:"खरीद शुरू करें",tutorial:"कैसे काम करता है",proof1:"GPS केन्द्र चयन",proof2:"10-स्लॉट बफर",proof3:"SMS अलर्ट",fieldNode:"खेत स्थान",gpsReady:"GPS तैयार",digitalToken:"डिजिटल टोकन",tokenReady:"बुकिंग के बाद बनेगा",queuePulse:"कतार स्थिति",waitingFarmers:"किसान प्रतीक्षा में",
  guidedTour:"2 मिनट की मार्गदर्शिका",tourText:"शुरू करने से पहले पूरी खरीद यात्रा देखें।",fairByDesign:"न्यायपूर्ण व्यवस्था",fairText:"हर गतिविधि दर्ज होती है ताकि किसान को अगला कदम पता रहे।",
  journeyTitle:"खेत से उचित बारी तक।",journeyText:"एक स्पष्ट दृश्य यात्रा कतार और अलग-अलग अपडेट की उलझन को कम करती है।",
  j1:"पंजीकरण",j1p:"किसान प्रोफ़ाइल",j2:"स्थान",j2p:"निकटतम केन्द्र",j3:"फसल",j3p:"विवरण व गुणवत्ता",j4:"समय",j4p:"स्लॉट चुनें",j5:"टोकन",j5p:"डिजिटल पास",j6:"कतार",j6p:"लाइव स्थिति",j7:"पहुंचें",j7p:"केन्द्र स्थिति",j8:"पुष्टि",j8p:"QR पूरा",
  controlTitle:"अपनी यात्रा बनाएं।",controlText:"हर चरण पूरा करें; KrishiPath जानकारी आगे ले जाएगा।",yourJourney:"आपकी यात्रा",s1:"पंजीकरण",s2:"स्थान",s3:"केन्द्र",s4:"फसल विवरण",s5:"स्लॉट बुक करें",s6:"टोकन",secureFlow:"जुड़ी हुई यात्रा",
  regTitle:"फसल लाने वाले किसान की जानकारी दें।",regText:"आपकी जानकारी इसी खरीद यात्रा से जुड़ी रहेगी।",name:"किसान का नाम",mobile:"मोबाइल नंबर",aadhaar:"आधार नंबर",village:"गाँव / क्षेत्र",privacy:"आपकी खरीद यात्रा के लिए आवश्यक जानकारी ही ली जाती है।",
  locTitle:"रास्ता आपका निकटतम केन्द्र खोजे।",locText:"उपयुक्त खरीद केन्द्र चुनने के लिए लाइव GPS का उपयोग करें।",detect:"मेरा स्थान खोजें",
  centreTitle:"आपका सबसे नजदीकी खरीद केन्द्र।",centreText:"केन्द्र का मार्ग आपके स्थान के आधार पर चुना गया है।",smartAlert:"यात्रा आधारित अलर्ट",
  cropTitle:"आज आप कौन सी फसल ला रहे हैं?",cropText:"फसल और मात्रा दें ताकि केन्द्र आपकी तैयारी कर सके।",crop:"फसल",quantity:"मात्रा",unit:"इकाई",quality:"गुणवत्ता",
  slotTitle:"अपने लिए सही समय चुनें।",slotText:"बफर में दस स्लॉट सक्रिय रहते हैं। स्लॉट खुलते ही अगला किसान अपने आप आगे आता है।",
  tokenTitle:"आपका खरीद पास तैयार है।",tokenText:"इस टोकन को संभालकर रखें। कतार और यात्रा आधारित अलर्ट इसी के अनुसार बदलेंगे।",
  queueTitle:"कतार आपके साथ चलती है।",queueText:"दस-स्लॉट रोलिंग बफर अगली गति तैयार रखता है।",alertTitle:"दूरी के अनुसार अलर्ट समय बदलता है।",smsTitle:"ऑफलाइन SMS सूचनाएँ",bufferTitle:"10 तैयार। 11वाँ आगे।",bufferText:"कोई सक्रिय स्लॉट पूरा होते ही अगला किसान अपने आप खाली स्थान में आ जाता है।",
  trackTitle:"अपनी फसल की स्थिति जानें।",trackText:"अंतिम QR पुष्टि तक हर चरण दिखाई देता है।",offlineTitle:"इंटरनेट नहीं है? यात्रा गायब नहीं होगी।",offlineText:"टोकन, नवीनतम कतार जानकारी और जरूरी विवरण डिवाइस पर उपलब्ध रहेंगे। इंटरनेट न होने पर SMS किसान को सूचित करता रहेगा।"
 }
};

function $(id){return document.getElementById(id)}
function persist(){
  try{ localStorage.setItem("krishipath-journey", JSON.stringify(state)); }catch(_e){}
}
function restore(){
  try{
    const raw=localStorage.getItem("krishipath-journey");
    if(!raw)return;
    const saved=JSON.parse(raw);
    Object.assign(state, saved);
    if(state.farmer){
      if($("farmerName")) $("farmerName").value=state.farmer.name||"";
      if($("farmerMobile")) $("farmerMobile").value=state.farmer.mobile||"";
      if($("farmerVillage")) $("farmerVillage").value=state.farmer.village||"";
    }
  }catch(_e){}
}
function showToast(msg){
  const t=$("toast"); if(!t) return;
  t.textContent=msg; t.classList.add("show");
  clearTimeout(showToast._t); showToast._t=setTimeout(()=>t.classList.remove("show"),2800);
}
async function api(path, opts={}){
  const res=await fetch(API+path,{
    method: opts.method||"GET",
    headers:{ "Content-Type":"application/json" },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
function startProcurement(){document.querySelector("#procurement").scrollIntoView({behavior:"smooth"});goToStep(1)}
function goToStep(step){
  if(step>1&&!state.registrationCompleted){step=1}
  if(step>2&&!state.locationDetected){step=2}
  if(step>3&&!state.centreSelected){step=3}
  if(step>4&&!state.cropCompleted){step=4}
  if(step>5&&!state.slotBooked){step=5}
  state.step=step;
  document.querySelectorAll(".wizard-step").forEach(x=>x.classList.remove("active"));
  $("step"+step).classList.add("active");
  document.querySelectorAll(".step-link").forEach(x=>{x.classList.toggle("active",+x.dataset.step===step);x.classList.toggle("done",+x.dataset.step<step)})
  $("stepCounter").textContent=`0${step} / 06`; $("wizardProgress").style.width=`${step/6*100}%`;
  document.querySelector("#procurement").scrollIntoView({behavior:"smooth",block:"start"});
  if(step===5) loadSchedule();
  persist();
}
async function nextStep(){
  if(!validateStep(state.step))return;
  if(state.step===1){
    state.registrationCompleted=true;
    try {
  const data = await api("/api/farmers/register", {
    method: "POST",
    body: {
      name: state.farmer.name,
      mobile: state.farmer.mobile,
      aadhaar: state.farmer.aadhaar,
      village: state.farmer.village
    }
  });

  state.farmerId = data.farmerId;
  state.registrationCompleted = true;
} catch (err) {
  showToast(err.message || "Farmer registration failed.");
  return;
}
  }
  if(state.step===2)state.locationDetected=true;
  if(state.step===3)state.centreSelected=true;
  if(state.step===4){state.cropCompleted=true;updateCropPreview()}
  if(state.step===5){await generateToken();return}
  goToStep(Math.min(6,state.step+1));updateAll();
}
function previousStep(){goToStep(Math.max(1,state.step-1))}
function validateStep(step){
  if(step===1){
    const n=$("farmerName").value.trim(),m=$("farmerMobile").value.trim(),a=$("farmerAadhaar").value.trim(),v=$("farmerVillage").value.trim();
    if(!n||!/^\d{10}$/.test(m)||!/^\d{12}$/.test(a)||!v){showToast("Please complete all registration fields correctly.");return false}
    state.farmer={name:n,mobile:m,aadhaar:a,village:v}; persist(); return true;
  }
  if(step===2&&!state.locationDetected){showToast("Please detect your location first.");return false}
  if(step===3&&!state.locationDetected){showToast("Location is required to select the centre.");return false}
  if(step===4){
    state.crop=$("crop").value;state.quantity=$("quantity").value;state.unit=$("unit").value;
    if(!state.crop||!state.quantity||Number(state.quantity)<=0||!state.unit||!state.quality){showToast("Please enter crop, quantity, unit and quality.");return false} return true;
  }
  if(step===5&&!state.slot){showToast("Please select a time slot.");return false}
  return true;
}
function detectLocation(){
  $("gpsButton").disabled=true;$("gpsButton").textContent="Locating…";$("gpsStatus").textContent="GPS scanning";
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      resolveLocation(pos.coords.latitude, pos.coords.longitude);
    },()=>fallbackLocation());
  }else fallbackLocation();
}
async function resolveLocation(lat, lon){
  try{
    const route=await api("/api/centres/nearest",{method:"POST",body:{ latitude:lat,longitude:lon}});
    state.locationDetected=true;
    state.distance=route.distanceKm;
    state.travelMinutes=route.travelMinutes;
    state.headsUp=route.headsUpMinutes;
    state.location=route.location;
    state.centre=route.centre.name;
    state.centreId=route.centre.id;
    state.zone=route.zone;
    state.zoneLabel=route.zoneLabel;
    applyLocation(route);
    showToast(route.notifyReason);
  }catch(_e){
    state.locationDetected=true;
    const seed=Math.abs(Math.sin(lat*12.9898+lon*78.233));
    state.distance=Number((2.4+seed*26).toFixed(1));
    state.travelMinutes=Math.max(7,Math.round(state.distance*2.05));
    state.zone=state.distance<12?"TALUK":state.distance<40?"JILA":"OTHER";
    state.headsUp=state.zone==="TALUK"?15:state.zone==="JILA"?50:90;
    state.location=`${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
    state.zoneLabel=state.zone==="TALUK"?"Local / Taluk":state.zone==="JILA"?"Same Jila":"Outside Jila";
    applyLocation();
    showToast("Location saved locally. Connect the backend for live centre matching.");
  }
}
function fallbackLocation(){
  resolveLocation(21.15, 79.09);
}
function applyLocation(route){
  $("gpsButton").disabled=false;$("gpsButton").textContent="Detect my location";
  $("gpsStatus").textContent="GPS READY";$("locationResult").textContent=state.location;
  $("locationDescription").textContent=`Nearest centre selected at approximately ${state.distance} km (${state.zoneLabel || state.zone}). Travel time is about ${state.travelMinutes} minutes.`;
  if($("centreName")) $("centreName").textContent=state.centre;
  $("centreAddress").textContent=`${state.centre} • ${state.distance} km • ${state.zoneLabel || ""}`;
  $("centreDistance").textContent=`${state.distance} km`;$("travelTime").textContent=`${state.travelMinutes} min travel`;
  $("alertPreview").textContent=`${state.zone==="TALUK"?"Taluk/local":state.zone==="JILA"?"Jila":"Long-distance"} farmer: heads-up ${state.headsUp} minutes before your slot.`;
  $("heroLocation").textContent=state.distance+" km to centre";state.centreSelected=true;updateAll();persist();
  if(route && route.notifyReason){ /* already toasted */ }
}
function chooseQuality(btn,value){document.querySelectorAll(".quality-row button").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");state.quality=value}
function updateCropPreview(){
  $("cropPreview").textContent=state.crop?`${state.crop} • ${state.quality}`:"Crop details will appear here";
  $("cropQuantityPreview").textContent=state.quantity?`${state.quantity} ${state.unit}`:"Quantity pending";
}
function selectDate(btn,date,iso){
  document.querySelectorAll(".date-card").forEach(b=>b.classList.remove("selected"));
  if(btn) btn.classList.add("selected");
  state.date=date; state.dateIso=iso||state.dateIso; persist();
  loadSchedule();
}
function selectSlot(btn,slot){document.querySelectorAll(".time-slot").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");state.slot=slot;persist()}
async function loadSchedule(){
  try{
    const q=state.centreId?`?centreId=${encodeURIComponent(state.centreId)}${state.dateIso?`&date=${state.dateIso}`:""}`:"";
    const data=await api("/api/slots"+q);
    renderSlots(data.slots);
    const line=document.querySelector(".buffer-line");
    if(line){
     const active = data.buffer.active || 0;
     const capacity = data.buffer.capacity || 10;
     const waiting = data.buffer.waiting || 0;

     line.innerHTML = `
     <span>${active}/${capacity}</span>
     <p>Live buffer loaded · ${waiting} waiting</p>
     <b>${waiting > 0 ? "Next movement: automatic" : "Buffer available"}</b>
  `;

}
function renderDates(dates, selected){
  const col=document.querySelector(".date-column");
  if(!col||!dates) return;
  const small=col.querySelector("small");
  col.innerHTML="";
  if(small) col.appendChild(small);
  else { const s=document.createElement("small"); s.textContent="NEXT AVAILABLE DATES"; col.appendChild(s); }
  dates.forEach(d=>{
    const b=document.createElement("button");
    b.className="date-card"+(d.iso===(selected&&selected.iso)?" selected":"");
    b.type="button";
    b.innerHTML=`<b>${d.day}</b><span>${d.month}</span><em>${d.tag}</em>`;
    b.onclick=()=>selectDate(b,d.label,d.iso);
    col.appendChild(b);
  });
  if(selected){ state.date=selected.label; state.dateIso=selected.iso; }
}
function renderSlots(slots){
  const box=document.querySelector(".slots");
  if(!box||!slots) return;
  box.innerHTML="";
  slots.slice(0,10).forEach((slot,i)=>{
    const b=document.createElement("button");
    b.className="time-slot"+(state.slot===slot.label||(!state.slot&&i===0)?" selected":"");
    b.type="button";
    b.textContent=slot.label;
    b.onclick=()=>selectSlot(b,slot.label);
    box.appendChild(b);
  });
  if(!state.slot && slots[0]) state.slot=slots[0].label;
}
function applyBooking(data){
  state.token=data.token;
  state.tokenGenerated=true;
  state.slotBooked=true;
  state.queueAhead=data.queueAhead;
  state.queuePosition=data.queuePosition;
  state.waitMinutes=data.waitMinutes;
  state.buffer=data.bufferLoaded;
  state.eleventhReady=data.eleventhReady;
  state.headsUp=data.headsUpMinutes;
  state.distance=data.distanceKm;
  state.travelMinutes=data.travelMinutes;
  state.zone=data.zone;
  state.centre=data.centre;
  state.date=data.date;
  state.slot=data.slot;
  state.procurementCompleted=data.status==="completed";
  if(data.sms){
    state.smsHint=`SMS ${data.sms.status} to ${data.sms.masked}. ${data.inBuffer?"You are in the 10-slot buffer.":"Waiting — 11th enters when a slot opens."}`;
  }else if(data.mobileMasked){
    state.smsHint=`Alerts active for ${data.mobileMasked}. Heads-up ${data.headsUpMinutes} min (${data.zone}).`;
  }
  persist();
}
async function generateToken(){
  try{
    const data = await api("/api/bookings", {
  method: "POST",
  body: {
    farmerId: state.farmerId,
    crop: state.crop,
    quantity: state.quantity,
    unit: state.unit,
    quality: state.quality,
    centreId: state.centreId,
    date: state.dateIso,
    slotTime: state.slot,
    distanceKm: state.distance,
    travelMinutes: state.travelMinutes,
    headsUpMinutes: state.headsUpMinutes
    }
  });
    applyBooking(data);
    updateAll();goToStep(6);showToast("Digital token generated. SMS notification queued.");
    startQueuePoll();
  }catch(err){
    if(!state.token)state.token="KP-"+Math.floor(100000+Math.random()*900000);
    state.tokenGenerated=true;state.slotBooked=true;state.queueAhead=12;state.queuePosition=13;state.waitMinutes=35;state.buffer=10;
    state.smsHint="Offline booking saved on this device. SMS will send when the centre is reachable.";
    persist(); updateAll();goToStep(6);showToast(err.message||"Saved locally (offline).");
    clearInterval(queueTimer);queueTimer=setInterval(()=>{if(state.tokenGenerated&&!state.procurementCompleted&&state.queueAhead>0){state.queueAhead--;state.queuePosition=Math.max(1,state.queueAhead+1);state.waitMinutes=Math.max(5,state.queueAhead*3);updateAll()}},18000);
  }
}
function startQueuePoll(){
  clearInterval(queueTimer);
  queueTimer=setInterval(syncBooking, 8000);
}
async function syncBooking(){
  if(!state.tokenGenerated||!state.token||state.procurementCompleted) return;
  try{
    const data=await api("/api/bookings/"+encodeURIComponent(state.token));
    applyBooking(data); updateAll();
  }catch(_e){}
}
function updateAll(){
  updateHero();updateQueue();updateTracking();updateToken();updateBuffer();
  persist();
}
function updateHero(){
  $("heroToken").textContent=state.token||"— — —";$("heroQueue").textContent=state.tokenGenerated?state.queueAhead:"—";
}
function updateToken(){
  $("tokenNumber").textContent=state.token||"KP-000000";$("tokenFarmer").textContent=state.farmer.name||"—";$("tokenCrop").textContent=state.crop||"—";
  $("tokenQty").textContent=state.quantity?`${state.quantity} ${state.unit}`:"—";$("tokenDate").textContent=(state.date||"—")+" • "+state.slot;
  $("tokenCentre").textContent=state.centre;$("tokenAlert").textContent=state.headsUp?`${state.headsUp} min · ${state.zone||"route"}`:"—";
  $("trackToken").textContent=state.token||"—";
}
function updateQueue(){
  $("queuePosition").textContent=state.tokenGenerated?state.queuePosition:"—";$("queueAhead").textContent=state.tokenGenerated?state.queueAhead:"—";
  $("waitTime").textContent=state.tokenGenerated?`${state.waitMinutes} min`:"—";
  $("bufferCount").textContent=state.tokenGenerated?`${Math.min(10,state.buffer)}/10`:"—";
  $("bufferBig").textContent=state.tokenGenerated?state.buffer:"10";
  $("queueStatusTitle").textContent=state.tokenGenerated?(state.procurementCompleted?"Procurement completed":(state.queuePosition<=10?"Live buffer position":"Waiting — 11th auto-enters")):"Waiting for a token";
  $("alertDistance").textContent=state.distance?`${state.distance} km`:"—";$("alertTravel").textContent=state.travelMinutes?`${state.travelMinutes} min`:"—";
  $("alertMinutes").textContent=state.headsUp?`${state.headsUp} min ${state.zone?`· ${state.zone}`:""}`:"—";
  $("alertMeterFill").style.width=state.headsUp?`${Math.min(100,state.headsUp/90*100)}%`:"0%";
  $("smsStatus").textContent=state.tokenGenerated?state.smsHint:"Token alerts will be available here.";
}
function updateBuffer(){
  const el=$("bufferSlots");el.innerHTML="";
  for(let i=1;i<=10;i++){const s=document.createElement("span");s.textContent=String(i).padStart(2,"0");if(state.tokenGenerated&&state.queuePosition===i)s.className="current";el.appendChild(s)}
  const n=document.createElement("span");n.textContent="11";n.className="next";el.appendChild(n);
}
async function refreshQueue(){
  if(!state.tokenGenerated){showToast("Generate your token to enter the live queue.");return}
  if(state.procurementCompleted){showToast("Procurement is already completed.");return}
  try{
    const data=await api("/api/bookings/"+encodeURIComponent(state.token));
    applyBooking(data); updateAll();
    showToast(data.inBuffer?"You are in the live 10-slot buffer.":"A slot opening will auto-trigger the 11th farmer.");
  }catch(_e){
    if(state.queueAhead>0){state.queueAhead--;state.queuePosition=Math.max(1,state.queueAhead+1);state.waitMinutes=Math.max(5,state.queueAhead*3);showToast("Queue refreshed from saved device data.");}
    else showToast("You are next. Please proceed to the centre when notified.");
    updateAll();
  }
}
function showQueue(){document.querySelector("#queue").scrollIntoView({behavior:"smooth"});updateAll();syncBooking()}
function updateTracking(){
  const labels=[["Registration completed","Farmer details verified"],["Slot booked","Time and date reserved"],["Waiting in queue","Live buffer position"],["Visit centre","Arrive at allotted time"],["Verification & weighing","Crop checked and weighed"],["Procurement completed","QR confirmation"]];
  $("timeline").innerHTML=labels.map((x,i)=>{
    let cls="";
    if(!state.tokenGenerated){cls=i===0&&state.registrationCompleted?"done":""}
    else if(state.procurementCompleted)cls="done";
    else if(i<2)cls="done"; else if(i===2)cls="current";
    return `<div class="timeline-item ${cls}"><div class="timeline-dot"></div><strong>${x[0]}</strong><span>${x[1]}</span></div>`;
  }).join("");
  $("trackStatus").textContent=!state.tokenGenerated?"NOT STARTED":state.procurementCompleted?"COMPLETED":"IN PROGRESS";
  $("trackHeadline").textContent=!state.tokenGenerated?"Your journey will appear here.":state.procurementCompleted?"Procurement successfully confirmed.":"Your procurement journey is active.";
  $("confirmBtn").disabled=!state.tokenGenerated||state.procurementCompleted;
}
async function confirmProcurement(){
  if(!state.tokenGenerated)return;
  try{
    const data=await api("/api/bookings/"+encodeURIComponent(state.token)+"/complete",{method:"POST",body:{}});
    applyBooking(data);
  }catch(_e){}
  state.procurementCompleted=true;state.queueAhead=0;state.queuePosition=1;state.waitMinutes=0;state.buffer=0;updateAll();showToast("QR scanned. Procurement confirmed. Next farmer auto-entered the buffer.");
}
function resetProcurement(){
  Object.assign(state,{step:1,registrationCompleted:false,locationDetected:false,centreSelected:false,cropCompleted:false,slotBooked:false,tokenGenerated:false,procurementCompleted:false,farmer:{name:"",mobile:"",aadhaar:"",village:""},location:"",centre:"Greenfield Procurement Centre",centreId:"greenfield",zone:"",zoneLabel:"",distance:0,travelMinutes:0,headsUp:0,crop:"",quantity:"",unit:"",quality:"",date:"",dateIso:"",slot:"08:40 AM",token:"",queueAhead:12,queuePosition:13,waitMinutes:35,buffer:10,eleventhReady:false,smsHint:"Token alerts will be available here."});
  ["farmerName","farmerMobile","farmerAadhaar","farmerVillage","quantity"].forEach(id=>$(id).value="");$("crop").value="";$("unit").value="";
  document.querySelectorAll(".quality-row button").forEach(b=>b.classList.remove("selected"));
  try{ localStorage.removeItem("krishipath-journey"); }catch(_e){}
  clearInterval(queueTimer);updateAll();goToStep(1);showToast("New procurement journey started.");
}
function changeLanguage(){
  state.language=state.language==="en"?"hi":"en";$("langBtn").textContent=state.language==="en"?"हिन्दी":"English";
  document.querySelectorAll("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(translations[state.language][key])el.textContent=translations[state.language][key]});
  showToast(state.language==="hi"?"हिन्दी भाषा सक्रिय":"English language active");
}
$("langBtn").addEventListener("click",changeLanguage);
document.querySelectorAll(".step-link").forEach(b=>b.addEventListener("click",()=>goToStep(+b.dataset.step)));
$("quantity").addEventListener("input",updateCropPreview);$("crop").addEventListener("change",updateCropPreview);$("unit").addEventListener("change",updateCropPreview);

const tutorial=[
 ["Register once.","Create your farmer profile and begin a connected procurement journey."],
 ["Find the right centre.","GPS identifies the nearest procurement route and estimates your travel time."],
 ["Choose your time.","Pick a date and slot while the ten-slot rolling buffer keeps the next movement ready."],
 ["Follow the queue.","Your position, waiting time and distance-aware notification timing update as the queue moves."],
 ["Confirm with QR.","Reach the centre, complete verification and scan the QR to close the procurement journey."]
];
function openTutorial(){tutorialIndex=0;renderTutorial();$("tutorialModal").classList.add("open")}
function closeTutorial(){$("tutorialModal").classList.remove("open")}
function renderTutorial(){$("tutorialNumber").textContent=String(tutorialIndex+1).padStart(2,"0");$("tutorialHead").textContent=tutorial[tutorialIndex][0];$("tutorialCopy").textContent=tutorial[tutorialIndex][1];$("tutorialDots").innerHTML=tutorial.map((_,i)=>`<span class="${i===tutorialIndex?"active":""}"></span>`).join("")}
function tutorialNext(){tutorialIndex=(tutorialIndex+1)%tutorial.length;renderTutorial()}
function tutorialPrev(){tutorialIndex=(tutorialIndex-1+tutorial.length)%tutorial.length;renderTutorial()}
window.addEventListener("online",()=>{$("connectionText").textContent="Online connection";showToast("Connection restored.");syncBooking();});
window.addEventListener("offline",()=>{$("connectionText").textContent="Offline access active";showToast("Offline access active. SMS will still reach the registered mobile.");});
restore();
updateAll();
if(state.tokenGenerated && !state.procurementCompleted) startQueuePoll();

if ("serviceWorker" in navigator) { window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(()=>{})); }
