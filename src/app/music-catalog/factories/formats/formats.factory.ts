import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { AuthenticationServiceInterface } from '../../services/authentication.service.interface';
import { ApiRequestServiceInterface } from '../../services/api-request.service.interface';
import { FormatInterface } from '../../models/format.model.interface';
import { FormatsFactoryState } from './formats.factory.state';
import {
    FormatApiResponse, FormatApiResponseWrapper, FormatsApiResponse
} from '../../models/api-responses/formats-api-response.interface';
import { ModalServiceInterface } from '../../services/modal.service.interface';
import { Format } from '../../models/format.model';
import { FormatsFactoryInterface } from './formats.factory.interface';
import { FormatApiPostData } from '../../models/api-post-data/format-api-post-data.interface';

@Injectable()
export class FormatsFactory implements FormatsFactoryInterface {

    public constructor(
        private authenticationService: AuthenticationServiceInterface,
        private apiRequestService: ApiRequestServiceInterface,
        private state: FormatsFactoryState,
        private modalService: ModalServiceInterface,
    ) {
        //
    }

    public getFormatsFromAPI(page: number): Observable<FormatInterface[]> {
        const observable: Subject<FormatInterface[]> = new Subject<FormatInterface[]>();
        const token = this.authenticationService.getToken();
        let params = new HttpParams();
        params = params.set('token', token);
        params = params.set('page', page.toString());
        if (page === 0) {
            if (this.state.retrievedAllFormats) {
                return of(this.sortFormats(this.state.getCacheAsArray()));
            }
            this.state.retrievedAllFormats = true;
        }
        this.apiRequestService.get<FormatsApiResponse>('/formats', params).subscribe({
            next: (response) => {
                const formats: FormatInterface[] = [];
                response.body.formats.forEach((formatApiResponse) => {
                    if (this.state.cache[formatApiResponse.id]) {
                        formats.push(this.updateFormat(this.state.cache[formatApiResponse.id], formatApiResponse));
                    } else {
                        const newFormat = this.newFormat(formatApiResponse);
                        formats.push(newFormat);
                        this.state.cache[newFormat.getId()] = newFormat;
                    }
                });
                observable.next(this.sortFormats(formats));
            },
            error: (error: HttpErrorResponse) => {
                this.modalService.getModal('message-modal')
                    .setMessage(error.error.message)
                    .open();
                observable.error([]);
            }
        });
        return observable;
    }

    public postFormat(formatApiPostData: FormatApiPostData): Observable<FormatInterface> {
        const observable: Subject<FormatInterface> = new Subject<FormatInterface>();
        const token = this.authenticationService.getToken();
        const headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
        let body = new HttpParams();
        if (formatApiPostData.name) {
            body = body.set('name', formatApiPostData.name);
        }
        if (formatApiPostData.description) {
            body = body.set('description', formatApiPostData.description);
        }
        this.apiRequestService.post<FormatApiResponseWrapper>(
            '/formats?token=' + token,
            body,
            headers
        ).subscribe({
            next: (response) => {
                const formatApiResponse: FormatApiResponse = response.body.format;
                const format: FormatInterface = this.newFormat(formatApiResponse);
                this.state.cache[format.getId()] = format;
                observable.next(format);
            },
            error: (error: HttpErrorResponse) => {
                this.modalService.getModal('message-modal')
                    .setMessage(error.error.message)
                    .open();
                observable.error([]);
            }
        });
        return observable;
    }

    public searchFormatsInCache(keyword: string): FormatInterface[] {
        return this.state.getCacheAsArray()
            .filter((format) => {
                return format.getName().toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
            });
    }

    public matchFormatInCache(value: string): FormatInterface {
        return this.state.getCacheAsArray()
            .find((format) => {
                return format.getName().toLowerCase() === value.toLowerCase();
            });
    }

    public updateAndGetFormat(formatApiResponse: FormatApiResponse): FormatInterface {
        if (this.state.cache[formatApiResponse.id]) {
            this.updateFormat(this.state.cache[formatApiResponse.id], formatApiResponse);
        } else {
            this.state.cache[formatApiResponse.id] = this.newFormat(formatApiResponse);
        }
        return this.state.cache[formatApiResponse.id];
    }

    private sortFormats(formats: FormatInterface[]): FormatInterface[] {
        const sortFunc = (format1: FormatInterface, format2: FormatInterface) => {
            return format1.getName().toLowerCase() < format2.getName().toLowerCase() ? -1 : 1;
        };
        return formats.sort(sortFunc);
    }

    private newFormat(formatApiResponse: FormatApiResponse): FormatInterface {
        return new Format(
            formatApiResponse.id,
            formatApiResponse.name,
            formatApiResponse.description,
        );
    }

    private updateFormat(format: FormatInterface, formatApiResponse: FormatApiResponse): FormatInterface {
        format.setName(formatApiResponse.name);
        return format;
    }
}
