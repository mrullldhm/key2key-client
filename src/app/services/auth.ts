import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment'; // Set your backend URL here

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`; // e.g., http://localhost:5000/api/v1/auth

  // Sign Up
  signup(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sign-up`, userData).pipe(
      tap((res: any) => {
        if (res.success && res.data.token) {
          this.saveSession(res.data.token);
        }
      })
    );
  }

  // Sign In
  signin(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sign-in`, credentials).pipe(
      tap((res: any) => {
        if (res.success && res.data.token) {
          this.saveSession(res.data.token);
        }
      })
    );
  }

  // Helper to store the JWT (You could also use a Signal for this)
  private saveSession(token: string) {
    localStorage.setItem('k2k_token', token);
  }

  // Get Vault Salt (For Login Flow)
  getVaultSalt(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/salt/${email}`);
  }

  logout() {
    localStorage.removeItem('k2k_token');
  }
}
