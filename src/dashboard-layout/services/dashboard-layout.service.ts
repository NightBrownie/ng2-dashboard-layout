import {Injectable} from '@angular/core';

import {DashboardLayoutItem} from '../interfaces/dashboard-layout-item.interface';
import {OffsetModel, CoordinatesModel, ScaleModel, SizeModel} from '../models';
import {DimensionType} from '../enums/dimension-type.enum';
import {DEFAULT_PRESCISION_CHARS} from '../constants/default-config';


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
    this.startDashboardOperation(dashboardLayoutItem);
  }

  public drag(dashboardLayoutItem: DashboardLayoutItem, offset: OffsetModel) {
    const containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);

    if (containerElement) {
      dashboardLayoutItem.setTranslate(this.getPossibleDragOffset(containerElement, dashboardLayoutItem, offset));
      dashboardLayoutItem.updateTransform();
    }
  }

  public endDrag(dashboardLayoutItem: DashboardLayoutItem, offset: OffsetModel) {
    const containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);

    if (containerElement) {
      const possibleOffset = this.getPossibleDragOffset(containerElement, dashboardLayoutItem, offset);

      const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
      const layoutItemBoundingClientRect = dashboardLayoutItem.getElementClientBoundingRect();

      const updatedCoordinates = new CoordinatesModel(
        layoutItemBoundingClientRect.left - containerBoundingClientRect.left  + possibleOffset.x,
        layoutItemBoundingClientRect.top - containerBoundingClientRect.top + possibleOffset.y
      );

      dashboardLayoutItem.setPosition(this.getPercentageCoordinates(containerElement, updatedCoordinates));
      dashboardLayoutItem.setTranslate(new OffsetModel(0, 0));
      dashboardLayoutItem.updateTransform();
    }
  }

  public startResize(dashboardLayoutItem: DashboardLayoutItem) {
    this.startDashboardOperation(dashboardLayoutItem);
  }

  public resize(
    dashboardLayoutItem: DashboardLayoutItem,
    offset: OffsetModel,
    resizeDirection: string,
    scalePreferred: boolean = true
  ) {
    const containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);
    const currentItemClientBoundingRect = dashboardLayoutItem.getElementClientBoundingRect();

    const possibleOffset = this.getPossibleResizeOffset(containerElement, dashboardLayoutItem, offset, resizeDirection);
    const possibleSize = this.getPossibleResizeSize(containerElement, dashboardLayoutItem, offset, resizeDirection);

    if (scalePreferred) {
      dashboardLayoutItem.setScale(new ScaleModel(possibleSize.width / currentItemClientBoundingRect.width,
        possibleSize.height / currentItemClientBoundingRect.height));
    } else {
      dashboardLayoutItem.setSize(possibleSize);
    }

    dashboardLayoutItem.setTranslate(possibleOffset);
    dashboardLayoutItem.updateTransform();
  }

  public endResize(dashboardLayoutItem: DashboardLayoutItem, offset: OffsetModel, resizeDirection) {
    const containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);
    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
    const currentItemClientBoundingRect = dashboardLayoutItem.getElementClientBoundingRect();

    const possibleOffset = this.getPossibleResizeOffset(containerElement, dashboardLayoutItem, offset, resizeDirection);
    const possibleSize = this.getPossibleResizeSize(containerElement, dashboardLayoutItem, offset, resizeDirection);

    const updatedCoordinates = new CoordinatesModel(
      currentItemClientBoundingRect.left - containerBoundingClientRect.left  + possibleOffset.x,
      currentItemClientBoundingRect.top - containerBoundingClientRect.top + possibleOffset.y
    );

    dashboardLayoutItem.setPosition(this.getPercentageCoordinates(containerElement, updatedCoordinates));
    dashboardLayoutItem.setSize(possibleSize)

    dashboardLayoutItem.setScale(new ScaleModel(0, 0));
    dashboardLayoutItem.setTranslate(new OffsetModel(0, 0));
    dashboardLayoutItem.updateTransform();
  }

  private startDashboardOperation(dashboardLayoutItem: DashboardLayoutItem) {
    const containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);

    if (containerElement) {
      this.containerClientBoundingRectMap.set(containerElement, containerElement.getBoundingClientRect());
    }
  }

  private getPossibleDragOffset(
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

  private getPossibleResizeOffset(
    containerElement: HTMLElement,
    dashboardLayoutItem: DashboardLayoutItem,
    offset: OffsetModel,
    resizeDirection
  ): OffsetModel {
    const currentItemClientBoundingRect = dashboardLayoutItem.getElementClientBoundingRect();
    const possibleOffset = new OffsetModel(0, 0);

    switch (resizeDirection) {
      case 'nw':
        possibleOffset.x = offset.x;
        possibleOffset.y = offset.y;
        break;
      case 'w':
      case 'sw':
        possibleOffset.x = offset.x;
        break;
      case 'n':
      case 'ne':
        possibleOffset.y = offset.y;
        break;
    }

    return possibleOffset;
  }

  private getPossibleResizeSize(
    containerElement: HTMLElement,
    dashboardLayoutItem: DashboardLayoutItem,
    offset: OffsetModel,
    resizeDirection
  ): SizeModel {
    const currentItemClientBoundingRect = dashboardLayoutItem.getElementClientBoundingRect();
    const possibleSize = new SizeModel(currentItemClientBoundingRect.width, currentItemClientBoundingRect.height,
      DimensionType.pixels);

    switch (resizeDirection) {
      case 'w':
        possibleSize.width -= offset.x;
        break;
      case 'nw':
        possibleSize.width -= offset.x;
        possibleSize.height -= offset.y;
        break;
      case 'n':
        possibleSize.height -= offset.y;
        break;
      case 'ne':
        possibleSize.width += offset.x;
        possibleSize.height -= offset.y;
        break;
      case 'e':
        possibleSize.width += offset.x;
        break;
      case 'se':
        possibleSize.width += offset.x;
        possibleSize.height += offset.y;
        break;
      case 's':
        possibleSize.height += offset.y;
        break;
      case 'sw':
        possibleSize.width -= offset.x;
        possibleSize.height += offset.y;
        break;
    }

    return possibleSize;
  }

  private getPercentageCoordinates(containerElement: HTMLElement, coordinates: CoordinatesModel): CoordinatesModel {
    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);

    return new CoordinatesModel(
      Number((coordinates.x / containerBoundingClientRect.width * 100)
        .toFixed(DEFAULT_PRESCISION_CHARS)),
      Number((coordinates.y / containerBoundingClientRect.height * 100)
        .toFixed(DEFAULT_PRESCISION_CHARS))
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
