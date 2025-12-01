import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { MenuComponent } from '../menu/menu';
import { SiteBodyService } from '../../services/site-body.service';

@Component({
  selector: 'app-header-componant',
  imports: [MenuComponent, AsyncPipe, NgIf],
  templateUrl: './header-componant.html',
  styleUrl: './header-componant.css',
})
export class HeaderComponant {
  private readonly siteBodyService = inject(SiteBodyService);

  siteBody$ = this.siteBodyService.siteBody$.pipe(
    map((siteBody) => {
      if (!siteBody) {
        return null;
      }
      const logoSrc = this.siteBodyService.resolveLogoSource(siteBody.logo);
      return {
        ...siteBody,
        logoSrc,
      };
    })
  );
}
