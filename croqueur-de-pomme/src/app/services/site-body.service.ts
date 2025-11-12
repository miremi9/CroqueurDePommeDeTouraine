import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, finalize, of } from 'rxjs';
import { SiteBodyResponse } from '../model/article-response.model';

@Injectable({
  providedIn: 'root',
})
export class SiteBodyService {
  private readonly apiUrl = '/api/site-body';
  private readonly http = inject(HttpClient);

  private siteBodySubject = new BehaviorSubject<SiteBodyResponse | null>(null);
  siteBody$ = this.siteBodySubject.asObservable();

  private loading = false;
  private loadedOnce = false;

  ensureLoaded(): void {
    if (this.loadedOnce || this.loading) {
      return;
    }
    this.loading = true;
    this.http
      .get<SiteBodyResponse>(this.apiUrl)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (siteBody) => this.setSiteBody(siteBody),
        error: (error) => {
          console.error('Erreur lors du chargement du site body', error);
        },
      });
  }

  getSiteBody(): Observable<SiteBodyResponse> {
    if (this.siteBodySubject.value) {
      return of(this.siteBodySubject.value);
    }
    return this.http.get<SiteBodyResponse>(this.apiUrl).pipe(
      tap((siteBody) => this.setSiteBody(siteBody))
    );
  }

  updateSiteBody(payload: SiteBodyResponse): Observable<SiteBodyResponse> {
    return this.http.put<SiteBodyResponse>(this.apiUrl, payload).pipe(
      tap((updated) => this.setSiteBody(updated))
    );
  }

  resolveLogoSource(logoData: string | undefined | null): string | null {
    if (!logoData) {
      return null;
    }
    const value = logoData.trim();
    if (!value) {
      return null;
    }
    if (value.startsWith('http') || value.startsWith('data:')) {
      return value;
    }
    return `data:image/png;base64,${value}`;
  }

  private setSiteBody(siteBody: SiteBodyResponse): void {
    this.loadedOnce = true;
    this.siteBodySubject.next(siteBody);
    this.applyTheme(siteBody);
  }

  private applyTheme(siteBody: SiteBodyResponse): void {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    if (siteBody.couleurPrincipale) {
      root.style.setProperty('--primary-color', siteBody.couleurPrincipale);
    }
    if (siteBody.couleurSecondaire) {
      root.style.setProperty('--secondary-color', siteBody.couleurSecondaire);
    }
  }
}

