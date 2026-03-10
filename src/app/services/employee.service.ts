import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Employee, Department } from '../models';

const MOCK_EMPLOYEES: Employee[] = [
  { id: 1,  firstName: 'Agni',    lastName: 'Klepth',    email: 'agni.klepth@company.com',    position: 'CEO',                  departmentId: 1, hireDate: new Date('2018-01-15'), salary: 150000, status: 'active' },
  { id: 2,  firstName: 'Deoxys',  lastName: 'Kumar',     email: 'deoxys.kumar@company.com',   position: 'Engineering Manager',  departmentId: 1, hireDate: new Date('2019-03-20'), salary: 120000, status: 'active',    managerId: 1 },
  { id: 3,  firstName: 'Mike',    lastName: 'Manu',      email: 'mike.manu@company.com',      position: 'Senior Developer',     departmentId: 1, hireDate: new Date('2020-05-10'), salary: 95000,  status: 'active',    managerId: 2 },
  { id: 4,  firstName: 'Sarah',   lastName: 'Williams',  email: 'sarah.williams@company.com', position: 'Full Stack Developer', departmentId: 1, hireDate: new Date('2021-02-14'), salary: 85000,  status: 'active',    managerId: 2 },
  { id: 5,  firstName: 'David',   lastName: 'Brown',     email: 'david.brown@company.com',    position: 'Sales Manager',        departmentId: 2, hireDate: new Date('2019-07-01'), salary: 110000, status: 'active',    managerId: 1 },
  { id: 6,  firstName: 'Abdul',   lastName: 'Krishna',   email: 'abdul.krishna@company.com',  position: 'Sales Representative', departmentId: 2, hireDate: new Date('2021-09-15'), salary: 65000,  status: 'active',    managerId: 5 },
  { id: 7,  firstName: 'Robert',  lastName: 'Miller',    email: 'robert.miller@company.com',  position: 'Junior Developer',     departmentId: 1, hireDate: new Date('2022-01-10'), salary: 70000,  status: 'active',    managerId: 2 },
  { id: 8,  firstName: 'Lisa',    lastName: 'Wilson',    email: 'lisa.wilson@company.com',    position: 'Marketing Manager',    departmentId: 3, hireDate: new Date('2020-04-20'), salary: 105000, status: 'active',    managerId: 1 },
  { id: 9,  firstName: 'Tom',     lastName: 'Jerry',     email: 'tom.jerry@company.com',      position: 'Marketing Specialist', departmentId: 3, hireDate: new Date('2021-11-05'), salary: 60000,  status: 'active',    managerId: 8 },
  { id: 10, firstName: 'Swift',   lastName: 'Taylor',    email: 'swift.taylor@company.com',   position: 'HR Manager',           departmentId: 4, hireDate: new Date('2019-08-12'), salary: 100000, status: 'active',    managerId: 1 },
  { id: 11, firstName: 'Chris',   lastName: 'Anderson',  email: 'chris.anderson@company.com', position: 'Frontend Developer',   departmentId: 1, hireDate: new Date('2021-06-30'), salary: 80000,  status: 'on-leave',  managerId: 2 },
  { id: 12, firstName: 'Jessica', lastName: 'Thomas',    email: 'jessica.thomas@company.com', position: 'Finance Manager',      departmentId: 5, hireDate: new Date('2020-02-18'), salary: 115000, status: 'active',    managerId: 1 }
];

const MOCK_DEPARTMENTS: Department[] = [
  { id: 1, name: 'Engineering', description: 'Software Development',         employeeCount: 25, managerId: 2,  budget: 500000 },
  { id: 2, name: 'Sales',       description: 'Sales and Business Development', employeeCount: 15, managerId: 5,  budget: 300000 },
  { id: 3, name: 'Marketing',   description: 'Marketing and Communications',  employeeCount: 10, managerId: 8,  budget: 200000 },
  { id: 4, name: 'HR',          description: 'Human Resources',               employeeCount: 5,  managerId: 10, budget: 150000 },
  { id: 5, name: 'Finance',     description: 'Finance and Accounting',         employeeCount: 8,  managerId: 12, budget: 250000 }
];

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private employeesSubject = new BehaviorSubject<Employee[]>([...MOCK_EMPLOYEES]);
  public employees$ = this.employeesSubject.asObservable();

  private departmentsSubject = new BehaviorSubject<Department[]>([...MOCK_DEPARTMENTS]);
  public departments$ = this.departmentsSubject.asObservable();

  // ─── Employees ───────────────────────────────────────────────────────────────

  getAllEmployees(): Observable<Employee[]> {
    return of([...MOCK_EMPLOYEES]).pipe(
      tap(employees => this.employeesSubject.next(employees))
    );
  }

  getEmployeeById(id: number): Observable<Employee> {
    const emp = MOCK_EMPLOYEES.find(e => e.id === Number(id));
    return emp ? of({ ...emp }) : of({} as Employee);
  }

  getEmployeesByDepartment(departmentId: number): Observable<Employee[]> {
    return of(MOCK_EMPLOYEES.filter(e => e.departmentId === Number(departmentId)));
  }

  addEmployee(employee: Omit<Employee, 'id'>): Observable<Employee> {
    const current = this.employeesSubject.value;
    const newEmp: Employee = { ...employee, id: current.length + 100 } as Employee;
    MOCK_EMPLOYEES.push(newEmp);
    this.employeesSubject.next([...MOCK_EMPLOYEES]);
    return of(newEmp);
  }

  updateEmployee(employee: Employee): Observable<Employee> {
    const idx = MOCK_EMPLOYEES.findIndex(e => e.id === employee.id);
    if (idx !== -1) {
      MOCK_EMPLOYEES[idx] = { ...employee };
      this.employeesSubject.next([...MOCK_EMPLOYEES]);
    }
    return of({ ...employee });
  }

  deleteEmployee(id: number): Observable<void> {
    const idx = MOCK_EMPLOYEES.findIndex(e => e.id === id);
    if (idx !== -1) MOCK_EMPLOYEES.splice(idx, 1);
    this.employeesSubject.next([...MOCK_EMPLOYEES]);
    return of(undefined);
  }

  // ─── Departments ─────────────────────────────────────────────────────────────

  getAllDepartments(): Observable<Department[]> {
    return of([...MOCK_DEPARTMENTS]).pipe(
      tap(departments => this.departmentsSubject.next(departments))
    );
  }

  getDepartmentById(id: number): Observable<Department> {
    const dept = MOCK_DEPARTMENTS.find(d => d.id === Number(id));
    return dept ? of({ ...dept }) : of({} as Department);
  }
}
