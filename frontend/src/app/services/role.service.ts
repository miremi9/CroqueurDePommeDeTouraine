// src/app/services/role.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// À adapter si tu as déjà un modèle RoleDAO / Role
export interface RoleDAO {
  idRole?: string;   // ou number, selon ton backend
  nomRole: string;      // ou libellé du rôle
  // ajoute ici les autres champs de RoleDAO si besoin
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les rôles
   * GET /roles
   */
  getAllRoles(): Observable<RoleDAO[]> {
    return this.http.get<RoleDAO[]>(`${this.apiUrl}/roles`);
  }

  /**
   * Crée un nouveau rôle
   * POST /roles
   */
  createRole(role: RoleDAO): Observable<RoleDAO> {
    return this.http.post<RoleDAO>(`${this.apiUrl}/roles`, role);
  }

  /**
   * Met à jour un rôle existant
   * PUT /roles
   * (le backend récupère le rôle à partir du body)
   */
  updateRole(role: RoleDAO): Observable<RoleDAO> {
    return this.http.put<RoleDAO>(`${this.apiUrl}/roles`, role);
  }
}