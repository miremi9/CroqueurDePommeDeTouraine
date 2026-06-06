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

  resolveBackgroundImageSource(backgroundData: string | undefined | null): string | null {
    if (!backgroundData) {
      return null;
    }
    const value = backgroundData.trim();
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
    const body = document.body;

    if (siteBody.couleurPrincipale) {
      root.style.setProperty('--primary-color', siteBody.couleurPrincipale);
    }
    if (siteBody.couleurSecondaire) {
      root.style.setProperty('--secondary-color', siteBody.couleurSecondaire);
    }

    // Appliquer l'image de fond ou le gris par défaut
    const backgroundImageSource = this.resolveBackgroundImageSource(siteBody.backgroundImage);
    if (backgroundImageSource) {
      body.style.backgroundImage = `url('${backgroundImageSource}')`;
      body.style.backgroundSize = 'cover';
      body.style.backgroundAttachment = 'fixed';
      body.style.backgroundPosition = 'center center';
      body.style.backgroundRepeat = 'no-repeat';
    } else {
      body.style.backgroundImage = 'none';
      body.style.backgroundColor = '#cccccc';
    }

    // Appliquer le favicon dynamique si un logo est présent
    const logoSource = this.resolveLogoSource(siteBody.logo);
    this.setFavicon(logoSource);
  }

  private setFavicon(source: string | null): void {
    if (!source || typeof document === 'undefined') {
      return;
    }

    const head = document.head || document.getElementsByTagName('head')[0];

    // Remove existing favicon links to avoid duplicates
    const existing = head.querySelectorAll("link[rel~='icon']");
    existing.forEach((el) => el.parentNode?.removeChild(el));

    const link = document.createElement('link');
    link.rel = 'icon';

    // Try to load the image and render to a PNG data URL (works for SVG/PNG/remote images)
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          const pngData = canvas.toDataURL('image/png');
          link.href = pngData;
          head.appendChild(link);
          return;
        }
      } catch (err) {
        // fall through to set the original source as href
      }
      link.href = source;
      head.appendChild(link);
    };
    img.onerror = () => {
      // If loading failed (CORS or other), fallback to using the source directly
      link.href = source;
      head.appendChild(link);
    };

    // Start loading the image (data: or remote URL)
    img.src = source;
  }

  private createEmptySiteBody(): SiteBodyResponse {
    return {
      titre: '',
      basDePage: '',
      couleurPrincipale: '#094609',
      couleurSecondaire: '#0c6a3a',
      logo: '',
      url: '',
      backgroundImage: '',
    };
  }
}

