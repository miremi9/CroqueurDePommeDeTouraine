import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, distinctUntilChanged, startWith, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface AuthUser {
  idUser: string;
  nom: string;
  roles: string[];
  email: string | null;
}

interface AuthResponse {
  token: string;
  user?: AuthUser;
}

interface Credentials {
  nom: string;
  motDePasse: string;
}

interface ForgotPasswordPayload {
  email: string;
}

interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

interface UpdateProfilePayload {
  nom: string;
  email: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  getUsername(): string | null {
    const user = this.getUser();
    if (user?.nom) return user.nom;
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return typeof payload?.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'auth_user';
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
      .pipe(
        tap(res => {
          this.setToken(res.token);
          this.setUser(res.user);
        })
      );
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/users/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/users/reset-password`, payload);
  }

  updateProfile(payload: UpdateProfilePayload): Observable<AuthUser> {
    const currentUser = this.getUser();
    if (!currentUser?.idUser) {
      throw new Error('Utilisateur non connecté');
    }

    const body: AuthUser = {
      ...currentUser,
      nom: payload.nom,
      email: payload.email
    };

    return this.http
      .put<AuthUser>(`${environment.apiUrl}/users/${currentUser.idUser}`, body)
      .pipe(tap(user => this.setUser(user)));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.authenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private setToken(token: string | undefined) {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
      this.authenticatedSubject.next(true);
    }
  }

  private setUser(user: AuthUser | undefined) {
    if (!user) return;
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private hasToken(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) {
      return false;
    }
    return !this.isTokenExpired();
  }

  getRoles(): string[] {
    const user = this.getUser();
    if (user && Array.isArray(user.roles)) return user.roles;
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
    const user = this.getUser();
    if (typeof user?.idUser === 'string') return user.idUser;
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


