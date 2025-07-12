import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {}

  navigateToStudentManagement(): void {
    this.router.navigate(['/students']);
  }

  navigateToTeacherManagement(): void {
    // Future implementation
    console.log('Teacher Management - Coming Soon!');
  }

  navigateToClassManagement(): void {
    // Future implementation
    console.log('Class Management - Coming Soon!');
  }

  navigateToAttendance(): void {
    // Future implementation
    console.log('Attendance - Coming Soon!');
  }
}
