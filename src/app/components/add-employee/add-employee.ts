import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { EmployeeService } from '../../services/employee.service';
import { Department, Employee } from '../../models';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatStepperModule
  ],
  templateUrl: './add-employee.html',
  styleUrl: './add-employee.css'
})
export class AddEmployee implements OnInit {
  personalForm!: FormGroup;
  employmentForm!: FormGroup;

  departments: Department[] = [];
  employees: Employee[] = [];
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.personalForm = this.fb.group({
      firstName:   ['', [Validators.required, Validators.minLength(2)]],
      lastName:    ['', [Validators.required, Validators.minLength(2)]],
      email:       ['', [Validators.required, Validators.email]],
      phoneNumber: ['']
    });

    this.employmentForm = this.fb.group({
      position:     ['', Validators.required],
      departmentId: ['', Validators.required],
      salary:       ['', [Validators.required, Validators.min(1)]],
      hireDate:     [new Date().toISOString().split('T')[0], Validators.required],
      status:       ['active', Validators.required],
      managerId:    ['']
    });

    this.employeeService.getAllDepartments().subscribe(d => this.departments = d);
    this.employeeService.getAllEmployees().subscribe(e => this.employees = e);
  }

  get initials(): string {
    const f = this.personalForm.get('firstName')?.value || '';
    const l = this.personalForm.get('lastName')?.value || '';
    return ((f[0] || '') + (l[0] || '')).toUpperCase() || '?';
  }

  get previewName(): string {
    const f = this.personalForm.get('firstName')?.value || '';
    const l = this.personalForm.get('lastName')?.value || '';
    return [f, l].filter(Boolean).join(' ') || 'New Employee';
  }

  getDepartmentName(id: number): string {
    return this.departments.find(d => d.id === id)?.name || '';
  }

  onSubmit(): void {
    if (this.personalForm.invalid || this.employmentForm.invalid) {
      this.personalForm.markAllAsTouched();
      this.employmentForm.markAllAsTouched();
      this.snackBar.open('Please fill all required fields.', 'Close', { duration: 3000 });
      return;
    }

    this.submitting = true;
    const v1 = this.personalForm.value;
    const v2 = this.employmentForm.value;

    const newEmployee: Employee = {
      id: 0,
      firstName:    v1.firstName.trim(),
      lastName:     v1.lastName.trim(),
      email:        v1.email.trim(),
      phoneNumber:  v1.phoneNumber?.trim() || undefined,
      position:     v2.position.trim(),
      departmentId: parseInt(v2.departmentId),
      salary:       parseFloat(v2.salary),
      hireDate:     new Date(v2.hireDate),
      status:       v2.status,
      managerId:    v2.managerId ? parseInt(v2.managerId) : undefined
    };

    this.employeeService.addEmployee(newEmployee).subscribe({
      next: (emp) => {
        this.snackBar.open(`✅ ${emp.firstName} ${emp.lastName} added successfully!`, 'Close', {
          duration: 4000,
          panelClass: ['snack-success']
        });
        this.router.navigate(['/employees']);
      },
      error: () => {
        this.snackBar.open('Error adding employee. Please try again.', 'Close', { duration: 3000 });
        this.submitting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }
}
