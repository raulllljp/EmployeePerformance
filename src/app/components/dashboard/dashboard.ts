import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Subject, combineLatest, forkJoin } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';
import { PerformanceService } from '../../services/performance.service';
import { Employee, PerformanceRecord, Review, User } from '../../models';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatChipsModule,
    MatTableModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatBadgeModule,
    NgxChartsModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  // Role helpers
  get isManager(): boolean { return this.currentUser?.role === 'manager'; }
  get isEmployee(): boolean { return this.currentUser?.role === 'employee'; }

  // ── Admin / Manager stats ──
  totalEmployees = 0;
  activeEmployees = 0;
  pendingReviews = 0;
  averageRating = 0;
  performanceStats: any = null;
  recentReviews: Review[] = [];
  displayedColumns = ['employee', 'reviewType', 'status', 'dueDate'];

  // Manager: my team
  myTeam: Employee[] = [];
  myTeamPerformance: Map<number, number> = new Map();
  myTeamPendingReviews = 0;
  teamColumns = ['name', 'position', 'rating', 'actions'];

  // Employee name lookup for recent reviews
  employeeNameMap: Map<number, string> = new Map();

  // ── Employee-specific ──
  myEmployee: Employee | null = null;
  myPerformanceRecords: PerformanceRecord[] = [];
  myReviews: Review[] = [];
  myLatestRecord: PerformanceRecord | null = null;
  myAverageRating = 0;

  // Chart data
  pieChartData: any[] = [];
  barChartData: any[] = [];
  departmentBarData: any[] = [];
  ratingTrendData: any[] = [];
  scoreBreakdownData: any[] = [];

  colorScheme: any = { domain: ['#10b981', '#6366f1', '#06b6d4', '#f43f5e'] };
  barColorScheme: any = { domain: ['#6366f1', '#a855f7', '#06b6d4', '#f97316', '#10b981', '#f43f5e'] };

  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService,
    private performanceService: PerformanceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    if (this.isManager) this.loadManagerData();
    else this.loadEmployeeData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────
  //  MANAGER
  // ─────────────────────────────────────────
  loadManagerData(): void {
    // Parse to number — localStorage may have stored employeeId as string
    const managerId = Number(this.currentUser?.employeeId);

    // Use forkJoin so we wait for ALL three HTTP responses before building charts
    forkJoin({
      employees: this.employeeService.getAllEmployees(),
      records:   this.performanceService.getAllPerformanceRecords(),
      reviews:   this.performanceService.getAllReviews()
    }).pipe(takeUntil(this.destroy$)).subscribe(({ employees, records, reviews }) => {

      // Coerce all ids to numbers for safe comparison
      const allEmployees = employees.map(e => ({
        ...e,
        id: Number(e.id),
        managerId: e.managerId != null ? Number(e.managerId) : undefined
      }));
      const allRecords = records.map(r => ({ ...r, employeeId: Number(r.employeeId) }));
      const allReviews = reviews.map(r => ({ ...r, employeeId: Number(r.employeeId) }));

      // Manager sees their direct reports
      this.myTeam = allEmployees.filter(e => e.managerId === managerId);

      // If manager has no direct reports (e.g. CEO), show all employees
      const teamSource = this.myTeam.length > 0 ? this.myTeam : allEmployees;
      this.totalEmployees = teamSource.length;
      this.activeEmployees = teamSource.filter(e => e.status === 'active').length;

      const teamIds = teamSource.map(e => e.id);
      const teamRecords = allRecords.filter(r => teamIds.includes(r.employeeId));

      // Per-employee average ratings
      const ratingMap = new Map<number, number[]>();
      teamRecords.forEach(r => {
        if (!ratingMap.has(r.employeeId)) ratingMap.set(r.employeeId, []);
        ratingMap.get(r.employeeId)!.push(r.overallRating);
      });
      const perfMap = new Map<number, number>();
      ratingMap.forEach((ratings, id) => {
        perfMap.set(id, ratings.reduce((s, v) => s + v, 0) / ratings.length);
      });
      this.myTeamPerformance = perfMap;

      // Use ALL records for avg rating & charts (not just direct reports)
      const chartRecords = allRecords.length > 0 ? allRecords : teamRecords;

      this.averageRating = chartRecords.length
        ? parseFloat((chartRecords.reduce((s, r) => s + r.overallRating, 0) / chartRecords.length).toFixed(2))
        : 0;

      if (chartRecords.length > 0) {
        this.buildTeamScoreBar(chartRecords);
        this.buildTeamPieData(chartRecords);
      } else {
        this.performanceStats = null;
        this.pieChartData = [];
        this.barChartData = [];
      }

      // Pending reviews — all employees the manager is reviewing
      const mgrReviews = allReviews.filter(r => Number(r.reviewerId) === managerId);
      const pending = mgrReviews.filter(r => r.status === 'pending' || r.status === 'in-progress');
      this.pendingReviews = pending.length;
      this.recentReviews = [...allReviews]
        .sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime())
        .slice(0, 5);

      // Employee name map for "Recent Reviews" display
      const nameMap = new Map<number, string>();
      allEmployees.forEach(e => nameMap.set(e.id, `${e.firstName} ${e.lastName}`));
      this.employeeNameMap = nameMap;

      // Build department chart with the data we already have
      this.buildDepartmentChartFromData(allEmployees, allRecords);
    });

    // Fetch departments separately (needed for dept chart labels)
    this.employeeService.getAllDepartments().pipe(takeUntil(this.destroy$)).subscribe(depts => {
      forkJoin({
        records:   this.performanceService.getAllPerformanceRecords(),
        employees: this.employeeService.getAllEmployees()
      }).subscribe(({ records, employees }) => {
        const allR = records.map(r => ({ ...r, employeeId: Number(r.employeeId) }));
        const allE = employees.map(e => ({ ...e, id: Number(e.id), departmentId: Number(e.departmentId) }));
        const normDepts = depts.map(d => ({ ...d, id: Number(d.id) }));
        this.departmentBarData = normDepts.map(dept => {
          const ids = allE.filter(e => e.departmentId === dept.id).map(e => e.id);
          const dRecords = allR.filter(r => ids.includes(r.employeeId));
          const avg = dRecords.length
            ? dRecords.reduce((s, r) => s + r.overallRating, 0) / dRecords.length : 0;
          return { name: dept.name, value: parseFloat(avg.toFixed(2)) };
        }).filter(d => d.value > 0);
      });
    });
  }

  buildTeamScoreBar(records: PerformanceRecord[]): void {
    const avg = (key: keyof PerformanceRecord) =>
      parseFloat((records.reduce((s, r) => s + (r[key] as number), 0) / records.length).toFixed(2));
    this.barChartData = [
      { name: 'Productivity', value: avg('productivityScore') },
      { name: 'Quality',      value: avg('qualityScore') },
      { name: 'Comm.',        value: avg('communicationScore') },
      { name: 'Teamwork',     value: avg('teamworkScore') },
      { name: 'Innovation',   value: avg('innovationScore') },
      { name: 'Attendance',   value: avg('attendanceScore') },
    ];
  }

  buildTeamPieData(records: PerformanceRecord[]): void {
    const exc  = records.filter(r => r.overallRating >= 4.5).length;
    const excd = records.filter(r => r.overallRating >= 4.0 && r.overallRating < 4.5).length;
    const meet = records.filter(r => r.overallRating >= 3.0 && r.overallRating < 4.0).length;
    const need = records.filter(r => r.overallRating < 3.0).length;
    this.pieChartData = [
      { name: 'Exceptional', value: exc },
      { name: 'Exceeds',     value: excd },
      { name: 'Meets',       value: meet },
      { name: 'Needs Work',  value: need },
    ].filter(d => d.value > 0);

    this.performanceStats = {
      totalReviews: records.length,
      exceptional: exc,
      exceedsExpectations: excd,
      meetsExpectations: meet,
      needsImprovement: need,
    };
  }

  // ─────────────────────────────────────────
  //  EMPLOYEE
  // ─────────────────────────────────────────
  loadEmployeeData(): void {
    const empId = this.currentUser?.employeeId;
    if (!empId) return;

    // Fetch employee profile
    this.employeeService.getEmployeeById(empId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(emp => { this.myEmployee = emp ?? null; });

    // Fetch performance records directly via HTTP (not BehaviorSubject)
    this.performanceService.getPerformanceRecordsByEmployee(empId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(allRecords => {
        const records = [...allRecords].sort(
          (a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime()
        );
        this.myPerformanceRecords = records;
        if (records.length > 0) {
          this.myLatestRecord = records[0];
          this.myAverageRating = records.reduce((s, r) => s + r.overallRating, 0) / records.length;

          // Trend chart
          this.ratingTrendData = [{
            name: 'Rating',
            series: [...records]
              .sort((a, b) => new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime())
              .map(r => ({ name: r.period, value: r.overallRating }))
          }];

          // Latest score breakdown
          const latest = this.myLatestRecord!;
          this.scoreBreakdownData = [
            { name: 'Productivity', value: latest.productivityScore },
            { name: 'Quality',      value: latest.qualityScore },
            { name: 'Comm.',        value: latest.communicationScore },
            { name: 'Teamwork',     value: latest.teamworkScore },
            { name: 'Innovation',   value: latest.innovationScore },
            { name: 'Attendance',   value: latest.attendanceScore },
          ];
        } else {
          this.myLatestRecord = null;
          this.myAverageRating = 0;
          this.ratingTrendData = [];
          this.scoreBreakdownData = [];
        }
      });

    // Fetch reviews directly via HTTP
    this.performanceService.getReviewsByEmployee(empId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(reviews => { this.myReviews = reviews; });
  }

  // ─────────────────────────────────────────
  //  SHARED helpers
  // ─────────────────────────────────────────
  buildPieAndBarData(stats: any): void {
    this.pieChartData = [
      { name: 'Exceptional', value: stats.exceptional || 0 },
      { name: 'Exceeds',     value: stats.exceedsExpectations || 0 },
      { name: 'Meets',       value: stats.meetsExpectations || 0 },
      { name: 'Needs Work',  value: stats.needsImprovement || 0 },
    ].filter(d => d.value > 0);
  }

  loadDepartmentChartData(): void {
    forkJoin({
      departments: this.employeeService.getAllDepartments(),
      records:     this.performanceService.getAllPerformanceRecords(),
      employees:   this.employeeService.getAllEmployees()
    }).subscribe(({ departments, records, employees }) => {
      this.buildDepartmentChartFromData(employees, records, departments);
    });
  }

  buildDepartmentChartFromData(
    employees: Employee[],
    records: PerformanceRecord[],
    departments?: any[]
  ): void {
    if (departments) {
      this.departmentBarData = departments.map(dept => {
        const ids = employees.filter(e => e.departmentId === dept.id).map(e => e.id);
        const dRecords = records.filter(r => ids.includes(r.employeeId));
        const avg = dRecords.length
          ? dRecords.reduce((s, r) => s + r.overallRating, 0) / dRecords.length : 0;
        return { name: dept.name, value: parseFloat(avg.toFixed(2)) };
      }).filter(d => d.value > 0);
    }

    if (records.length > 0) {
      const avg = (key: keyof PerformanceRecord) =>
        parseFloat((records.reduce((s, r) => s + (r[key] as number), 0) / records.length).toFixed(2));
      this.barChartData = [
        { name: 'Productivity', value: avg('productivityScore') },
        { name: 'Quality',      value: avg('qualityScore') },
        { name: 'Comm.',        value: avg('communicationScore') },
        { name: 'Teamwork',     value: avg('teamworkScore') },
        { name: 'Innovation',   value: avg('innovationScore') },
        { name: 'Attendance',   value: avg('attendanceScore') },
      ];
    }
  }

  getRatingStars(rating: number): string {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
  }

  getRatingLabel(rating: number): string {
    if (rating >= 4.5) return 'Exceptional';
    if (rating >= 4.0) return 'Exceeds Expectations';
    if (rating >= 3.0) return 'Meets Expectations';
    return 'Needs Improvement';
  }

  getRatingClass(rating: number): string {
    if (rating >= 4.5) return 'exceptional';
    if (rating >= 4.0) return 'exceeds';
    if (rating >= 3.0) return 'meets';
    return 'needs';
  }

  navigateToEmployees(): void { this.router.navigate(['/employees']); }
  navigateToReviews(): void   { this.router.navigate(['/performance-review']); }
  navigateToAnalytics(): void { this.router.navigate(['/analytics']); }
  navigateToAddEmployee(): void { this.router.navigate(['/employees/add']); }
  navigateToMyDetail(): void  {
    if (this.currentUser?.employeeId) {
      this.router.navigate(['/employee', this.currentUser.employeeId]);
    }
  }
  navigateToEmployee(id: number): void { this.router.navigate(['/employee', id]); }
  navigateToReviewForEmployee(employeeId: number): void {
    this.router.navigate(['/performance-review'], { queryParams: { employeeId } });
  }
  navigateToReviewDetail(review: Review): void {
    if (review.employeeId) this.router.navigate(['/employee', review.employeeId]);
  }

  getTeamMemberRating(employeeId: number): number {
    return this.myTeamPerformance.get(Number(employeeId)) || 0;
  }

  getEmployeeName(employeeId: number): string {
    return this.employeeNameMap.get(Number(employeeId)) || `Employee #${employeeId}`;
  }

  getEmployeeInitials(employeeId: number): string {
    const name = this.employeeNameMap.get(Number(employeeId));
    if (!name) return `#${employeeId}`;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'primary';
      case 'in-progress': return 'accent';
      case 'pending': return 'warn';
      default: return '';
    }
  }
}
