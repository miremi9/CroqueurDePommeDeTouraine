import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, distinctUntilChanged, startWith, map } from 'rxjs';

interface AuthResponse {
  token: string;
}

interface Credentials {
  nom: string;
  motDePasse: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  getUsername(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return typeof payload?.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }
  private readonly apiUrl = '/api/auth';
  private readonly tokenKey = 'auth_token';
  private http = inject(HttpClient);
  

  private authenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  isAuthenticated$ = this.authenticatedSubject.asObservable();


  register(credentials: Credentials): Observable<string> {
    // L'API renvoie du texte (ex: "User registered") → éviter le parse JSON
    return this.http.post(`${this.apiUrl}/register`, credentials, { responseType: 'text' });
  }

  login(credentials: Credentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap(res => this.setToken(res.token)));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.authenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string | undefined) {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
      this.authenticatedSubject.next(true);
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return Array.isArray(payload.roles) ? payload.roles : [];
    } catch {
      return [];
    }
  }

  getId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return typeof payload?.userId === 'string' ? payload.userId : null;
    } catch {
      return null;
    }
  }

  /**
   * Vérifie si le token JWT est expiré
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      if (!payload.exp) return true; // Pas de date d'expiration = considéré comme expiré
      
      const expirationDate = new Date(payload.exp * 1000); // exp est en secondes
      return expirationDate < new Date();
    } catch {
      return true; // Erreur de décodage = considéré comme expiré
    }
  }

  // dans AuthService
  roles$ = this.isAuthenticated$.pipe(
  // recalcule quand l'auth change (login/logout)
  map(() => this.getRoles()),
  startWith(this.getRoles()),
  distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
);

}


