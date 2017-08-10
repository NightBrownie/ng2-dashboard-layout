import {Directive, HostListener, Input} from '@angular/core';
import {Subject} from 'rxjs/Subject';

import {CoordinatesModel} from '../models/coordinates.model';
import {ResizeStartModel} from '../models/resize-start.model';


@Directive({
  selector: '[resizer]'
})
export class ResizerDirective {
  @Input('resizer') resizer: string;

  private _resizeStartSubject: Subject<ResizeStartModel> = new Subject<ResizeStartModel>();

  public get resizeStartSubject(): Subject<ResizeStartModel> {
    return this._resizeStartSubject;
  }

  @HostListener('mousedown', ['$event.clientX', '$event.clientY'])
  private onMouseDown(x, y) {
    this.resizeStartSubject.next(new ResizeStartModel(new CoordinatesModel(x, y), this.resizer));
  }
}
