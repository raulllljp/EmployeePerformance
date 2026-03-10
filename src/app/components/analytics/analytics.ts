import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';
import { PerformanceService } from '../../services/performance.service';
import { Employee, PerformanceRecord, Department } from '../../models';

@Component({
  selector: 'app-analytics',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    NgxChartsModule
  ],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css'
})
export class Analytics implements OnInit {

  // Summary KPIs
  totalEmployees = 0;
  activeEmployees = 0;
  avgOverallRating = 0;
  totalReviews = 0;
  topPerformerName = '';
  topPerformerRating = 0;

  // Distribution breakdown
  exceptional = 0;
  exceeds = 0;
  meets = 0;
  needsWork = 0;

  // Raw data
  employees: Employee[] = [];
  records: PerformanceRecord[] = [];
  departments: Department[] = [];

  // Chart data
  ratingDistPie: any[]      = [];
  deptBarData: any[]        = [];
  categoryBarData: any[]    = [];
  trendLineData: any[]      = [];
  statusPieData: any[]      = [];
  topPerformersBar: any[]   = [];

  colorScheme: any      = { domain: ['#10b981', '#6366f1', '#06b6d4', '#f43f5e'] };
  deptScheme: any       = { domain: ['#6366f1', '#a855f7', '#06b6d4', '#f97316', '#10b981'] };
  categoryScheme: any   = { domain: ['#6366f1', '#a855f7', '#06b6d4', '#f97316', '#10b981', '#f43f5e'] };
  statusScheme: any     = { domain: ['#10b981', '#f59e0b', '#e11d48'] };
  topPerformScheme: any = { domain: ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f97316'] };

  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService,
    private performanceService: PerformanceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.employeeService.getAllEmployees().subscribe(emps => {
      this.employees = emps;
      this.totalEmployees = emps.length;
      this.activeEmployees = emps.filter(e => e.status === 'active').length;

      // Status pie
      const onLeave = emps.filter(e => e.status === 'on-leave').length;
      const inactive = emps.filter(e => e.status === 'inactive').length;
      this.statusPieData = [
        { name: 'Active', value: this.activeEmployees },
        { name: 'On Leave', value: onLeave },
        { name: 'Inactive', value: inactive }
      ].filter(d => d.value > 0);

      this.buildDeptData();
    });

    this.employeeService.getAllDepartments().subscribe(depts => {
      this.departments = depts;
      this.buildDeptData();
    });

    this.performanceService.getAllPerformanceRecords().subscribe(records => {
      this.records = records;
      this.totalReviews = records.length;

      if (records.length === 0) return;

      // Overall avg rating
      this.avgOverallRating = records.reduce((s, r) => s + r.overallRating, 0) / records.length;

      // Rating distribution
      this.exceptional = records.filter(r => r.overallRating >= 4.5).length;
      this.exceeds      = records.filter(r => r.overallRating >= 4.0 && r.overallRating < 4.5).length;
      this.meets        = records.filter(r => r.overallRating >= 3.0 && r.overallRating < 4.0).length;
      this.needsWork    = records.filter(r => r.overallRating < 3.0).length;

      this.ratingDistPie = [
        { name: 'Exceptional ≥4.5', value: this.exceptional },
        { name: 'Exceeds 4.0–4.5',  value: this.exceeds },
        { name: 'Meets 3.0–4.0',    value: this.meets },
        { name: 'Needs Work <3.0',  value: this.needsWork }
      ].filter(d => d.value > 0);

      // Category averages
      const avg = (key: keyof PerformanceRecord) =>
        parseFloat((records.reduce((s, r) => s + (r[key] as number), 0) / records.length).toFixed(2));
      this.categoryBarData = [
        { name: 'Productivity', value: avg('productivityScore') },
        { name: 'Quality',      value: avg('qualityScore') },
        { name: 'Comm.',        value: avg('communicationScore') },
        { name: 'Teamwork',     value: avg('teamworkScore') },
        { name: 'Innovation',   value: avg('innovationScore') },
        { name: 'Attendance',   value: avg('attendanceScore') }
      ];

      // Rating trend by period
      const byPeriod: Record<string, number[]> = {};
      records.forEach(r => {
        if (!byPeriod[r.period]) byPeriod[r.period] = [];
        byPeriod[r.period].push(r.overallRating);
      });
      const sorted = Object.keys(byPeriod).sort();
      this.trendLineData = [{
        name: 'Avg Rating',
        series: sorted.map(p => ({
          name: p,
          value: parseFloat((byPeriod[p].reduce((a, b) => a + b, 0) / byPeriod[p].length).toFixed(2))
        }))
      }];

      // Top 5 performers
      const empMap: Record<number, PerformanceRecord[]> = {};
      records.forEach(r => {
        if (!empMap[r.employeeId]) empMap[r.employeeId] = [];
        empMap[r.employeeId].push(r);
      });
      const empAvgs = Object.entries(empMap).map(([id, recs]) => ({
        id: parseInt(id),
        avg: recs.reduce((s, r) => s + r.overallRating, 0) / recs.length
      })).sort((a, b) => b.avg - a.avg).slice(0, 5);

      this.topPerformersBar = empAvgs.map(e => {
        const emp = this.employees.find(em => em.id === e.id);
        const name = emp ? `${emp.firstName} ${emp.lastName}` : `Emp #${e.id}`;
        return { name, value: parseFloat(e.avg.toFixed(2)) };
      });

      if (empAvgs.length > 0) {
        const top = empAvgs[0];
        const topEmp = this.employees.find(e => e.id === top.id);
        this.topPerformerName   = topEmp ? `${topEmp.firstName} ${topEmp.lastName}` : `#${top.id}`;
        this.topPerformerRating = parseFloat(top.avg.toFixed(2));
      }

      this.buildDeptData();
    });
  }

  buildDeptData(): void {
    if (!this.departments.length || !this.employees.length || !this.records.length) return;
    this.deptBarData = this.departments.map(dept => {
      const ids = this.employees.filter(e => e.departmentId === dept.id).map(e => e.id);
      const dRecs = this.records.filter(r => ids.includes(r.employeeId));
      const avg = dRecs.length
        ? dRecs.reduce((s, r) => s + r.overallRating, 0) / dRecs.length : 0;
      return { name: dept.name, value: parseFloat(avg.toFixed(2)) };
    }).filter(d => d.value > 0);
  }

  getRatingLabel(r: number): string {
    if (r >= 4.5) return 'Exceptional';
    if (r >= 4.0) return 'Exceeds Expectations';
    if (r >= 3.0) return 'Meets Expectations';
    return 'Needs Improvement';
  }

  getRatingClass(r: number): string {
    if (r >= 4.5) return 'exceptional';
    if (r >= 4.0) return 'exceeds';
    if (r >= 3.0) return 'meets';
    return 'needs';
  }

  goBack(): void { this.router.navigate(['/dashboard']); }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
