import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { SplashScreenComponent } from './shared/splash-screen/splash-screen.component';
import { IosInstallPromptComponent } from './shared/ios-install-prompt/ios-install-prompt.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

// Feature Modules
import { StudentsModule } from './features/students/students.module';

@NgModule({
  declarations: [
    AppComponent,
    SplashScreenComponent,
    IosInstallPromptComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    StudentsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
