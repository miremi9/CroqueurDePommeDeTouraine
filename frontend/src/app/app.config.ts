// app.config.ts
import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';

import { RouteService } from './services/route.service';
import { createRoutes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors([authInterceptor])),
    RouteService,
    provideRouter(createRoutes()),  // charge les routes statiques initiales
    provideAppInitializer(() => {
      const routeService = inject(RouteService);
      const router = inject(Router);
      
      return firstValueFrom(
        routeService.getDynamicRoutes().pipe(
          tap(dynamicRoutes => {
            const routes = createRoutes(dynamicRoutes);
            router.resetConfig(routes);
          })
        )
      );
    })
  ],
};
