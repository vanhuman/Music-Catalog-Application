import { AlbumInterface } from '../models/album.model.interface';
import { Observable } from 'rxjs';
import { SortDirection, SortField } from '../components/overview/overview.component';

export interface AlbumsMetaData {
    totalNumberOfRecords: number;
    currentPage: number;
    pageSize: number;
}

export interface GetAlbumsParams {
    page: number;
    keywords: string;
    sortby: SortField;
    sortdirection: SortDirection;
}

export abstract class AlbumsFactoryInterface {
    public abstract getAlbums(getAlbumsParams: GetAlbumsParams): Observable<AlbumInterface[]>;
    public abstract getAlbumsMetaData(): Observable<AlbumsMetaData>;
}
