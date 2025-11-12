import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserResponse } from '../model/article-response.model';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = '/api';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/users`);
  }

  updateUser(user:UserResponse): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/users/${user?.idUser}`, user);
  }
  createUser(payload: { nom: string; roles: string[] }): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/users`, payload);
  }
}

