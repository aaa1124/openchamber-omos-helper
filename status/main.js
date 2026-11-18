(()=>{var u="openchamber.sdk",E=1;var et=`
:root {
  /* Quiet at rest like the app's own thumbs; hover gives a clear grab target. */
  --oc-scrollbar-thumb: color-mix(in srgb, var(--oc-muted, currentColor) 18%, transparent);
  --oc-scrollbar-thumb-hover: color-mix(in srgb, var(--oc-muted, currentColor) 36%, transparent);
  scrollbar-gutter: stable;
}
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
:hover, [data-oc-scrolling] {
  scrollbar-color: var(--oc-scrollbar-thumb) transparent;
}
/* Chromium's standard scrollbar properties otherwise override its pseudo-elements. */
@supports selector(::-webkit-scrollbar) {
  *, :hover, [data-oc-scrolling] { scrollbar-width: auto; scrollbar-color: auto; }
  ::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
  }
  :hover::-webkit-scrollbar-thumb, [data-oc-scrolling]::-webkit-scrollbar-thumb { background: var(--oc-scrollbar-thumb); }
  ::-webkit-scrollbar-thumb:hover { background: var(--oc-scrollbar-thumb-hover); }
  ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
}
@media (forced-colors: active) {
  *, :hover, [data-oc-scrolling] { scrollbar-color: auto; }
  ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb:hover { background: CanvasText; }
}
`;function eo(e){let r=e.documentElement;if(r.hasAttribute("data-oc-scrollbar-activity"))return;r.setAttribute("data-oc-scrollbar-activity","");let s=new WeakMap;e.addEventListener("scroll",(T)=>{let p=T.target===e?r:T.target;if(!(p instanceof Element))return;if(!p.hasAttribute("data-oc-scrolling"))p.setAttribute("data-oc-scrolling","");let f=s.get(p);if(f!==void 0)clearTimeout(f);s.set(p,setTimeout(()=>{s.delete(p),p.removeAttribute("data-oc-scrolling")},1000))},{capture:!0,passive:!0})}var Wo=`(${eo.toString()})(document);`;var tt=128,ot=65536;var ge=128;var be=65536;var no=/^[a-z][a-z0-9-]{0,39}$/;var to=(e)=>Object(e)===e&&!Array.isArray(e),rt=(e,r)=>Object.keys(e).every((s)=>r.includes(s)),oo=(e)=>String(e)===e&&e.length>=1&&e.length<=60,ro=(e)=>String(e)===e&&e.length>=1&&e.length<=80,so=(e)=>{if(!Array.isArray(e)||e.length>4)return!1;let r=new Set;for(let s of e){if(!to(s)||!no.test(s.id)||!oo(s.label))return!1;if(s.disabled!==void 0&&s.disabled!==!0&&s.disabled!==!1)return!1;if(r.has(s.id))return!1;if(r.add(s.id),s.kind==="button"){if(!rt(s,["kind","id","label","disabled"]))return!1;continue}if(s.kind!=="select"||!rt(s,["kind","id","label","value","options","disabled"]))return!1;if(!ro(s.value)||!Array.isArray(s.options)||s.options.length<1||s.options.length>16)return!1;let T=new Set;for(let p of s.options){if(!to(p)||!rt(p,["value","label"])||!ro(p.value)||!oo(p.label)||T.has(p.value))return!1;T.add(p.value)}if(!T.has(s.value))return!1}return!0};var io=["{id}","{segment}","{segments+}"];var Ir=new Set(io);var ao=["turn-finished","turn-failed","permission-asked","question-asked","turn-started","session-created","session-archived","session-deleted"];var gr=new Set(ao);var Ce=20000000,ke=256;var nt=(e)=>("bytes"in e)?e.bytes.byteLength:e.content.length,co=(e,r)=>{if(e.path!==r.path||e.readOnly!==r.readOnly)return!1;if(e.encoding==="text"||r.encoding==="text")return e.encoding==="text"&&r.encoding==="text"&&e.content===r.content;if(e.bytes.byteLength!==r.bytes.byteLength)return!1;for(let s=0;s<e.bytes.byteLength;s+=1)if(e.bytes[s]!==r.bytes[s])return!1;return!0};var lo=/^[A-Za-z0-9_-]{1,80}$/;var _o=["left","right","top","bottom"];var po=(e,r=0,s={remaining:16000})=>{if(--s.remaining<0||r>=32)return!1;if(e===null)return!0;let T=Array.isArray(e)?e:Object(e)===e?Object.values(e):[];for(let p of T)if(!po(p,r+1,s))return!1;return!0},st=(e)=>{if(e===null||e===!0||e===!1)return!0;if(Array.isArray(e))return Object.keys(e).every((r)=>/^(0|[1-9]\d*)$/.test(r)&&Number(r)<e.length)&&e.every(st);if(Object(e)===e){let r=Object.getPrototypeOf(e);return(r===null||r===Object.prototype)&&Object.values(e).every(st)}return String(e)===e||Number.isFinite(e)},it=(e)=>{try{if(String(e.id)!==e.id||!lo.test(e.id)||!Number.isFinite(e.anchor.x)||Math.abs(e.anchor.x)>1e5||!Number.isFinite(e.anchor.y)||Math.abs(e.anchor.y)>1e5||!Number.isFinite(e.anchor.width)||!Number.isFinite(e.anchor.height)||e.anchor.width<=0||e.anchor.height<=0||e.anchor.width>1e5||e.anchor.height>1e5||!Number.isInteger(e.width)||e.width<160||e.width>640||!Number.isInteger(e.height)||e.height<48||e.height>480||e.side!==void 0&&!_o.includes(e.side)||e.focus!==void 0&&e.focus!==!0&&e.focus!==!1||!po(e.data)||!st(e.data))return!1;return JSON.stringify(e.data).length<=16000}catch{return!1}};var ct=2000;var Eo=["file","directory","other","missing"],dt=(e)=>Boolean(e&&"sessionId"in e),lt=(e)=>Boolean(e&&"sent"in e&&!("sessionId"in e));var To=/^[0-9a-f]{7,64}$/i,_t=(e)=>To.test(e),Ue=500,Me=32000,So=16000,fo=128,Ao=200,Oo=2000,Ro=16000,ho=80,mo=200,Io=16000;var xo=2000;var pt=20000,Ne=1024,ye=2000000;var ve=64000,Le=8000,ut=4000;var Et=960000;var go=999,bo=1e4,Ee=500,Co=["HOST_UNAVAILABLE","HOST_TIMEOUT","HOST_REJECTED","DISCONNECTED","DISABLED","BAD_PATH","NO_INTEGRATION","NO_SERVICE","SERVICE_FAILED","REQUEST_FAILED","RESPONSE_TOO_LARGE","NO_SESSION","SESSION_BUSY","NOT_GRANTED","NO_DIRECTORY","NOT_FOUND","FILE_TOO_LARGE","DENIED","NO_MODEL","MODEL_FAILED","UNSUPPORTED"],ko=["stopped","starting","ready","failed"],zo=new Set(Co),Uo=(e)=>zo.has(e),Mo=(e)=>e&&Uo(e)?e:"HOST_REJECTED",ee=(e)=>{if(e===void 0)return!1;if(e===null||e===!0||e===!1)return!0;if(String(e)===e)return!0;if(Number(e)===e)return Number.isFinite(e);if(Array.isArray(e))return e.every(ee);if(Object(e)===e)return Object.values(e).every(ee);return!1},No=(e)=>ee(e)&&JSON.stringify(e).length<=Io,uo=(e)=>e?.trim().slice(0,mo)??"",te=(e)=>{let r=e.id.trim().slice(0,fo),s=e.title.trim().slice(0,Ao),T=e.url.trim().slice(0,Oo),p=e.text?.trim().slice(0,Ro),f=e.author?.trim().slice(0,ho),B=e.kind==="pull"?"pull":"issue",w={providerId:e.providerId.trim(),id:r,title:s||r,url:T,kind:B};if(p)w.text=p;if(f)w.author=f;if(B==="pull"){let K=uo(e.branches?.head),W=uo(e.branches?.base);if(K&&W)w.branches={head:K,base:W}}if(No(e.data))w.data=e.data;return w},Tt=(e)=>{let r=te(e);if(e.projectId)r.projectId=e.projectId;if(e.navigation)r.navigation=e.navigation;if(e.worktree)r.worktree=e.worktree;return r},St=(e)=>{let r={text:e.text.trim().slice(0,So)};if(e.send)r.send=!0;return r},ft=(e)=>{if(e===null||!Number.isFinite(e))return null;return Math.min(go,Math.max(0,Math.round(e)))},At=(e)=>{if(!Number.isFinite(e))return 0;return Math.min(bo,Math.max(0,Math.ceil(e)))};var oe=(e)=>e.length>0&&e.length<=Ne&&!e.includes("\x00")&&!e.includes("\\");var Pe=(e)=>{if(!e.startsWith("/")||e.includes("\x00")||e.includes("\\")||e.includes("://"))return!1;if(e.length>xo)return!1;return!e.split("/").some((s)=>s==="."||s==="..")},Yo=new Set(ko),Ot=(e)=>Boolean(e&&"status"in e&&Yo.has(String(e.status))&&!("body"in e)),we=(e)=>Boolean(e&&"status"in e&&"body"in e&&Number.isInteger(e.status)),Rt=(e)=>Boolean(e&&"content"in e&&String(e.content)===e.content),ht=(e)=>Boolean(e&&"written"in e&&e.written===!0),mt=(e)=>Boolean(e&&"entries"in e&&Array.isArray(e.entries)),Jo=new Set(Eo),It=(e)=>Boolean(e&&"kind"in e&&"size"in e&&Jo.has(String(e.kind))&&Number.isFinite(e.size)),xt=(e)=>Boolean(e&&"text"in e&&String(e.text)===e.text&&!("status"in e)),Qo=new Set(["workspace","shells","ready","directory","session","connection","settings","session-lifecycle","item","resolve","action","service-event","status-control-event","popover-closed","file-open","file-snapshot","file-saved","generate-late"]),Zo=(e)=>Object(e)===e?e:null,at=(e)=>String(e)===e&&e.length>0,qo=(e)=>{if(!at(e.id))return null;if(e.ok===!0){let r={channel:u,v:E,type:"result",id:e.id,ok:!0};if(Object(e.payload)===e.payload)r.payload=e.payload;return r}if(e.ok===!1&&at(e.error))return{channel:u,v:E,type:"result",id:e.id,ok:!1,error:e.error,code:Mo(at(e.code)?e.code:void 0)};return null},gt=(e)=>{let r=Zo(e);if(!r||r.channel!==u||r.v!==E)return null;if(r.type==="result")return qo(r);if(!Qo.has(String(r.type))||Object(r.payload)!==r.payload)return null;return r};var yo=(e)=>("key"in e)&&("metaKey"in e)&&("ctrlKey"in e),er=(e)=>(e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey&&e.key.toLowerCase()==="s";class c extends Error{code;constructor(e,r){super(r);this.name="HostRequestError",this.code=e}}var vo=()=>Promise.reject(new c("BAD_PATH",'Request path must start with "/" and stay on the declared origin.')),Ge=()=>Promise.reject(new c("BAD_PATH",`File path must be 1 to ${Ne} characters without NUL or backslash.`)),De=(e)=>{if(e===void 0)return;if(Object(e)!==e||Array.isArray(e)||e.scope!==void 0&&e.scope!=="instance"&&e.scope!=="device")throw new c("HOST_REJECTED",'Storage scope must be "instance" or "device".');return e.scope==="device"?"device":void 0},_=(e)=>(e.value+=1,`oc-${e.value}`),bt=(e={})=>{let r=e.target??("window"in globalThis?window:null);if(!r)throw new c("HOST_UNAVAILABLE","No window. connectHost runs in a browser frame.");let s=e.acceptSource??((t)=>t===r.parent),T=e.requestTimeoutMs??pt,p=new Set,f=new Set,B=new Set,w=new Set,K=new Set,W=new Set,ae=new Set,Se=new Set,fe=new Set,Ae=new Set,Oe=new Set,J=new Set,Ye=[],ce=null,de=null,Re=new Set,he=new Set,le=null,_e=null,Je=!1,Q=new Map,Z=new Map,q=new Map,D=!1,l={value:0},d=null,X=null,pe=!1,ue=!1,Ht=null,Ft=(t)=>{if(!t)return null;return{sessionId:t.id,phase:t.busy?"started":"completed"}},L=(t)=>{r.parent.postMessage(t,"*")},Bt=()=>{if(D||r.parent===r||J.size===0||d?.features?.lateGenerateResults!==!0)return;L({channel:u,v:E,type:"generate-late-listen"})},R=(t,o)=>{for(let i of t)try{i(o)}catch(a){console.error(a)}},Kt=(t)=>{if(!(t instanceof MessageEvent))return;if(!s(t.source))return;let o=gt(t.data);if(!o)return;if(o.type==="workspace"){let a=Z.get(o.payload.subscriptionId);if(a)R([a],o.payload.snapshot);return}if(o.type==="shells"){let a=q.get(o.payload.subscriptionId);if(a)R([a],o.payload.snapshot);return}if(o.type==="ready"){if(d=o.payload,X=Ft(o.payload.session),R(p,o.payload),R(f,o.payload.directory),R(B,o.payload.session),X)R(w,X);if(R(K,o.payload.connection),R(W,o.payload.settings),R(ae,o.payload.item),o.payload.block)R(Se,o.payload.block);Bt();return}if(o.type==="service-event"){R(fe,o.payload);return}if(o.type==="generate-late"){if(J.size===0)Ye.push(o.payload);else R(J,o.payload);return}if(o.type==="directory"){if(d)d={...d,directory:o.payload.directory};R(f,o.payload.directory);return}if(o.type==="session"){if(d)d={...d,session:o.payload.session};if(!o.payload.session)X=null;else if(X?.sessionId!==o.payload.session.id)X=Ft(o.payload.session);R(B,o.payload.session);return}if(o.type==="session-lifecycle"){X=o.payload,R(w,o.payload);return}if(o.type==="connection"){if(d)d={...d,connection:o.payload.connection};R(K,o.payload.connection);return}if(o.type==="settings"){if(d)d={...d,settings:o.payload.settings};R(W,o.payload.settings);return}if(o.type==="item"){if(d)d={...d,item:o.payload.item};R(ae,o.payload.item);return}if(o.type==="status-control-event"){R(Ae,o.payload);return}if(o.type==="popover-closed"){R(Oe,o.payload);return}if(o.type==="action"){let a=(S)=>{if(!D)L({channel:u,v:E,type:"action-result",id:o.id,payload:S})},A=de;if(!A){a({ok:!1,error:"This extension does not handle background actions."});return}Promise.resolve().then(()=>A(o.payload)).then(()=>a({ok:!0}),(S)=>{let C=(S instanceof Error?S.message:String(S)).trim();a({ok:!1,error:(C||"Action failed.").slice(0,Ee)})});return}if(o.type==="file-open"){let a=o.payload;if(_e&&co(_e,a))return;_e=a,R(Re,o.payload);return}if(o.type==="file-saved"){R(he,o.payload.version);return}if(o.type==="file-snapshot"){let a=(C)=>{if(!D)L({channel:u,v:E,type:"file-snapshot-result",id:o.id,payload:C})},A=(C)=>a({error:(C.trim()||"Could not read the edited file.").slice(0,Ee)}),S=le;if(!S){A("This extension does not edit files.");return}Promise.resolve().then(()=>S(o.payload.purpose)).then((C)=>{if(nt(C)>Ce){A(`The file is over ${Ce} ${"bytes"in C?"bytes":"characters"}.`);return}if(C.version.length>ke){A(`The snapshot version is over ${ke} characters.`);return}a({snapshot:"bytes"in C?{bytes:C.bytes,version:C.version}:{content:C.content,version:C.version}})},(C)=>A(C instanceof Error?C.message:String(C)));return}if(o.type==="resolve"){let a=(S)=>{L({channel:u,v:E,type:"resolve-result",id:o.id,payload:S})},A=ce;if(!A){a({error:"This extension does not resolve commands."});return}Promise.resolve().then(()=>A(o.payload)).then((S)=>a({item:S?te(S):null}),(S)=>{let C=(S instanceof Error?S.message:String(S)).trim();a({error:(C||"Command failed.").slice(0,Ee)})});return}let i=Q.get(o.id);if(!i)return;if(clearTimeout(i.timer),Q.delete(o.id),o.ok){i.resolve(o.payload);return}i.reject(new c(o.code,o.error))};r.addEventListener("message",Kt),L({channel:u,v:E,type:"hello"});let k=(t,o=T)=>{if(D||r.parent===r)return Promise.reject(new c("HOST_UNAVAILABLE","No host frame. This page is not in an iframe."));return new Promise((i,a)=>{let A=setTimeout(()=>{Q.delete(t.id),a(new c("HOST_TIMEOUT","Host did not answer in time."))},o);Q.set(t.id,{resolve:i,reject:a,timer:A}),L(t)})},x=(t)=>k(t).then(()=>{return}),b={channel:u,v:E},Qe=(t)=>{if(!D&&r.parent!==r)L(t)},Wt=()=>Qe({...b,type:"file-save"}),jt=(t)=>{if(!yo(t)||!er(t))return;t.preventDefault(),Wt()},zt=(t)=>{if(!yo(t)||t.key!=="Escape"||d?.surface!=="popover"||!d.popover)return;t.preventDefault(),Zt(d.popover.id,"escape").catch(()=>{return})},me=()=>{let t=d?.surface==="popover"?d.popover:void 0;if(!t)return;let o=pe||ue;if(Ht===o)return;Ht=o,qt(t.id,o).catch(()=>{return})},Ie=()=>{if(d?.surface!=="popover"||pe)return;pe=!0,me()},Yt=(t)=>{if(d?.surface!=="popover"||t.relatedTarget!==null||!pe)return;pe=!1,me()},Jt=()=>{if(d?.surface!=="popover"||ue)return;ue=!0,me()},Qt=()=>{if(d?.surface!=="popover"||!ue)return;ue=!1,me()},G=(t,o=1024)=>{if(!t.trim()||t.length>o)throw new c("HOST_REJECTED",`Identity must contain 1 to ${o} characters.`)},Ze=async(t)=>{if(t.kind!=="projects")G(t.projectId);let o=await k({...b,type:"workspace-read",id:_(l),payload:t});if(!o||!("kind"in o)||!("state"in o)||o.kind!==t.kind)throw new c("HOST_REJECTED","Host did not return workspace data.");return o},qe=async(t,o)=>{if(t.kind!=="projects")G(t.projectId);let i=_(l);Z.set(i,o);try{await x({...b,type:"workspace-subscribe",id:_(l),payload:{subscriptionId:i,query:t}})}catch(a){if(Z.delete(i),!D)L({...b,type:"workspace-unsubscribe",id:_(l),payload:{subscriptionId:i}});throw a}return()=>{if(!Z.delete(i)||D)return;L({...b,type:"workspace-unsubscribe",id:_(l),payload:{subscriptionId:i}})}},Ko=async(t,o)=>{if(t.kind==="session")G(t.sessionId);if(t.kind==="project")G(t.projectId);let i=_(l);q.set(i,o);try{await x({...b,type:"shells-subscribe",id:_(l),payload:{subscriptionId:i,scope:t}})}catch(a){if(q.delete(i),!D)L({...b,type:"shells-unsubscribe",id:_(l),payload:{subscriptionId:i}});throw a}return()=>{if(!q.delete(i)||D)return;L({...b,type:"shells-unsubscribe",id:_(l),payload:{subscriptionId:i}})}},xe=async(t)=>{if("key"in t&&(t.key.length===0||t.key.length>tt))throw new c("HOST_REJECTED","Storage key must contain 1 to 128 characters.");if(t.op==="set"&&!ee(t.value))throw new c("HOST_REJECTED","Storage values must be JSON.");if(t.op==="set"&&new TextEncoder().encode(JSON.stringify(t.value)).length>ot)throw new c("HOST_REJECTED","Storage value exceeds 64 KiB.");if(t.scope==="device"&&d?.features?.deviceStorage!==!0)throw new c("UNSUPPORTED","This host does not support device storage.");let o=await k({...b,type:"storage",id:_(l),payload:t});if(!o||!("storage"in o)||o.op!==t.op)throw new c("HOST_REJECTED","Host did not return storage data.");return o},Zt=(t,o)=>d?.features?.popovers!==!0&&!(d?.surface==="popover"&&d.popover?.id===t)?Promise.reject(new c("UNSUPPORTED","This host does not support popovers.")):x({...b,type:"popover-close",id:_(l),payload:o?{id:t,reason:o}:{id:t}}),qt=(t,o)=>d?.features?.popovers!==!0&&!(d?.surface==="popover"&&d.popover?.id===t)?Promise.reject(new c("UNSUPPORTED","This host does not support popovers.")):x({...b,type:"popover-anchor",id:_(l),payload:{id:t,active:o}});return r.addEventListener("keydown",zt,!0),r.addEventListener("pointerover",Ie),r.addEventListener("pointermove",Ie),r.addEventListener("pointerout",Yt),r.addEventListener("focus",Jt),r.addEventListener("blur",Qt),{onAction:(t)=>(de=t,()=>{if(de===t)de=null}),listProjects:async()=>{let t=await Ze({kind:"projects"});if(t.kind!=="projects")throw new c("HOST_REJECTED","Expected projects.");return t},listWorktrees:async(t)=>{let o=await Ze({kind:"worktrees",projectId:t});if(o.kind!=="worktrees")throw new c("HOST_REJECTED","Expected worktrees.");return o},listSessions:async(t)=>{let o=await Ze({kind:"sessions",projectId:t});if(o.kind!=="sessions")throw new c("HOST_REJECTED","Expected sessions.");return o},onProjects:(t)=>qe({kind:"projects"},(o)=>{if(o.kind==="projects")t(o)}),onWorktrees:(t,o)=>qe({kind:"worktrees",projectId:t},(i)=>{if(i.kind==="worktrees")o(i)}),onSessions:(t,o)=>qe({kind:"sessions",projectId:t},(i)=>{if(i.kind==="sessions")o(i)}),onRunningShells:(t,o)=>Ko(t,o),readShellOutput:async(t,o)=>{G(t,ge);let i=o?.cursor;if(i!==void 0&&(!Number.isInteger(i)||i<0))throw new c("HOST_REJECTED","Shell output cursor must be a non-negative integer.");let a=o?.tailBytes;if(a!==void 0&&(!Number.isInteger(a)||a<1||a>be))throw new c("HOST_REJECTED",`Shell output tailBytes must be an integer between 1 and ${be}.`);let S=await k({...b,type:"shell-output",id:_(l),payload:{shellId:t,cursor:i,tailBytes:a}});if(!S||typeof S.output!=="string"||!Number.isFinite(S.cursor))throw new c("HOST_REJECTED","Host did not return shell output.");return S},stopShell:async(t)=>{if(G(t,ge),(await k({...b,type:"shell-stop",id:_(l),payload:{shellId:t}}))?.stopped!==!0)throw new c("HOST_REJECTED","Host did not stop the shell.");return{stopped:!0}},openSession:async(t)=>{G(t),await x({...b,type:"open-session",id:_(l),payload:{sessionId:t}})},storage:{get:async(t,o)=>{let i=De(o),a={op:"get",key:t};if(i)a.scope=i;let A=await xe(a);return A.op==="get"&&A.found?A.value:void 0},set:async(t,o,i)=>{let a=De(i),A={op:"set",key:t,value:o};if(a)A.scope=a;await xe(A)},delete:async(t,o)=>{let i=De(o),a={op:"delete",key:t};if(i)a.scope=i;await xe(a)},keys:async(t)=>{let o=De(t),i={op:"keys"};if(o)i.scope=o;let a=await xe(i);if(a.op!=="keys")throw new c("HOST_REJECTED","Expected storage keys.");return a.keys}},onReady:(t)=>{if(p.add(t),d)t(d);return()=>{p.delete(t)}},onDirectory:(t)=>{if(f.add(t),d)t(d.directory);return()=>{f.delete(t)}},onSession:(t)=>{if(B.add(t),d)t(d.session);return()=>{B.delete(t)}},onSessionLifecycle:(t)=>{if(w.add(t),X)t(X);return()=>{w.delete(t)}},onConnection:(t)=>{if(K.add(t),d)t(d.connection);return()=>{K.delete(t)}},onSettings:(t)=>{if(W.add(t),d)t(d.settings);return()=>{W.delete(t)}},onItem:(t)=>{if(ae.add(t),d)t(d.item);return()=>{ae.delete(t)}},onBlock:(t)=>{if(Se.add(t),d?.block)t(d.block);return()=>{Se.delete(t)}},onServiceEvent:(t)=>(fe.add(t),()=>{fe.delete(t)}),onStatusControl:(t)=>(Ae.add(t),()=>{Ae.delete(t)}),onPopoverClosed:(t)=>(Oe.add(t),()=>{Oe.delete(t)}),setStatusControls:(t)=>{if(d?.features?.statusControls!==!0)return Promise.reject(new c("UNSUPPORTED","This host does not support status controls."));if(!so(t))return Promise.reject(new c("HOST_REJECTED","Status controls must have unique bounded ids and valid selected options."));return x({...b,type:"status-controls",id:_(l),payload:{controls:t}})},openPopover:(t)=>{if(d?.features?.popovers!==!0)return Promise.reject(new c("UNSUPPORTED","This host does not support popovers."));if(!it(t))return Promise.reject(new c("HOST_REJECTED","Popover requests need bounded geometry and JSON data."));return x({...b,type:"popover-open",id:_(l),payload:t})},closePopover:Zt,setPopoverAnchorActive:qt,onResolve:(t)=>(ce=t,()=>{if(ce===t)ce=null}),toast:(t)=>{let o=t.message.trim();if(!o||o.length>Ue)return Promise.reject(new c("HOST_REJECTED",`Toast message must contain 1 to ${Ue} characters.`));if(t.copy&&t.copy!==!0&&(!t.copy.text.length||t.copy.text.length>Me))return Promise.reject(new c("HOST_REJECTED",`Toast copy text must contain 1 to ${Me} characters.`));return x({channel:u,v:E,type:"toast",id:_(l),payload:{...t,message:o}})},openUrl:(t)=>x({channel:u,v:E,type:"open-url",id:_(l),payload:{url:t}}),openCommit:(t)=>_t(t)?x({channel:u,v:E,type:"open-commit",id:_(l),payload:{sha:t}}):Promise.reject(new c("HOST_REJECTED","Commit id must be 7 to 64 hex characters.")),answerBlock:(t)=>x({channel:u,v:E,type:"block-answer",id:_(l),payload:{text:t.trim().slice(0,ct)}}),openSurface:(t)=>x({channel:u,v:E,type:"open-surface",id:_(l),payload:{surfaceId:t}}),writeClipboard:(t)=>x({channel:u,v:E,type:"clipboard-write",id:_(l),payload:{text:t}}),compose:(t)=>x({channel:u,v:E,type:"compose",id:_(l),payload:t}),attach:(t)=>x({channel:u,v:E,type:"attach",id:_(l),payload:te(t)}),startSession:async(t)=>{if(t.projectId!==void 0)G(t.projectId);let o=t.worktree;if(o&&o!==!0)if(o.kind==="existing")G(o.directory);else{if(o.name!==void 0)G(o.name,200);if(o.baseBranch!==void 0)G(o.baseBranch,200)}let i=await k({channel:u,v:E,type:"start-session",id:_(l),payload:Tt(t)},e.requestTimeoutMs??180000);if(!dt(i))throw new c("HOST_REJECTED","Host did not return a session.");return i},prompt:(t)=>k({channel:u,v:E,type:"prompt",id:_(l),payload:St(t)}).then((o)=>{if(!lt(o))throw new c("HOST_REJECTED","Host did not return a prompt result.");return o}),sessionLink:(t)=>x({channel:u,v:E,type:"session-link",id:_(l),payload:te(t)}),close:()=>x({channel:u,v:E,type:"close",id:_(l)}),oauthStart:()=>x({channel:u,v:E,type:"oauth-start",id:_(l)}),oauthDisconnect:()=>x({channel:u,v:E,type:"oauth-disconnect",id:_(l)}),request:(t)=>(Pe(t.path)?k({channel:u,v:E,type:"request",id:_(l),payload:t}):vo()).then((o)=>{if(!we(o))throw new c("HOST_REJECTED","Host request result was empty.");return o}),serviceRequest:(t)=>(Pe(t.path)?k({channel:u,v:E,type:"service-request",id:_(l),payload:t}):vo()).then((o)=>{if(!we(o))throw new c("HOST_REJECTED","Host service request result was empty.");return o}),serviceStatus:()=>k({channel:u,v:E,type:"service-status",id:_(l)}).then((t)=>{if(!Ot(t))throw new c("HOST_REJECTED","Host did not return service status.");return t}),readFile:(t)=>(oe(t)?k({channel:u,v:E,type:"file-read",id:_(l),payload:{path:t}}):Ge()).then((o)=>{if(!Rt(o))throw new c("HOST_REJECTED","Host did not return file content.");return o}),writeFile:(t,o)=>{if(!oe(t))return Ge();if(o.length>ye)return Promise.reject(new c("FILE_TOO_LARGE",`Content is over ${ye} characters.`));return k({channel:u,v:E,type:"file-write",id:_(l),payload:{path:t,content:o}}).then((i)=>{if(!ht(i))throw new c("HOST_REJECTED","Host did not confirm the write.");return i})},listDir:(t)=>(oe(t)?k({channel:u,v:E,type:"file-list",id:_(l),payload:{path:t}}):Ge()).then((o)=>{if(!mt(o))throw new c("HOST_REJECTED","Host did not return directory entries.");return o}),stat:(t)=>(oe(t)?k({channel:u,v:E,type:"file-stat",id:_(l),payload:{path:t}}):Ge()).then((o)=>{if(!It(o))throw new c("HOST_REJECTED","Host did not return file status.");return o}),generate:(t)=>{let o=t.prompt.trim(),i=t.system?.trim();if(o.length===0||o.length>ve)return Promise.reject(new c("HOST_REJECTED",`Prompt must be 1 to ${ve} characters.`));if(i!==void 0&&(i.length===0||i.length>Le))return Promise.reject(new c("HOST_REJECTED",`System prompt must be 1 to ${Le} characters.`));let a=t.maxOutputTokens===void 0?void 0:Math.min(ut,Math.max(1,Math.floor(t.maxOutputTokens)));if(a!==void 0&&!Number.isFinite(a))return Promise.reject(new c("HOST_REJECTED","maxOutputTokens must be a number."));let A={prompt:o};if(i!==void 0)A.system=i;if(a!==void 0)A.maxOutputTokens=a;return k({channel:u,v:E,type:"generate",id:_(l),payload:A},e.requestTimeoutMs??Et).then((S)=>{if(!xt(S))throw new c("HOST_REJECTED","Host did not return generated text.");return S})},onLateGenerateResult:(t)=>{J.add(t);for(let o of Ye.splice(0))R([t],o);return Bt(),()=>{J.delete(t)}},setBadge:(t)=>x({channel:u,v:E,type:"badge",id:_(l),payload:{count:ft(t)}}),setHeight:(t)=>x({channel:u,v:E,type:"resize",id:_(l),payload:{height:At(t)}}),onFileOpen:(t)=>{if(Re.add(t),!Je)Je=!0,r.addEventListener("keydown",jt,!0);if(_e)t(_e);return()=>{Re.delete(t)}},onFileSnapshot:(t)=>(le=t,()=>{if(le===t)le=null}),onFileSaved:(t)=>(he.add(t),()=>{he.delete(t)}),reportFileChange:(t)=>Qe({...b,type:"file-change",payload:{dirty:t.dirty,edited:t.edited}}),requestFileSave:Wt,reportFileUnsupported:()=>Qe({...b,type:"file-unsupported"}),dispose:()=>{for(let t of Z.keys())L({...b,type:"workspace-unsubscribe",id:_(l),payload:{subscriptionId:t}});Z.clear();for(let t of q.keys())L({...b,type:"shells-unsubscribe",id:_(l),payload:{subscriptionId:t}});if(q.clear(),D=!0,ce=null,de=null,le=null,Re.clear(),he.clear(),Je)r.removeEventListener("keydown",jt,!0);r.removeEventListener("message",Kt),r.removeEventListener("keydown",zt,!0),r.removeEventListener("pointerover",Ie),r.removeEventListener("pointermove",Ie),r.removeEventListener("pointerout",Yt),r.removeEventListener("focus",Jt),r.removeEventListener("blur",Qt);for(let t of Q.values())clearTimeout(t.timer),t.reject(new c("HOST_UNAVAILABLE","Host client was disposed."));Q.clear(),p.clear(),f.clear(),B.clear(),w.clear(),K.clear(),W.clear(),ae.clear(),Se.clear(),fe.clear(),Ae.clear(),Oe.clear(),J.clear(),Ye.length=0}}};var Lo=["browser.open","browser.snapshot","browser.click","browser.type","browser.select","browser.scroll","browser.back","browser.forward","browser.inspect","browser.capture","browser.resize","browser.close"];var $r=new Set(Lo);var Po=["none","agent","user"];var Fr=new Set(Po);var tr=[["--oc-bg","background"],["--oc-elevated","elevated"],["--oc-fg","foreground"],["--oc-muted","muted"],["--oc-subtle","subtle"],["--oc-border","border"],["--oc-hover","hover"],["--oc-selection","selection"],["--oc-focus","focus"],["--oc-primary","primary"],["--oc-muted-surface","mutedSurface"],["--oc-elevated-fg","elevatedForeground"],["--oc-active","active"],["--oc-selection-fg","selectionForeground"],["--oc-primary-fg","primaryForeground"],["--oc-primary-text","primaryText"],["--oc-success-text","successText"],["--oc-warning-text","warningText"],["--oc-error-text","errorText"],["--oc-info-text","infoText"],["--oc-success","success"],["--oc-warning","warning"],["--oc-error","error"],["--oc-info","info"],["--oc-font","font"],["--oc-mono","mono"],["--oc-radius","radius"],["--surface-background","background"],["--surface-elevated","elevated"],["--surface-foreground","foreground"],["--surface-muted-foreground","muted"],["--surface-subtle","subtle"],["--interactive-border","border"],["--interactive-hover","hover"],["--interactive-selection","selection"],["--interactive-focus-ring","focus"],["--primary","primary"],["--surface-muted","mutedSurface"],["--surface-elevated-foreground","elevatedForeground"],["--interactive-active","active"],["--interactive-selection-foreground","selectionForeground"],["--primary-foreground","primaryForeground"],["--primary-text","primaryText"],["--success-text","successText"],["--warning-text","warningText"],["--error-text","errorText"],["--info-text","infoText"],["--status-success","success"],["--status-warning","warning"],["--status-error","error"],["--status-info","info"],["--font-sans","font"],["--font-mono","mono"],["--radius","radius"]],or=[["--oc-syntax-keyword","--syntax-keyword","syntaxKeyword"],["--oc-syntax-string","--syntax-string","syntaxString"],["--oc-syntax-number","--syntax-number","syntaxNumber"],["--oc-syntax-function","--syntax-function","syntaxFunction"],["--oc-syntax-type","--syntax-type","syntaxType"],["--oc-syntax-comment","--syntax-comment","syntaxComment"],["--oc-syntax-variable","--syntax-variable","syntaxVariable"],["--oc-syntax-operator","--syntax-operator","syntaxOperator"]],wo=(e,r)=>{r.style.colorScheme=e.mode;for(let[s,T]of tr)r.style.setProperty(s,e.tokens[T]);for(let[s,T,p]of or){let f=e.tokens[p]??"";r.style.setProperty(s,f),r.style.setProperty(T,f)}r.style.setProperty("font-family",e.tokens.font),r.style.setProperty("font-size",e.tokens.fontSize??"0.875rem"),r.style.setProperty("line-height","1.45"),r.style.setProperty("color",e.tokens.foreground)},Ct=(e,r)=>{if(wo(e.theme,r),r.dataset)r.dataset.ocSurface=e.surface,r.dataset.ocTheme=e.theme.mode};var rr={"surface-background":"bg","surface-elevated":"elevated","surface-elevated-foreground":"elevated-fg","surface-foreground":"fg","surface-muted-foreground":"muted","surface-muted":"muted-surface","surface-subtle":"subtle","interactive-border":"border","interactive-hover":"hover","interactive-active":"active","interactive-selection":"selection","interactive-selection-foreground":"selection-fg","interactive-focus-ring":"focus",primary:"primary","primary-foreground":"primary-fg","primary-text":"primary-text","success-text":"success-text","warning-text":"warning-text","error-text":"error-text","info-text":"info-text","status-success":"success","status-warning":"warning","status-error":"error","status-info":"info","font-sans":"font","font-mono":"mono",radius:"radius"},O=(e,r)=>`var(--${e}, var(--oc-${rr[e]}, ${r}))`,H=O("surface-background","transparent"),Ve=O("surface-elevated","transparent"),re=O("surface-elevated-foreground","inherit"),P=O("surface-foreground","inherit"),h=O("surface-muted-foreground","gray"),nr=O("surface-muted","transparent"),j=O("interactive-border","currentColor"),N=O("interactive-hover","transparent"),z=O("interactive-active","transparent"),kt=O("interactive-selection","transparent"),Ut=O("interactive-selection-foreground","inherit"),V=O("primary","currentColor"),Mt=O("primary-text","inherit"),Nt=O("error-text","inherit"),sr=O("font-sans","inherit"),yt=O("font-mono","monospace"),Vo=O("radius","9px"),vt=`calc(${Vo} - 2px)`,Go=`calc(${Vo} - 4px)`,m=(e,r,s="transparent")=>`color-mix(in srgb, ${e} ${r}%, ${s})`,Do=`background-image: linear-gradient(${N}, ${N});`,Lt=(e,r="0.5px")=>`box-shadow: inset 0 0 0 ${r} ${e}, var(--oc-sdk-field-lift);`,Pt="border-color: var(--oc-sdk-edge); box-shadow: var(--oc-sdk-raised-lift);",Xo="box-shadow: var(--oc-sdk-lit);",wt=`inset 0 0.5px 0 0 ${m(P,8)}, 0 1px 2px 0 rgb(0 0 0 / 0.4)`,ir=`
:root {
  --oc-sdk-edge: ${m(P,16)};
  --oc-sdk-field-bg: ${Ve};
  --oc-sdk-raised-bg: ${H};
  --oc-sdk-field-lift: inset 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --oc-sdk-raised-lift: 0 1px 1.5px 0 rgb(0 0 0 / 0.08);
  --oc-sdk-lit: inset 0 1px 0 0 rgb(255 255 255 / 0.2), 0 1px 1.5px 0 rgb(0 0 0 / 0.1);
  --oc-sdk-float-edge: rgb(0 0 0 / 0.14);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.7), 0 1px 2px -0.5px rgb(0 0 0 / 0.06), 0 4px 8px -2px rgb(0 0 0 / 0.08), 0 12px 20px -4px rgb(0 0 0 / 0.06);
}
:root[data-oc-theme="dark"] {
  --oc-sdk-edge: ${m(P,14)};
  --oc-sdk-field-bg: ${m(H,50,Ve)};
  --oc-sdk-raised-bg: ${Ve};
  --oc-sdk-field-lift: ${wt};
  --oc-sdk-raised-lift: ${wt};
  --oc-sdk-lit: ${wt};
  --oc-sdk-float-edge: rgb(0 0 0 / 0.55);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.04), inset 0 0 0 0.5px rgb(255 255 255 / 0.08), 0 8px 16px 0 rgb(0 0 0 / 0.25), 0 4px 8px 0 rgb(0 0 0 / 0.25);
}`,Xe=(e)=>{let r=O(`status-${e}`,"currentColor");return`
.oc-sdk[data-tone="${e}"], .oc-sdk [data-tone="${e}"] { --oc-sdk-tone: ${r}; --oc-sdk-tone-text: ${O(`${e}-text`,"inherit")}; }`},n=(e)=>`calc(${e}rem / 14)`,ar=`
.oc-sdk { box-sizing: border-box; font-size: 0.875rem; line-height: 1.45; }
.oc-sdk *, .oc-sdk *::before, .oc-sdk *::after { box-sizing: border-box; }
/* :where() keeps the reset at zero specificity so every primitive class below overrides it. */
:where(.oc-sdk) :where(button, input, textarea), :where(button.oc-sdk, input.oc-sdk, textarea.oc-sdk) { font: inherit; color: inherit; margin: 0; }
:where(.oc-sdk) :where(button), :where(button.oc-sdk) { cursor: pointer; background: none; border: 0; padding: 0; }
.oc-sdk button:disabled, button.oc-sdk:disabled, .oc-sdk[aria-disabled="true"], .oc-sdk [aria-disabled="true"] { opacity: .5; pointer-events: none; }

.oc-sdk-btn { display: inline-flex; align-items: center; justify-content: center; gap: ${n(8)}; height: ${n(32)}; padding: 0 ${n(12)}; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; line-height: 1; white-space: nowrap; }
.oc-sdk-btn[data-size="sm"] { gap: ${n(6)}; height: ${n(28)}; padding: 0 ${n(10)}; font-size: 0.8125rem; }
.oc-sdk-btn[data-size="xs"] { gap: ${n(4)}; height: ${n(24)}; padding: 0 ${n(8)}; font-size: 0.75rem; }
.oc-sdk-btn[data-loading="true"] { opacity: .5; pointer-events: none; }
.oc-sdk-btn > .oc-sdk-spinner-ring { width: ${n(14)}; height: ${n(14)}; }

.oc-sdk-field { display: flex; flex-direction: column; gap: ${n(4)}; min-width: 0; }
.oc-sdk-field-label { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-field-note { font-size: 0.75rem; }
.oc-sdk-input { display: block; width: 100%; min-width: 0; height: ${n(32)}; padding: 0 ${n(10)}; border: 0; font-size: 0.875rem; line-height: 1.45; appearance: none; }
textarea.oc-sdk-input { height: auto; padding: ${n(8)} ${n(10)}; resize: vertical; }

.oc-sdk-search { position: relative; min-width: 0; }
.oc-sdk-search .oc-sdk-input { padding-left: ${n(34)}; padding-right: ${n(34)}; }
.oc-sdk-search-icon { position: absolute; left: ${n(11)}; top: 50%; transform: translateY(-50%); pointer-events: none; }
.oc-sdk-search-clear { position: absolute; right: ${n(6)}; top: 50%; transform: translateY(-50%); display: none; align-items: center; justify-content: center; width: ${n(24)}; height: ${n(24)}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-clear { display: inline-flex; }

.oc-sdk-select { position: relative; display: flex; flex-direction: column; gap: ${n(4)}; min-width: 0; }
.oc-sdk-trigger { display: inline-flex; align-items: center; gap: ${n(6)}; align-self: flex-start; width: auto; max-width: 100%; min-width: 0; height: ${n(28)}; padding: 0 ${n(10)}; border: 1px solid transparent; font-size: 0.8125rem; text-align: left; }
.oc-sdk-trigger-value { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-trigger-chevron { flex: 0 0 auto; }
.oc-sdk-popup { position: fixed; z-index: 50; display: flex; flex-direction: column; gap: ${n(2)}; min-width: ${n(160)}; max-width: calc(100vw - ${n(16)}); max-height: min(${n(320)}, calc(100vh - ${n(16)})); overflow: auto; padding: ${n(4)}; border: 1px solid transparent; }
.oc-sdk-popup-search { flex: 0 0 auto; padding: ${n(2)} ${n(2)} ${n(4)}; }
.oc-sdk-popup-search .oc-sdk-input { height: ${n(28)}; font-size: 0.8125rem; }
.oc-sdk-option { display: flex; align-items: center; gap: ${n(8)}; width: 100%; padding: ${n(6)} ${n(8)}; font-size: 0.8125rem; text-align: left; }
.oc-sdk-option-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-option-hint { flex: 0 0 auto; font-size: 0.75rem; }
.oc-sdk-option-check { flex: 0 0 auto; display: inline-flex; width: ${n(14)}; visibility: hidden; }
.oc-sdk-option[aria-selected="true"] > .oc-sdk-option-check { visibility: visible; }
.oc-sdk-popup-empty { padding: ${n(8)}; font-size: 0.8125rem; }

.oc-sdk-check { display: inline-flex; align-items: flex-start; gap: ${n(8)}; width: 100%; text-align: left; }
.oc-sdk-check-box { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: ${n(14)}; height: ${n(14)}; margin-top: ${n(3)}; border: 1px solid transparent; }
.oc-sdk-check-box > svg { display: none; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box > svg { display: block; }
.oc-sdk-check-thumb { flex: 0 0 auto; position: relative; width: ${n(36)}; height: ${n(20)}; --oc-sdk-thumb-travel: ${n(16)}; }
.oc-sdk-check-thumb::after { content: ""; position: absolute; top: ${n(2)}; left: ${n(2)}; width: ${n(16)}; height: ${n(16)}; }
.oc-sdk-check-text { display: flex; flex-direction: column; min-width: 0; }
.oc-sdk-check-label { font-size: 0.875rem; }
.oc-sdk-check-desc { font-size: 0.75rem; }

.oc-sdk-tabs { display: inline-flex; gap: ${n(2)}; padding: ${n(2)}; max-width: 100%; overflow: auto; }
.oc-sdk-tab { display: inline-flex; align-items: center; gap: ${n(6)}; height: ${n(28)}; padding: 0 ${n(10)}; border: 1px solid transparent; font-size: 0.8125rem; font-weight: 500; white-space: nowrap; }
.oc-sdk-tab-count { font-size: 0.75rem; font-variant-numeric: tabular-nums; }

.oc-sdk-badge { display: inline-flex; align-items: center; padding: ${n(1)} ${n(6)}; font-size: ${n(11)}; font-weight: 500; line-height: ${n(16)}; white-space: nowrap; }

.oc-sdk-list { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.oc-sdk-row { display: flex; align-items: center; gap: ${n(8)}; width: 100%; padding: ${n(6)} ${n(8)}; text-align: left; }
.oc-sdk-row-lead { flex: 0 0 auto; width: ${n(64)}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.oc-sdk-row-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-row-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-meta { flex: 0 0 auto; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-list-empty { padding: ${n(16)} ${n(8)}; text-align: center; font-size: 0.8125rem; }

.oc-sdk-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: ${n(4)}; padding: ${n(40)} ${n(16)}; text-align: center; }
.oc-sdk-empty-title { margin: 0; font-size: 0.8125rem; font-weight: 600; }
.oc-sdk-empty-body { margin: 0; max-width: 32rem; font-size: 0.8125rem; }
.oc-sdk-empty-action { margin-top: ${n(12)}; }

@keyframes oc-sdk-spin { to { transform: rotate(360deg); } }
.oc-sdk-spinner { display: inline-flex; align-items: center; gap: ${n(8)}; font-size: 0.8125rem; }
.oc-sdk-spinner-ring { width: ${n(16)}; height: ${n(16)}; border: 2px solid transparent; animation: oc-sdk-spin .8s linear infinite; }
.oc-sdk-spinner[data-size="sm"] .oc-sdk-spinner-ring { width: ${n(12)}; height: ${n(12)}; }

.oc-sdk-banner { display: flex; align-items: flex-start; gap: ${n(12)}; padding: ${n(8)} ${n(12)}; border: 1px solid transparent; }
.oc-sdk-banner-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: ${n(2)}; }
.oc-sdk-banner-title { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-banner-body { font-size: 0.8125rem; }
.oc-sdk-banner-action { flex: 0 0 auto; }

.oc-sdk-separator { display: flex; align-items: center; gap: ${n(8)}; width: 100%; margin: ${n(8)} 0; font-size: 0.75rem; }
.oc-sdk-separator::before, .oc-sdk-separator::after { content: ""; flex: 1 1 auto; height: 1px; }
.oc-sdk-separator[data-labeled="false"]::after { display: none; }
.oc-sdk-popup > .oc-sdk-separator { margin: ${n(4)} 0; }

.oc-sdk-progress { display: flex; flex-direction: column; gap: ${n(4)}; min-width: 0; }
.oc-sdk-progress-label { display: flex; justify-content: space-between; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-progress-track { height: ${n(6)}; overflow: hidden; }
.oc-sdk-progress-fill { height: 100%; transform-origin: left; transition: transform 200ms ease-out; }
.oc-sdk-progress-value { display: inline-flex; align-items: center; gap: ${n(2)}; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { font-weight: 600; }

.oc-sdk-menu { position: relative; display: inline-flex; }

.oc-sdk-text { white-space: pre-wrap; overflow-wrap: anywhere; }
.oc-sdk-text img { display: block; max-width: 100%; margin: ${n(8)} 0; }

/* Under a finger the controls reach the app's touch sizes: rows and options 44px like its sheets, every other
   control at least 36px. Inputs keep 16px text, below which iOS zooms the page on focus. */
@media (pointer: coarse) {
  .oc-sdk-btn, .oc-sdk-input { height: ${n(40)}; }
  .oc-sdk-btn[data-size="sm"], .oc-sdk-btn[data-size="xs"], .oc-sdk-trigger, .oc-sdk-tab, .oc-sdk-popup-search .oc-sdk-input { height: ${n(36)}; }
  .oc-sdk-input, .oc-sdk-popup-search .oc-sdk-input { font-size: max(16px, 0.875rem); }
  .oc-sdk-search-clear { width: ${n(36)}; height: ${n(36)}; right: 0; }
  .oc-sdk-row, .oc-sdk-option { min-height: ${n(44)}; }
  .oc-sdk-check { min-height: ${n(36)}; padding: ${n(8)} 0; }
}
`,$o=`${ir}
.oc-sdk { color: ${P}; font-family: ${sr}; }
.oc-sdk :focus-visible, .oc-sdk:focus-visible { outline: none; }
.oc-sdk :where(button, a[href], [role="button"], [role="tab"], [role="option"]):focus-visible, button.oc-sdk:focus-visible { ${Do} }
.oc-sdk-mono { font-family: ${yt}; }
.oc-sdk-muted { color: ${h}; }
${Xe("success")}${Xe("warning")}${Xe("error")}${Xe("info")}
.oc-sdk[data-tone="primary"], .oc-sdk [data-tone="primary"] { --oc-sdk-tone: ${V}; --oc-sdk-tone-text: ${Mt}; }

.oc-sdk-btn { border-radius: ${vt}; transition: background 150ms ease-out, color 150ms ease-out; }
.oc-sdk-btn[data-size="xs"] { border-radius: ${Go}; }
.oc-sdk-btn[data-variant="default"] { color: ${Mt}; background: ${m(V,10,H)}; border-color: ${m(V,12)}; ${Xo} }
.oc-sdk-btn[data-variant="default"]:hover { background: ${m(V,16,H)}; }
.oc-sdk-btn[data-variant="default"]:active { background: ${m(V,22,H)}; box-shadow: none; }
.oc-sdk-btn[data-variant="secondary"] { background: ${nr}; color: var(--oc-fg); }
.oc-sdk-btn[data-variant="secondary"]:hover { background-image: linear-gradient(${N}, ${N}); }
.oc-sdk-btn[data-variant="secondary"]:active { background-image: linear-gradient(${z}, ${z}); }
.oc-sdk-btn[data-variant="outline"] { background: var(--oc-sdk-raised-bg); color: ${re}; ${Pt} }
.oc-sdk-btn[data-variant="outline"]:hover { background-image: linear-gradient(${N}, ${N}); }
.oc-sdk-btn[data-variant="outline"]:active { background-image: linear-gradient(${z}, ${z}); box-shadow: none; }
.oc-sdk-btn[data-variant="ghost"] { background: transparent; }
.oc-sdk-btn[data-variant="ghost"]:hover { background: ${N}; }
.oc-sdk-btn[data-variant="ghost"]:active { background: ${z}; }
.oc-sdk-btn[data-variant="destructive"] { --oc-sdk-tone: ${O("status-error","red")}; color: ${Nt}; background: ${m("var(--oc-sdk-tone)",7,H)}; border-color: ${m("var(--oc-sdk-tone)",12)}; ${Xo} }
.oc-sdk-btn[data-variant="destructive"]:hover { background: ${m("var(--oc-sdk-tone)",9,H)}; }
.oc-sdk-btn[data-variant="destructive"]:active { background: ${m("var(--oc-sdk-tone)",11,H)}; box-shadow: none; }

.oc-sdk-field-note { color: ${h}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-field-note { color: ${Nt}; }
.oc-sdk-input { border-radius: ${vt}; background: var(--oc-sdk-field-bg); color: ${re}; ${Lt("var(--oc-sdk-edge)")} transition: background 150ms ease-out; }
.oc-sdk-input::placeholder { color: ${h}; }
.oc-sdk-input:hover:not(:focus) { background-image: linear-gradient(${N}, ${N}); }
.oc-sdk-input:focus, .oc-sdk-input:focus-visible { ${Lt(m(P,26),"1px")} }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input, .oc-sdk-field[data-invalid="true"] .oc-sdk-input:focus { ${Lt(O("status-error","red"),"1px")} }
.oc-sdk-input[data-mono="true"] { font-family: ${yt}; }

.oc-sdk-search-icon { color: ${h}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-icon { color: ${V}; }
.oc-sdk-search-clear { border-radius: ${Go}; color: ${h}; }
.oc-sdk-search-clear:hover { background: ${N}; color: ${P}; }

.oc-sdk-trigger { border-radius: ${vt}; background: var(--oc-sdk-raised-bg); color: ${re}; ${Pt} transition: background 150ms ease-out; }
.oc-sdk-trigger:hover { background-image: linear-gradient(${N}, ${N}); }
.oc-sdk-trigger[aria-expanded="true"] { background-image: linear-gradient(${z}, ${z}); }
.oc-sdk-trigger-value[data-empty="true"] { color: ${h}; }
.oc-sdk-trigger-chevron { color: ${h}; }
/* The app's floating level: the glass edge (a hairline ring and a lit top line, dark outside and light inside in dark themes) over soft shadows. The outer ring is the border, over the page like the app's. */
.oc-sdk-popup { --surface-foreground: ${re}; border-color: var(--oc-sdk-float-edge); border-radius: 12px; background: ${Ve}; background-clip: padding-box; color: ${re}; box-shadow: var(--oc-sdk-float); }
.oc-sdk-option { border-radius: 8px; }
.oc-sdk-option[data-active="true"] { background: ${N}; }
/* A selected option shows a check mark in the text colour, like the app's own pickers. Options without the mark come
   from bundles built before it existed and keep the selection fill as their only sign of the choice. */
.oc-sdk-option[aria-selected="true"]:not([data-mark]) { background: ${kt}; color: ${Ut}; }
.oc-sdk-option-check { color: ${P}; }
.oc-sdk-option[data-destructive="true"] { color: ${Nt}; }
.oc-sdk-option[data-destructive="true"][data-active="true"] { background: ${m(O("status-error","red"),10)}; }
.oc-sdk-option-hint { color: ${h}; }
.oc-sdk-popup-empty { color: ${h}; }

/* Checked stays neutral: the mark carries the state, and the primary colour stays with primary actions. */
.oc-sdk-check-box { border-color: ${j}; border-radius: 4px; color: ${P}; transition: border-color 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box { border-color: ${m(P,60,j)}; }
.oc-sdk-check-thumb { border-radius: 9999px; background: ${j}; transition: background 150ms ease-out; }
.oc-sdk-check-thumb::after { border-radius: 9999px; background: ${H}; transition: transform 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb { background: ${V}; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb::after { transform: translateX(var(--oc-sdk-thumb-travel, 16px)); }
.oc-sdk-check:focus-visible { box-shadow: none; }
.oc-sdk-check:focus-visible .oc-sdk-check-box, .oc-sdk-check:focus-visible .oc-sdk-check-thumb { ${Do} }
.oc-sdk-check-desc { color: ${h}; }

.oc-sdk-tabs { border-radius: 10px; }
.oc-sdk-tabs[data-track="true"] { background: ${m(P,4)}; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.16); }
.oc-sdk-tab { border-radius: 8px; color: ${h}; transition: color 150ms ease-out, background 150ms ease-out; }
.oc-sdk-tab:hover { color: ${P}; }
.oc-sdk-tab[aria-selected="true"] { color: ${Ut}; background: ${kt}; border-color: ${j}; }
.oc-sdk-tabs[data-track="true"] .oc-sdk-tab[aria-selected="true"] { color: ${re}; background: var(--oc-sdk-raised-bg); ${Pt} }
.oc-sdk-tab-count { color: ${h}; }

/* The app's neutral badge: a step of the text colour, the same in every theme. */
.oc-sdk-badge { border-radius: 9999px; background: ${m(P,6)}; color: ${h}; }
.oc-sdk-badge[data-tone] { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); background: ${m("var(--oc-sdk-tone)",15)}; }

.oc-sdk-row { border-radius: 6px; transition: background 120ms ease-out; }
.oc-sdk-row:hover, .oc-sdk-row[data-active="true"] { background: ${N}; }
.oc-sdk-row[aria-selected="true"] { background: ${kt}; color: ${Ut}; }
.oc-sdk-row-lead { font-family: ${yt}; color: ${h}; }
.oc-sdk-row-sub { color: ${h}; }
.oc-sdk-row-meta { color: ${h}; }
.oc-sdk-row[aria-selected="true"] .oc-sdk-row-lead, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-sub, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-meta { color: inherit; opacity: .75; }
.oc-sdk-list-empty { color: ${h}; }

.oc-sdk-empty-body { color: ${h}; }

.oc-sdk-spinner { color: ${h}; }
.oc-sdk-spinner-ring { border-color: ${j}; border-top-color: ${V}; border-radius: 9999px; }

/* Set apart by its tint alone, like the app's banners. */
.oc-sdk-banner { border-color: transparent; border-radius: 8px; background: ${m("var(--oc-sdk-tone)",10)}; }
.oc-sdk-banner-title { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); }
.oc-sdk-banner-body { color: ${h}; }

.oc-sdk-separator { color: ${h}; }
.oc-sdk-separator::before, .oc-sdk-separator::after { background: ${m(j,40)}; }

.oc-sdk-progress-label { color: ${h}; }
/* The app's progress: a groove a step of the text colour, green once done. Older bundles mark done only through aria-valuenow. */
.oc-sdk-progress-track { border-radius: 9999px; background: ${m(P,6)}; }
.oc-sdk-progress-fill { border-radius: 9999px; background: var(--oc-sdk-tone, ${V}); }
.oc-sdk-progress-track[aria-valuenow="100"] > .oc-sdk-progress-fill:not([data-tone]) { background: ${O("status-success","currentColor")}; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { color: ${O("success-text","inherit")}; }

.oc-sdk-text a { color: ${Mt}; text-decoration: underline; text-underline-offset: 2px; }
.oc-sdk-text img { border-radius: 8px; border: 1px solid ${m(j,60)}; }
`,U=`
${et}
${ar}
${$o}`;var ie=bt(),M=document.getElementById("root"),Y=null,Xt=!1,Vt=!1,We=!0,Ke=0,I=null,se=null,Ho=0,Dt=!1;function g(e,r={},...s){let T=document.createElement(e);for(let[p,f]of Object.entries(r)){if(f===void 0||f===null||f===!1)continue;if(p==="class")T.className=String(f);else if(p==="text")T.textContent=String(f);else if(p.startsWith("on")&&typeof f==="function")T.addEventListener(p.slice(2).toLowerCase(),f);else if(f===!0)T.setAttribute(p,"");else T.setAttribute(p,String(f))}for(let p of s){if(p===null||p===void 0)continue;T.append(typeof p==="string"?document.createTextNode(p):p)}return T}function Bo(e){if(e instanceof c)return{code:String(e.code||""),text:e.message||String(e.code||"Request failed")};return{code:"",text:e instanceof Error?e.message:String(e)}}function $t(){if(Dt)return;Dt=!0,requestAnimationFrame(()=>{Dt=!1;let e=Math.ceil(M.getBoundingClientRect().height);if(e>0&&e!==Ho)Ho=e,ie.setHeight(e).catch(()=>{})})}async function je(){let e=++Ke;We=!0,ze();try{let r=await ie.serviceRequest({method:"GET",path:"/status",query:Y?{directory:Y}:void 0});if(e!==Ke)return;let s=r?.body,T=typeof s==="string"?JSON.parse(s):s;if(!T)throw Error("Empty answer from the local service");if(T.ok===!1)I=null,se={kind:"error",text:T.error||"Could not read the config."};else I=T,se=null}catch(r){if(e!==Ke)return;let s=Bo(r);I=null,se=s.code==="NO_SERVICE"?{kind:"error",text:"Allow the local service in Settings → Extensions to read presets."}:{kind:"error",text:s.text}}finally{if(e===Ke)We=!1,ze()}}async function pr(){try{await ie.openSurface("plugin:openchamber-omos-helper")}catch(e){let r=Bo(e),s=r.code==="UNSUPPORTED"||r.code==="NO_DIRECTORY"?"Open the openchamber-omos-helper panel from the rail.":`Could not open the editor: ${r.text}`;await ie.toast({kind:"info",message:s}).catch(()=>{})}}function ur(e){let r=e.runningModel?`Running as ${e.runningModel}${e.runningVariant?` · ${e.runningVariant}`:""}`:"Not registered in the running server",s=e.status==="drift"||e.status==="missing"||e.status==="inherited"?r:e.status==="match"?"Matches the running server":void 0,T=e.model||"inherited";return g("div",{class:"agent","data-status":e.status,title:s},g("span",{class:"dot"}),g("span",{class:"name",text:e.name}),g("span",{class:`model${e.model?"":" inherited"}`,text:T}),e.variant?g("span",{class:"variant",text:e.variant}):null)}function Fo(){return g("div",{class:"footer"},g("button",{type:"button",text:"Refresh",disabled:We,onclick:()=>void je()}),Vt?null:g("button",{type:"button",text:"Open editor",onclick:()=>void pr()}))}function ze(){if(M.replaceChildren(),!I){if(M.append(g("div",{class:`note${se?.kind==="error"?" error":""}`,text:se?.text||(We?"Reading presets…":"No config loaded.")})),se)M.append(Fo()),$t();return}let e=Array.isArray(I.agents)?I.agents:[];if(M.append(g("div",{class:"head"},g("span",{class:"preset",text:I.presetName||"No default preset",title:"Default preset for new sessions"}),I.presetSource==="project"?g("span",{class:"badge",text:"project",title:I.projectConfigPath||""}):null,g("span",{class:"count",text:e.length===1?"1 agent":`${e.length} agents`}))),!I.presetName)M.append(g("div",{class:"note",text:I.presetCount?`${I.presetCount} presets in the config.`:"No presets in the config yet."}));else if(!I.presetFound)M.append(g("div",{class:"note warning",text:"This preset is not in the merged config."}));else if(e.length===0)M.append(g("div",{class:"note",text:"This preset has no agents."}));else{let r=g("div",{class:"agents"});for(let s of e)r.append(ur(s));M.append(r)}if(!I.runningAvailable)M.append(g("div",{class:"note",text:"Running models unavailable; start OpenChamber’s local API to compare."}));else{if(I.driftCount>0)M.append(g("div",{class:"note warning",text:I.driftCount===1?"1 agent differs from the running server.":`${I.driftCount} agents differ from the running server.`}));if(I.missingCount>0)M.append(g("div",{class:"note",text:I.missingCount===1?"1 agent is not registered in the running server.":`${I.missingCount} agents are not registered in the running server.`}))}if(I.projectConfigPath)M.append(g("div",{class:"note",text:"Project override is in effect.",title:I.projectConfigPath}));M.append(Fo()),$t()}if(typeof ResizeObserver==="function")new ResizeObserver(()=>$t()).observe(M);ie.onDirectory((e)=>{let r=e||null;if(r===Y)return;if(Y=r,Xt)je()});ie.onReady((e)=>{Ct(e,document.documentElement);let r=e.device?e.device.formFactor!=="desktop":!1,s=r!==Vt;Vt=r;let T=e.directory||null;if(!Xt)Xt=!0,Y=T,je();else if(T!==Y)Y=T,je();else if(s)ze()});ze();})();
