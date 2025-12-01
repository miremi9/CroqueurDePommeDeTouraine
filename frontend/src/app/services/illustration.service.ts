import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Illustration {
  uuid: string;
  fileName: string;
  mimeType?: string;
}

@Injectable({ providedIn: 'root' })
export class IllustrationService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère une illustration par son UUID.
   * Retourne un Blob (binaire image). À convertir en URL via URL.createObjectURL si besoin.
   */
  getIllustration(uuid: string): Observable<Illustration> {
    return this.http.get<Illustration>(`${this.apiUrl}/illustrations/${uuid}`);
  }

  /**
   * Récupère le fichier d'une illustration par son UUID.
   * Retourne un Blob (binaire image). À convertir en URL via URL.createObjectURL si besoin.
   */
  getImage(uuid: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/illustrations/${uuid}/file`, {
      responseType: 'blob'
    });
  }

  /**
   * Récupère le fichier complet d'une illustration sous forme de File.
   */
  getFile(uuid: string, fileName?: string, mimeType?: string): Observable<File> {
    return this.getImage(uuid).pipe(
      map((blob) => {
        const name = fileName || `illustration-${uuid}`;
        const type = mimeType || blob.type || 'application/octet-stream';
        return new File([blob], name, { type });
      })
    );
  }

  
  /**
   * Crée une illustration (upload fichier). Optionnellement, on peut passer des métadonnées.
   * L'API attend généralement un multipart/form-data avec la clé "file".
   */
  createIllustration(file: File, metadata?: Record<string, string>): Observable<Illustration> {
    console.log('createIllustration', file, metadata);
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value != null) formData.append(key, value);
      });
    }
    return this.http.post<Illustration>(`${this.apiUrl}/illustrations`, formData);
  }

  /**
   * Supprime une illustration par son UUID.
   */
  deleteIllustration(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/illustrations/${uuid}`);
  }
}


