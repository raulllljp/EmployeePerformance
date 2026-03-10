import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PerformanceService } from '../../services/performance.service';
import { LoadingService } from '../../services/loading.service';
import { User } from '../../models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
  badge?: number;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatBadgeModule,
    MatProgressBarModule
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css'
})
export class Shell implements OnInit, OnDestroy {
  currentUser: User | null = null;
  collapsed = false;
  currentRoute = '';
  private destroy$ = new Subject<void>();

  navItems: NavItem[] = [
    // ── Shared ──
    { label: 'Dashboard',    icon: 'dashboard',    route: '/dashboard',          roles: ['manager', 'employee'] },

    // ── Manager only ──
    { label: 'Employees',    icon: 'people',       route: '/employees',          roles: ['manager'] },
    { label: 'Add Employee', icon: 'person_add',   route: '/employees/add',      roles: ['manager'] },
    { label: 'Reviews',      icon: 'rate_review',  route: '/performance-review', roles: ['manager'] },
    { label: 'Analytics',    icon: 'bar_chart',    route: '/analytics',          roles: ['manager'] },

    // ── Employee only ──
    { label: 'My Profile',   icon: 'account_circle', route: '/employee/0',       roles: ['employee'] },
    { label: 'My Reviews',   icon: 'star_rate',      route: '/performance-review', roles: ['employee'] },
  ];

  constructor(
    public authService: AuthService,
    private performanceService: PerformanceService,
    public loadingService: LoadingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.currentRoute = this.router.url;

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e: any) => {
      this.currentRoute = e.urlAfterRedirects;
    });

    // Set the correct employee profile route dynamically
    if (this.currentUser?.role === 'employee' && this.currentUser.employeeId) {
      const profileItem = this.navItems.find(i => i.label === 'My Profile');
      if (profileItem) {
        profileItem.route = `/employee/${this.currentUser.employeeId}`;
      }
    }

    // Live pending-reviews badge for manager
    if (this.currentUser?.role === 'manager') {
      this.performanceService.reviews$.pipe(
        takeUntil(this.destroy$)
      ).subscribe(reviews => {
        const pending = reviews.filter(r => r.status === 'pending' || r.status === 'in-progress').length;
        const reviewItem = this.navItems.find(i => i.label === 'Reviews');
        if (reviewItem) reviewItem.badge = pending > 0 ? pending : undefined;
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get visibleNavItems(): NavItem[] {
    const role = this.currentUser?.role || '';
    return this.navItems.filter(item => item.roles.includes(role));
  }

  get isManager(): boolean { return this.currentUser?.role === 'manager'; }
  get isEmployee(): boolean { return this.currentUser?.role === 'employee'; }

  get userInitials(): string {
    const u = this.currentUser?.username || '';
    return u.slice(0, 2).toUpperCase();
  }

  get roleLabel(): string {
    const r = this.currentUser?.role || '';
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
