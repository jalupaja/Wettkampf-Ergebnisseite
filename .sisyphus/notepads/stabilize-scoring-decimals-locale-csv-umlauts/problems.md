
- `requireAthlete` middleware in `auth.js` strictly checks `req.user.role === 'athlete'`, preventing `finalist` users from performing basic athlete actions. This needs to be expanded to `['athlete', 'finalist'].includes(req.user.role)`.
- `results.js` backend fetches users strictly filtered by `role === 'athlete'`. It needs to include `finalist` users in the results computation.
- `GET /api/users` must be partially accessible or conditionally restricted so `ergebnisdienst` can fetch athletes without gaining full admin rights.

- The backend still relies on in-memory store mutation for role transitions, so finalist demotion/reassignment only persists for the current process lifetime.
- `ergebnisdienst` visibility is now limited for `/api/Users`, but other admin-adjacent endpoints remain admin-only by design.

- `RoutesView.svelte` still derives finalists locally; admin-targeted entry works only when the selected target is actually a finalist.
- Browser QA tooling was not available in this session, so verification is limited to build success and code inspection.
