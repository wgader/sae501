import type { AssociationModule } from '@/lib/api';

export const ADMIN_ROLE = 'ROLE_ADMIN';

export const AGENT_MODULES: ReadonlyArray<{ id: AssociationModule; title: string; description: string; role: string }> = [
  { id: 'evenements', title: 'Événement', description: 'Gestion des événements externes', role: 'ROLE_GESTION_EVENT' },
  { id: 'subventions', title: 'Subvention', description: 'Gestion des demandes de subvention', role: 'ROLE_GESTION_SUBVENTION' },
  { id: 'materiel', title: 'Matériel', description: 'Gestion des réservations de matériel', role: 'ROLE_GESTION_MATERIEL' },
  { id: 'salles', title: 'Salle', description: 'Gestion des réservations de salles', role: 'ROLE_GESTION_SALLE' },
];

/** Pages de l'administration ouvertes à un agent selon ses modules ; les autres sont réservées aux administrateurs. */
const MODULE_PAGES: ReadonlyArray<{ path: string; module: AssociationModule }> = [
  { path: '/admin/salle', module: 'salles' },
  { path: '/admin/campagnes', module: 'salles' },
  { path: '/admin/materiel', module: 'materiel' },
  { path: '/admin/subvention', module: 'subventions' },
  { path: '/admin/evenements', module: 'evenements' },
];

export interface AgentAccess {
  isAdmin: boolean;
  modules: AssociationModule[];
}

/** Un administrateur dispose de tous les modules, quels que soient ceux enregistrés. */
export function accessFromRoles(roles: string[]): AgentAccess {
  const isAdmin = roles.includes(ADMIN_ROLE);
  return {
    isAdmin,
    modules: AGENT_MODULES.filter(
      (module) => isAdmin || roles.includes(module.role) || (module.id === 'evenements' && roles.includes('ROLE_ADMIN_GESTION_EVENT')),
    ).map((module) => module.id),
  };
}

export function canOpenAdminPage(pathname: string, access: AgentAccess): boolean {
  if (access.isAdmin) return true;
  const page = MODULE_PAGES.find(({ path }) => pathname === path || pathname.startsWith(`${path}/`));
  return page !== undefined && access.modules.includes(page.module);
}

/** Page d'arrivée : le tableau de bord pour un administrateur, le premier module pour un agent. */
export function adminHomePath(access: AgentAccess): string {
  if (access.isAdmin) return '/admin/dashboard';
  return MODULE_PAGES.find(({ module }) => access.modules.includes(module))?.path ?? '/admin/dashboard';
}

/** Page d'arrivée du compte connecté, sans passer par une page qu'il ne peut pas ouvrir. */
export function adminHomePathForRoles(roles: string[]): string {
  return adminHomePath(accessFromRoles(roles));
}

export function rolesFromAccess({ isAdmin, modules }: AgentAccess): string[] {
  if (isAdmin) return [ADMIN_ROLE];
  return AGENT_MODULES.filter((module) => modules.includes(module.id)).map((module) => module.role);
}

export function describeAccess({ isAdmin, modules }: AgentAccess): string {
  if (isAdmin) return 'Administrateur (tous les modules)';
  return AGENT_MODULES.filter((module) => modules.includes(module.id)).map((module) => module.title).join(', ');
}
