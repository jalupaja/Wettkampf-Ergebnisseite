
### Implementation Plan: Ergebnisdienst, Finalist Auto-assign, Admin Route Editing

**1. Backend Access & Middleware**
- Add a new middleware `requireAdminOrErgebnisdienst` in `auth.js`.
- Apply this middleware to `GET /api/users` so that the `ergebnisdienst` can fetch athletes to populate user selection dropdowns.
- `ergebnisdienst` will not have access to POST/PUT/DELETE on `/api/users`.

**2. Backend Route Editing (Impersonation)**
- Update `routes/routes.js` (`GET /`, `POST /result`, `POST /bonus`) to accept an optional `userId` parameter.
- If `userId` is provided and differs from `req.user.id`, verify that `req.user.role` is `admin` or `ergebnisdienst`.
- Use this `userId` to fetch/update the route results.

**3. Finalist Auto-Assignment**
- In `routes/config.js` (`PUT /`), detect when `competitionState` transitions to `finale`.
- When this transition occurs, calculate the top athletes for each group (reusing the logic from `results.js`).
- Automatically update the `role` of these athletes from `athlete` to `finalist`.
- (Optional but recommended) If state transitions from `finale` back to `qualification`, reset all `finalist` roles back to `athlete`.

**4. Frontend Dashboard & Routing**
- Update `Dashboard.svelte` to render `AdminDashboard.svelte` for `ergebnisdienst` as well.
- In `AdminDashboard.svelte`, add a new tab `Ergebniseingabe` (AdminRoutesView).
- Hide the `users`, `groups`, `routes`, `config`, and `status` tabs for `ergebnisdienst` (they should only see `Rangliste` and `Ergebniseingabe`).

**5. Frontend User Selection (AdminRoutesView.svelte)**
- Create a new component `AdminRoutesView.svelte` that fetches all users and groups.
- Provide dropdowns to filter by Startklasse and select a specific Athlete/Finalist.
- Render `RoutesView.svelte` for the selected user by passing the user object as a prop.

**6. RoutesView Adaptation**
- Modify `RoutesView.svelte` to accept a `targetUser` prop.
- Replace internal references to `$userStore.id` with `targetUser.id`.
- Update the API calls (`api.routes.list`, `api.routes.setResult`, `api.routes.setBonusResult`) to include the `targetUser.id` payload.
- Update `isFinalist` logic: it can now directly check if `targetUser.role === 'finalist'` instead of computing finalists locally.

**7. Risks & Edge Cases to Handle**
- Admins manually assigning the `finalist` role during `qualification` state: `RoutesView` must still gate finale routes strictly behind `competitionState === 'finale'`.
- Security: Ensure the backend strictly checks `admin` or `ergebnisdienst` roles before allowing any `userId` override in route submissions.

**8. Preserving Athlete Behavior for Finalists**
- Update `requireAthlete` middleware in `auth.js` to allow both `athlete` and `finalist` roles.
- Update user filtering in `results.js` to fetch `role === 'athlete' || role === 'finalist'` so finalists don't disappear from the rankings.

### Backend Role/State Enforcement Decision
- Keep `requireAdmin` strict for mutation-heavy routes and introduce a separate `requireAdminOrErgebnisdienst` for limited `ergebnisdienst` access.
- Resolve finalist state on competition transitions only, by resetting stale finalists before reassigning them from current results.
- Validate target user existence in route submission handlers before processing `userId` overrides to avoid silent writes to invalid IDs.
