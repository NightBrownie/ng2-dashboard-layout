import {Injectable} from "@angular/core";

import {DashboardLayoutItem} from "../interfaces/dashboard-layout-item.interface";
import {DragHandleDirective} from "../directives/drag-handle.directive";
import {DraggableDirective} from "../directives/draggable.directive";
import {CoordinatesModel} from "../models/coordinates.model";
import {OffsetModel} from "../models/offset.model";


@Injectable()
export class DashboardLayoutService {
  private containerElementDashboardLayoutItemsMap: Map<HTMLElement, DashboardLayoutItem[]>
    = new Map<HTMLElement, DashboardLayoutItem[]>();
  private containerClientBoundingRectMap: Map<HTMLElement, ClientRect>
    = new Map<HTMLElement, ClientRect>();
  private dashboardLayoutItemContainerMap: Map<DashboardLayoutItem, HTMLElement>
    = new Map<DashboardLayoutItem, HTMLElement>();
  private dashboardLayoutItemClientBoundingRectMap: Map<DashboardLayoutItem, ClientRect>
    = new Map<DashboardLayoutItem, ClientRect>();
  private dragHandleDashboardLayoutItemMap: Map<DragHandleDirective, DashboardLayoutItem>
    = new Map<DragHandleDirective, DashboardLayoutItem>();

  constructor() {
  }

  public registerDashboardLayoutItem(dashboardLayoutItem: DashboardLayoutItem, containerElement: HTMLElement) {
    let dashboardLayoutItems = this.containerElementDashboardLayoutItemsMap.get(containerElement);

    if (!dashboardLayoutItems) {
      this.containerElementDashboardLayoutItemsMap.set(containerElement, [dashboardLayoutItem]);
    } else if(!dashboardLayoutItems.includes(dashboardLayoutItem)) {
      dashboardLayoutItems.push(dashboardLayoutItem);
    }

    this.dashboardLayoutItemContainerMap.set(dashboardLayoutItem, containerElement);
  }

  public unregisterDashboardLayoutItem(dashboardLayoutItem: DashboardLayoutItem) {
    let containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);

    if (containerElement) {
      this.dashboardLayoutItemContainerMap.delete(dashboardLayoutItem);

      let dashboardLayoutItems = this.containerElementDashboardLayoutItemsMap.get(containerElement);
      dashboardLayoutItems = dashboardLayoutItems.filter(layoutItem => layoutItem !== dashboardLayoutItem);

      if (dashboardLayoutItems.length) {
        this.containerElementDashboardLayoutItemsMap.set(containerElement, dashboardLayoutItems);
      } else {
        this.containerElementDashboardLayoutItemsMap.delete(containerElement);
      }
    }
  }

  public registerDragHandle(dragHandleDirective: DragHandleDirective, draggableDirective: DraggableDirective): void {
    this.dragHandleDashboardLayoutItemMap.set(dragHandleDirective, draggableDirective);
  }

  public unregisterDragHandle(dragHandleDirective: DragHandleDirective): void {
    this.dragHandleDashboardLayoutItemMap.delete(dragHandleDirective);
  }

  // TODO: move this out of service
  public startDrag(dragHandleDirective: DragHandleDirective, coordinates: CoordinatesModel) {
    let dashboardLayoutItem = this.dragHandleDashboardLayoutItemMap.get(dragHandleDirective);
    if (dashboardLayoutItem) {
      this.dashboardLayoutItemClientBoundingRectMap.set(dashboardLayoutItem,
        dashboardLayoutItem.getElementClientBoundingRect());
      let containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);
      this.containerClientBoundingRectMap.set(containerElement, containerElement.getBoundingClientRect());

      dashboardLayoutItem.startDrag(coordinates);
    }
  }

  public drag(dashboardLayoutItem: DashboardLayoutItem, offset: OffsetModel) {
    let containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);

    if (containerElement) {
      let containerBoundingClientRect = this.containerClientBoundingRectMap.get(containerElement);
      let dashboardLayoutItemBoundingClientRect = this.dashboardLayoutItemClientBoundingRectMap.get(dashboardLayoutItem);

      dashboardLayoutItem.setTranslate(offset);
    }
  }

  public endDrag(dashboardLayoutItem: DashboardLayoutItem, coordinates: CoordinatesModel) {
    let containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);

    if (containerElement) {
      let containerBoundingClientRect = this.containerClientBoundingRectMap.get(containerElement);
      let dashboardLayoutItemBoundingClientRect = this.dashboardLayoutItemClientBoundingRectMap.get(dashboardLayoutItem);
    }
  }
}
