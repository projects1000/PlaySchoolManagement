import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Student, StudentRegistrationRequest, StudentResponse, MessageResponse } from '../models/student.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly API_URL = `${environment.apiUrl}/students`;
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Get all active students
   */
  getAllStudents(): Observable<StudentResponse[]> {
    return this.http.get<StudentResponse[]>(this.API_URL, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get student by ID
   */
  getStudentById(id: number): Observable<StudentResponse> {
    return this.http.get<StudentResponse>(`${this.API_URL}/${id}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Register a new student
   */
  registerStudent(student: StudentRegistrationRequest): Observable<StudentResponse> {
    return this.http.post<StudentResponse>(`${this.API_URL}/register`, student, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Update existing student
   */
  updateStudent(id: number, student: StudentRegistrationRequest): Observable<StudentResponse> {
    return this.http.put<StudentResponse>(`${this.API_URL}/${id}`, student, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Delete/Deactivate student
   */
  deleteStudent(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.API_URL}/${id}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Reactivate student
   */
  reactivateStudent(id: number): Observable<StudentResponse> {
    return this.http.put<StudentResponse>(`${this.API_URL}/${id}/reactivate`, {}, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Search students by name
   */
  searchStudents(name: string): Observable<StudentResponse[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<StudentResponse[]>(`${this.API_URL}/search`, { ...this.httpOptions, params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get students by parent email
   */
  getStudentsByParentEmail(email: string): Observable<StudentResponse[]> {
    return this.http.get<StudentResponse[]>(`${this.API_URL}/parent/${email}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get total active students count
   */
  getTotalActiveStudents(): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/count`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.statusText}`;
      }
    }
    
    console.error('StudentService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Utility method to format date for API
   */
  formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Utility method to convert StudentResponse to Student
   */
  convertToStudent(response: StudentResponse): Student {
    return {
      id: response.id,
      studentId: response.studentId,
      firstName: response.firstName,
      lastName: response.lastName,
      dateOfBirth: response.dateOfBirth,
      gender: response.gender as 'MALE' | 'FEMALE' | 'OTHER',
      address: response.address,
      parentName: response.parentName,
      parentPhone: response.parentPhone,
      parentEmail: response.parentEmail,
      emergencyContact: response.emergencyContact,
      emergencyPhone: response.emergencyPhone,
      medicalInfo: response.medicalInfo,
      allergies: response.allergies,
      enrollmentDate: response.enrollmentDate,
      isActive: response.isActive
    };
  }
}
