import { Component, OnInit } from '@angular/core';
import { StudentResponse } from '../../../models/student.model';

@Component({
  selector: 'app-student-management',
  templateUrl: './student-management.component.html',
  styleUrls: ['./student-management.component.scss']
})
export class StudentManagementComponent implements OnInit {
  activeView: 'list' | 'register' = 'list';
  refreshList = false;
  selectedStudent: StudentResponse | null = null;
  
  // Stats properties (you can connect these to your service)
  totalStudents = 0;
  newStudentsThisMonth = 0;
  activeStudents = 0;

  constructor() {}

  ngOnInit(): void {}

  showRegisterForm(): void {
    this.activeView = 'register';
    this.selectedStudent = null;
  }

  showStudentList(): void {
    this.activeView = 'list';
    this.selectedStudent = null;
    this.triggerListRefresh();
  }

  onStudentRegistered(student: StudentResponse): void {
    this.showStudentList();
  }

  onCancelRegistration(): void {
    this.showStudentList();
  }

  onEditStudent(student: StudentResponse): void {
    this.selectedStudent = student;
    this.activeView = 'register';
  }

  onViewStudent(student: StudentResponse): void {
    this.selectedStudent = student;
    // You can implement a view-only modal or component here
    console.log('Viewing student:', student);
  }

  private triggerListRefresh(): void {
    this.refreshList = !this.refreshList;
  }
}
