
- Fixed rankings table header wrapping by increasing `.rank-col` width to 75px and adding `white-space: nowrap` in `RankingsTable.svelte`.

- Frontend UI updated to support editing of all user fields (including username) and assigning new roles ('ergebnisdienst', 'finalist').
Task completed: Admin UI for role behavior updated

- Learned that `ergebnisdienst` and `finalist` roles are already partially present in the UI (`UsersManagement.svelte`) and backend `users.js` validation, but the core functionality (auto-assign, route editing impersonation) is missing.
- Computed finalists are currently calculated on the fly in `RoutesView.svelte`. With the new role, this logic can be moved to the backend state transition.

## Backend Role Management (admin, athlete, ergebnisdienst, finalist)
- When building multi-state systems without a database, you must propagate role state carefully. We added a 'finalist' role that gets assigned automatically based on ranking logic during competition state transitions ('qualification' to 'finale').
- Added 'ergebnisdienst' (result service) which behaves identically to 'admin' in backend endpoints but limits privileges.
- Admin users can modify athlete routes through backend APIs by passing 'userId' in the payload. Backend enforcement of competition state is critical so users cannot enter bonus points while finals are running.

- Backend now supports `ergebnisdienst` access to user listings via a dedicated middleware, while keeping full admin-only mutation endpoints gated.
- Finalist roles are now treated as reversible state during competition transitions: entering `finale` re-computes finalists, leaving `finale` demotes previous finalists back to `athlete`.
- Route entry and bonus submission now validate target users before applying `userId` overrides, which keeps admin impersonation explicit and bounded.

- Final-state standings now branch on `competitionState === 'finale'`: total ranking points use only final-route points, while qualification scoring remains unchanged outside finale.

- Added admin target-user route entry by reusing `RoutesView.svelte` with a `targetUser` prop; self-entry remains the default when no target is passed.
- Frontend API route helpers now pass optional `userId` for route reads/writes so admin and athlete flows share the same component path.

- README now explicitly documents the accepted plaintext-password/admin-visibility tradeoff and includes the required AI-agent disclaimer directly under the main header.
