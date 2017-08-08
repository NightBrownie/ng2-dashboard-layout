import {
  Directive,
  HostListener,
} from '@angular/core';
import {Subject} from 'rxjs/Subject';

import {CoordinatesModel} from '../models';


@Directive({
  selector: '[drag-handle]'
})
export class DragHandleDirective {
  private _dragStartSubject: Subject<CoordinatesModel> = new Subject<CoordinatesModel>();

  public get dragStartSubject(): Subject<CoordinatesModel> {
    return this._dragStartSubject;
  }

  @HostListener('mousedown', ['$event.clientX', '$event.clientY'])
  private onMouseDown(x, y) {
    this.dragStartSubject.next(new CoordinatesModel(x, y));
  }
}
