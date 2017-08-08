import {Directive, ElementRef, HostBinding, OnInit} from '@angular/core';

import {DashboardLayoutService} from '../services/dashboard-layout.service';
import {DashboardLayoutItem} from '../interfaces/dashboard-layout-item.interface';
import {CoordinatesModel, OffsetModel} from '../models';

@Directive({
  selector: '[dashboard-layout-item]'
})
export class DashboardLayoutItemDirective implements DashboardLayoutItem, OnInit {
  @HostBinding('style.transform')
  private transform: string;

  constructor(protected element: ElementRef, protected dashboardLayoutService: DashboardLayoutService) {
  }

  ngOnInit() {
    this.dashboardLayoutService.registerDashboardLayoutItem(this, this.element.nativeElement.parentElement);
  }

  getElementClientBoundingRect(): ClientRect {
    return this.element.nativeElement.getBoundingClientRect();
  }

  setTranslate(offset: OffsetModel) {
    this.transform = `translate(${offset.x}px, ${offset.y}px)`;
  }

  setPosition(coordinates: CoordinatesModel) {
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
