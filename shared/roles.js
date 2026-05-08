// Shared enumeration for user roles used by both backend and frontend
export const Roles = Object.freeze({
  ADMIN: 'admin',
  ATHLETE: 'athlete',
  FINALIST: 'finalist',
  SCHIEDSRICHTER: 'schiedsrichter'
});

export const RoleValues = Object.values(Roles);

export default Roles;
