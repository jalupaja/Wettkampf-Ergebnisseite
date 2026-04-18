## Dark Matter: Hidden Couplings

Found 7 file pairs that frequently co-change but have no import relationship:

| File A | File B | NPMI | Co-Changes | Lift |
|--------|--------|------|------------|------|
| Backend/src/routes/results.js | Backend/src/routes/routes.js | 0.753 | 5 | 4.88 |
| Frontend/src/lib/components/admin/GroupsManagement.svelte | Frontend/src/lib/components/admin/RoutesManagement.svelte | 0.654 | 6 | 3.51 |
| Frontend/src/lib/components/AdminDashboard.svelte | Frontend/src/lib/components/admin/ConfigManagement.svelte | 0.625 | 3 | 5.13 |
| Backend/src/routes/results.js | Frontend/src/lib/components/ResultsView.svelte | 0.566 | 3 | 4.39 |
| Frontend/src/lib/components/admin/RoutesManagement.svelte | Frontend/src/lib/components/admin/UsersManagement.svelte | 0.551 | 9 | 2.31 |
| Backend/src/routes/routes.js | Frontend/src/lib/api.js | 0.540 | 3 | 4.10 |
| Backend/src/routes/results.js | Frontend/src/lib/components/RoutesView.svelte | 0.511 | 5 | 2.93 |

These pairs likely share an architectural concern invisible to static analysis.
Consider adding explicit documentation or extracting the shared concern.