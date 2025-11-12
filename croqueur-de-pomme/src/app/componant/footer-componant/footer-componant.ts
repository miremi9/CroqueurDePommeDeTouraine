import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map } from 'rxjs';
import { SiteBodyService } from '../../services/site-body.service';

@Component({
  selector: 'app-footer-componant',
  imports: [AsyncPipe, NgIf],
  templateUrl: './footer-componant.html',
  styleUrl: './footer-componant.css',
})
export class FooterComponant {
  private readonly siteBodyService = inject(SiteBodyService);
  private readonly sanitizer = inject(DomSanitizer);

  siteFooter$ = this.siteBodyService.siteBody$.pipe(
    map((siteBody) => {
      if (!siteBody) {
        return null;
      }

      const basDePage: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
        siteBody.basDePage ?? ''
      );

      return {
        ...siteBody,
        basDePage,
      };
    })
  );

}
