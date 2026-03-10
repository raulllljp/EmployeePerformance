import { Pipe, PipeTransform } from '@angular/core';
import { Employee } from '../models';

@Pipe({
  name: 'employeeFilter',
  standalone: true
})
export class EmployeeFilterPipe implements PipeTransform {
  transform(
    employees: Employee[],
    searchTerm: string = '',
    departmentId: string = 'all',
    minRating: number = 0,
    performanceMap: Map<number, number> = new Map()
  ): Employee[] {
    if (!employees) return [];

    let filtered = [...employees];

    // Filter by search term
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        emp =>
          emp.firstName.toLowerCase().includes(term) ||
          emp.lastName.toLowerCase().includes(term) ||
          emp.email.toLowerCase().includes(term) ||
          emp.position.toLowerCase().includes(term)
      );
    }

    // Filter by department
    if (departmentId && departmentId !== 'all') {
      const deptId = parseInt(departmentId, 10);
      filtered = filtered.filter(emp => emp.departmentId === deptId);
    }

    // Filter by minimum rating
    if (minRating > 0) {
      filtered = filtered.filter(emp => {
        const rating = performanceMap.get(emp.id) || 0;
        return rating >= minRating;
      });
    }

    return filtered;
  }
}
