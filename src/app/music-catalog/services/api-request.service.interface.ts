import { HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

export abstract class ApiRequestServiceInterface {
    public abstract get<T>(url: string, params: HttpParams): Observable<HttpResponse<T>>;
    public abstract getThrottled<T>(url: string, params: HttpParams, externalRequest: boolean): Observable<HttpResponse<T>>;
    public abstract post<T>(url: string, body, headers): Observable<HttpResponse<T>>;
    public abstract put<T>(url: string, body, headers): Observable<HttpResponse<T>>;
    public abstract delete<T>(url: string, headers): Observable<HttpResponse<T>>;
    public abstract monitorAuthorisationError(): Subject<boolean>;
    public abstract clearHttpQueue(): void;
}

