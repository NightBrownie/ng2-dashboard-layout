import {
  AfterContentInit, ContentChildren, Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output,
  QueryList
} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {Subscription} from 'rxjs/Subscription';

import {DashboardLayoutService} from '../services/dashboard-layout.service';
import {DragHandleDirective} from './drag-handle.directive';
import {CoordinatesModel} from '../models';
import {DashboardLayoutItemDirective} from './dashboard-layout-item.directive';


@Directive({
  selector: '[draggable]'
})
export class DraggableDirective extends DashboardLayoutItemDirective implements AfterContentInit, OnDestroy {
  private startDragCoordinates: CoordinatesModel;
  private cachedElementClientBoundingRect: ClientRect;
  private dragHandleSubs: Subscription[] = [];

  @Input() private draggable: boolean;
  @Input() private dragging: boolean;
  @Output() private draggingChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ContentChildren(DragHandleDirective) private dragHandles: QueryList<DragHandleDirective>;

  @HostListener('window:mousemove', ['$event.clientX', '$event.clientY'])
  private onMouseMove(x, y) {
    if (this.startDragCoordinates) {
      this.drag(new CoordinatesModel(x, y));
    }
  }

  @HostListener('window:mouseup', ['$event.clientX', '$event.clientY'])
  private onMouseUp(x, y) {
    if (this.startDragCoordinates) {
      this.endDrag(new CoordinatesModel(x, y));
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
    this.dragHandleSubs = this.dragHandles.map(dragHandle =>
      dragHandle.dragStartSubject.subscribe(dragStartCoordinates => this.startDrag(dragStartCoordinates)));
  }

  ngOnDestroy(): void {
    this.dragHandleSubs.forEach(dragHandleSubscription => dragHandleSubscription.unsubscribe());
    this.dashboardLayoutService.unregisterDashboardLayoutItem(this);
  }

  getElementClientBoundingRect(): ClientRect {
    return this.cachedElementClientBoundingRect || super.getElementClientBoundingRect();
  }

  private startDrag(dragStartCoordinates: CoordinatesModel) {
    this.startDragCoordinates = dragStartCoordinates;
    this.cachedElementClientBoundingRect = super.getElementClientBoundingRect();

    this.dashboardLayoutService.startDrag(this);
    this.draggingChange.next(true);
  }

  private drag(dragCoordinates: CoordinatesModel) {
    this.dashboardLayoutService.drag(this, this.getOffset(this.startDragCoordinates, dragCoordinates));
  }

  private endDrag(dragEndCoordinates: CoordinatesModel) {
    this.dashboardLayoutService.endDrag(this, this.getOffset(this.startDragCoordinates, dragEndCoordinates));
    this.startDragCoordinates = null;
    this.cachedElementClientBoundingRect = null;
    this.draggingChange.next(false);
  }
}
