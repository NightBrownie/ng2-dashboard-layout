import {
  AfterContentInit, ContentChildren, Directive, ElementRef, HostBinding, HostListener, Input, OnDestroy, OnInit,
  QueryList
} from "@angular/core";

import {DashboardLayoutService} from "../services/dashboard-layout.service";
import {DragHandleDirective} from "./drag-handle.directive";
import {DashboardLayoutItem} from "../interfaces/dashboard-layout-item.interface";
import {Subscription} from "rxjs/Subscription";
import {CoordinatesModel} from "../models/coordinates.model";
import {OffsetModel} from "../models/offset.model";


@Directive({
  selector: '[draggable]'
})
export class DraggableDirective implements DashboardLayoutItem, OnInit, OnDestroy, AfterContentInit {
  private startDragCoordinates: CoordinatesModel;
  private dragStartSubs: Subscription;

  @Input() private draggable: boolean;
  @ContentChildren(DragHandleDirective) private dragHandles: QueryList<DragHandleDirective>;
  @HostBinding('style.transform')
  private transform: string;

  @HostListener('window:mousemove', ['$event.clientX', '$event.clientY'])
  private onMouseMove(x, y) {
    if (this.startDragCoordinates) {
      this.dashboardLayoutService.drag(this, this.getOffset(this.startDragCoordinates, new CoordinatesModel(x, y)));
    }
  }

  @HostListener('window:mouseup', ['$event.clientX', '$event.clientY'])
  private onMouseUp(x, y) {
    if (this.startDragCoordinates) {
      this.dashboardLayoutService.endDrag(this, new CoordinatesModel(x, y));
      this.startDragCoordinates = null;
    }
  }

  constructor(private element: ElementRef, private dashboardLayoutService: DashboardLayoutService) {
  }

  ngOnInit() {
    this.dashboardLayoutService.registerDashboardLayoutItem(this, this.element.nativeElement.parentElement);
  }


  ngAfterContentInit(): void {
    this.dragHandles.forEach(dragHandle => this.dashboardLayoutService.registerDragHandle(dragHandle, this));
  }

  ngOnDestroy(): void {
    this.dragHandles.forEach(dragHandle => this.dashboardLayoutService.unregisterDragHandle(dragHandle));
    this.dashboardLayoutService.unregisterDashboardLayoutItem(this);
  }

  getElementClientBoundingRect(): ClientRect {
    return this.element.nativeElement.getBoundingClientRect();
  }

  startDrag(startDragCoordinates: CoordinatesModel) {
    this.startDragCoordinates = startDragCoordinates;
  }

  setTranslate(offset: OffsetModel) {
    this.transform = `translate(${offset.x}px, ${offset.y}px)`;
  }

  setOffset(coordinates: CoordinatesModel) {
  }

  private getOffset(dragStartMouseCoordinates: CoordinatesModel, coordinates: CoordinatesModel) {
    return dragStartMouseCoordinates && coordinates
      && new OffsetModel(coordinates.x - dragStartMouseCoordinates.x, coordinates.y - dragStartMouseCoordinates.y);
  }
}
