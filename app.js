"use strict";

const SERVICES = [
 {id:1,name:"Teeth Cleaning",description:"Routine cleaning to remove plaque and keep your teeth healthy.",duration:45,price:800,category:"Preventive"},
 {id:2,name:"Dental Filling",description:"Restore teeth affected by small cavities and damage.",duration:45,price:1200,category:"Restorative"},
 {id:3,name:"Tooth Extraction",description:"Safe removal of a damaged or problematic tooth.",duration:45,price:1500,category:"Emergency"},
 {id:4,name:"Braces",description:"Orthodontic treatment for improving tooth alignment.",duration:60,price:35000,category:"Orthodontic"},
 {id:5,name:"Dental X-Ray",description:"Dental imaging to help check teeth and surrounding structures.",duration:20,price:700,category:"Preventive"}
];

const DENTISTS = [
 {id:1,name:"Dr. James Carter",specialization:"General Dentistry"},
 {id:2,name:"Dr. Maria Santos",specialization:"Orthodontics"},
 {id:3,name:"Dr. Kevin Lee",specialization:"Restorative Dentistry"}
];

const DEMO_USERS = [
 {id:1,fullname:"Demo Admin",email:"demo-admin@example.test",password:"DEMO-2026!",role:"admin",phone:""},
 {id:2,fullname:"Demo Receptionist",email:"demo-reception@example.test",password:"DEMO-2026!",role:"receptionist",phone:""},
 {id:3,fullname:"Demo Dentist",email:"demo-dentist@example.test",password:"DEMO-2026!",role:"dentist",phone:""},
 {id:4,fullname:"Demo Patient",email:"demo-patient@example.test",password:"DEMO-2026!",role:"patient",phone:"09000000000"}
];

const KEYS = {users:"sw_users",appointments:"sw_appointments",session:"sw_session",seq:"sw_seq",selectedService:"sw_selected_service",sync:"sw_sync"};
let booking = {serviceId:null,dentistId:null,date:null,time:null,step:1,editId:null};

function readLocal(key,fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}}
function writeLocal(key,value){localStorage.setItem(key,JSON.stringify(value))}
function readSession(){try{return JSON.parse(sessionStorage.getItem(KEYS.session)) ?? null}catch{return null}}
function setSession(user){sessionStorage.setItem(KEYS.session,JSON.stringify(user))}
function clearSession(){sessionStorage.removeItem(KEYS.session)}
function esc(value){return String(value ?? "").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]))}
function isoDate(date){return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function todayPlus(days){const d=new Date();d.setDate(d.getDate()+days);return isoDate(d)}
function fmtDate(value){return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH",{month:"long",day:"numeric",year:"numeric"})}
function fmtTime(value){const [h,m]=value.split(":");const d=new Date();d.setHours(Number(h),Number(m),0,0);return d.toLocaleTimeString("en-PH",{hour:"numeric",minute:"2-digit"})}
function nextId(){const next=Number(localStorage.getItem(KEYS.seq)||"1000")+1;localStorage.setItem(KEYS.seq,String(next));return next}
function serviceById(id){return SERVICES.find(item=>item.id===Number(id))}
function dentistById(id){return DENTISTS.find(item=>item.id===Number(id))}
function userById(id){return readLocal(KEYS.users,[]).find(item=>item.id===Number(id))}
function appointments(){return readLocal(KEYS.appointments,[])}
function saveAppointments(value){writeLocal(KEYS.appointments,value)}
function statusClass(value){return String(value).replace(/[^a-zA-Z0-9_-]/g,"-")}
function notice(message,type="error"){const style=type==="success"?"background:#ecfbf3;border-color:#c8eedb;color:#19774f":"";return `<div class="notice" style="${style}">${esc(message)}</div>`}

function seed(){
 if(!localStorage.getItem(KEYS.users)) writeLocal(KEYS.users,DEMO_USERS);
 if(!localStorage.getItem(KEYS.appointments)) writeLocal(KEYS.appointments,[
  {id:1,userId:4,dentistId:1,serviceId:1,date:todayPlus(1),time:"09:00",status:"Confirmed",notes:"Routine cleaning",paid:false,paymentMethod:""}
 ]);
 if(!localStorage.getItem(KEYS.seq)) localStorage.setItem(KEYS.seq,"1000");
 if(localStorage.getItem(KEYS.sync)===null) localStorage.setItem(KEYS.sync,"true");
}

function logout(){clearSession();location.href="index.html"}
function requireAccess(page){
 const user=readSession();
 if(page==="patient.html" && (!user||user.role!=="patient")){location.href="login.html";return false}
 if(page==="admin.html" && (!user||user.role==="patient")){location.href="login.html";return false}
 return true
}

function initHome(){
 const grid=document.getElementById("serviceGrid");
 if(!grid)return;
 const render=(category="All")=>{
  grid.innerHTML=SERVICES.filter(s=>category==="All"||s.category===category).map(s=>`<article class="card procedure-card"><div class="procedure-icon">🦷</div><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p><div class="meta"><span>${s.duration} min</span><span class="price">₱${s.price.toLocaleString()}</span></div><a class="btn small" href="login.html" data-service="${s.id}">Book this</a></article>`).join("");
  grid.querySelectorAll("[data-service]").forEach(link=>link.addEventListener("click",()=>localStorage.setItem(KEYS.selectedService,String(link.dataset.service))));
 };
 render();
 document.querySelectorAll("#serviceTabs .tab").forEach(button=>button.addEventListener("click",()=>{
  document.querySelectorAll("#serviceTabs .tab").forEach(item=>item.classList.remove("active"));
  button.classList.add("active");
  render(button.dataset.cat);
 }));
}

function initLogin(){
 const form=document.getElementById("loginForm");
 if(!form)return;
 form.addEventListener("submit",event=>{
  event.preventDefault();
  const email=document.getElementById("email").value.trim().toLowerCase();
  const password=document.getElementById("password").value;
  const users=readLocal(KEYS.users,[]);
  const user=users.find(item=>item.email.toLowerCase()===email && item.password===password);
  if(!user){document.getElementById("loginNotice").innerHTML=notice("The demo email or password is incorrect.");return}
  setSession(user);
  location.href=user.role==="patient"?"patient.html":"admin.html";
 });
}

function initRegister(){
 const form=document.getElementById("registerForm");
 if(!form)return;
 form.addEventListener("submit",event=>{
  event.preventDefault();
  const users=readLocal(KEYS.users,[]);
  const name=document.getElementById("regName").value.trim();
  const email=document.getElementById("regEmail").value.trim().toLowerCase();
  const password=document.getElementById("regPassword").value;
  const phone=document.getElementById("regPhone").value.trim();
  if(name.length<2){document.getElementById("registerNotice").innerHTML=notice("Please enter your full name.");return}
  if(password.length<8){document.getElementById("registerNotice").innerHTML=notice("Use at least 8 characters for this demo account.");return}
  if(users.some(item=>item.email.toLowerCase()===email)){document.getElementById("registerNotice").innerHTML=notice("That email is already registered in this browser.");return}
  const user={id:nextId(),fullname:name,email,password,role:"patient",phone};
  users.push(user);writeLocal(KEYS.users,users);setSession(user);location.href="patient.html";
 });
}

function initPatient(){
 if(!requireAccess("patient.html"))return;
 const user=readSession();
 document.querySelectorAll("[data-patient-name]").forEach(el=>el.textContent=user.fullname);
 const selected=localStorage.getItem(KEYS.selectedService);
 if(selected){localStorage.removeItem(KEYS.selectedService);startBooking(Number(selected));}
 renderAppointments();
}

function startBooking(serviceId=null){
 booking={serviceId:serviceId,dentistId:null,date:null,time:null,step:1,editId:null};
 const home=document.getElementById("home");
 const bookingBox=document.getElementById("booking");
 if(home)home.style.display="none";
 if(bookingBox)bookingBox.style.display="block";
 renderBooking();
 window.scrollTo({top:0,behavior:"smooth"});
}
function exitBooking(){
 const home=document.getElementById("home");
 const bookingBox=document.getElementById("booking");
 if(home)home.style.display="block";
 if(bookingBox){bookingBox.style.display="none";bookingBox.innerHTML="";}
 renderAppointments();
 window.scrollTo({top:0,behavior:"smooth"});
}
function renderBooking(){
 const el=document.getElementById("booking");
 if(!el)return;
 let content=`<div class="booking-head"><div><span class="eyebrow">Patient Portal</span><h1>${booking.editId?"Reschedule Appointment":"Book an Appointment"}</h1></div><button class="btn secondary small" id="exitBooking">Exit booking</button></div><div class="steps">${[[1,"Choose a Dentist"],[2,"Choose a Date"],[3,"Choose a Time"],[4,"Confirm"]].map((item,index)=>`<div class="step ${booking.step>=item[0]?"active":""}"><span class="circle">${item[0]}</span>${item[1]}</div>${index<3?'<span class="connector"></span>':''}`).join("")}</div>`;
 if(booking.step===1)content+=stepDentist();
 if(booking.step===2)content+=stepDate();
 if(booking.step===3)content+=stepTime();
 if(booking.step===4)content+=stepConfirm();
 el.innerHTML=content;
 document.getElementById("exitBooking")?.addEventListener("click",exitBooking);
}
function stepDentist(){
 return `<div class="card"><h2>Choose a Dentist</h2><p class="muted">Select a dentist for your appointment.</p><div class="provider-grid">${DENTISTS.map(d=>`<button type="button" class="provider ${booking.dentistId===d.id?"selected":""}" data-dentist="${d.id}"><span class="avatar">DR</span><span><strong>${esc(d.name)}</strong><small>${esc(d.specialization)}</small></span>${booking.dentistId===d.id?'<span class="check">✓</span>':''}</button>`).join("")}</div><div class="info-note">This school prototype stores booking data only in this browser.</div><div class="actions"><button class="btn" id="nextDate">Next: Choose a Date</button></div></div>`;
}
function chooseDentist(id){booking.dentistId=Number(id);renderBooking()}
function stepDate(){
 const current=booking.date?new Date(`${booking.date}T00:00:00`):new Date();
 const year=current.getFullYear();const month=current.getMonth();const first=new Date(year,month,1).getDay();const total=new Date(year,month+1,0).getDate();
 let cells="";for(let i=0;i<first;i++)cells+="<div></div>";
 const min=new Date();min.setHours(0,0,0,0);
 for(let day=1;day<=total;day++){
  const d=new Date(year,month,day);const ds=isoDate(d);const weekend=d.getDay()===0||d.getDay()===6;const past=d<min;
  cells+=`<button type="button" class="day ${booking.date===ds?"selected":""}" data-date="${ds}" ${weekend||past?"disabled":""}>${day}</button>`;
 }
 return `<div class="card calendar"><div class="calendar-head"><button type="button" class="btn secondary small" id="prevMonth">‹</button><strong>${current.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</strong><button type="button" class="btn secondary small" id="nextMonth">›</button></div><p class="muted">Select a weekday.</p><div class="calendar-grid"><div class="dow">Sun</div><div class="dow">Mon</div><div class="dow">Tue</div><div class="dow">Wed</div><div class="dow">Thu</div><div class="dow">Fri</div><div class="dow">Sat</div>${cells}</div><div class="actions"><button class="btn secondary" id="backDentist">Back</button><button class="btn" id="nextTime" ${booking.date?"":"disabled"}>Next: Choose a Time</button></div></div>`;
}
function shiftMonth(amount){const base=booking.date?new Date(`${booking.date}T00:00:00`):new Date();base.setMonth(base.getMonth()+amount,1);booking.date=isoDate(new Date(base.getFullYear(),base.getMonth(),1));renderBooking()}
function chooseDate(value){booking.date=value;renderBooking()}
function stepTime(){
 const slots=["09:00","10:00","11:00","13:00","14:00","15:00"];
 const blocked=appointments().some(a=>a.dentistId===booking.dentistId&&a.date===booking.date&&a.status!=="Cancelled");
 return `<div class="card"><h2>Choose a Time Slot</h2><p class="muted">Available slots for ${esc(fmtDate(booking.date))}.</p>${blocked?'<div class="notice">Some time slots may already be booked. Choose an available slot.</div>':''}<div class="slot-list">${slots.map(t=>`<div class="slot"><div><strong>${fmtTime(t)}</strong> <span class="badge">${serviceById(booking.serviceId||1)?.duration||45} min</span></div><button type="button" class="btn small" data-time="${t}">Select</button></div>`).join("")}</div><div class="actions"><button class="btn secondary" id="backDate">Back</button></div></div>`;
}
function chooseTime(value){booking.time=value;booking.step=4;renderBooking()}
function stepConfirm(){
 const service=serviceById(booking.serviceId||1);const dentist=dentistById(booking.dentistId);
 return `<div class="card"><h2>Confirm Appointment</h2><p class="muted">Review your appointment before saving it.</p><div class="summary"><div class="summary-row"><span>Service</span><strong>${esc(service.name)}</strong></div><div class="summary-row"><span>Dentist</span><strong>${esc(dentist.name)}</strong></div><div class="summary-row"><span>Date</span><strong>${esc(fmtDate(booking.date))}</strong></div><div class="summary-row"><span>Time</span><strong>${esc(fmtTime(booking.time))}</strong></div><div class="summary-row"><span>Clinic</span><strong>123 Main Street, Ortigas-Cainta, Rizal</strong></div><div class="field"><label for="bookingNotes">Notes</label><textarea id="bookingNotes" rows="3" maxlength="300" placeholder="Optional notes"></textarea></div></div><div class="actions"><button class="btn secondary" id="backTime">Back</button><button class="btn" id="confirmAppointment">${booking.editId?"Save Changes":"Confirm Appointment"}</button></div></div>`;
}
function confirmBooking(){
 const user=readSession();
 if(!user||!booking.dentistId||!booking.date||!booking.time)return;
 const list=appointments();
 const notes=document.getElementById("bookingNotes")?.value.trim()||"";
 if(booking.editId){
  const item=list.find(a=>a.id===booking.editId);
  if(item){Object.assign(item,{serviceId:booking.serviceId||1,dentistId:booking.dentistId,date:booking.date,time:booking.time,status:"Pending",notes});saveAppointments(list);showConfirmation(item.id);}
  return;
 }
 const appointment={id:nextId(),userId:user.id,dentistId:booking.dentistId,serviceId:booking.serviceId||1,date:booking.date,time:booking.time,status:"Pending",notes,paid:false,paymentMethod:""};
 list.push(appointment);saveAppointments(list);showConfirmation(appointment.id);
}
function showConfirmation(id){
 const item=appointments().find(a=>a.id===id);if(!item)return;
 const service=serviceById(item.serviceId);const dentist=dentistById(item.dentistId);const box=document.getElementById("booking");
 if(box)box.innerHTML=`<section class="success"><div class="success-icon">✓</div><h1>${booking.editId?"Appointment Updated":"Appointment Saved"}</h1><p class="muted">Thank you for using the SmileWare school prototype.</p><div class="card summary"><div class="summary-row"><span>Doctor</span><strong>${esc(dentist.name)}</strong></div><div class="summary-row"><span>Procedure</span><strong>${esc(service.name)}</strong></div><div class="summary-row"><span>Date</span><strong>${esc(fmtDate(item.date))}</strong></div><div class="summary-row"><span>Time</span><strong>${esc(fmtTime(item.time))}</strong></div><div class="summary-row"><span>Status</span><strong class="status ${statusClass(item.status)}">${esc(item.status)}</strong></div><div class="actions"><button class="btn secondary" id="bookAnother">Book another</button><button class="btn" id="manageBooking">Manage My Booking</button></div></div></section>`;
 booking.editId=null;renderAppointments();
 document.getElementById("bookAnother")?.addEventListener("click",()=>startBooking());
 document.getElementById("manageBooking")?.addEventListener("click",exitBooking);
}
function renderAppointments(){
 const box=document.getElementById("patientAppointments");if(!box)return;const user=readSession();if(!user)return;
 const list=appointments().filter(a=>a.userId===user.id).sort((a,b)=>b.date.localeCompare(a.date));
 const count=document.getElementById("appointmentCount");if(count)count.textContent=`${list.length} appointment${list.length===1?"":"s"}`;
 box.innerHTML=list.length?list.map(item=>{const service=serviceById(item.serviceId);const dentist=dentistById(item.dentistId);return `<article class="card"><div class="appointment-top"><strong>${esc(service?.name||"Dental Service")}</strong><span class="status ${statusClass(item.status)}">${esc(item.status)}</span></div><p class="muted">${esc(dentist?.name||"Dentist")}<br>${esc(fmtDate(item.date))} at ${esc(fmtTime(item.time))}</p><div class="actions-left"><button type="button" class="btn small secondary" data-reschedule="${item.id}">Reschedule</button>${!["Cancelled","Complete"].includes(item.status)?`<button type="button" class="btn small secondary" data-cancel="${item.id}">Cancel</button>`:""}</div></article>`}).join(""):'<div class="card"><strong>No appointments yet.</strong><p class="muted">Book your first dental appointment above.</p></div>';
 box.querySelectorAll("[data-reschedule]").forEach(button=>button.addEventListener("click",()=>reschedule(Number(button.dataset.reschedule))));
 box.querySelectorAll("[data-cancel]").forEach(button=>button.addEventListener("click",()=>cancelAppointment(Number(button.dataset.cancel))));
}
function cancelAppointment(id){if(!window.confirm("Cancel this appointment?"))return;const list=appointments();const item=list.find(a=>a.id===id);if(item)item.status="Cancelled";saveAppointments(list);renderAppointments()}
function reschedule(id){const item=appointments().find(a=>a.id===id);if(!item)return;booking={serviceId:item.serviceId,dentistId:item.dentistId,date:item.date,time:item.time,step:1,editId:id};document.getElementById("home").style.display="none";document.getElementById("booking").style.display="block";renderBooking()}

function initAdmin(){
 if(!requireAccess("admin.html"))return;
 const user=readSession();
 document.querySelectorAll("[data-admin-name]").forEach(el=>el.textContent=user.fullname);
 document.querySelectorAll("[data-page]").forEach(link=>link.addEventListener("click",event=>{event.preventDefault();document.querySelectorAll("[data-page]").forEach(x=>x.classList.remove("active"));link.classList.add("active");renderAdmin(link.dataset.page)}));
 renderAdmin("dashboard");
}
function renderAdmin(page){
 const title=document.getElementById("pageTitle");if(title)title.textContent=page==="schedule"?"My Schedule":page.charAt(0).toUpperCase()+page.slice(1);
 const el=document.getElementById("adminContent");if(!el)return;const list=appointments();const today=isoDate(new Date());
 if(page==="dashboard"){
  const todayApps=list.filter(a=>a.date===today);const pending=list.filter(a=>a.status==="Pending").length;const noShow=list.filter(a=>a.status==="No-show").length;
  el.innerHTML=`<div class="stats"><div class="stat"><small>Today's Appointments</small><strong>${todayApps.length}</strong></div><div class="stat"><small>Confirmed Today</small><strong>${todayApps.filter(a=>a.status==="Confirmed").length}</strong></div><div class="stat"><small>Pending</small><strong>${pending}</strong></div><div class="stat"><small>No-show</small><strong>${noShow}</strong></div></div><div class="card section-card"><div class="toolbar"><h3>Appointments</h3><input class="field search" id="apptSearch" maxlength="50" placeholder="Search patient..."></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Patient</th><th>Service</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead><tbody id="apptRows">${adminRows(list)}</tbody></table></div></div>`;
  document.getElementById("apptSearch")?.addEventListener("input",event=>filterAdminAppointments(event.target.value));
 }else if(page==="calendar")renderCalendar(el,list);
 else if(page==="schedule")el.innerHTML=`<div class="card section-card"><h3>My Schedule</h3><p class="muted">Assigned appointments for Dr. Kevin Lee in this prototype.</p><div class="table-wrap"><table class="data-table"><thead><tr><th>Patient</th><th>Service</th><th>Date</th><th>Time</th><th>Status</th></tr></thead><tbody>${adminRows(list.filter(a=>a.dentistId===3),false)}</tbody></table></div></div>`;
 else if(page==="patients")renderPatients(el);
 else if(page==="billing")renderBilling(el);
 else el.innerHTML=`<div class="card section-card"><h3>Settings</h3><p class="muted">Synchronized Digital Scheduling</p><label class="switch"><input id="syncToggle" type="checkbox" ${localStorage.getItem(KEYS.sync)!=="false"?"checked":""}><span>Enabled</span></label><div class="prototype-warning">School prototype: data is stored in this browser only. Do not use real patient or payment information.</div></div>`;
 document.getElementById("syncToggle")?.addEventListener("change",event=>localStorage.setItem(KEYS.sync,String(event.target.checked)));
}
function adminRows(list,actions=true){return list.map(item=>{const user=userById(item.userId);const service=serviceById(item.serviceId);const dentist=dentistById(item.dentistId);return `<tr><td>${esc(user?.fullname||"Unknown")}</td><td>${esc(service?.name||"Dental")}</td><td>${esc(dentist?.name||"-")}</td><td>${esc(fmtDate(item.date))}</td><td>${esc(fmtTime(item.time))}</td><td><span class="status ${statusClass(item.status)}">${esc(item.status)}</span></td><td>${actions?`<select data-status-id="${item.id}"><option value="Pending" ${item.status==="Pending"?"selected":""}>Pending</option><option value="Confirmed" ${item.status==="Confirmed"?"selected":""}>Confirmed</option><option value="Arrived" ${item.status==="Arrived"?"selected":""}>Arrived</option><option value="In Chair" ${item.status==="In Chair"?"selected":""}>In Chair</option><option value="Complete" ${item.status==="Complete"?"selected":""}>Complete</option><option value="No-show" ${item.status==="No-show"?"selected":""}>No-show</option><option value="Cancelled" ${item.status==="Cancelled"?"selected":""}>Cancelled</option></select>`:""}</td></tr>`}).join("")||'<tr><td colspan="7">No appointments found.</td></tr>'}
function bindStatusHandlers(){document.querySelectorAll("[data-status-id]").forEach(select=>select.addEventListener("change",()=>setStatus(Number(select.dataset.statusId),select.value)))}
function filterAdminAppointments(query){const q=query.trim().toLowerCase();const list=appointments().filter(item=>(userById(item.userId)?.fullname||"").toLowerCase().includes(q));const rows=document.getElementById("apptRows");if(rows){rows.innerHTML=adminRows(list);bindStatusHandlers()}}
function setStatus(id,status){const list=appointments();const item=list.find(a=>a.id===id);if(item)item.status=status;saveAppointments(list);renderAdmin("dashboard");bindStatusHandlers()}
function renderCalendar(el,list){const grouped={};list.forEach(item=>(grouped[item.date]??=[]).push(item));const dates=Object.keys(grouped).sort();el.innerHTML=`<div class="card section-card"><h3>Appointment Calendar</h3><p class="muted">Upcoming dates with appointments.</p>${dates.length?dates.map(date=>`<div class="calendar-entry"><strong>${esc(fmtDate(date))}</strong><div class="muted small-text">${grouped[date].map(item=>`${esc(fmtTime(item.time))} — ${esc(userById(item.userId)?.fullname||"Patient")} — ${esc(serviceById(item.serviceId)?.name||"")}`).join("<br>")}</div></div>`).join(""):'<p class="muted">No appointments available.</p>'}</div>`}
function renderPatients(el){const patients=readLocal(KEYS.users,[]).filter(user=>user.role==="patient");el.innerHTML=`<div class="card section-card"><div class="toolbar"><h3>Patient Records</h3><input class="field search" id="patientSearch" maxlength="50" placeholder="Search patient..."></div><div id="patientList">${patientRows(patients)}</div></div>`;document.getElementById("patientSearch")?.addEventListener("input",event=>filterPatients(event.target.value))}
function patientRows(patients){return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Visits</th><th>Latest Status</th></tr></thead><tbody>${patients.map(user=>{const as=appointments().filter(item=>item.userId===user.id).sort((a,b)=>b.date.localeCompare(a.date));const latest=as[0];return `<tr><td>${esc(user.fullname)}</td><td>${esc(user.email)}</td><td>${esc(user.phone||"-")}</td><td>${as.length}</td><td>${latest?`<span class="status ${statusClass(latest.status)}">${esc(latest.status)}</span>`:"-"}</td></tr>`}).join("")||'<tr><td colspan="5">No patients found.</td></tr>'}</tbody></table></div>`}
function filterPatients(query){const q=query.trim().toLowerCase();const patients=readLocal(KEYS.users,[]).filter(user=>user.role==="patient"&&user.fullname.toLowerCase().includes(q));const el=document.getElementById("patientList");if(el)el.innerHTML=patientRows(patients)}
function renderBilling(el){const list=appointments();el.innerHTML=`<div class="card section-card"><h3>Billing & Payment Tracking</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Patient</th><th>Service</th><th>Price</th><th>Date</th><th>Payment</th><th>Action</th></tr></thead><tbody>${list.map(item=>{const user=userById(item.userId);const service=serviceById(item.serviceId);return `<tr><td>${esc(user?.fullname||"")}</td><td>${esc(service?.name||"")}</td><td>₱${(service?.price||0).toLocaleString()}</td><td>${esc(fmtDate(item.date))}</td><td><span class="status ${item.paid?"Paid":"Pending"}">${item.paid?"Paid":"Pending"}</span></td><td>${item.paid?"<span class=\"muted\">Recorded</span>":`<button type="button" class="btn small" data-paid="${item.id}">Mark Paid</button>`}</td></tr>`}).join("")||'<tr><td colspan="6">No billing records found.</td></tr>'}</tbody></table></div></div>`;el.querySelectorAll("[data-paid]").forEach(button=>button.addEventListener("click",()=>markPaid(Number(button.dataset.paid))))}
function markPaid(id){const list=appointments();const item=list.find(a=>a.id===id);if(item){item.paid=true;item.paymentMethod="Cash"}saveAppointments(list);renderAdmin("billing")}

function bindBookingEvents(){
 document.getElementById("booking")?.addEventListener("click",event=>{
  const target=event.target.closest("[data-dentist],[data-date],[data-time]");
  if(target?.dataset.dentist)chooseDentist(Number(target.dataset.dentist));
  if(target?.dataset.date)chooseDate(target.dataset.date);
  if(target?.dataset.time)chooseTime(target.dataset.time);
  const id=event.target.id;
  if(id==="nextDate")nextStep(2);
  if(id==="backDentist")nextStep(1);
  if(id==="nextTime")nextStep(3);
  if(id==="backDate")nextStep(2);
  if(id==="prevMonth")shiftMonth(-1);
  if(id==="nextMonth")shiftMonth(1);
  if(id==="backTime")nextStep(3);
  if(id==="confirmAppointment")confirmBooking();
 });
}
function nextStep(step){
 if(step===2&&!booking.dentistId){window.alert("Please choose a dentist.");return}
 if(step===3&&!booking.date){window.alert("Please choose a date.");return}
 booking.step=step;renderBooking();
}

function init(){
 seed();
 bindBookingEvents();
 const page=location.pathname.split("/").pop()||"index.html";
 if(page==="index.html")initHome();
 if(page==="login.html")initLogin();
 if(page==="register.html")initRegister();
 if(page==="patient.html")initPatient();
 if(page==="admin.html")initAdmin();
 document.querySelectorAll("[data-logout]").forEach(button=>button.addEventListener("click",logout));
 if(page==="admin.html")bindStatusHandlers();
}

document.addEventListener("DOMContentLoaded",init);
