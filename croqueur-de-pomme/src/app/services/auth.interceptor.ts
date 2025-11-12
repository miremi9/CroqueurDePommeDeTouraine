import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Vérifier si le token est expiré avant d'envoyer la requête
  if (token && authService.isTokenExpired()) {
    authService.logout();
    return throwError(() => new Error('Token expiré'));
  }

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si la réponse est 401 (Unauthorized), le token est probablement expiré ou invalide
        if (error.status === 401) {
          authService.logout();
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};


