import { Routes } from '@angular/router';
import { AccueilPageComponent } from './pages/accueil/accueil-page.component';
import { SectionResponse } from './model/article-response.model';
import { DynamicPage } from './pages/dynamic-page/dynamic-page';
import { AdminEditSectionComponent } from './pages/admin-edit-section/admin-edit-section.component';
import { AdminEditRoleComponent } from './pages/admin-edit-role/admin-edit-role.component';
import { AdminEditSiteComponent } from './pages/admin-edit-site/admin-edit-site.component';
import { adminGuard } from './guards/admin.guard';

/**
 * Routes statiques de base de l'application
 */
export const baseRoutes: Routes = [
  {
    path: '',
    redirectTo: '/accueil',
    pathMatch: 'full',
    data: { 
      title: 'Accueil'
      ,parent: null
     }
  },
  {
    path: 'accueil',
    component: AccueilPageComponent
  },
  {
    path: 'admin/edit-section',
    component: AdminEditSectionComponent,
    canActivate: [adminGuard],
    data: { title: 'Edit Section' }
  },
  {
    path: 'admin/edit-role',
    component: AdminEditRoleComponent,
    canActivate: [adminGuard],
    data: { title: 'Edit Role' }
  },
  {
    path: 'admin/edit-site',
    component: AdminEditSiteComponent,
    canActivate: [adminGuard],
    data: { title: 'Edit Site' }
  },
];

/**
 * Combine les routes statiques avec les routes dynamiques
 * Cette fonction est utilisée dans app.config.ts pour créer les routes finales
 */
export function createRoutes(dynamicRoutes: SectionResponse[] = []): Routes {
  const routes: Routes = [...baseRoutes];

  console.log("Create routes");
  // Ajoute les routes dynamiques
  for (const route of dynamicRoutes) {
    console.log(route);
    routes.push({
      path: route.path,
      component: DynamicPage,
      data: { title: route.nom, routeData: route},
      pathMatch: 'full'
    });
  }
  return routes;

}

// Export des routes de base pour utilisation immédiate (routes statiques uniquement)
export const routes: Routes = baseRoutes;