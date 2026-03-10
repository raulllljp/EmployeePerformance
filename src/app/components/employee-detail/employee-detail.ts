import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmployeeService } from '../../services/employee.service';
import { PerformanceService } from '../../services/performance.service';
import { AuthService } from '../../services/auth.service';
import { Employee, Department, PerformanceRecord, Review } from '../../models';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-employee-detail',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatListModule,
    MatDividerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    NgxChartsModule
  ],
  templateUrl: './employee-detail.html',
  styleUrl: './employee-detail.css',
})
export class EmployeeDetail implements OnInit, OnDestroy {
  employee: Employee | null = null;
  department: Department | null = null;
  performanceRecords: PerformanceRecord[] = [];
  reviews: Review[] = [];
  averageRating = 0;
  loading = true;
  currentUserRole = '';

  // Review popup state
  selectedReview: Review | null = null;
  selectedReviewRecord: PerformanceRecord | null = null;

  // Chart data for performance trend
  ratingTrendData: any[] = [];
  scoreRadarData: any[] = [];
  colorScheme: any = { domain: ['#3f51b5', '#e91e63', '#00bcd4'] };

  private destroy$ = new Subject<void>();
  private employeeId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private performanceService: PerformanceService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUserRole = this.authService.currentUserValue?.role || '';
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeId = parseInt(id);
      this.loadEmployeeDetails(this.employeeId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmployeeDetails(id: number): void {
    this.employeeService.getEmployeeById(id).subscribe(employee => {
      if (employee) {
        this.employee = employee;
        this.loadDepartment(employee.departmentId);
        this.loadPerformanceData(id);
        this.loadReviews(id);
      } else {
        this.router.navigate(['/employees']);
      }
      this.loading = false;
    });
  }

  loadDepartment(departmentId: number): void {
    this.employeeService.getDepartmentById(departmentId).subscribe(dept => {
      this.department = dept || null;
    });
  }

  loadPerformanceData(employeeId: number): void {
    this.performanceService.getPerformanceRecordsByEmployee(employeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(records => {
        const sorted = [...records].sort(
          (a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime()
        );
        this.performanceRecords = sorted;
        if (sorted.length > 0) {
          this.averageRating = sorted.reduce((acc, r) => acc + r.overallRating, 0) / sorted.length;
          this.buildChartData(sorted);
        } else {
          this.averageRating = 0;
          this.ratingTrendData = [];
          this.scoreRadarData = [];
        }
      });
  }

  buildChartData(records: PerformanceRecord[]): void {
    // Line chart: rating trend over time
    const sorted = [...records].sort((a, b) =>
      new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime()
    );
    this.ratingTrendData = [
      {
        name: 'Overall Rating',
        series: sorted.map(r => ({
          name: r.period,
          value: r.overallRating
        }))
      }
    ];

    // Latest record score breakdown
    if (records.length > 0) {
      const latest = records[0];
      this.scoreRadarData = [
        { name: 'Productivity', value: latest.productivityScore },
        { name: 'Quality', value: latest.qualityScore },
        { name: 'Communication', value: latest.communicationScore },
        { name: 'Teamwork', value: latest.teamworkScore },
        { name: 'Innovation', value: latest.innovationScore },
        { name: 'Attendance', value: latest.attendanceScore }
      ];
    }
  }

  submitReview(): void {
    this.router.navigate(['/performance-review'], {
      queryParams: { employeeId: this.employeeId }
    });
  }

  loadReviews(employeeId: number): void {
    this.performanceService.getReviewsByEmployee(employeeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(reviews => {
        this.reviews = [...reviews].sort(
          (a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime()
        );
      });
  }

  openReviewPopup(review: Review): void {
    this.selectedReview = review;
    // Link the matching performance record if one exists
    this.selectedReviewRecord = review.performanceRecordId
      ? this.performanceRecords.find(r => r.id === review.performanceRecordId) ?? null
      : null;
    document.body.style.overflow = 'hidden';
  }

  closeReviewPopup(): void {
    this.selectedReview = null;
    this.selectedReviewRecord = null;
    document.body.style.overflow = '';
  }

  getScorePercent(score: number): number { return (score / 5) * 100; }

  getScoreColor(score: number): string {
    if (score >= 4.5) return '#22c55e';
    if (score >= 4.0) return '#6366f1';
    if (score >= 3.0) return '#f59e0b';
    return '#ef4444';
  }

  getRatingLevel(rating: number): string {
    if (rating >= 4.5) return 'Exceptional';
    if (rating >= 4.0) return 'Exceeds Expectations';
    if (rating >= 3.0) return 'Meets Expectations';
    if (rating >= 2.0) return 'Needs Improvement';
    return 'Unsatisfactory';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'primary';
      case 'on-leave': return 'accent';
      case 'inactive': return 'warn';
      default: return '';
    }
  }

  getReviewStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'primary';
      case 'approved': return 'primary';
      case 'in-progress': return 'accent';
      case 'pending': return 'warn';
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

  getYearsOfService(): number {
    if (!this.employee) return 0;
    const today = new Date();
    const hireDate = new Date(this.employee.hireDate);
    return today.getFullYear() - hireDate.getFullYear();
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }
}
