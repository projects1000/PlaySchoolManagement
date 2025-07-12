import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentManagementComponent } from './features/students/student-management/student-management.component';

const routes: Routes = [
  { path: '', redirectTo: '/students', pathMatch: 'full' },
  { path: 'students', component: StudentManagementComponent },
  { path: '**', redirectTo: '/students' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
