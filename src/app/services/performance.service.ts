import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { PerformanceRecord, Review } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  /** Base URL of the JSON Server mock API. */
  private readonly apiUrl = 'http://localhost:3000';

  private performanceRecordsSubject = new BehaviorSubject<PerformanceRecord[]>([]);
  public performanceRecords$ = this.performanceRecordsSubject.asObservable();

  private reviewsSubject = new BehaviorSubject<Review[]>([]);
  public reviews$ = this.reviewsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadData();
  }

  /** Fetch performance records & reviews from JSON Server and seed the BehaviorSubjects. */
  private loadData(): void {
    this.http.get<PerformanceRecord[]>(`${this.apiUrl}/performanceRecords`).pipe(
      map(records => records.map(r => ({ ...r, reviewDate: new Date(r.reviewDate) }))),
      catchError(this.handleError)
    ).subscribe(records => this.performanceRecordsSubject.next(records));

    this.http.get<Review[]>(`${this.apiUrl}/reviews`).pipe(
      map(reviews => reviews.map(r => ({
        ...r,
        reviewDate: new Date(r.reviewDate),
        dueDate: new Date(r.dueDate),
        submittedDate: r.submittedDate ? new Date(r.submittedDate) : undefined,
        approvedDate: r.approvedDate ? new Date(r.approvedDate) : undefined
      }))),
      catchError(this.handleError)
    ).subscribe(reviews => this.reviewsSubject.next(reviews));
  }

  // --- Performance Records ---

  getAllPerformanceRecords(): Observable<PerformanceRecord[]> {
    return this.http.get<PerformanceRecord[]>(`${this.apiUrl}/performanceRecords`).pipe(
      map(records => records.map(r => ({ ...r, reviewDate: new Date(r.reviewDate) }))),
      tap(records => this.performanceRecordsSubject.next(records)),
      catchError(this.handleError)
    );
  }

  getPerformanceRecordById(id: number): Observable<PerformanceRecord> {
    return this.http.get<PerformanceRecord>(`${this.apiUrl}/performanceRecords/${id}`).pipe(
      map(r => ({ ...r, reviewDate: new Date(r.reviewDate) })),
      catchError(this.handleError)
    );
  }

  getPerformanceRecordsByEmployee(employeeId: number): Observable<PerformanceRecord[]> {
    return this.http.get<PerformanceRecord[]>(
      `${this.apiUrl}/performanceRecords?employeeId=${employeeId}`
    ).pipe(
      map(records => records.map(r => ({ ...r, reviewDate: new Date(r.reviewDate) }))),
      catchError(this.handleError)
    );
  }

  addPerformanceRecord(record: Omit<PerformanceRecord, 'id'>): Observable<PerformanceRecord> {
    return this.http.post<PerformanceRecord>(`${this.apiUrl}/performanceRecords`, record).pipe(
      map(r => ({ ...r, reviewDate: new Date(r.reviewDate) })),
      tap(newRecord => {
        const current = this.performanceRecordsSubject.value;
        this.performanceRecordsSubject.next([...current, newRecord]);
      }),
      catchError(this.handleError)
    );
  }

  updatePerformanceRecord(record: PerformanceRecord): Observable<PerformanceRecord> {
    return this.http.put<PerformanceRecord>(
      `${this.apiUrl}/performanceRecords/${record.id}`, record
    ).pipe(
      map(r => ({ ...r, reviewDate: new Date(r.reviewDate) })),
      tap(updated => {
        const current = this.performanceRecordsSubject.value;
        const idx = current.findIndex(r => r.id === updated.id);
        if (idx !== -1) {
          const copy = [...current];
          copy[idx] = updated;
          this.performanceRecordsSubject.next(copy);
        }
      }),
      catchError(this.handleError)
    );
  }

  // --- Reviews ---

  getAllReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviews`).pipe(
      map(reviews => this.mapReviewDates(reviews)),
      tap(reviews => this.reviewsSubject.next(reviews)),
      catchError(this.handleError)
    );
  }

  getReviewById(id: number): Observable<Review> {
    return this.http.get<Review>(`${this.apiUrl}/reviews/${id}`).pipe(
      map(r => this.mapSingleReviewDates(r)),
      catchError(this.handleError)
    );
  }

  getReviewsByEmployee(employeeId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviews?employeeId=${employeeId}`).pipe(
      map(reviews => this.mapReviewDates(reviews)),
      catchError(this.handleError)
    );
  }

  getPendingReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviews?status=pending`).pipe(
      map(reviews => this.mapReviewDates(reviews)),
      catchError(this.handleError)
    );
  }

  addReview(review: Omit<Review, 'id'>): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/reviews`, review).pipe(
      map(r => this.mapSingleReviewDates(r)),
      tap(newReview => {
        const current = this.reviewsSubject.value;
        this.reviewsSubject.next([...current, newReview]);
      }),
      catchError(this.handleError)
    );
  }

  updateReview(review: Review): Observable<Review> {
    return this.http.put<Review>(`${this.apiUrl}/reviews/${review.id}`, review).pipe(
      map(r => this.mapSingleReviewDates(r)),
      tap(updated => {
        const current = this.reviewsSubject.value;
        const idx = current.findIndex(r => r.id === updated.id);
        if (idx !== -1) {
          const copy = [...current];
          copy[idx] = updated;
          this.reviewsSubject.next(copy);
        }
      }),
      catchError(this.handleError)
    );
  }

  // --- Analytics ---

  getPerformanceStatistics(): Observable<{
    averageRating: number;
    totalReviews: number;
    exceptional: number;
    exceedsExpectations: number;
    meetsExpectations: number;
    needsImprovement: number;
  }> {
    return this.getAllPerformanceRecords().pipe(
      map(records => {
        if (records.length === 0) {
          return {
            averageRating: 0,
            totalReviews: 0,
            exceptional: 0,
            exceedsExpectations: 0,
            meetsExpectations: 0,
            needsImprovement: 0
          };
        }
        const totalRating = records.reduce((sum, r) => sum + r.overallRating, 0);
        return {
          averageRating: totalRating / records.length,
          totalReviews: records.length,
          exceptional: records.filter(r => r.overallRating >= 4.5).length,
          exceedsExpectations: records.filter(r => r.overallRating >= 4.0 && r.overallRating < 4.5).length,
          meetsExpectations: records.filter(r => r.overallRating >= 3.0 && r.overallRating < 4.0).length,
          needsImprovement: records.filter(r => r.overallRating < 3.0).length
        };
      }),
      catchError(this.handleError)
    );
  }

  getAverageRatingByDepartment(_departmentId: number): Observable<number> {
    return this.getAllPerformanceRecords().pipe(
      map(records => {
        if (records.length === 0) return 0;
        const sum = records.reduce((acc, r) => acc + r.overallRating, 0);
        return sum / records.length;
      }),
      catchError(this.handleError)
    );
  }

  // --- Helpers ---

  private mapReviewDates(reviews: Review[]): Review[] {
    return reviews.map(r => this.mapSingleReviewDates(r));
  }

  private mapSingleReviewDates(r: Review): Review {
    return {
      ...r,
      reviewDate: new Date(r.reviewDate),
      dueDate: new Date(r.dueDate),
      submittedDate: r.submittedDate ? new Date(r.submittedDate) : undefined,
      approvedDate: r.approvedDate ? new Date(r.approvedDate) : undefined
    };
  }

  // --- Error Handling ---

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An unexpected error occurred.';
    if (error.status === 0) {
      message = 'Network error: Cannot reach the server. Is JSON Server running? (npm run server)';
    } else {
      message = `Server returned code ${error.status}: ${error.message}`;
    }
    console.error('[PerformanceService]', message, error);
    return throwError(() => new Error(message));
  }
}
