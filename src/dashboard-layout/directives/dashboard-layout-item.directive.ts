import {Directive, ElementRef, HostBinding, OnInit} from '@angular/core';

import {DashboardLayoutService} from '../services/dashboard-layout.service';
import {DashboardLayoutItem} from '../interfaces/dashboard-layout-item.interface';
import {CoordinatesModel, OffsetModel, ScaleModel, SizeModel} from '../models';
import {DimensionType} from '../enums/dimension-type.enum';


@Directive({
  selector: '[dashboardLayoutItem]'
})
export class DashboardLayoutItemDirective implements DashboardLayoutItem, OnInit {
  private transformScale: ScaleModel;
  private transformTranslate: OffsetModel;

  @HostBinding('style.transform')
  private transform: string;

  @HostBinding('style.left.%')
  private xCoordinate: number;

  @HostBinding('style.top.%')
  private yCoordinate: number;

  @HostBinding('style.height')
  private height: string;

  @HostBinding('style.width')
  private width: string;

  constructor(protected element: ElementRef, protected dashboardLayoutService: DashboardLayoutService) {
  }

  ngOnInit() {
    this.dashboardLayoutService.registerDashboardLayoutItem(this, this.element.nativeElement.parentElement);
  }

  getElementClientBoundingRect(): ClientRect {
    return this.element.nativeElement.getBoundingClientRect();
  }

  setTranslate(offset: OffsetModel) {
    this.transformTranslate = offset;
  }

  setPosition(coordinates: CoordinatesModel) {
    this.xCoordinate = coordinates.x;
    this.yCoordinate = coordinates.y;
  }

  setScale(scale: ScaleModel) {
    this.transformScale = scale;
  }

  setSize(size: SizeModel) {
    let sizeTypePostfix: string;

    switch (size.sizeType) {
      case DimensionType.persentile:
        sizeTypePostfix = '%';
        break;
      case DimensionType.pixels:
        sizeTypePostfix = 'px';
        break;
      default:
        sizeTypePostfix = '';
    }

    this.height = size.height + sizeTypePostfix;
    this.width = size.width + sizeTypePostfix;
  }

  updateTransform() {
    let transform = this.transformTranslate && (!!this.transformTranslate.x || !!this.transformTranslate.y)
      ? `translate(${this.transformTranslate.x}px, ${this.transformTranslate.y}px)`
      : '';

    transform += this.transformScale && (!!this.transformScale.x || !!this.transformScale.y)
      ? (!!transform ? ' ' : '') + `scale(${this.transformScale.x}, ${this.transformScale.y})`
      : '';

    this.transform = transform;
  }

  protected getOffset(dragStartMouseCoordinates: CoordinatesModel, coordinates: CoordinatesModel) {
    return dragStartMouseCoordinates && coordinates
      && new OffsetModel(coordinates.x - dragStartMouseCoordinates.x, coordinates.y - dragStartMouseCoordinates.y);
  }
}
