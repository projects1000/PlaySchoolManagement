import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, map } from 'rxjs';
import { LoginRequest, SignupRequest, JwtResponse, MessageResponse, User, AuthState } from '../models/auth.model';
import { EnvironmentService } from '../core/services/environment.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<AuthState>({
    isLoggedIn: false,
    user: null,
    token: null
  });

  public authState$ = this.authStateSubject.asObservable();
  private readonly TOKEN_KEY = 'auth-token';
  private readonly USER_KEY = 'auth-user';

  constructor(
    private http: HttpClient,
    private envService: EnvironmentService
  ) {
    this.loadStoredAuth();
  }

  private getApiEndpoint(): string {
    const baseUrl = this.envService.getApiUrl();
    return `${baseUrl}/auth`;
  }

  private getHttpOptions(skipAuth: boolean = false): { headers: HttpHeaders } {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Skip authentication for specific endpoints like test endpoints
    if (skipAuth) {
      return { headers };
    }

    // Add authentication headers if we have a token
    const token = this.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // For cloud environment, add basic auth for non-authenticated requests
    if (!this.envService.isLocal() && !token) {
      const credentials = btoa('admin:admin123');
      headers = headers.set('Authorization', `Basic ${credentials}`);
    }

    return { headers };
  }

  // Load stored authentication state on service initialization
  private loadStoredAuth(): void {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const userStr = localStorage.getItem(this.USER_KEY);
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        this.authStateSubject.next({
          isLoggedIn: true,
          user,
          token
        });
        console.log('🔐 Auth: Loaded stored authentication state');
      }
    } catch (error) {
      console.error('🔐 Auth: Error loading stored authentication:', error);
      this.logout();
    }
  }

  // Test auth endpoint connectivity
  testAuthEndpoint(): Observable<MessageResponse> {
    const url = `${this.getApiEndpoint()}/test-signin`;
    console.log('🔐 Auth: Testing endpoint:', url);
    
    // Use skipAuth for test endpoint in local environment
    const httpOptions = this.getHttpOptions(this.envService.isLocal());
    
    return this.http.post<MessageResponse>(url, {}, httpOptions).pipe(
      tap(response => {
        console.log('🔐 Auth: Test endpoint success:', response);
      }),
      catchError(error => {
        console.error('🔐 Auth: Test endpoint error:', error);
        return throwError(() => error);
      })
    );
  }

  // Login user
  login(credentials: LoginRequest): Observable<JwtResponse> {
    const url = `${this.getApiEndpoint()}/signin`;
    console.log('🔐 Auth: Attempting login for user:', credentials.username);
    
    return this.http.post<JwtResponse>(url, credentials, this.getHttpOptions(true)).pipe(
      tap(response => {
        console.log('🔐 Auth: Login successful:', response);
        this.storeAuthData(response);
        
        const user: User = {
          id: response.id,
          username: response.username,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          roles: response.roles
        };

        this.authStateSubject.next({
          isLoggedIn: true,
          user,
          token: response.token
        });
      }),
      catchError(error => {
        console.error('🔐 Auth: Login error:', error);
        return this.handleAuthError(error, 'Login');
      })
    );
  }

  // Register new user
  signup(signupData: SignupRequest): Observable<MessageResponse> {
    const url = `${this.getApiEndpoint()}/signup`;
    console.log('🔐 Auth: Attempting signup for user:', signupData.username);
    
    return this.http.post<MessageResponse>(url, signupData, this.getHttpOptions(true)).pipe(
      tap(response => {
        console.log('🔐 Auth: Signup successful:', response);
      }),
      catchError(error => {
        console.error('🔐 Auth: Signup error:', error);
        return this.handleAuthError(error, 'Signup');
      })
    );
  }

  // Create admin user (for testing)
  createAdmin(): Observable<MessageResponse> {
    const url = `${this.getApiEndpoint()}/create-admin`;
    console.log('🔐 Auth: Creating admin user');
    
    return this.http.post<MessageResponse>(url, {}, this.getHttpOptions(true)).pipe(
      tap(response => {
        console.log('🔐 Auth: Admin creation:', response);
      }),
      catchError(error => {
        console.error('🔐 Auth: Admin creation error:', error);
        return this.handleAuthError(error, 'Create Admin');
      })
    );
  }

  // Logout user
  logout(): void {
    console.log('🔐 Auth: Logging out user');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this.authStateSubject.next({
      isLoggedIn: false,
      user: null,
      token: null
    });
  }

  // Store authentication data
  private storeAuthData(authResponse: JwtResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResponse.token);
    
    const user: User = {
      id: authResponse.id,
      username: authResponse.username,
      email: authResponse.email,
      firstName: authResponse.firstName,
      lastName: authResponse.lastName,
      roles: authResponse.roles
    };
    
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.authStateSubject.value.user;
  }

  // Check if user is logged in
  isLoggedIn(): Observable<boolean> {
    return this.authState$.pipe(
      map((state: AuthState) => state.isLoggedIn)
    );
  }

  // Check if user is logged in (synchronous for template usage)
  get isAuthenticated(): boolean {
    return this.authStateSubject.value.isLoggedIn;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.roles.includes(role) : false;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  // Check if user is teacher
  isTeacher(): boolean {
    return this.hasRole('ROLE_TEACHER');
  }

  // Check if user is parent
  isParent(): boolean {
    return this.hasRole('ROLE_PARENT');
  }

  // Enhanced error handler for CORS and connectivity issues
  private handleAuthError(error: any, operation: string): Observable<never> {
    let errorMessage = '';
    
    if (error.status === 0) {
      // CORS or network error
      if (error.error instanceof ProgressEvent) {
        errorMessage = `🌐 Connection Issue: Unable to reach the backend server. This might be due to CORS configuration or network connectivity.`;
      } else {
        errorMessage = `🌐 Network Error: Cannot connect to authentication server.`;
      }
      
      console.error(`🚨 CORS/Network Error in ${operation}:`, {
        frontend: window.location.origin,
        backend: this.envService.getApiUrl(),
        error: error
      });
      
    } else if (error.status >= 500) {
      errorMessage = `🔧 Server Error: The backend server is experiencing issues. Please try again later.`;
    } else if (error.status === 401) {
      errorMessage = `🔐 Authentication Failed: Invalid credentials or session expired.`;
    } else if (error.status === 403) {
      errorMessage = `🚫 Access Denied: You don't have permission to access this resource.`;
    } else {
      errorMessage = error.error?.message || `❌ ${operation} failed. Please try again.`;
    }

    return throwError(() => ({
      ...error,
      userMessage: errorMessage
    }));
  }
}
