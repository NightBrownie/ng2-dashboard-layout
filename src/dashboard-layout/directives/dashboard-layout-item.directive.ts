import {Directive, ElementRef, HostBinding, OnInit} from '@angular/core';

import {DashboardLayoutService} from '../services/dashboard-layout.service';
import {DashboardLayoutItem} from '../interfaces/dashboard-layout-item.interface';
import {CoordinatesModel, OffsetModel} from '../models';

@Directive({
  selector: '[dashboardLayoutItem]'
})
export class DashboardLayoutItemDirective implements DashboardLayoutItem, OnInit {
  @HostBinding('style.transform')
  private transform: string;

  @HostBinding('style.left.%')
  private xCoordinate: number;

  @HostBinding('style.top.%')
  private yCoordinate: number;

  constructor(protected element: ElementRef, protected dashboardLayoutService: DashboardLayoutService) {
  }

  ngOnInit() {
    this.dashboardLayoutService.registerDashboardLayoutItem(this, this.element.nativeElement.parentElement);
  }

  getElementClientBoundingRect(): ClientRect {
    return this.element.nativeElement.getBoundingClientRect();
  }

  setTranslate(offset: OffsetModel) {
    this.transform = offset.x !== 0 || offset.y !== 0
      ? `translate(${offset.x}px, ${offset.y}px)`
      : '';
  }

  setPosition(coordinates: CoordinatesModel) {
    this.xCoordinate = coordinates.x;
    this.yCoordinate = coordinates.y;
  }

  setScale() {
  }

  setSize() {
  }

  protected getOffset(dragStartMouseCoordinates: CoordinatesModel, coordinates: CoordinatesModel) {
    return dragStartMouseCoordinates && coordinates
      && new OffsetModel(coordinates.x - dragStartMouseCoordinates.x, coordinates.y - dragStartMouseCoordinates.y);
  }
}
