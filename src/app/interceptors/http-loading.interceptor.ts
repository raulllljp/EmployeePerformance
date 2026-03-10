import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, finalize, retry } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

/**
 * Functional HTTP interceptor that:
 *  - Shows a global loading spinner via LoadingService for every request.
 *  - Retries failed requests once before propagating the error.
 *  - Maps HTTP errors to human-readable messages.
 */
export const httpLoadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  loadingService.show();

  return next(req).pipe(
    retry(1),
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred.';

      if (error.status === 0) {
        // Network / CORS error – JSON Server may not be running
        errorMessage =
          'Cannot connect to the server. Please ensure JSON Server is running on port 3000 (run: npm run server).';
      } else if (error.status === 404) {
        errorMessage = `Resource not found: ${req.url}`;
      } else if (error.status === 400) {
        errorMessage = 'Bad request. Please check the submitted data.';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      } else {
        errorMessage = `Server error (${error.status}): ${error.message}`;
      }

      console.error('[HttpInterceptor]', errorMessage, error);
      return throwError(() => new Error(errorMessage));
    }),
    finalize(() => loadingService.hide())
  );
};
