import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize, map, of, tap } from 'rxjs';
import { SiteBodyResponse } from '../model/article-response.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SiteBodyService {
  private readonly apiUrl = `${environment.apiUrl}/site-body`;
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
      .get<SiteBodyResponse | null>(this.apiUrl)
      .pipe(
        map((siteBody) => siteBody ?? this.createEmptySiteBody()),
        finalize(() => (this.loading = false))
      )
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
    return this.http.get<SiteBodyResponse | null>(this.apiUrl).pipe(
      map((siteBody) => siteBody ?? this.createEmptySiteBody()),
      tap((siteBody) => this.setSiteBody(siteBody))
    );
  }

  updateSiteBody(payload: SiteBodyResponse): Observable<SiteBodyResponse> {
    return this.http.put<SiteBodyResponse | null>(this.apiUrl, payload).pipe(
      map((updated) => updated ?? payload),
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

  private createEmptySiteBody(): SiteBodyResponse {
    return {
      titre: '',
      basDePage: '',
      couleurPrincipale: '#094609',
      couleurSecondaire: '#0c6a3a',
      logo: '',
    };
  }
}

