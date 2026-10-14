import{r as i,u as N,a as v,j as e}from"./index-GKd4jAUj.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var f={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=s=>s.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),m=(s,u)=>{const l=i.forwardRef(({color:p="currentColor",size:n=24,strokeWidth:t=2,absoluteStrokeWidth:a,className:c="",children:o,...g},x)=>i.createElement("svg",{ref:x,...f,width:n,height:n,stroke:p,strokeWidth:a?Number(t)*24/Number(n):t,className:["lucide",`lucide-${k(s)}`,c].join(" "),...g},[...u.map(([r,d])=>i.createElement(r,d)),...Array.isArray(o)?o:[o]]));return l.displayName=`${s}`,l};/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=m("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=m("LockKeyhole",[["circle",{cx:"12",cy:"16",r:"1",key:"1au0dj"}],["rect",{x:"3",y:"10",width:"18",height:"12",rx:"2",key:"6s8ecr"}],["path",{d:"M7 10V7a5 5 0 0 1 10 0v3",key:"1pqi11"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=m("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=m("Truck",[["path",{d:"M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11",key:"hs4xqm"}],["path",{d:"M14 9h4l4 4v4c0 .6-.4 1-1 1h-2",key:"11fp61"}],["circle",{cx:"7",cy:"18",r:"2",key:"19iecd"}],["path",{d:"M15 18H9",key:"1lyqi6"}],["circle",{cx:"17",cy:"18",r:"2",key:"332jqn"}]]);function E(){const[s,u]=i.useState(""),[l,p]=i.useState(""),[n,t]=i.useState(""),[a,c]=i.useState(!1),o=N(),{login:g}=v(),x=async r=>{var d,j,y;r.preventDefault();try{t(""),c(!0),await g(s,l),o("/dashboard")}catch(h){console.error("Sign-in request failed",{status:((d=h.response)==null?void 0:d.status)??null,code:h.code??null}),t(((y=(j=h.response)==null?void 0:j.data)==null?void 0:y.error)||h.message||"Unable to sign in. Check your credentials and try again.")}finally{c(!1)}};return e.jsxs("div",{className:"login-shell",children:[e.jsxs("section",{className:"login-art","aria-label":"Bharat Transport Company",children:[e.jsx("div",{className:"login-orbit","aria-hidden":"true"}),e.jsx("div",{className:"login-lamp","aria-hidden":"true",children:e.jsx("span",{className:"login-lamp-base"})}),e.jsxs("div",{"aria-hidden":"true",children:[e.jsx("span",{className:"login-firefly"}),e.jsx("span",{className:"login-firefly"}),e.jsx("span",{className:"login-firefly"}),e.jsx("span",{className:"login-firefly"}),e.jsx("span",{className:"login-firefly"}),e.jsx("span",{className:"login-firefly"})]}),e.jsxs("div",{className:"login-art-copy",children:[e.jsx("div",{className:"login-brand-kicker",children:"Connected routes. Clear journeys."}),e.jsxs("h1",{children:["Moving Bharat,",e.jsx("br",{}),"one delivery at a time."]}),e.jsx("p",{children:"Operations, people, and freight in one dependable workspace for Bharat Transport Company."})]})]}),e.jsx("section",{className:"login-form-side",children:e.jsxs("div",{className:"login-card",children:[e.jsxs("div",{className:"login-card-brand",children:[e.jsx("div",{className:"login-card-mark",children:e.jsx(A,{size:20,strokeWidth:1.8})}),e.jsxs("div",{children:[e.jsx("div",{className:"login-card-brand-name",children:"BHARAT TRANSPORT COMPANY"}),e.jsx("div",{className:"login-card-brand-subtitle",children:"Transport Management System"})]})]}),e.jsx("h2",{children:"Welcome Back"}),e.jsx("p",{className:"login-card-subtitle",children:"Enter your details to access your account."}),n&&e.jsx("div",{role:"alert",className:"login-error",children:n}),e.jsxs("form",{onSubmit:x,className:"login-form",children:[e.jsxs("div",{className:"login-field",children:[e.jsx("label",{htmlFor:"login-email",children:"Email or username"}),e.jsxs("div",{className:"login-input-wrap",children:[e.jsx(C,{size:17,"aria-hidden":"true"}),e.jsx("input",{id:"login-email",type:"text",value:s,onChange:r=>u(r.target.value),placeholder:"Email or username",autoComplete:"username",required:!0,disabled:a})]})]}),e.jsxs("div",{className:"login-field",children:[e.jsx("label",{htmlFor:"login-password",children:"Password"}),e.jsxs("div",{className:"login-input-wrap",children:[e.jsx(w,{size:17,"aria-hidden":"true"}),e.jsx("input",{id:"login-password",type:"password",value:l,onChange:r=>p(r.target.value),placeholder:"Enter your password",autoComplete:"current-password",required:!0,disabled:a})]})]}),e.jsxs("button",{type:"submit",disabled:a,className:"login-submit",children:[a?"Signing in...":"Sign In",!a&&e.jsx(b,{size:17,"aria-hidden":"true"})]})]}),e.jsx("p",{className:"login-copyright",children:"© 2026 Bharat Transport Company"})]})})]})}export{E as default};
