import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmployeeService } from '../../services/employee.service';
import { PerformanceService } from '../../services/performance.service';
import { Employee, Department } from '../../models';
import { EmployeeFilterPipe } from '../../pipes/employee-filter.pipe';
import { TopPerformerDirective } from '../../directives/top-performer.directive';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-employee-list',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatBadgeModule,
    EmployeeFilterPipe,
    TopPerformerDirective
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeList implements OnInit, OnDestroy {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  departments: Department[] = [];
  displayedColumns = ['name', 'email', 'position', 'department', 'status', 'rating', 'actions'];
  searchTerm = '';
  selectedDepartment = 'all';
  minRating = 0;
  employeePerformance: Map<number, number> = new Map();

  private destroy$ = new Subject<void>();

  get isAdmin(): boolean {
    return this.authService.currentUserValue?.role === 'manager';
  }

  constructor(
    private employeeService: EmployeeService,
    private performanceService: PerformanceService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDepartments();
    this.loadPerformanceData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.employees = employees;
        this.applyFilters();
      });
  }

  loadDepartments(): void {
    this.employeeService.getAllDepartments()
      .pipe(takeUntil(this.destroy$))
      .subscribe(departments => {
        this.departments = departments;
      });
  }

  loadPerformanceData(): void {
    // Use the live BehaviorSubject stream so ratings update when a review is added
    this.performanceService.performanceRecords$
      .pipe(takeUntil(this.destroy$))
      .subscribe(records => {
        const employeeRatings: Map<number, number[]> = new Map();
        records.forEach(record => {
          if (!employeeRatings.has(record.employeeId)) {
            employeeRatings.set(record.employeeId, []);
          }
          employeeRatings.get(record.employeeId)!.push(record.overallRating);
        });
        const updated: Map<number, number> = new Map();
        employeeRatings.forEach((ratings, employeeId) => {
          const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          updated.set(employeeId, avg);
        });
        this.employeePerformance = updated;
      });
  }

  applyFilters(): void {
    let filtered = [...this.employees];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.firstName.toLowerCase().includes(searchLower) ||
        emp.lastName.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.position.toLowerCase().includes(searchLower)
      );
    }

    // Apply department filter
    if (this.selectedDepartment !== 'all') {
      const deptId = parseInt(this.selectedDepartment);
      filtered = filtered.filter(emp => emp.departmentId === deptId);
    }

    // Apply minimum rating filter
    if (this.minRating > 0) {
      filtered = filtered.filter(emp => {
        const rating = this.employeePerformance.get(emp.id) || 0;
        return rating >= this.minRating;
      });
    }

    this.filteredEmployees = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onDepartmentChange(): void {
    this.applyFilters();
  }

  onMinRatingChange(): void {
    this.applyFilters();
  }

  getDepartmentName(departmentId: number): string {
    const dept = this.departments.find(d => d.id === departmentId);
    return dept ? dept.name : 'Unknown';
  }

  getEmployeeRating(employeeId: number): number {
    return this.employeePerformance.get(employeeId) || 0;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'primary';
      case 'on-leave': return 'accent';
      case 'inactive': return 'warn';
      default: return '';
    }
  }

  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '½';
    const emptyStars = 5 - Math.ceil(rating);
    stars += '☆'.repeat(emptyStars);
    return stars;
  }

  viewEmployee(employee: Employee): void {
    this.router.navigate(['/employee', employee.id]);
  }

  reviewEmployee(employee: Employee): void {
    this.router.navigate(['/performance-review'], { queryParams: { employeeId: employee.id } });
  }

  navigateToAdd(): void {
    this.router.navigate(['/employees/add']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
