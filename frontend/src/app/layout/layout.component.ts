import { Component, computed, signal, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../core/auth.service';
import { RangeService } from '../core/range.service';
import { IconComponent } from '../shared/icon.component';
import { ToastService } from '../shared/toast.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  adminOnly?: boolean;
  exact?: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass, IconComponent],
  template: `
    <div class="shell">
      <!-- ============ SIDEBAR (mobile: drawer) ============ -->
      <aside class="sidebar" [class.open]="sideOpen()">
        <div class="brand">
          <div class="brand-logo"><app-icon name="home" [size]="21" /></div>
          <div class="brand-name">Real<span>Estate</span></div>
          <button class="side-close" (click)="sideOpen.set(false)" aria-label="Close menu">
            <app-icon name="x" [size]="19" />
          </button>
        </div>

        <div class="side-user">
          <div class="avatar">{{ initials() }}</div>
          <div style="min-width:0">
            <div class="name">{{ auth.user()?.fullName }}</div>
            <div class="role">{{ auth.isAdmin() ? 'Admin' : 'Associate' }}</div>
          </div>
        </div>

        <nav class="nav">
          @for (item of navItems(); track item.path) {
            <a class="nav-item" [class.active]="isActive(item.path)" [class.purple]="auth.isAdmin()"
               [routerLink]="item.path" (click)="sideOpen.set(false)">
              <span class="ico"><app-icon [name]="item.icon" [size]="18" /></span>
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>

      <!-- backdrop for mobile drawer -->
      <div class="side-backdrop" [class.show]="sideOpen()" (click)="sideOpen.set(false)"></div>

      <!-- ============ MAIN ============ -->
      <div class="main">
        <header class="topbar">
          <div class="flex">
            <button class="hamburger" (click)="sideOpen.set(!sideOpen())">
              <app-icon name="menu" [size]="20" />
            </button>
            <div>
              <div class="page-title">{{ pageTitle() }}</div>
              <div class="page-sub">{{ auth.isAdmin() ? 'Complete control • Manage everything' : 'Welcome back, ' + (auth.user()?.fullName || '') }}</div>
            </div>
          </div>

          <div class="topbar-right">
            <div class="date-pill">
              <app-icon name="calendar" [size]="16" color="#94a3b8" />
              <select [value]="range.range().label" (change)="onRangeChange($event)">
                @for (p of range.presets(); track p.label) {
                  <option [value]="p.label">{{ p.label }}</option>
                }
              </select>
              <app-icon name="chevron" [size]="14" color="#94a3b8" />
            </div>

            <button class="icon-btn" (click)="bellOpen.set(!bellOpen())">
              <app-icon name="bell" [size]="19" />
              <span class="dot"></span>
            </button>

            <div class="top-user" (click)="userOpen.set(!userOpen())">
              <div class="avatar">{{ initials() }}</div>
              <div style="text-align:left">
                <div class="name">{{ auth.user()?.fullName }}</div>
                <div class="small muted">{{ auth.isAdmin() ? 'Admin' : 'Associate' }}</div>
              </div>
              <app-icon name="chevron" [size]="15" color="#94a3b8" />
            </div>
          </div>

          @if (bellOpen()) {
            <div class="dropdown" style="right:190px">
              <div class="item"><app-icon name="bell" [size]="16" color="#f59e0b" /> 3 pending payments</div>
              <div class="item"><app-icon name="trophy" [size]="16" color="#22c55e" /> Commission approvals</div>
              <div class="sep"></div>
              <div class="item" (click)="bellOpen.set(false)"><app-icon name="check" [size]="16" color="#94a3b8" /> Mark all read</div>
            </div>
          }

          @if (userOpen()) {
            <div class="dropdown">
              <div class="item" (click)="go('/profile'); userOpen.set(false)">
                <app-icon name="user" [size]="16" color="#2563eb" /> My Profile
              </div>
              <div class="item" (click)="go('/dashboard'); userOpen.set(false)">
                <app-icon name="home" [size]="16" color="#22c55e" /> Dashboard
              </div>
              <div class="sep"></div>
              <div class="item" (click)="auth.logout()">
                <app-icon name="logout" [size]="16" color="#ef4444" /> Logout
              </div>
            </div>
          }
        </header>

        <main class="content">
          <router-outlet />
        </main>

        <!-- fixed footer (desktop) -->
        <footer class="footer-bar">
          <div>© {{ year }} <b>RealEstate Pvt. Ltd.</b> — Admin &amp; Associate Panel</div>
          <div class="flex" style="gap:16px">
            <span>Angular • .NET • SQL Server</span>
            <span class="badge green" style="font-size:9.5px">v1.0</span>
          </div>
        </footer>
      </div>
    </div>

    <!-- ============ BOTTOM NAV (mobile app-like) ============ -->
    <nav class="bottom-nav">
      @for (item of bottomNav(); track item.label) {
        @if (item.path === '__menu__') {
          <button (click)="openMenu()">
            <app-icon [name]="item.icon" [size]="21" />
            {{ item.label }}
          </button>
        } @else {
          <a [routerLink]="item.path"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: item.exact === true }"
             [class.purple]="auth.isAdmin()">
            <app-icon [name]="item.icon" [size]="21" />
            {{ item.label }}
          </a>
        }
      }
    </nav>

    <!-- toasts -->
    <div class="toast-wrap">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [ngClass]="t.type">{{ t.message }}</div>
      }
    </div>
  `
})
export class LayoutComponent {
  sideOpen = signal(false);
  bellOpen = signal(false);
  userOpen = signal(false);
  year = new Date().getFullYear();

  private employeeNav: NavItem[] = [
    { label: 'Dashboard', icon: 'home', path: '/dashboard' },
    { label: 'My Profile', icon: 'user', path: '/profile' },
    { label: 'Register Person', icon: 'user-plus', path: '/register-person' },
    { label: 'My Team', icon: 'users', path: '/team' },
    { label: 'My Clients', icon: 'briefcase', path: '/clients' },
    { label: 'Site Visits', icon: 'camera', path: '/site-visits' },
    { label: 'My Sales', icon: 'chart', path: '/sales' },
    { label: 'My Commission', icon: 'rupee', path: '/commissions' },
    { label: 'My Rank', icon: 'trophy', path: '/rank' },
    { label: 'Reports', icon: 'file', path: '/reports' }
  ];

  private adminNav: NavItem[] = [
    { label: 'Dashboard', icon: 'home', path: '/dashboard' },
    { label: 'All Admins', icon: 'users', path: '/users' },
    { label: 'All Registered Persons', icon: 'user-plus', path: '/persons' },
    { label: 'All Clients', icon: 'briefcase', path: '/all-clients' },
    { label: 'All Plot Sales', icon: 'chart', path: '/sales' },
    { label: 'Payment Management', icon: 'card', path: '/payments' },
    { label: 'Site Visit Photos', icon: 'image', path: '/site-photos' },
    { label: 'Plots / Inventory', icon: 'pin', path: '/plots' },
    { label: 'Commissions', icon: 'rupee', path: '/commissions' },
    { label: 'Reports', icon: 'file', path: '/reports' },
    { label: 'Settings', icon: 'settings', path: '/settings' }
  ];

  navItems = computed(() => (this.auth.isAdmin() ? this.adminNav : this.employeeNav));

  /** Mobile bottom tab bar (app-like) */
  bottomNav = computed<NavItem[]>(() =>
    this.auth.isAdmin()
      ? [
          { label: 'Home', icon: 'home', path: '/dashboard', exact: true },
          { label: 'Sales', icon: 'chart', path: '/sales' },
          { label: 'Payments', icon: 'card', path: '/payments' },
          { label: 'Photos', icon: 'image', path: '/site-photos' },
          { label: 'More', icon: 'menu', path: '__menu__' }
        ]
      : [
          { label: 'Home', icon: 'home', path: '/dashboard', exact: true },
          { label: 'Register', icon: 'user-plus', path: '/register-person' },
          { label: 'Clients', icon: 'users', path: '/clients' },
          { label: 'Visits', icon: 'camera', path: '/site-visits' },
          { label: 'Profile', icon: 'user', path: '/profile' }
        ]
  );

  initials = computed(() => {
    const n = this.auth.user()?.fullName || '?';
    return n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  });

  pageTitle = computed(() => {
    const url = this.router.url.split('?')[0];
    const all = [...this.adminNav, ...this.employeeNav];
    return all.find(n => n.path === url)?.label ?? 'Dashboard';
  });

  constructor(
    public auth: AuthService,
    public range: RangeService,
    public toast: ToastService,
    private router: Router
  ) {}

  isActive(path: string) {
    return this.router.url.split('?')[0] === path;
  }

  openMenu() {
    this.bellOpen.set(false);
    this.userOpen.set(false);
    this.sideOpen.set(true);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.sideOpen.set(false);
    this.bellOpen.set(false);
    this.userOpen.set(false);
  }

  onRangeChange(e: Event) {
    const label = (e.target as HTMLSelectElement).value;
    const preset = this.range.presets().find(p => p.label === label);
    if (preset) this.range.set(preset);
  }

  go(path: string) {
    this.router.navigate([path]);
  }
}
