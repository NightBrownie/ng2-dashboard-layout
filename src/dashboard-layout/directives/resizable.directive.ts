import {
  AfterContentInit, ContentChildren, Directive, EventEmitter, Input, OnDestroy, Output,
  QueryList
} from '@angular/core';

import {DashboardLayoutItemDirective} from './dashboard-layout-item.directive';
import {CoordinatesModel} from '../models/coordinates.model';
import {Subscription} from 'rxjs/Subscription';
import {ResizerDirective} from './resizer.directive';
import {ResizeStartModel} from '../models/resize-start.model';


@Directive({
  selector: '[resizable]'
})
export class ResizableDirective extends DashboardLayoutItemDirective implements AfterContentInit, OnDestroy {
  private startResizeCoordinates: CoordinatesModel;
  private cachedElementClientBoundingRect: ClientRect;
  private resizerSubs: Subscription[] = [];

  @Input() private resizable: boolean;
  @Input() private resizing: boolean;
  @Output() private resizingChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ContentChildren(ResizerDirective) private resizers: QueryList<ResizerDirective>;

  ngAfterContentInit(): void {
    this.resizerSubs = this.resizers.map(resizer => resizer.resizeStartSubject.subscribe(
      resizeStartCoordinates => this.startResize(resizeStartCoordinates)));
  }

  ngOnDestroy(): void {
    this.resizerSubs.forEach(resizerSubscription => resizerSubscription.unsubscribe());
    this.dashboardLayoutService.unregisterDashboardLayoutItem(this);
  }

  private startResize(resizeStart: ResizeStartModel) {
    this.startResizeCoordinates = resizeStart.coordinates;
    this.cachedElementClientBoundingRect = super.getElementClientBoundingRect();
    this.resizingChange.next(true);
  }
}
