const $ = (id) => document.getElementById(id);
const screens = ["welcomeScreen","registerScreen","loginScreen","introScreen","profileScreen","dashboardScreen","featureScreen"];
const STORE_KEY = "pec_demo_account_v1";
let currentUser = null;
let cameraStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordedUrl = null;
let recordingTimer = null;
let recordingSeconds = 0;
let profilePhotoData = "";
let introVideoSaved = false;

function getStoredAccount(){ try{return JSON.parse(localStorage.getItem(STORE_KEY)||"null")}catch(e){return null} }
function saveAccount(account){localStorage.setItem(STORE_KEY,JSON.stringify(account));}
function showScreen(id){
  screens.forEach(s=>$(s).classList.toggle("active",s===id));
  $("logoutBtn").classList.toggle("hidden",!currentUser || id==="welcomeScreen");
  window.scrollTo({top:0,behavior:"smooth"});
}
function toast(message){
  const t=$("toast");t.textContent=message;t.classList.add("show");
  clearTimeout(toast._timer);toast._timer=setTimeout(()=>t.classList.remove("show"),2800);
}
function normalise(value){return (value||"").trim().toLowerCase()}
function accountIdentity(account){return normalise(account.phone)===normalise($("loginIdentity").value)||normalise(account.email)===normalise($("loginIdentity").value)}
function openIntro(){stopCamera();showScreen("introScreen")}
function updateDashboard(){
  if(!currentUser)return;
  $("dashName").textContent=(currentUser.displayName||currentUser.fullName||"friend").split(" ")[0];
  $("dashAvatar").textContent=(currentUser.displayName||currentUser.fullName||"P").charAt(0).toUpperCase();
  if(currentUser.photo){$("dashAvatar").style.backgroundImage=`url(${currentUser.photo})`;$("dashAvatar").textContent=""}
  $("accountStatus").textContent=currentUser.profileSaved?"Profile saved on this device":"Demo account created";
}
function setProfileForm(){
  $("profileName").value=currentUser?.displayName||currentUser?.fullName||"";
  $("profileProvince").value=currentUser?.province||"";
  $("profileBio").value=currentUser?.bio||"";
  profilePhotoData=currentUser?.photo||"";
  if(profilePhotoData){$("avatarPreview").style.backgroundImage=`url(${profilePhotoData})`;$("avatarPreview").textContent=""}
  else{$("avatarPreview").style.backgroundImage="";$("avatarPreview").textContent="＋"}
}
function continueToProfile(){stopCamera();setProfileForm();showScreen("profileScreen")}
function openDashboard(){updateDashboard();showScreen("dashboardScreen")}
function stopCamera(){
  if(mediaRecorder && mediaRecorder.state==="recording"){try{mediaRecorder.stop()}catch(e){}}
  if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null}
  $("cameraPreview").srcObject=null;
  $("cameraPreview").classList.add("hidden");
  $("cameraPlaceholder").classList.remove("hidden");
  $("startCamera").textContent="Open camera";
  $("startRecord").disabled=true;
  if(recordingTimer){clearInterval(recordingTimer);recordingTimer=null}
}
$("brandHome").addEventListener("click",()=>currentUser?openDashboard():showScreen("welcomeScreen"));
$("showRegister").addEventListener("click",()=>showScreen("registerScreen"));
$("showLogin").addEventListener("click",()=>showScreen("loginScreen"));
$("registerToLogin").addEventListener("click",()=>showScreen("loginScreen"));
$("loginToRegister").addEventListener("click",()=>showScreen("registerScreen"));

$("registerForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const name=$("regName").value.trim(), phone=$("regPhone").value.trim(), email=$("regEmail").value.trim(), password=$("regPassword").value;
  if(password.length<8){toast("Use a password with at least 8 characters.");return}
  if(password!==$("regConfirm").value){toast("Your passwords do not match.");return}
  const old=getStoredAccount();
  if(old && (normalise(old.phone)===normalise(phone) || (email && normalise(old.email)===normalise(email)))){
    toast("An account with these details exists on this device. Please log in.");showScreen("loginScreen");return;
  }
  currentUser={fullName:name,displayName:name,phone,email,password,createdAt:new Date().toISOString(),profileSaved:false,province:"",bio:"",photo:"",introText:"",introSubmitted:false};
  saveAccount(currentUser);
  $("introText").value="";$("introCount").textContent="0";
  openIntro();
  toast("Account created on this device.");
});
$("loginForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const account=getStoredAccount();
  if(!account){toast("No demo account found on this device. Create an account first.");return}
  if(!accountIdentity(account)||account.password!==$("loginPassword").value){toast("Those details do not match the saved demo account.");return}
  currentUser=account;
  if(!currentUser.introSubmitted)openIntro();
  else if(!currentUser.profileSaved)continueToProfile();
  else openDashboard();
});
$("logoutBtn").addEventListener("click",()=>{stopCamera();currentUser=null;$("loginPassword").value="";showScreen("welcomeScreen");toast("You have logged out of this demo.");});

$("startCamera").addEventListener("click",async()=>{
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    toast("Camera access needs HTTPS or localhost. Open this project through a local server.");return;
  }
  try{
    stopCamera();
    cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:true});
    $("cameraPreview").srcObject=cameraStream;
    $("cameraPreview").classList.remove("hidden");
    $("cameraPlaceholder").classList.add("hidden");
    $("startCamera").textContent="Camera ready";
    $("startRecord").disabled=false;
    $("cameraStatus").textContent="Camera ready. When you are comfortable, tap Record.";
  }catch(err){
    $("cameraStatus").textContent="Camera permission was not granted or the camera is unavailable.";
    toast("Please allow camera and microphone access, then try again.");
  }
});
$("startRecord").addEventListener("click",()=>{
  if(!cameraStream)return;
  if(!window.MediaRecorder){toast("Video recording is not supported by this browser.");return}
  recordedChunks=[];recordingSeconds=0;
  try{
    const options=MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")?{mimeType:"video/webm;codecs=vp8,opus"}:{};
    mediaRecorder=new MediaRecorder(cameraStream,options);
    mediaRecorder.ondataavailable=(event)=>{if(event.data&&event.data.size)recordedChunks.push(event.data)};
    mediaRecorder.onstop=()=>{
      const blob=new Blob(recordedChunks,{type:mediaRecorder.mimeType||"video/webm"});
      if(recordedUrl)URL.revokeObjectURL(recordedUrl);
      recordedUrl=URL.createObjectURL(blob);
      $("recordedVideo").src=recordedUrl;
      $("recordedVideo").classList.remove("hidden");
      $("cameraStatus").textContent="Recording ready for review. It has not been uploaded.";
      $("startRecord").disabled=false;$("startRecord").textContent="● Record again";
      $("stopRecord").classList.add("hidden");$("recordingPill").classList.add("hidden");
      stopCamera();
    };
    mediaRecorder.start();
    $("startRecord").disabled=true;$("stopRecord").classList.remove("hidden");$("recordingPill").classList.remove("hidden");
    $("cameraStatus").textContent="Recording. Keep it under 60 seconds.";
    recordingTimer=setInterval(()=>{
      recordingSeconds++;
      $("recordTimer").textContent=`00:${String(recordingSeconds).padStart(2,"0")}`;
      if(recordingSeconds>=60 && mediaRecorder?.state==="recording")mediaRecorder.stop();
    },1000);
  }catch(err){toast("Could not start recording. Try again.");}
});
$("stopRecord").addEventListener("click",()=>{if(mediaRecorder&&mediaRecorder.state==="recording")mediaRecorder.stop()});
$("introText").addEventListener("input",()=>{$("introCount").textContent=$("introText").value.length});
$("submitIntro").addEventListener("click",()=>{
  const text=$("introText").value.trim();
  if(!text && !recordedUrl){toast("Please record a short video, write an introduction, or choose Do this later.");return}
  if(!currentUser){toast("Please create an account first.");return}
  currentUser.introText=text;
  currentUser.introSubmitted=true;
  currentUser.introVideoRecorded=!!recordedUrl;
  saveAccount(currentUser);
  stopCamera();continueToProfile();toast("Introduction saved in this demo.");
});
$("skipIntro").addEventListener("click",()=>{
  if(!currentUser)return;
  currentUser.introSubmitted=true;currentUser.introSkipped=true;currentUser.introText="";
  saveAccount(currentUser);stopCamera();continueToProfile();
  toast("You can add an introduction later.");
});
$("profilePhoto").addEventListener("change",(e)=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>2*1024*1024){toast("Choose an image smaller than 2 MB.");e.target.value="";return}
  const reader=new FileReader();
  reader.onload=()=>{profilePhotoData=reader.result;$("avatarPreview").style.backgroundImage=`url(${profilePhotoData})`;$("avatarPreview").textContent=""};
  reader.readAsDataURL(file);
});
$("profileForm").addEventListener("submit",(e)=>{
  e.preventDefault();if(!currentUser)return;
  currentUser.displayName=$("profileName").value.trim();
  currentUser.province=$("profileProvince").value;
  currentUser.bio=$("profileBio").value.trim();
  currentUser.photo=profilePhotoData;
  currentUser.profileSaved=true;
  saveAccount(currentUser);openDashboard();toast("Profile saved on this device.");
});

const featureData={
 earning:{eyebrow:"EXPLORE OPTIONS",title:"Earning opportunities",description:"Research legitimate ways to earn online.",cards:[
  ["Start with your skills","List what you can already do, such as writing, design, translation, tutoring, or video editing. Match opportunities to your skills."],
  ["Check before joining","Read the platform's official terms, country eligibility, minimum payout, fees, and payment methods before investing time."],
  ["Scam warning","Avoid offers that guarantee income, pressure you to pay to unlock a job, or ask for your password, PIN, or one-time code."]]},
 affiliate:{eyebrow:"PROMOTE RESPONSIBLY",title:"Affiliate marketing",description:"Learn how referral links and commissions work.",cards:[
  ["How it works","An affiliate program may pay a commission when someone makes an eligible purchase through your tracked link. Rates and rules vary by program."],
  ["Your first steps","Choose a topic you understand, review the program's country rules and payout methods, then make honest content that explains the product."],
  ["Be transparent","Tell your audience when a post contains an affiliate link. Never promise results you cannot verify."]]},
 jobs:{eyebrow:"REMOTE WORK",title:"Online jobs",description:"Build a realistic path toward remote work.",cards:[
  ["Skills to develop","Explore customer support, writing, data entry, design, video editing, translation, and virtual assistance."],
  ["Prepare a portfolio","Create two or three sample projects that show your ability. Do not include private information from other people."],
  ["Protect yourself","A real employer should explain the role, payment, and contract. Be careful with fake cheques, reshipping requests, and upfront recruitment fees."]]},
 learn:{eyebrow:"BUILD YOUR SKILLS",title:"Learn to earn",description:"Use free learning to improve your options.",cards:[
  ["Digital basics","Practise email, online safety, document editing, file management, and clear communication."],
  ["Create something","Build a small portfolio item: a sample poster, short video, article, or simple webpage."],
  ["Keep learning","Set one small weekly goal and track your progress. Skills take time; income is not guaranteed."]]},
 introduction:{eyebrow:"YOUR INTRODUCTION",title:"My introduction",description:"Check the introduction details saved in this demo.",cards:[]},
 profile:{eyebrow:"ACCOUNT DETAILS",title:"My profile",description:"Review or update your profile.",cards:[]}
};
function openFeature(key){
  const data=featureData[key];if(!data)return;
  $("featureEyebrow").textContent=data.eyebrow;$("featureTitle").textContent=data.title;$("featureDescription").textContent=data.description;
  const content=$("featureContent");content.innerHTML="";
  if(key==="profile"){
    const card=document.createElement("div");card.className="info-card";
    const p=currentUser?.province||"Not set";
    card.innerHTML=`<span class="pill">YOUR PROFILE</span><h3>${escapeHtml(currentUser?.displayName||currentUser?.fullName||"User")}</h3><p>Province: ${escapeHtml(p)}<br>Skills: ${escapeHtml(currentUser?.bio||"Not added yet")}</p>`;
    content.appendChild(card);
    const btn=document.createElement("button");btn.className="button primary full";btn.textContent="Edit profile";btn.onclick=()=>{setProfileForm();showScreen("profileScreen")};content.appendChild(btn);
  }else if(key==="introduction"){
    const card=document.createElement("div");card.className="info-card";
    card.innerHTML=`<span class="pill">${currentUser?.introSubmitted?"SAVED IN DEMO":"NOT SUBMITTED"}</span><h3>Your written introduction</h3><p>${escapeHtml(currentUser?.introText||"No written introduction saved.")}</p><p style="margin-top:10px">Video recording: ${currentUser?.introVideoRecorded?"Recorded in this browser session; not uploaded":"No video saved to a server."}</p>`;
    content.appendChild(card);
    const btn=document.createElement("button");btn.className="button primary full";btn.textContent="Add or update introduction";btn.onclick=()=>{ $("introText").value=currentUser?.introText||"";$("introCount").textContent=$("introText").value.length;openIntro()};content.appendChild(btn);
  }else{
    data.cards.forEach((item,i)=>{
      const card=document.createElement("article");card.className="info-card";
      card.innerHTML=`<span class="pill">GUIDE ${String(i+1).padStart(2,"0")}</span><h3>${escapeHtml(item[0])}</h3><p>${escapeHtml(item[1])}</p>`;
      content.appendChild(card);
    });
    const warning=document.createElement("div");warning.className="warning-box";warning.textContent="This demo provides general guidance only. Verify every opportunity independently, especially whether people in Papua New Guinea are eligible and how payments are made.";content.appendChild(warning);
  }
  showScreen("featureScreen");
}
function escapeHtml(str){return String(str??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
document.querySelectorAll(".feature-card").forEach(btn=>btn.addEventListener("click",()=>openFeature(btn.dataset.feature)));
$("backDashboard").addEventListener("click",openDashboard);
document.querySelectorAll("[data-nav]").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll("[data-nav]").forEach(b=>b.classList.toggle("selected",b===btn));
  if(btn.dataset.nav==="profile")openFeature("profile");
  else if(btn.dataset.nav==="opportunities")openFeature("earning");
  else openDashboard();
}));

// Restore a saved demo session only when the user chooses to log in; never auto-sign in.
const saved=getStoredAccount();
if(saved){
  $("loginIdentity").value=saved.phone||saved.email||"";
  $("loginIdentity").placeholder="Saved demo account available";
}
showScreen("welcomeScreen");
