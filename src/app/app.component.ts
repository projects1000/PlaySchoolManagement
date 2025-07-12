import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { PwaService } from './core/services/pwa.service';
import { OfflineService } from './core/services/offline.service';
import { EnvironmentService } from './core/services/environment.service';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './features/auth/login/login.component';
import { SignupComponent } from './features/auth/signup/signup.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'PlaySchool Management';
  isOnline = true;
  canInstallPwa = false;
  currentRoute = '';
  showUserMenu = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private pwaService: PwaService,
    private offlineService: OfflineService,
    public envService: EnvironmentService,
    public authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initializeApp();
    this.setupRouterEvents();
    this.setupNetworkStatus();
    this.checkPwaInstallability();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeApp(): void {
    console.log('PlaySchool Management PWA initialized');
  }

  private setupRouterEvents(): void {
    const routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.currentRoute = event.url;
        }
      });
    
    this.subscriptions.push(routerSub);
  }

  private setupNetworkStatus(): void {
    const networkSub = this.offlineService.isOnline$.subscribe(status => {
      this.isOnline = status;
    });
    
    this.subscriptions.push(networkSub);
  }

  private checkPwaInstallability(): void {
    // Check periodically if PWA can be installed
    setInterval(() => {
      this.canInstallPwa = this.pwaService.canInstall();
    }, 1000);
  }

  public installPwa(): void {
    this.pwaService.installPwa();
  }

  public getStatusText(): string {
    if (this.isOnline) {
      return 'Connected';
    } else {
      return 'Working Offline';
    }
  }

  public hasActiveRoute(): boolean {
    return this.currentRoute !== '' && this.currentRoute !== '/';
  }

  // Authentication Methods
  openLoginDialog(): void {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '450px',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'auth-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        console.log('✅ User logged in successfully');
        this.showUserMenu = false;
        // Optionally navigate to dashboard
        this.router.navigate(['/dashboard']);
      }
    });
  }

  openSignupDialog(): void {
    const dialogRef = this.dialog.open(SignupComponent, {
      width: '550px',
      maxWidth: '90vw',
      maxHeight: '85vh',
      disableClose: false,
      panelClass: 'auth-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        console.log('✅ User registered successfully');
        // Show success message and open login dialog
        setTimeout(() => {
          this.openLoginDialog();
        }, 500);
      }
    });
  }

  // User Menu Methods
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  getCurrentUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'User';
  }

  getCurrentUserRole(): string {
    const user = this.authService.getCurrentUser();
    if (!user || !user.roles?.length) return 'Guest';
    
    const role = user.roles[0].replace('ROLE_', '');
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  viewProfile(): void {
    this.showUserMenu = false;
    // TODO: Navigate to profile page
    console.log('🔧 Profile page not implemented yet');
  }

  viewSettings(): void {
    this.showUserMenu = false;
    // TODO: Navigate to settings page
    console.log('🔧 Settings page not implemented yet');
  }

  logout(): void {
    this.showUserMenu = false;
    this.authService.logout();
    console.log('👋 User logged out');
    this.router.navigate(['/dashboard']);
  }

  // Close user menu when clicking outside
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const userMenu = target.closest('.user-menu');
    if (!userMenu && this.showUserMenu) {
      this.showUserMenu = false;
    }
  }
}
