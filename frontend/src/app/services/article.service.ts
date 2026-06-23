import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ArticleResponse } from '../model/article-response.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})


export class ArticleService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les articles depuis l'API
   */

  getRecentArticles(max: number): Observable<ArticleResponse[]> {

    return this.http.get<ArticleResponse[]>(`${this.apiUrl}/articles/recents?limit=${max}`);
  }

  getFrontPageArticles(): Observable<ArticleResponse[]> {
    return this.http.get<ArticleResponse[]>(`${this.apiUrl}/articles/frontPage`);
  }

  getAccueilArticles(recentLimit = 3): Observable<ArticleResponse[]> {
    return this.getFrontPageArticles().pipe(
      switchMap(articles => articles.length > 0
        ? of(articles)
        : this.getRecentArticles(recentLimit)),
      catchError(() => this.getRecentArticles(recentLimit))
    );
  }

  getArticles(): Observable<ArticleResponse[]> {
    return this.http.get<ArticleResponse[]>(`${this.apiUrl}/articles`);
  }

  /**
   * Récupère un article par son ID
   */
  getArticleById(id: number | string): Observable<ArticleResponse> {
    return this.http.get<ArticleResponse>(`${this.apiUrl}/articles/${id}`);
  }

  /**
   * Crée un nouvel article
   */
  createArticle(article: ArticleResponse): Observable<ArticleResponse> {
    return this.http.post<ArticleResponse>(`${this.apiUrl}/articles`, article);
  }

  /**
   * Met à jour un article existant
   */
  updateArticle(id: number | string, article: ArticleResponse): Observable<ArticleResponse> {
    return this.http.put<ArticleResponse>(`${this.apiUrl}/articles/${id}`, article);
  }

  /**
   * Supprime un article
   */
  deleteArticle(id: number | string): Observable<string> {
    return this.http.delete(`${this.apiUrl}/articles/${id}`, {
      responseType: 'text'
    });
  }

  getArticlesBySection(section: number): Observable<ArticleResponse[]> {
    // Log pour vérifier que l'URL est correcte
    const url = `${this.apiUrl}/articles/bySection?idSection=${section}`;
    console.log('ArticleService - URL de la requête:', url);
    
    const response = this.http.get<ArticleResponse[]>(url);
    return response;
  }

}

