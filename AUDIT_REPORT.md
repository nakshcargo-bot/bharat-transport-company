# Bharat Transport Company System Audit

## Scope and verification

This audit covers the page inventory, React routes, dashboard navigation, Bilty/Bill/Gadi Challan/MR flows, customer master API wiring, branch selection, print entry points, production API configuration, and available build checks.

The frontend and API were reachable during this audit. The API preflight for `https://bharat-transport-company.vercel.app` returned HTTP 204 with the expected CORS origin; a protected API request without a token returned HTTP 401. No authenticated test account or test records were available, so no production create/update/delete operations or browser print dialogs were run. Results below distinguish implementation/build verification from authenticated end-to-end verification.

## Page and dashboard inventory

| Page | Route(s) | Dashboard access |
|---|---|---|
| Accounts | `/accounts` | Yes |
| Audit | `/audit` | Yes (admin) |
| Backup | `/backup` | Yes (admin) |
| BillEntry | `/bill/new`, `/bill/edit/:id`, `/bill-entry`, `/bill-edit/:id` | Yes |
| BillList | `/bills`, `/bill/list` | Yes |
| BillPrint | `/bill-print`, `/bill-print/:id`, `/bills/:id/print` | Yes |
| Bills | No route; older duplicate list component | No; current list is BillList |
| BiltyEntry | `/consignments/new` | Yes |
| BiltyList | No route; older list component with stale navigation/API calls | No; current list is Consignments |
| BiltyPrint | `/bilty-print/:id?` | Yes; no-ID route now opens a selectable list |
| BranchLoginPage | `/branch-login/:slug` | No; dynamic public entry |
| BranchPayments | `/branch-payments` | Yes |
| BranchPortal | `/branch/:branchSlug` | No; requires a branch slug |
| Branches | `/branches` | Yes (admin menu/quick action) |
| Claims | `/claims` | Yes |
| Commissions | `/commissions` | Yes |
| Consignments | `/consignments` | Yes |
| Customers | `/customers` | Yes |
| Dashboard | `/`, `/dashboard` | It is the dashboard |
| Drivers | `/drivers` | Yes |
| EwayBill | `/eway` | Yes |
| Expenses | `/expenses` | Yes |
| GadiChallan | `/gadi-challan` | Yes |
| GadiChallanPrint | `/gadi-challan-print/:id?` | Yes; no-ID route opens a selectable list |
| GatePass | `/gate-pass` | Yes |
| Ledger | `/ledger` | Yes |
| Login | `/login` | No; public authentication entry |
| MR | `/mr` | Yes |
| MRCreate | `/mr/create` | Yes |
| MRPrint | `/mr/print`, `/mr-print/:id?` | Yes |
| Outstanding | `/outstanding` | Yes |
| POD | `/pod` | Yes |
| PODUpload | `/pod-upload` | Yes |
| PODView | `/pod-view` | Yes (added) |
| PartyEntry | `/party/new`, `/party/edit/:id` | Yes through Party Master |
| PartyList | `/party` | Yes (added) |
| Rates | `/rates` | Yes |
| Reports | `/reports` | Yes |
| StockManagement | `/stock` | Yes (admin) |
| TrackBilty | `/track` | Yes |
| Transit | `/transit` | Yes |
| Trips | `/trips` | Yes |
| Users | `/users` | Yes (admin) |
| Vehicles | `/vehicles` | Yes |

The branch portal and branch login require an actual slug, and Login is intentionally unauthenticated; none has a static dashboard destination. The two un-routed legacy components (`Bills` and `BiltyList`) are not used by the current routes. The latter still contains obsolete paths and a call to a nonexistent `biltyAPI.deleteByLR`; use the current Consignments page for bilty listing and management.

## Workflow status

| Flow/function | Status | Findings and changes |
|---|---|---|
| Bilty create/save | **Static PASS; E2E not verified** | Existing form calls the consignment API and reports save success/failure. LR generation no longer silently falls back to a likely-duplicate `BTC/YY/0001` when the API is unavailable. |
| Bilty list/open | **Static PASS; E2E not verified** | `/consignments` is routed and dashboard-linked. |
| Bilty print | **Static PASS; E2E not verified** | The dashboard's no-ID print link previously stayed on an indefinite loading screen. It now loads a selectable Bilty list, and failed loads show an error; per-record printing retains `window.print()` and print CSS. |
| Bill create/calculation/save | **Static PASS; E2E not verified** | Bill totals calculate freight/charges, GST, advance, and balance; the UI calls the transactional bill API. No authenticated save was performed. |
| Bill list/print | **Static PASS; E2E not verified** | List and print routes exist and are dashboard-linked. Print code includes `window.print()` and print CSS. |
| Gadi Challan create/save | **Static PASS; E2E not verified** | LR selection now supports multiple active bilties and auto-fills combined LR numbers, weights, packages, and freight. The existing `lr_no` database column stores the selected LRs as a comma-separated value. |
| Gadi Challan print | **Static PASS; E2E not verified** | Per-challan and selectable-list routes exist; print action and print CSS are present. |
| MR create/save | **Static PASS; E2E not verified** | MR can link either a Bilty or a Bill. Linked outstanding is prefilled; backend now validates positive/non-overpayment amounts, serializes receipt creation and balance updates in a transaction, and only marks a document paid when its outstanding reaches zero. |
| MR list/delete/print | **Static PASS; E2E not verified** | List and print routes exist. Delete now reverses the linked document's receipt totals/status in a transaction; frontend surfaces failed delete responses. |
| Party/customer create/edit/delete | **Static PASS; E2E not verified** | Added authenticated customer CRUD endpoints and schema migrations for the Party Master fields already used by the frontend; the Party Master list/edit/create routes are now dashboard-accessible. |
| GatePass, POD, Transit, Trips, Vehicles, Drivers, Reports, Tracking, Accounts, Ledger, Expenses, Claims, Rates, Branches, Backup, Stock, Users | **Routes/navigation present; E2E not verified** | Dashboard entries and corresponding routes were checked. Authenticated CRUD and print actions were not executed. |

## Configuration and build checks

- `frontend/.env.production` points to `https://bharat-transport-api.onrender.com`.
- The backend allows the deployed Vercel origin; deployed preflight check passed.
- No `N.B.T.C.` values or `localhost:5000` fallbacks remain in `frontend/src` or `backend`.
- Searchable/creatable Branch/From/To selection and localStorage persistence are implemented in `CreatableBranchSelect`; storage failures now produce a toast.
- Frontend production build: **PASS** (`npm --prefix frontend run build`).
- Backend syntax: **PASS** (`node --check backend/server.js`). The backend package does not define a `build` script.
- Live checks: frontend HTTP 200; API root HTTP 200; protected consignment endpoint HTTP 401 without credentials (expected); production CORS preflight HTTP 204 with the correct allow-origin.

## Remaining verification

Authenticated save/read/edit/delete and physical print output for Bilty, Bill, Gadi Challan, MR, Customer, and other pages still require a test login and test data. These were not simulated against production. Gadi Challan persists multiple LRs as a comma-separated string in the existing schema rather than as normalized linked rows.
