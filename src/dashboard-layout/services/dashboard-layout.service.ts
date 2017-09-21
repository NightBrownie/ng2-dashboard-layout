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
    minSize: SizeModel = new SizeModel(0, 0),
    scalePreferred: boolean = false
  ) {
    const containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);
    const currentItemClientBoundingRect = dashboardLayoutItem.getElementClientBoundingRect();

    const possibleOffset = this.getPossibleResizeOffset(containerElement, dashboardLayoutItem, offset, resizeDirection);
    const resultOffset = this.getResizeOffset(containerElement, dashboardLayoutItem, possibleOffset, resizeDirection);
    const resultSize = this.getResizeSize(containerElement, dashboardLayoutItem, possibleOffset, resizeDirection);

    if (scalePreferred) {
      dashboardLayoutItem.setScale(new ScaleModel(resultSize.width / currentItemClientBoundingRect.width,
        resultSize.height / currentItemClientBoundingRect.height));
    } else {
      dashboardLayoutItem.setSize(resultSize);
    }

    dashboardLayoutItem.setTranslate(resultOffset);
    dashboardLayoutItem.updateTransform();
  }

  public endResize(
    dashboardLayoutItem: DashboardLayoutItem,
    offset: OffsetModel,
    resizeDirection,
    minSize: SizeModel = new SizeModel(0, 0)
  ) {
    const containerElement = this.dashboardLayoutItemContainerMap.get(dashboardLayoutItem);
    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
    const currentItemClientBoundingRect = dashboardLayoutItem.getElementClientBoundingRect();

    const possibleOffset = this.getPossibleResizeOffset(containerElement, dashboardLayoutItem, offset, resizeDirection);
    const resultOffset = this.getResizeOffset(containerElement, dashboardLayoutItem, possibleOffset, resizeDirection);
    const resultSize = this.getResizeSize(containerElement, dashboardLayoutItem, possibleOffset, resizeDirection);

    if (resultOffset.x + currentItemClientBoundingRect.width < 0) {
      resultOffset.x = 0;
    } else if (resultOffset.x > currentItemClientBoundingRect.width) {
      resultOffset.x = currentItemClientBoundingRect.width;
    }

    if (resultOffset.y + currentItemClientBoundingRect.height < 0) {
      resultOffset.y = 0;
    } else if (resultOffset.y > currentItemClientBoundingRect.height) {
      resultOffset.y = currentItemClientBoundingRect.height;
    }

    if (resultSize.width < 0) {
      resultSize.width = 0;
    } else if (resultSize.width > containerBoundingClientRect.width) {
      resultSize.width = containerBoundingClientRect.width;
    }

    if (resultSize.height < 0) {
      resultSize.height = 0;
    } else if (resultSize.height > containerBoundingClientRect.height) {
      resultSize.height = containerBoundingClientRect.height;
    }

    const updatedCoordinates = new CoordinatesModel(
      currentItemClientBoundingRect.left - containerBoundingClientRect.left  + resultOffset.x,
      currentItemClientBoundingRect.top - containerBoundingClientRect.top + resultOffset.y
    );

    dashboardLayoutItem.setPosition(this.getPercentageCoordinates(containerElement, updatedCoordinates));
    dashboardLayoutItem.setSize(resultSize);

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
    resizeDirection,
    minSize: SizeModel = new SizeModel(0, 0)
  ): OffsetModel {
    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
    const currentItemClientBoundingRect = dashboardLayoutItem.getElementClientBoundingRect();

    let minWidth = minSize.width;
    let minHeight = minSize.height;

    if (minSize.sizeType === DimensionType.persentile) {
      minWidth = containerBoundingClientRect.width * minSize.width / 100;
      minHeight = containerBoundingClientRect.height * minSize.height / 100;
    }

    const possibleOffset = new OffsetModel(offset.x, offset.y);

    switch (resizeDirection) {
      case 'w':
      case 'nw':
      case 'sw':
        if ((currentItemClientBoundingRect.left - containerBoundingClientRect.left) + possibleOffset.x < 0) {
          possibleOffset.x = -(currentItemClientBoundingRect.left - containerBoundingClientRect.left);
        } else if (possibleOffset.x > currentItemClientBoundingRect.width - minWidth) {
          possibleOffset.x = currentItemClientBoundingRect.width - minWidth;
        }
        break;
      case 'e':
      case 'ne':
      case 'se':
        if (currentItemClientBoundingRect.width - minWidth + possibleOffset.x < 0) {
          possibleOffset.x = -(currentItemClientBoundingRect.width + minWidth);
        } else if (possibleOffset.x > containerBoundingClientRect.right - currentItemClientBoundingRect.right) {
          possibleOffset.x = containerBoundingClientRect.right - currentItemClientBoundingRect.right;
        }
        break;
    }

    switch (resizeDirection) {
      case 'n':
      case 'ne':
      case 'nw':
        if ((currentItemClientBoundingRect.top - containerBoundingClientRect.top) + possibleOffset.y < 0) {
          possibleOffset.y = -(currentItemClientBoundingRect.top - containerBoundingClientRect.top);
        } else if (possibleOffset.y > currentItemClientBoundingRect.height - minHeight) {
          possibleOffset.y = currentItemClientBoundingRect.height - minHeight;
        }
        break;
      case 's':
      case 'se':
      case 'sw':
        if (currentItemClientBoundingRect.height - minHeight + possibleOffset.y < 0) {
          possibleOffset.y = -(currentItemClientBoundingRect.height + minHeight);
        } else if (possibleOffset.y > containerBoundingClientRect.bottom - currentItemClientBoundingRect.bottom) {
          possibleOffset.y = containerBoundingClientRect.bottom - currentItemClientBoundingRect.bottom;
        }
        break;
    }

    return possibleOffset;
  }

  private getResizeOffset(
    containerElement: HTMLElement,
    dashboardLayoutItem: DashboardLayoutItem,
    offset: OffsetModel,
    resizeDirection
  ): OffsetModel {
    const resultOffset = new OffsetModel(0, 0);

    switch (resizeDirection) {
      case 'nw':
        resultOffset.x = offset.x;
        resultOffset.y = offset.y;
        break;
      case 'w':
      case 'sw':
        resultOffset.x = offset.x;
        break;
      case 'n':
      case 'ne':
        resultOffset.y = offset.y;
        break;
    }

    return resultOffset;
  }

  private getResizeSize(
    containerElement: HTMLElement,
    dashboardLayoutItem: DashboardLayoutItem,
    offset: OffsetModel,
    resizeDirection
  ): SizeModel {
    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
    const currentItemClientBoundingRect = dashboardLayoutItem.getElementClientBoundingRect();
    const resultSize = new SizeModel(currentItemClientBoundingRect.width, currentItemClientBoundingRect.height,
      DimensionType.pixels);

    switch (resizeDirection) {
      case 'w':
        resultSize.width -= offset.x;
        break;
      case 'nw':
        resultSize.width -= offset.x;
        resultSize.height -= offset.y;
        break;
      case 'n':
        resultSize.height -= offset.y;
        break;
      case 'ne':
        resultSize.width += offset.x;
        resultSize.height -= offset.y;
        break;
      case 'e':
        resultSize.width += offset.x;
        break;
      case 'se':
        resultSize.width += offset.x;
        resultSize.height += offset.y;
        break;
      case 's':
        resultSize.height += offset.y;
        break;
      case 'sw':
        resultSize.width -= offset.x;
        resultSize.height += offset.y;
        break;
    }

    return resultSize;
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
