import {Injectable} from '@angular/core';

import {DashboardLayoutItem} from '../interfaces/dashboard-layout-item.interface';
import {OffsetModel} from '../models';
import {DEFAULT_PRESCISION_CHARS} from '../constants/config';
import {CoordinatesModel} from '../models/coordinates.model';


@Injectable()
export class DashboardLayoutService {
  private containerElementDashboardLayoutItemsMap: Map<HTMLElement, DashboardLayoutItem[]>
    = new Map<HTMLElement, DashboardLayoutItem[]>();
  private containerClientBoundingRectMap: Map<HTMLElement, ClientRect>
    = new Map<HTMLElement, ClientRect>();
  private dashboardLayoutItemContainerMap: Map<DashboardLayoutItem, HTMLElement>
    = new Map<DashboardLayoutItem, HTMLElement>();

  constructor() {
  }

  public registerDashboardLayoutItem(dashboardLayoutItem: DashboardLayoutItem, containerElement: HTMLElement) {
    const dashboardLayoutItems = this.containerElementDashboardLayoutItemsMap.get(containerElement);

    if (!dashboardLayoutItems) {
      this.containerElementDashboardLayoutItemsMap.set(containerElement, [dashboardLayoutItem]);
    } else if (!dashboardLayoutItems.includes(dashboardLayoutItem)) {
      dashboardLayoutItems.push(dashboardLayoutItem);
    }

    this.dashboardLayoutItemContainerMap.set(dashboardLayoutItem, containerElement);
  }

  public unregisterDashboardLayoutItem(dashboardLayoutItem: DashboardLayoutItem) {
    const containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);

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

  public startDrag(dashboardLayoutItem: DashboardLayoutItem) {
    const containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);

    if (containerElement) {
      this.containerClientBoundingRectMap.set(containerElement, containerElement.getBoundingClientRect());
    }
  }

  public drag(dashboardLayoutItem: DashboardLayoutItem, offset: OffsetModel) {
    const containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);

    if (containerElement) {
      dashboardLayoutItem.setTranslate(this.getPossibleOffset(containerElement, dashboardLayoutItem, offset));
    }
  }

  public endDrag(dashboardLayoutItem: DashboardLayoutItem, offset: OffsetModel) {
    const containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);

    if (containerElement) {
      const possibleOffset = this.getPossibleOffset(containerElement, dashboardLayoutItem, offset);

      console.log(possibleOffset);

      const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
      const layoutItemBoundingClientRect = dashboardLayoutItem.getElementClientBoundingRect();
      const updatedCoordinates = new CoordinatesModel(
        layoutItemBoundingClientRect.left - containerBoundingClientRect.left  + possibleOffset.x,
        layoutItemBoundingClientRect.top - containerBoundingClientRect.top + possibleOffset.y
      );
      dashboardLayoutItem.setPosition(this.getPercentageCoordinates(containerElement, updatedCoordinates));
      dashboardLayoutItem.setTranslate(new OffsetModel(0, 0));
    }
  }

  private getPossibleOffset(
    containerElement: HTMLElement,
    dashboardLayoutItem: DashboardLayoutItem,
    offset: OffsetModel
  ): OffsetModel {
    let possibleXOffset = 0;
    let possibleYOffset = 0;

    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
    const layoutItemBoundingClientRect = dashboardLayoutItem.getElementClientBoundingRect();

    if (layoutItemBoundingClientRect.left + offset.x >= containerBoundingClientRect.left
      && layoutItemBoundingClientRect.right + offset.x <= containerBoundingClientRect.right
    ) {
      possibleXOffset = offset.x;
    } else if (layoutItemBoundingClientRect.width <= containerBoundingClientRect.width
      && layoutItemBoundingClientRect.right + offset.x > containerBoundingClientRect.right
    ) {
      possibleXOffset = containerBoundingClientRect.right - layoutItemBoundingClientRect.right;
    } else {
      possibleXOffset = containerBoundingClientRect.left - layoutItemBoundingClientRect.left;
    }

    if (layoutItemBoundingClientRect.top + offset.y >= containerBoundingClientRect.top
      && layoutItemBoundingClientRect.bottom + offset.y <= containerBoundingClientRect.bottom
    ) {
      possibleYOffset = offset.y;
    } else if (layoutItemBoundingClientRect.height <= containerBoundingClientRect.height
      && layoutItemBoundingClientRect.bottom + offset.y > containerBoundingClientRect.bottom
    ) {
      possibleYOffset = containerBoundingClientRect.bottom - layoutItemBoundingClientRect.bottom;
    } else {
      possibleYOffset = containerBoundingClientRect.top - layoutItemBoundingClientRect.top;
    }

    return new OffsetModel(possibleXOffset, possibleYOffset);
  }

  private getPercentageCoordinates(containerElement: HTMLElement, coordinates: CoordinatesModel): CoordinatesModel {
    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);

    return new CoordinatesModel(
      Number((coordinates.x / containerBoundingClientRect.width * 100)
        .toPrecision(DEFAULT_PRESCISION_CHARS)),
      Number((coordinates.y / containerBoundingClientRect.height * 100)
        .toPrecision(DEFAULT_PRESCISION_CHARS))
    );
  }

  private getContainerBoundingClientRect(containerElement: HTMLElement): ClientRect {
    let containerBoundingClientRect = this.containerClientBoundingRectMap.get(containerElement);
    if (!containerBoundingClientRect) {
      containerBoundingClientRect = containerElement.getBoundingClientRect();
      this.containerClientBoundingRectMap.set(containerElement, containerBoundingClientRect);
    }

    return containerBoundingClientRect;
  }
}
