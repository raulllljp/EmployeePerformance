import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Employee, Department } from '../models';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  /** Base URL of the JSON Server mock API. */
  private readonly apiUrl = 'http://localhost:3000';

  private employeesSubject = new BehaviorSubject<Employee[]>([]);
  public employees$ = this.employeesSubject.asObservable();

  private departmentsSubject = new BehaviorSubject<Department[]>([]);
  public departments$ = this.departmentsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadData();
  }

  /** Fetch employees & departments from JSON Server and seed the BehaviorSubjects. */
  private loadData(): void {
    this.http.get<Employee[]>(`${this.apiUrl}/employees`).pipe(
      map(employees => employees.map(e => ({
        ...e,
        hireDate: new Date(e.hireDate)
      }))),
      catchError(this.handleError)
    ).subscribe(employees => this.employeesSubject.next(employees));

    this.http.get<Department[]>(`${this.apiUrl}/departments`).pipe(
      catchError(this.handleError)
    ).subscribe(departments => this.departmentsSubject.next(departments));
  }

  // ─── Employees ───────────────────────────────────────────────────────────────

  getAllEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/employees`).pipe(
      map(employees => employees.map(e => ({ ...e, hireDate: new Date(e.hireDate) }))),
      tap(employees => this.employeesSubject.next(employees)),
      catchError(this.handleError)
    );
  }

  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/employees/${id}`).pipe(
      map(e => ({ ...e, hireDate: new Date(e.hireDate) })),
      catchError(this.handleError)
    );
  }

  getEmployeesByDepartment(departmentId: number): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/employees?departmentId=${departmentId}`).pipe(
      map(employees => employees.map(e => ({ ...e, hireDate: new Date(e.hireDate) }))),
      catchError(this.handleError)
    );
  }

  addEmployee(employee: Omit<Employee, 'id'>): Observable<Employee> {
    return this.http.post<Employee>(`${this.apiUrl}/employees`, employee).pipe(
      map(e => ({ ...e, hireDate: new Date(e.hireDate) })),
      tap(newEmp => {
        const current = this.employeesSubject.value;
        this.employeesSubject.next([...current, newEmp]);
      }),
      catchError(this.handleError)
    );
  }

  updateEmployee(employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/employees/${employee.id}`, employee).pipe(
      map(e => ({ ...e, hireDate: new Date(e.hireDate) })),
      tap(updated => {
        const current = this.employeesSubject.value;
        const idx = current.findIndex(e => e.id === updated.id);
        if (idx !== -1) {
          const copy = [...current];
          copy[idx] = updated;
          this.employeesSubject.next(copy);
        }
      }),
      catchError(this.handleError)
    );
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/employees/${id}`).pipe(
      tap(() => {
        const current = this.employeesSubject.value;
        this.employeesSubject.next(current.filter(e => e.id !== id));
      }),
      catchError(this.handleError)
    );
  }

  // ─── Departments ─────────────────────────────────────────────────────────────

  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/departments`).pipe(
      tap(departments => this.departmentsSubject.next(departments)),
      catchError(this.handleError)
    );
  }

  getDepartmentById(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/departments/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // ─── Error Handling ──────────────────────────────────────────────────────────

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An unexpected error occurred.';
    if (error.status === 0) {
      message = 'Network error: Cannot reach the server. Is JSON Server running? (npm run server)';
    } else {
      message = `Server returned code ${error.status}: ${error.message}`;
    }
    console.error('[EmployeeService]', message, error);
    return throwError(() => new Error(message));
  }
}
