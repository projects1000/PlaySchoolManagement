import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PwaService } from './core/services/pwa.service';
import { OfflineService } from './core/services/offline.service';
import { EnvironmentService } from './core/services/environment.service';

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
  
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private pwaService: PwaService,
    private offlineService: OfflineService,
    public envService: EnvironmentService
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
}
