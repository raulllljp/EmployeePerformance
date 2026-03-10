export interface User {
  id: number;
  username: string;
  email: string;
  role: 'manager' | 'employee';
  employeeId?: number;
  token?: string;
}

export class UserClass implements User {
  constructor(
    public id: number,
    public username: string,
    public email: string,
    public role: 'manager' | 'employee',
    public employeeId?: number,
    public token?: string
  ) {}

  get isManager(): boolean {
    return this.role === 'manager';
  }

  get canReviewPerformance(): boolean {
    return this.isManager;
  }
}
