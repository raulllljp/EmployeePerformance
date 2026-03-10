import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { User, UserClass } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  // Mock users for demonstration
  private mockUsers: User[] = [
    { id: 1, username: 'manager', email: 'manager@company.com', role: 'manager', employeeId: 2 },
    { id: 2, username: 'employee', email: 'employee@company.com', role: 'employee', employeeId: 3 }
  ];

  constructor() {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string): Observable<User> {
    // Mock login - in real app, this would make HTTP request
    return of(null).pipe(
      delay(1000), // Simulate API call
      map(() => {
        const user = this.mockUsers.find(u => u.username === username);
        if (user && password === 'password123') {
          const userWithToken = { ...user, token: 'mock-jwt-token-' + user.id };
          localStorage.setItem('currentUser', JSON.stringify(userWithToken));
          this.currentUserSubject.next(userWithToken);
          return userWithToken;
        }
        throw new Error('Invalid username or password');
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  hasRole(roles: string[]): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return roles.includes(user.role);
  }

  isAdmin(): boolean {
    return this.isManager(); // kept for backwards compatibility; manager is the highest role
  }

  isManager(): boolean {
    return this.hasRole(['manager']);
  }
}
