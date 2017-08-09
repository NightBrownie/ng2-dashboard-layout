import {
  AfterContentInit, ContentChildren, Directive, ElementRef, HostListener, Input, OnDestroy,
  QueryList
} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

import {DashboardLayoutService} from '../services/dashboard-layout.service';
import {DragHandleDirective} from './drag-handle.directive';
import {CoordinatesModel} from '../models';
import {DashboardLayoutItemDirective} from './dashboard-layout-item.directive';


@Directive({
  selector: '[draggable]'
})
export class DraggableDirective extends DashboardLayoutItemDirective implements OnDestroy, AfterContentInit {
  private startDragCoordinates: CoordinatesModel;
  private cachedElementClientBoundingRect: ClientRect;
  private dragHandleSubs: Subscription[] = [];

  @Input() private draggable: boolean;
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

  constructor(protected element: ElementRef, protected dashboardLayoutService: DashboardLayoutService) {
    super(element, dashboardLayoutService);
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
  }

  private drag(dragCoordinates: CoordinatesModel) {
    this.dashboardLayoutService.drag(this, this.getOffset(this.startDragCoordinates, dragCoordinates));
  }

  private endDrag(dragEndCoordinates: CoordinatesModel) {
    this.dashboardLayoutService.endDrag(this, this.getOffset(this.startDragCoordinates, dragEndCoordinates));
    this.startDragCoordinates = null;
    this.cachedElementClientBoundingRect = null;
  }
}
