import {
  AfterContentInit, ContentChildren, Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output,
  QueryList
} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

import {DashboardLayoutItemDirective} from './dashboard-layout-item.directive';
import {CoordinatesModel} from '../models/coordinates.model';
import {Subscription} from 'rxjs/Subscription';
import {ResizerDirective} from './resizer.directive';
import {ResizeStartModel} from '../models/resize-start.model';
import {DashboardLayoutService} from '../services/dashboard-layout.service';


@Directive({
  selector: '[resizable]'
})
export class ResizableDirective extends DashboardLayoutItemDirective implements AfterContentInit, OnDestroy {
  private startResizeCoordinates: CoordinatesModel;
  private startResizeDirection: string;
  private cachedElementClientBoundingRect: ClientRect;
  private resizerSubs: Subscription[] = [];

  @Input() private resizable: boolean;
  @Output() private resizing: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ContentChildren(ResizerDirective) private resizers: QueryList<ResizerDirective>;

  @HostListener('window:mousemove', ['$event.clientX', '$event.clientY'])
  private onMouseMove(x, y) {
    if (this.startResizeCoordinates) {
      this.resize(new CoordinatesModel(x, y));
    }
  }

  @HostListener('window:mouseup', ['$event.clientX', '$event.clientY'])
  private onMouseUp(x, y) {
    if (this.startResizeCoordinates) {
      this.resizeEnd(new CoordinatesModel(x, y));
    }
  }

  constructor(
    protected element: ElementRef,
    protected dashboardLayoutService: DashboardLayoutService,
    sanitizer: DomSanitizer
  ) {
    super(element, dashboardLayoutService, sanitizer);
  }

  ngAfterContentInit(): void {
    this.resizerSubs = this.resizers.map(resizer => resizer.resizeStartSubject.subscribe(
      resizeStartModel => this.startResize(resizeStartModel)));
  }

  ngOnDestroy(): void {
    this.resizerSubs.forEach(resizerSubscription => resizerSubscription.unsubscribe());
    this.dashboardLayoutService.unregisterDashboardLayoutItem(this);
  }

  getElementClientBoundingRect(): ClientRect {
    return this.cachedElementClientBoundingRect || super.getElementClientBoundingRect();
  }

  private startResize(resizeStart: ResizeStartModel) {
    this.startResizeCoordinates = resizeStart.coordinates;
    this.startResizeDirection = resizeStart.resizeDirection;
    this.cachedElementClientBoundingRect = super.getElementClientBoundingRect();

    this.dashboardLayoutService.startResize(this);
    this.activate();
    this.resizing.next(true);
  }

  private resize(resizeCoordinates: CoordinatesModel) {
    this.dashboardLayoutService.resize(
      this,
      this.getOffset(this.startResizeCoordinates, resizeCoordinates),
      this.startResizeDirection
    );
  }

  private resizeEnd(resizeEndCoordinates: CoordinatesModel) {
    this.dashboardLayoutService.endResize(
      this,
      this.getOffset(this.startResizeCoordinates, resizeEndCoordinates),
      this.startResizeDirection
    );

    this.startResizeCoordinates = null;
    this.cachedElementClientBoundingRect = null;
    this.resizing.next(false);
  }
}
