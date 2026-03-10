import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { EmployeeService } from '../../services/employee.service';
import { PerformanceService } from '../../services/performance.service';
import { AuthService } from '../../services/auth.service';
import { Employee, PerformanceRecord, Review } from '../../models';

/** A performance record enriched with reviewer name for display */
interface ReceivedReview extends PerformanceRecord {
  reviewerName?: string;
  reviewerPosition?: string;
}

@Component({
  selector: 'app-performance-review',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatChipsModule,
    MatStepperModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatTabsModule,
    MatProgressBarModule,
  ],
  templateUrl: './performance-review.html',
  styleUrl: './performance-review.css',
})
export class PerformanceReview implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  reviewFormGroup!: FormGroup;
  scoresFormGroup!: FormGroup;
  feedbackFormGroup!: FormGroup;

  employees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  isSubmitting = false;

  // ── Employee "My Reviews" view ───────────────────────────────────────────────
  myReviews: ReceivedReview[] = [];
  myReviewsLoading = true;
  selectedReview: ReceivedReview | null = null;

  // ── Manager "Pending Reviews" panel ─────────────────────────────────────────
  pendingReviews: (Review & { employeeName?: string; employeePosition?: string })[] = [];
  allEmployees: Employee[] = [];

  get isEmployee(): boolean {
    return this.authService.currentUserValue?.role === 'employee';
  }

  get isManager(): boolean {
    return this.authService.currentUserValue?.role === 'manager';
  }

  constructor(
    private formBuilder: FormBuilder,
    private employeeService: EmployeeService,
    private performanceService: PerformanceService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForms();

    if (this.isEmployee) {
      // Employees see reviews written about them
      this.loadMyReviews();
    } else {
      // Managers see the full submission form
      this.loadEmployees();
      this.loadPendingReviews();
    }

    // Pre-select employee if passed via query param (manager flow)
    this.route.queryParams.subscribe(params => {
      if (params['employeeId']) {
        const id = parseInt(params['employeeId']);
        this.reviewFormGroup.get('employeeId')?.setValue(id);
        this.employeeService.getEmployeeById(id).subscribe(emp => {
          this.selectedEmployee = emp;
        });
      }
    });
  }

  // ── Employee: load reviews written about the current user ───────────────────
  loadMyReviews(): void {
    this.myReviewsLoading = true;
    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.employeeId) {
      this.myReviewsLoading = false;
      return;
    }

    this.performanceService.getPerformanceRecordsByEmployee(currentUser.employeeId)
      .subscribe({
        next: (records) => {
          // Sort newest first
          const sorted = [...records].sort(
            (a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime()
          );
          // Enrich each record with reviewer name by fetching employees
          this.employeeService.getAllEmployees().subscribe(emps => {
            this.allEmployees = emps;
            this.myReviews = sorted.map(r => {
              const reviewer = emps.find(e => e.id === r.reviewerId);
              return {
                ...r,
                reviewerName: reviewer
                  ? `${reviewer.firstName} ${reviewer.lastName}`
                  : `Reviewer #${r.reviewerId}`,
                reviewerPosition: reviewer?.position ?? ''
              };
            });
            if (this.myReviews.length > 0) {
              this.selectedReview = this.myReviews[0];
            }
            this.myReviewsLoading = false;
          });
        },
        error: () => {
          this.myReviewsLoading = false;
          this.snackBar.open('Could not load your reviews. Is JSON Server running?', 'Close', {
            duration: 4000
          });
        }
      });
  }

  selectReview(review: ReceivedReview): void {
    this.selectedReview = review;
  }

  getScoreLabel(score: number): string {
    if (score >= 4.5) return 'Excellent';
    if (score >= 4.0) return 'Very Good';
    if (score >= 3.0) return 'Good';
    if (score >= 2.0) return 'Fair';
    return 'Poor';
  }

  getScorePercent(score: number): number {
    return (score / 5) * 100;
  }

  getScoreColor(score: number): string {
    if (score >= 4.5) return '#22c55e';
    if (score >= 4.0) return '#3b82f6';
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

  getRatingBadgeClass(rating: number): string {
    if (rating >= 4.5) return 'badge-exceptional';
    if (rating >= 4.0) return 'badge-exceeds';
    if (rating >= 3.0) return 'badge-meets';
    return 'badge-needs';
  }

  /** Returns score-bar rows for the currently selected review. */
  getScoreRows(review: ReceivedReview): { label: string; icon: string; value: number }[] {
    return [
      { label: 'Productivity',   icon: 'trending_up', value: review.productivityScore  },
      { label: 'Quality',        icon: 'verified',    value: review.qualityScore       },
      { label: 'Communication',  icon: 'chat',        value: review.communicationScore },
      { label: 'Teamwork',       icon: 'group',       value: review.teamworkScore      },
      { label: 'Innovation',     icon: 'lightbulb',   value: review.innovationScore    },
      { label: 'Attendance',     icon: 'schedule',    value: review.attendanceScore    },
    ];
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  loadPendingReviews(): void {
    // Fetch fresh reviews + employees together so names always resolve
    this.performanceService.getAllReviews().subscribe(reviews => {
      const pending = reviews.filter(r => r.status === 'pending' || r.status === 'in-progress');
      this.employeeService.getAllEmployees().subscribe(emps => {
        this.allEmployees = emps;
        this.pendingReviews = pending.map(r => {
          const emp = emps.find(e => e.id === r.employeeId);
          return {
            ...r,
            employeeName: emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${r.employeeId}`,
            employeePosition: emp?.position || ''
          };
        }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      });
    });
  }

  selectPendingReview(review: Review & { employeeName?: string }): void {
    // Resolve the employee
    const emp = this.allEmployees.find(e => e.id === review.employeeId);
    this.selectedEmployee = emp || null;

    // Build a human-readable period string from reviewType + year
    const year = new Date(review.reviewDate).getFullYear();
    const periodMap: Record<string, string> = {
      quarterly: `Quarterly ${year}`,
      annual: `Annual ${year}`,
      'mid-year': `Mid-Year ${year}`,
      probation: `Probation ${year}`
    };
    const period = periodMap[review.reviewType] ?? `${review.reviewType} ${year}`;

    // Format reviewDate as YYYY-MM-DD for the date input
    const reviewDateStr = new Date(review.reviewDate).toISOString().split('T')[0];

    // Patch all three fields at once
    this.reviewFormGroup.patchValue({
      employeeId: review.employeeId,
      period,
      reviewDate: reviewDateStr
    });

    // Scroll the stepper into view smoothly
    setTimeout(() => {
      const el = document.querySelector('.stepper-card');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  getDaysUntilDue(dueDate: Date | string): number {
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  initializeForms(): void {
    this.reviewFormGroup = this.formBuilder.group({
      employeeId: ['', Validators.required],
      period: ['', Validators.required],
      reviewDate: [new Date().toISOString().split('T')[0], Validators.required]
    });

    this.scoresFormGroup = this.formBuilder.group({
      productivityScore: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      qualityScore: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      communicationScore: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      teamworkScore: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      innovationScore: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      attendanceScore: [3, [Validators.required, Validators.min(1), Validators.max(5)]]
    });

    this.feedbackFormGroup = this.formBuilder.group({
      comments: ['', Validators.required],
      goals: this.formBuilder.array([this.createGoalControl()]),
      achievements: this.formBuilder.array([this.createAchievementControl()]),
      areasOfImprovement: this.formBuilder.array([this.createImprovementControl()])
    });
  }

  createGoalControl(): FormGroup {
    return this.formBuilder.group({
      text: ['', Validators.required]
    });
  }

  createAchievementControl(): FormGroup {
    return this.formBuilder.group({
      text: ['', Validators.required]
    });
  }

  createImprovementControl(): FormGroup {
    return this.formBuilder.group({
      text: ['', Validators.required]
    });
  }

  get goals(): FormArray {
    return this.feedbackFormGroup.get('goals') as FormArray;
  }

  get achievements(): FormArray {
    return this.feedbackFormGroup.get('achievements') as FormArray;
  }

  get areasOfImprovement(): FormArray {
    return this.feedbackFormGroup.get('areasOfImprovement') as FormArray;
  }

  addGoal(): void {
    this.goals.push(this.createGoalControl());
  }

  removeGoal(index: number): void {
    if (this.goals.length > 1) {
      this.goals.removeAt(index);
    }
  }

  addAchievement(): void {
    this.achievements.push(this.createAchievementControl());
  }

  removeAchievement(index: number): void {
    if (this.achievements.length > 1) {
      this.achievements.removeAt(index);
    }
  }

  addImprovement(): void {
    this.areasOfImprovement.push(this.createImprovementControl());
  }

  removeImprovement(index: number): void {
    if (this.areasOfImprovement.length > 1) {
      this.areasOfImprovement.removeAt(index);
    }
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployees().subscribe(employees => {
      this.employees = employees.filter(e => e.status === 'active');
    });
  }

  onEmployeeChange(): void {
    const employeeId = this.reviewFormGroup.get('employeeId')?.value;
    if (employeeId) {
      this.employeeService.getEmployeeById(parseInt(employeeId)).subscribe(employee => {
        this.selectedEmployee = employee || null;
      });
    }
  }

  calculateOverallRating(): number {
    const scores = this.scoresFormGroup.value;
    const sum = scores.productivityScore + scores.qualityScore + 
                scores.communicationScore + scores.teamworkScore + 
                scores.innovationScore + scores.attendanceScore;
    return sum / 6;
  }

  formatSliderValue(value: number): string {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[value] || '';
  }

  onSubmit(): void {
    if (this.reviewFormGroup.invalid || this.scoresFormGroup.invalid || this.feedbackFormGroup.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000
      });
      return;
    }

    this.isSubmitting = true;
    const currentUser = this.authService.currentUserValue;

    const performanceRecord: PerformanceRecord = {
      id: 0,
      employeeId: parseInt(this.reviewFormGroup.value.employeeId),
      reviewDate: new Date(this.reviewFormGroup.value.reviewDate),
      reviewerId: currentUser?.id || 0,
      overallRating: this.calculateOverallRating(),
      productivityScore: this.scoresFormGroup.value.productivityScore,
      qualityScore: this.scoresFormGroup.value.qualityScore,
      communicationScore: this.scoresFormGroup.value.communicationScore,
      teamworkScore: this.scoresFormGroup.value.teamworkScore,
      innovationScore: this.scoresFormGroup.value.innovationScore,
      attendanceScore: this.scoresFormGroup.value.attendanceScore,
      comments: this.feedbackFormGroup.value.comments,
      goals: this.goals.value.map((g: any) => g.text).filter((t: string) => t.trim()),
      achievements: this.achievements.value.map((a: any) => a.text).filter((t: string) => t.trim()),
      areasOfImprovement: this.areasOfImprovement.value.map((i: any) => i.text).filter((t: string) => t.trim()),
      period: this.reviewFormGroup.value.period
    };

    this.performanceService.addPerformanceRecord(performanceRecord).subscribe({
      next: (saved) => {
        this.snackBar.open('Performance review submitted successfully!', 'View Employee', {
          duration: 4000
        }).onAction().subscribe(() => {
          this.router.navigate(['/employee', saved.employeeId]);
        });
        this.router.navigate(['/employee', saved.employeeId]);
      },
      error: (error) => {
        this.snackBar.open('Error submitting review. Please try again.', 'Close', {
          duration: 3000
        });
        this.isSubmitting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
