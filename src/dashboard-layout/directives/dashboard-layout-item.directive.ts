import {Directive, ElementRef, EventEmitter, HostBinding, Input, OnInit, Output} from '@angular/core';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';

import {DashboardLayoutService} from '../services/dashboard-layout.service';
import {DashboardLayoutItem} from '../interfaces/dashboard-layout-item.interface';
import {CoordinatesModel, OffsetModel, ScaleModel, SizeModel} from '../models';
import {DimensionType} from '../enums/dimension-type.enum';
import {SnappingMode} from '../enums/snapping-mode.enum';


@Directive({
  selector: '[dashboardLayoutItem]'
})
export class DashboardLayoutItemDirective implements DashboardLayoutItem, OnInit {
  private transformScale: ScaleModel;
  private transformTranslate: OffsetModel;
  private internalPriority: number;

  @HostBinding('style.transform')
  private transform: SafeStyle;

  @HostBinding('style.left.%')
  private xCoordinate: number;

  @HostBinding('style.top.%')
  private yCoordinate: number;

  @HostBinding('style.height')
  private height: string;

  @HostBinding('style.width')
  private width: string;

  get priority() {
    return this.internalPriority;
  }

  set priority(priority: number) {
    this.internalPriority = priority;
    this.priorityChanged.emit(priority);
  }

  @Input() snapToDashboardItemsMode: SnappingMode = SnappingMode.none;
  @Input() snapRadius = 0;

  @Output() priorityChanged: EventEmitter<number> = new EventEmitter();

  constructor(
    protected element: ElementRef,
    protected dashboardLayoutService: DashboardLayoutService,
    private sanitizer: DomSanitizer
  ) {
  }

  ngOnInit() {
    this.dashboardLayoutService.registerDashboardLayoutItem(this, this.element.nativeElement);
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

    this.transform = this.sanitizer.bypassSecurityTrustStyle(transform);
  }

  activate() {
    this.dashboardLayoutService.activateItem(this);
  }

  protected getOffset(dragStartMouseCoordinates: CoordinatesModel, coordinates: CoordinatesModel) {
    return dragStartMouseCoordinates && coordinates
      && new OffsetModel(coordinates.x - dragStartMouseCoordinates.x, coordinates.y - dragStartMouseCoordinates.y);
  }
}
