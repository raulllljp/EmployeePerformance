import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PerformanceRecord, Review } from '../models';

const MOCK_RECORDS: PerformanceRecord[] = [
  {
    id: 1, employeeId: 3, reviewDate: new Date('2025-12-15'), reviewerId: 2,
    overallRating: 4.5, productivityScore: 4.7, qualityScore: 4.5,
    communicationScore: 4.3, teamworkScore: 4.6, innovationScore: 4.4, attendanceScore: 5.0,
    comments: 'Excellent performance throughout the year. Consistently delivers high-quality work.',
    goals: ['Complete AWS certification', 'Lead at least 2 major projects', 'Mentor junior developers'],
    achievements: ['Successfully migrated legacy system to cloud', 'Reduced deployment time by 40%', 'Mentored 2 junior developers'],
    areasOfImprovement: ['Public speaking skills', 'Documentation practices'],
    period: '2025 Annual'
  },
  {
    id: 2, employeeId: 4, reviewDate: new Date('2025-12-10'), reviewerId: 2,
    overallRating: 4.2, productivityScore: 4.5, qualityScore: 4.0,
    communicationScore: 4.3, teamworkScore: 4.2, innovationScore: 4.0, attendanceScore: 4.5,
    comments: 'Strong performance with consistent delivery of features. Good team player.',
    goals: ['Improve frontend performance', 'Learn React Native', 'Contribute to open source'],
    achievements: ['Developed new dashboard module', 'Improved page load time by 30%', 'Fixed critical production bugs'],
    areasOfImprovement: ['Code review participation', 'Time management'],
    period: '2025 Annual'
  },
  {
    id: 3, employeeId: 6, reviewDate: new Date('2025-11-20'), reviewerId: 5,
    overallRating: 4.0, productivityScore: 4.2, qualityScore: 3.8,
    communicationScore: 4.3, teamworkScore: 4.0, innovationScore: 3.8, attendanceScore: 4.0,
    comments: 'Good performance with steady improvement in sales metrics.',
    goals: ['Achieve 120% of sales target', 'Expand client base by 20%', 'Complete sales training program'],
    achievements: ['Closed 15 major deals', 'Generated $500K in new revenue', 'Maintained 95% client satisfaction'],
    areasOfImprovement: ['CRM data entry', 'Follow-up consistency'],
    period: 'Q4 2025'
  },
  {
    id: 4, employeeId: 7, reviewDate: new Date('2025-10-15'), reviewerId: 2,
    overallRating: 3.8, productivityScore: 4.0, qualityScore: 3.5,
    communicationScore: 4.0, teamworkScore: 4.0, innovationScore: 3.5, attendanceScore: 4.0,
    comments: 'Showing good progress as a junior developer. Needs more experience with complex systems.',
    goals: ['Master React framework', 'Complete 5 feature implementations', 'Improve code quality'],
    achievements: ['Successfully delivered 3 features', 'Fixed 50+ bugs', 'Completed React training'],
    areasOfImprovement: ['System design skills', 'Problem-solving speed', 'Testing practices'],
    period: 'Q4 2025'
  },
  {
    id: 5, employeeId: 9, reviewDate: new Date('2025-09-30'), reviewerId: 8,
    overallRating: 4.3, productivityScore: 4.5, qualityScore: 4.2,
    communicationScore: 4.4, teamworkScore: 4.3, innovationScore: 4.0, attendanceScore: 4.5,
    comments: 'Excellent creativity in marketing campaigns. Strong collaboration with sales team.',
    goals: ['Launch 3 new campaigns', 'Increase social media engagement by 50%', 'Develop content strategy'],
    achievements: ['Successfully launched product campaign', 'Increased engagement by 60%', 'Created content calendar'],
    areasOfImprovement: ['Analytics skills', 'Budget management'],
    period: 'Q3 2025'
  }
];

const MOCK_REVIEWS: Review[] = [
  { id: 1, employeeId: 3,  reviewerId: 2, reviewType: 'annual',     reviewDate: new Date('2025-12-15'), dueDate: new Date('2025-12-20'), status: 'completed',   performanceRecordId: 1, submittedDate: new Date('2025-12-15'), approvedDate: new Date('2025-12-18'), approvedBy: 1 },
  { id: 2, employeeId: 4,  reviewerId: 2, reviewType: 'annual',     reviewDate: new Date('2025-12-10'), dueDate: new Date('2025-12-15'), status: 'completed',   performanceRecordId: 2, submittedDate: new Date('2025-12-10'), approvedDate: new Date('2025-12-12'), approvedBy: 1 },
  { id: 3, employeeId: 11, reviewerId: 2, reviewType: 'quarterly',  reviewDate: new Date('2026-01-15'), dueDate: new Date('2026-01-20'), status: 'pending' },
  { id: 4, employeeId: 7,  reviewerId: 2, reviewType: 'quarterly',  reviewDate: new Date('2026-01-18'), dueDate: new Date('2026-01-25'), status: 'in-progress' },
  { id: 5, employeeId: 6,  reviewerId: 5, reviewType: 'quarterly',  reviewDate: new Date('2025-11-20'), dueDate: new Date('2025-11-30'), status: 'completed',   performanceRecordId: 3 }
];

@Injectable({ providedIn: 'root' })
export class PerformanceService {
  private performanceRecordsSubject = new BehaviorSubject<PerformanceRecord[]>([...MOCK_RECORDS]);
  public performanceRecords$ = this.performanceRecordsSubject.asObservable();

  private reviewsSubject = new BehaviorSubject<Review[]>([...MOCK_REVIEWS]);
  public reviews$ = this.reviewsSubject.asObservable();

  // --- Performance Records ---

  getAllPerformanceRecords(): Observable<PerformanceRecord[]> {
    return of([...MOCK_RECORDS]).pipe(tap(r => this.performanceRecordsSubject.next(r)));
  }

  getPerformanceRecordById(id: number): Observable<PerformanceRecord> {
    const rec = MOCK_RECORDS.find(r => r.id === Number(id));
    return rec ? of({ ...rec }) : of({} as PerformanceRecord);
  }

  getPerformanceRecordsByEmployee(employeeId: number): Observable<PerformanceRecord[]> {
    return of(MOCK_RECORDS.filter(r => r.employeeId === Number(employeeId)));
  }

  addPerformanceRecord(record: Omit<PerformanceRecord, 'id'>): Observable<PerformanceRecord> {
    const newRec: PerformanceRecord = { ...record, id: MOCK_RECORDS.length + 100 } as PerformanceRecord;
    MOCK_RECORDS.push(newRec);
    this.performanceRecordsSubject.next([...MOCK_RECORDS]);
    return of(newRec);
  }

  updatePerformanceRecord(record: PerformanceRecord): Observable<PerformanceRecord> {
    const idx = MOCK_RECORDS.findIndex(r => r.id === record.id);
    if (idx !== -1) {
      MOCK_RECORDS[idx] = { ...record };
      this.performanceRecordsSubject.next([...MOCK_RECORDS]);
    }
    return of({ ...record });
  }

  // --- Reviews ---

  getAllReviews(): Observable<Review[]> {
    return of([...MOCK_REVIEWS]).pipe(tap(r => this.reviewsSubject.next(r)));
  }

  getReviewById(id: number): Observable<Review> {
    const rev = MOCK_REVIEWS.find(r => r.id === Number(id));
    return rev ? of({ ...rev }) : of({} as Review);
  }

  getReviewsByEmployee(employeeId: number): Observable<Review[]> {
    return of(MOCK_REVIEWS.filter(r => r.employeeId === Number(employeeId)));
  }

  getPendingReviews(): Observable<Review[]> {
    return of(MOCK_REVIEWS.filter(r => r.status === 'pending'));
  }

  addReview(review: Omit<Review, 'id'>): Observable<Review> {
    const newReview: Review = { ...review, id: MOCK_REVIEWS.length + 100 } as Review;
    MOCK_REVIEWS.push(newReview);
    this.reviewsSubject.next([...MOCK_REVIEWS]);
    return of(newReview);
  }

  updateReview(review: Review): Observable<Review> {
    const idx = MOCK_REVIEWS.findIndex(r => r.id === review.id);
    if (idx !== -1) {
      MOCK_REVIEWS[idx] = { ...review };
      this.reviewsSubject.next([...MOCK_REVIEWS]);
    }
    return of({ ...review });
  }

  // --- Analytics ---

  getPerformanceStatistics(): Observable<{
    averageRating: number; totalReviews: number; exceptional: number;
    exceedsExpectations: number; meetsExpectations: number; needsImprovement: number;
  }> {
    return of(MOCK_RECORDS).pipe(
      map(records => {
        const totalRating = records.reduce((sum, r) => sum + r.overallRating, 0);
        return {
          averageRating: totalRating / records.length,
          totalReviews: records.length,
          exceptional:          records.filter(r => r.overallRating >= 4.5).length,
          exceedsExpectations:  records.filter(r => r.overallRating >= 4.0 && r.overallRating < 4.5).length,
          meetsExpectations:    records.filter(r => r.overallRating >= 3.0 && r.overallRating < 4.0).length,
          needsImprovement:     records.filter(r => r.overallRating < 3.0).length
        };
      })
    );
  }

  getAverageRatingByDepartment(_departmentId: number): Observable<number> {
    return of(MOCK_RECORDS).pipe(
      map(records => {
        if (!records.length) return 0;
        return records.reduce((acc, r) => acc + r.overallRating, 0) / records.length;
      })
    );
  }
}
