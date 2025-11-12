import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {  Observable } from 'rxjs';
import { SectionResponse } from '../model/article-response.model';

/**
 * Interface pour les données de route dynamiques
 */


/**
 * Service pour récupérer la liste des routes dynamiques
 * Adaptez ce service selon votre API
 */


@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private readonly apiUrl = '/api'; 

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des routes depuis l'API
   * Adaptez cette méthode selon votre endpoint réel
   */
  getDynamicRoutes(): Observable<SectionResponse[]> {
    // Exemple : ajustez l'URL selon votre API
    console.log(`${this.apiUrl}/sections`);

     const response = this.http.get<SectionResponse[]>(`${this.apiUrl}/sections`);
     return response;
  }

  updateSection(section: SectionResponse): Observable<SectionResponse> {
    return this.http.put<SectionResponse>(`${this.apiUrl}/sections/${section.idSection}`, section);
  }

  createSection(section: Partial<SectionResponse>): Observable<SectionResponse> {
    return this.http.post<SectionResponse>(`${this.apiUrl}/sections`, section);
  }

}