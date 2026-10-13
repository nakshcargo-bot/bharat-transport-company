import{r as n,u as x,a as j,j as e}from"./index-Be9RVaRq.js";import{b as y}from"./api-reirx31X.js";import"./index-BCn5QfZZ.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var N={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=s=>s.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),h=(s,m)=>{const l=n.forwardRef(({color:g="currentColor",size:t=24,strokeWidth:o=2,absoluteStrokeWidth:r,className:d="",children:c,...p},u)=>n.createElement("svg",{ref:u,...N,width:t,height:t,stroke:g,strokeWidth:r?Number(o)*24/Number(t):o,className:["lucide",`lucide-${k(s)}`,d].join(" "),...p},[...m.map(([i,a])=>n.createElement(i,a)),...Array.isArray(c)?c:[c]]));return l.displayName=`${s}`,l};/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=h("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=h("LockKeyhole",[["circle",{cx:"12",cy:"16",r:"1",key:"1au0dj"}],["rect",{x:"3",y:"10",width:"18",height:"12",rx:"2",key:"6s8ecr"}],["path",{d:"M7 10V7a5 5 0 0 1 10 0v3",key:"1pqi11"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=h("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=h("Truck",[["path",{d:"M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11",key:"hs4xqm"}],["path",{d:"M14 9h4l4 4v4c0 .6-.4 1-1 1h-2",key:"11fp61"}],["circle",{cx:"7",cy:"18",r:"2",key:"19iecd"}],["path",{d:"M15 18H9",key:"1lyqi6"}],["circle",{cx:"17",cy:"18",r:"2",key:"332jqn"}]]);function L(){const[s,m]=n.useState(""),[l,g]=n.useState(""),[t,o]=n.useState(""),[r,d]=n.useState(!1),c=x(),{login:p}=j(),u=async i=>{i.preventDefault();try{o(""),d(!0),await p(s,l);const a=await y.login("admin","admin123");a.data&&a.data.token?(localStorage.setItem("token",a.data.token),localStorage.setItem("user",JSON.stringify(a.data.user||{})),console.log("✅ Token saved:",a.data.token.substring(0,20)+"...")):console.warn("⚠️ No token in response:",a.data),c("/dashboard")}catch(a){o("Failed to sign in: "+a.message),console.error("Login error:",a)}d(!1)};return e.jsxs("div",{className:"login-shell",children:[e.jsxs("section",{className:"login-art","aria-label":"Bharat Transport Company",children:[e.jsx("div",{className:"login-orbit","aria-hidden":"true"}),e.jsx("div",{className:"login-lamp","aria-hidden":"true",children:e.jsx("span",{className:"login-lamp-base"})}),e.jsxs("div",{"aria-hidden":"true",children:[e.jsx("span",{className:"login-firefly"}),e.jsx("span",{className:"login-firefly"}),e.jsx("span",{className:"login-firefly"}),e.jsx("span",{className:"login-firefly"}),e.jsx("span",{className:"login-firefly"}),e.jsx("span",{className:"login-firefly"})]}),e.jsxs("div",{className:"login-art-copy",children:[e.jsx("div",{className:"login-brand-kicker",children:"Connected routes. Clear journeys."}),e.jsxs("h1",{children:["Moving Bharat,",e.jsx("br",{}),"one delivery at a time."]}),e.jsx("p",{children:"Operations, people, and freight in one dependable workspace for Bharat Transport Company."})]})]}),e.jsx("section",{className:"login-form-side",children:e.jsxs("div",{className:"login-card",children:[e.jsxs("div",{className:"login-card-brand",children:[e.jsx("div",{className:"login-card-mark",children:e.jsx(w,{size:20,strokeWidth:1.8})}),e.jsxs("div",{children:[e.jsx("div",{className:"login-card-brand-name",children:"BHARAT TRANSPORT COMPANY"}),e.jsx("div",{className:"login-card-brand-subtitle",children:"Transport Management System"})]})]}),e.jsx("h2",{children:"Welcome Back"}),e.jsx("p",{className:"login-card-subtitle",children:"Enter your details to access your account."}),t&&e.jsx("div",{role:"alert",className:"login-error",children:t}),e.jsxs("form",{onSubmit:u,className:"login-form",children:[e.jsxs("div",{className:"login-field",children:[e.jsx("label",{htmlFor:"login-email",children:"Email"}),e.jsxs("div",{className:"login-input-wrap",children:[e.jsx(b,{size:17,"aria-hidden":"true"}),e.jsx("input",{id:"login-email",type:"email",value:s,onChange:i=>m(i.target.value),placeholder:"name@company.com",autoComplete:"username",required:!0,disabled:r})]})]}),e.jsxs("div",{className:"login-field",children:[e.jsx("label",{htmlFor:"login-password",children:"Password"}),e.jsxs("div",{className:"login-input-wrap",children:[e.jsx(f,{size:17,"aria-hidden":"true"}),e.jsx("input",{id:"login-password",type:"password",value:l,onChange:i=>g(i.target.value),placeholder:"Enter your password",autoComplete:"current-password",required:!0,disabled:r})]})]}),e.jsxs("button",{type:"submit",disabled:r,className:"login-submit",children:[r?"Signing in...":"Sign In",!r&&e.jsx(v,{size:17,"aria-hidden":"true"})]})]}),e.jsx("p",{className:"login-copyright",children:"© 2026 Bharat Transport Company"})]})})]})}export{L as default};
