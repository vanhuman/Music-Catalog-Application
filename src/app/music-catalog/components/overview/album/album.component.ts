import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { AlbumInterface } from '../../../models/album.model.interface';
import { AlbumsFactoryInterface } from '../../../factories/albums/albums.factory.interface';
import { AlbumPostData } from '../../../models/api-post-data/album-api-post-data.interface';
import { McCommunication } from '../../../models/music-catalog-communication.interface';
import { Configuration } from '../../../configuration';
import * as moment from 'moment';
import { AuthenticationServiceInterface } from '../../../services/authentication.service.interface';

@Component({
    selector: 'music-catalog-album',
    templateUrl: './album.component.html',
    styleUrls: ['./album.component.css'],
})
export class AlbumComponent {
    @Output() mcCommunicationOut: EventEmitter<McCommunication> = new EventEmitter<McCommunication>();

    public editImage = Configuration.ICONS_PATH + 'edit.svg';
    public deleteImage = Configuration.ICONS_PATH + 'delete.svg';
    public showImages = Configuration.SHOW_IMAGES;
    public isAdmin = false;

    private _album: AlbumInterface;

    public constructor(
        private albumsFactory: AlbumsFactoryInterface,
        private elementRef: ElementRef,
        private authenticationService: AuthenticationServiceInterface,
    ) {
        this.isAdmin = this.authenticationService.isAdmin();
    }

    @Input()
    set album(album: AlbumInterface) {
        this._album = album;
        this.getImages(this.album);
        this.isAdmin = this.authenticationService.isAdmin();
    }

    get album(): AlbumInterface {
        return this._album;
    }

    @Input()
    set mcCommunication(mcCommunication: McCommunication) {
        if (mcCommunication) {
            switch (mcCommunication.action) {
                case 'getImage':
                    if (mcCommunication.item === this.album) {
                        this.getImages(this.album, true);
                    }
                    break;
                case 'loggedIn':
                    this.isAdmin = this.authenticationService.isAdmin();
                    break;
                default:
                //
            }
        }
    }

    public edit(): void {
        this.mcCommunicationOut.emit({
            item: this.album,
            action: 'editAlbum',
        });
    }

    public delete(event: MouseEvent): void {
        event.stopPropagation();
        this.mcCommunicationOut.emit({
            item: this.album,
            action: 'deleteAlbum',
        });
    }

    public getTop(): string {
        if ((<HTMLElement>this.elementRef.nativeElement).offsetTop < 250) {
            return '-30px';
        } else if ((<HTMLElement>this.elementRef.nativeElement).offsetTop > 0.7 * window.innerHeight) {
            return '-300px';
        } else {
            return '-150px';
        }
    }

    private getImages(album: AlbumInterface, forced: boolean = false): void {
        let albumPostData: AlbumPostData;
        if (album.isMissingImages() || forced) {
            // if no images at all or forced, get from lastfm and store in db
            const fetchInterval = new Date();
            fetchInterval.setDate(fetchInterval.getDate() - Configuration.IMAGE_FETCH_INTERVAL);
            if (forced || !album.getImageFetchTimestamp() || album.getImageFetchTimestamp() < fetchInterval) {
                this.albumsFactory.getImagesFromLastfm(album).then(
                    (imageMap) => {
                        if (imageMap.has('small') && imageMap.get('small')
                            && imageMap.has('extralarge') && imageMap.get('extralarge')) {
                            const imageThumb = imageMap.get('small');
                            const imageExtralarge = imageMap.get('extralarge');
                            albumPostData = {
                                image_thumb: imageThumb,
                                image: imageExtralarge,
                                image_fetch_timestamp: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                            };
                            if (this.authenticationService.isAdmin()) {
                                // save the image locations in the database
                                this.albumsFactory.putAlbum(albumPostData, album);
                            } else {
                                // only update the model if we are not admin
                                this.albumsFactory.updateAlbumImages(album, {
                                    image: albumPostData.image,
                                    image_thumb: albumPostData.image_thumb,
                                });
                            }
                        } else {
                            this.saveImageTimestamp(album);
                        }
                    },
                    () => {
                        this.saveImageTimestamp(album);
                    }
                );
            }
        } else if (Configuration.RIP_IMAGES_ON_BROWSE
            && (!album.getImageThumbLocal() || !album.getImageLocal())
            && this.authenticationService.isAdmin()) {
            // if no local images, save remote images to trigger download to local in the API
            albumPostData = {
                image_thumb: album.getImageThumb(),
                image: album.getImage(),
                image_fetch_timestamp: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            };
            this.albumsFactory.putAlbum(albumPostData, album);
        }
    }

    private saveImageTimestamp(album: AlbumInterface): void {
        if (this.authenticationService.isAdmin()) {
            // save the image fetch timestamp in the database
            const albumPostData = {
                image_fetch_timestamp: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            };
            this.albumsFactory.putAlbum(albumPostData, album);
        }
    }
}
