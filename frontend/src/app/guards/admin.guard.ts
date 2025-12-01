import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Roles } from '../model/roles';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const roles = authService.getRoles();

  if (roles.includes(Roles.ADMIN)) {
    return true;
  }

  return router.parseUrl('/accueil');
};

