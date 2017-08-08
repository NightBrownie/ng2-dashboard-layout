import {
  Directive,
  ElementRef,
  HostListener,
} from "@angular/core";

import {DashboardLayoutService} from "../services/dashboard-layout.service";
import {CoordinatesModel} from "../models/coordinates.model";


@Directive({
  selector: '[drag-handle]'
})
export class DragHandleDirective {
  @HostListener('mousedown', ['$event.clientX', '$event.clientY'])
  private onMouseDown(x, y) {
    this.dashboardLayoutService.startDrag(this, new CoordinatesModel(x, y));
  }

  constructor(private element: ElementRef, private dashboardLayoutService: DashboardLayoutService) {
  }
}
