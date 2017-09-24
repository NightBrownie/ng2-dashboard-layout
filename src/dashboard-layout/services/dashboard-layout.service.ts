import {Injectable} from '@angular/core';

import {DashboardLayoutItem} from '../interfaces/dashboard-layout-item.interface';
import {OffsetModel, CoordinatesModel, ScaleModel, SizeModel} from '../models';
import {DimensionType} from '../enums/dimension-type.enum';
import {DEFAULT_PRESCISION_CHARS} from '../constants/default-config';
import {RectangleModel} from '../models/rectangle.model';
import {SnappingMode} from '../enums/snapping-mode.enum';


@Injectable()
export class DashboardLayoutService {
  // dashboard layout items register
  private containerElementDashboardLayoutItemsMap: Map<HTMLElement, DashboardLayoutItem[]>
    = new Map<HTMLElement, DashboardLayoutItem[]>();
  private dashboardLayoutItemElementMap: Map<DashboardLayoutItem, HTMLElement>
    = new Map<DashboardLayoutItem, HTMLElement>();
  private dashboardLayoutItemContainerElementMap: Map<DashboardLayoutItem, HTMLElement>
    = new Map<DashboardLayoutItem, HTMLElement>();

  private containerClientBoundingRectMap: Map<HTMLElement, ClientRect>
    = new Map<HTMLElement, ClientRect>();

  constructor() {
  }

  public registerDashboardLayoutItem(dashboardLayoutItem: DashboardLayoutItem, element: HTMLElement) {
    const containerElement = element.parentElement;
    const dashboardLayoutItems = this.containerElementDashboardLayoutItemsMap.get(containerElement);

    if (!dashboardLayoutItems) {
      this.containerElementDashboardLayoutItemsMap.set(containerElement, [dashboardLayoutItem]);
    } else if (!dashboardLayoutItems.includes(dashboardLayoutItem)) {
      dashboardLayoutItems.push(dashboardLayoutItem);
    }

    this.dashboardLayoutItemElementMap.set(dashboardLayoutItem, element);
    this.dashboardLayoutItemContainerElementMap.set(dashboardLayoutItem, containerElement);
  }

  public unregisterDashboardLayoutItem(dashboardLayoutItem: DashboardLayoutItem) {
    const containerElement = this.dashboardLayoutItemContainerElementMap.get(dashboardLayoutItem);

    if (containerElement) {
      this.dashboardLayoutItemElementMap.delete(dashboardLayoutItem);
      this.dashboardLayoutItemContainerElementMap.delete(dashboardLayoutItem);

      let dashboardLayoutItems = this.containerElementDashboardLayoutItemsMap.get(containerElement);
      dashboardLayoutItems = dashboardLayoutItems.filter(layoutItem => layoutItem !== dashboardLayoutItem);

      if (dashboardLayoutItems.length) {
        this.containerElementDashboardLayoutItemsMap.set(containerElement, dashboardLayoutItems);
      } else {
        this.containerElementDashboardLayoutItemsMap.delete(containerElement);
      }
    }
  }

  public activateItem(dashboardLayoutItem: DashboardLayoutItem) {
    // TODO: activate item and recalculate priority for all the other items, except current one
  }

  public startDrag(dashboardLayoutItem: DashboardLayoutItem) {
    this.startDashboardOperation(dashboardLayoutItem);
  }

  public drag(dashboardLayoutItem: DashboardLayoutItem, offset: OffsetModel) {
    const containerElement = this.dashboardLayoutItemContainerElementMap.get(dashboardLayoutItem);

    if (containerElement) {
      dashboardLayoutItem.setTranslate(this.getPossibleDragOffset(containerElement, dashboardLayoutItem, offset));
      dashboardLayoutItem.updateTransform();
    }
  }

  public endDrag(dashboardLayoutItem: DashboardLayoutItem, offset: OffsetModel) {
    const containerElement = this.dashboardLayoutItemContainerElementMap.get(dashboardLayoutItem);

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
    const containerElement = this.dashboardLayoutItemContainerElementMap.get(dashboardLayoutItem);
    const currentItemClientBoundingRect = dashboardLayoutItem.getElementClientBoundingRect();

    const possibleOffset = this.getPossibleResizeOffset(containerElement, dashboardLayoutItem, offset, resizeDirection);
    const resultOffset = this.getResizeOffset(containerElement, dashboardLayoutItem, possibleOffset, resizeDirection);
    const resultSize = this.getResizeSize(containerElement, dashboardLayoutItem, possibleOffset, resizeDirection);

    if (scalePreferred) {
      dashboardLayoutItem.setScale(new ScaleModel(resultSize.width / currentItemClientBoundingRect.width,
        resultSize.height / currentItemClientBoundingRect.height));
    } else {
      dashboardLayoutItem.setSize(this.getPercentageSize(containerElement, resultSize));
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
    const containerElement = this.dashboardLayoutItemContainerElementMap.get(dashboardLayoutItem);
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
    dashboardLayoutItem.setSize(this.getPercentageSize(containerElement, resultSize));

    dashboardLayoutItem.setScale(new ScaleModel(0, 0));
    dashboardLayoutItem.setTranslate(new OffsetModel(0, 0));
    dashboardLayoutItem.updateTransform();
  }

  private startDashboardOperation(dashboardLayoutItem: DashboardLayoutItem) {
    const containerElement = this.dashboardLayoutItemContainerElementMap.get(dashboardLayoutItem);

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

    // try to snap item to other items
    // noinspection TsLint
    // const dashboardLayoutItemInnerSnapRadius = !!(dashboardLayoutItem.snapToDashboardItemsMode & SnappingMode.inner)
    //   ? dashboardLayoutItem.snapRadius : 0;
    // // noinspection TsLint
    // const dashboardLayoutItemOuterSnapRadius = !!(dashboardLayoutItem.snapToDashboardItemsMode & SnappingMode.outer)
    //   ? dashboardLayoutItem.snapRadius : 0;
    //
    // // horizontal snapping rectangles
    // const layoutItemLeftSnapRectangle = new RectangleModel(
    //   new CoordinatesModel(layoutItemBoundingClientRect.left + dashboardLayoutItemOuterSnapRadius,
    //     layoutItemBoundingClientRect.top),
    //   new CoordinatesModel(layoutItemBoundingClientRect.left + dashboardLayoutItemInnerSnapRadius,
    //     layoutItemBoundingClientRect.bottom));
    // const layoutItemRightSnapRectangle = new RectangleModel(
    //   new CoordinatesModel(layoutItemBoundingClientRect.left + dashboardLayoutItemInnerSnapRadius,
    //     layoutItemBoundingClientRect.top),
    //   new CoordinatesModel(layoutItemBoundingClientRect.left + dashboardLayoutItemOuterSnapRadius,
    //     layoutItemBoundingClientRect.bottom));
    //
    // // vertical snapping rectangles
    // const layoutItemTopSnapRectangle = new RectangleModel(
    //   new CoordinatesModel(layoutItemBoundingClientRect.left,
    //     layoutItemBoundingClientRect.top + dashboardLayoutItemOuterSnapRadius),
    //   new CoordinatesModel(layoutItemBoundingClientRect.right,
    //     layoutItemBoundingClientRect.bottom + dashboardLayoutItemInnerSnapRadius));
    // const layoutItemBottomSnapRectangle = new RectangleModel(
    //   new CoordinatesModel(layoutItemBoundingClientRect.left,
    //     layoutItemBoundingClientRect.top + dashboardLayoutItemInnerSnapRadius),
    //   new CoordinatesModel(layoutItemBoundingClientRect.right,
    //     layoutItemBoundingClientRect.bottom + dashboardLayoutItemOuterSnapRadius));
    //
    // let snapOffset: OffsetModel = new OffsetModel(0, 0);
    // let snapOffsetLength = Infinity;
    // this.getSiblings(dashboardLayoutItem)
    //   .forEach(item => {
    //     const itemBoundingClientRect = item.getElementClientBoundingRect();
    //
    //     // noinspection TsLint
    //     const itemInnerSnapRadius = !!(item.snapToDashboardItemsMode & SnappingMode.inner)
    //       ? item.snapRadius : 0;
    //     // noinspection TsLint
    //     const itemOuterSnapRadius = !!(item.snapToDashboardItemsMode & SnappingMode.outer)
    //       ? item.snapRadius : 0;
    //
    //     // horizontal snapping rectangles
    //     const itemLeftSnapRectangle = new RectangleModel(
    //       new CoordinatesModel(itemBoundingClientRect.left + itemOuterSnapRadius, itemBoundingClientRect.top),
    //       new CoordinatesModel(itemBoundingClientRect.left + itemInnerSnapRadius, itemBoundingClientRect.bottom));
    //     const itemRightSnapRectangle = new RectangleModel(
    //       new CoordinatesModel(itemBoundingClientRect.left + itemInnerSnapRadius, itemBoundingClientRect.top),
    //       new CoordinatesModel(itemBoundingClientRect.left + itemOuterSnapRadius, itemBoundingClientRect.bottom));
    //
    //     // vertical snapping rectangles
    //     const itemTopSnapRectangle = new RectangleModel(
    //       new CoordinatesModel(itemBoundingClientRect.left, itemBoundingClientRect.top + itemOuterSnapRadius),
    //       new CoordinatesModel(itemBoundingClientRect.right, itemBoundingClientRect.bottom + itemInnerSnapRadius));
    //     const itemBottomSnapRectangle = new RectangleModel(
    //       new CoordinatesModel(itemBoundingClientRect.left, itemBoundingClientRect.top + itemInnerSnapRadius),
    //       new CoordinatesModel(itemBoundingClientRect.right, itemBoundingClientRect.bottom + itemOuterSnapRadius));
    //
    //     // top-bottom outer
    //     if (this.checkRectanglesIntersect(layoutItemTopSnapRectangle, itemBottomSnapRectangle)) {
    //       const currentSnapOffsetLength = itemBoundingClientRect.bottom - layoutItemBoundingClientRect.top;
    //       const currentSnapOffset = new OffsetModel(0, currentSnapOffsetLength);
    //
    //       if (currentSnapOffsetLength < snapOffsetLength) {
    //         snapOffsetLength = currentSnapOffsetLength;
    //         snapOffset = currentSnapOffset;
    //       }
    //     }
    //
    //     // bottom-top outer
    //     if (this.checkRectanglesIntersect(layoutItemBottomSnapRectangle, itemTopSnapRectangle)) {
    //       const currentSnapOffsetLength = itemBoundingClientRect.top - layoutItemBoundingClientRect.bottom;
    //       const currentSnapOffset = new OffsetModel(0, currentSnapOffsetLength);
    //
    //       if (currentSnapOffsetLength < snapOffsetLength) {
    //         snapOffsetLength = currentSnapOffsetLength;
    //         snapOffset = currentSnapOffset;
    //       }
    //     }
    //
    //     // left-right outer
    //     if (this.checkRectanglesIntersect(layoutItemLeftSnapRectangle, itemRightSnapRectangle)) {
    //       const currentSnapOffsetLength = itemBoundingClientRect.right - layoutItemBoundingClientRect.left;
    //       const currentSnapOffset = new OffsetModel(currentSnapOffsetLength, 0);
    //
    //       if (currentSnapOffsetLength < snapOffsetLength) {
    //         snapOffsetLength = currentSnapOffsetLength;
    //         snapOffset = currentSnapOffset;
    //       }
    //     }
    //
    //     // right-left outer
    //     if (this.checkRectanglesIntersect(layoutItemRightSnapRectangle, itemLeftSnapRectangle)) {
    //       const currentSnapOffsetLength = itemBoundingClientRect.left - layoutItemBoundingClientRect.right;
    //       const currentSnapOffset = new OffsetModel(currentSnapOffsetLength, 0);
    //
    //       if (currentSnapOffsetLength < snapOffsetLength) {
    //         snapOffsetLength = currentSnapOffsetLength;
    //         snapOffset = currentSnapOffset;
    //       }
    //     }
    //
    //     // inner vertical snapping test
    //     // noinspection TsLint
    //     if (!!(dashboardLayoutItem.snapToDashboardItemsMode & SnappingMode.inner)
    //       || !!(item.snapToDashboardItemsMode & SnappingMode.inner)
    //     ) {
    //       // top-top inner
    //       if (this.checkRectanglesIntersect(layoutItemTopSnapRectangle, itemTopSnapRectangle)) {
    //         const currentSnapOffsetLength = itemBoundingClientRect.top - layoutItemBoundingClientRect.top;
    //         const currentSnapOffset = new OffsetModel(0, currentSnapOffsetLength);
    //
    //         if (currentSnapOffsetLength < snapOffsetLength) {
    //           snapOffsetLength = currentSnapOffsetLength;
    //           snapOffset = currentSnapOffset;
    //         }
    //       }
    //
    //       // bottom-bottom inner
    //       if (this.checkRectanglesIntersect(layoutItemBottomSnapRectangle, itemBottomSnapRectangle)) {
    //         const currentSnapOffsetLength = itemBoundingClientRect.bottom - layoutItemBoundingClientRect.bottom;
    //         const currentSnapOffset = new OffsetModel(0, currentSnapOffsetLength);
    //
    //         if (currentSnapOffsetLength < snapOffsetLength) {
    //           snapOffsetLength = currentSnapOffsetLength;
    //           snapOffset = currentSnapOffset;
    //         }
    //       }
    //
    //       // left-left inner
    //       if (this.checkRectanglesIntersect(layoutItemLeftSnapRectangle, itemLeftSnapRectangle)) {
    //         const currentSnapOffsetLength = itemBoundingClientRect.left - layoutItemBoundingClientRect.left;
    //         const currentSnapOffset = new OffsetModel(currentSnapOffsetLength, 0);
    //
    //         if (currentSnapOffsetLength < snapOffsetLength) {
    //           snapOffsetLength = currentSnapOffsetLength;
    //           snapOffset = currentSnapOffset;
    //         }
    //       }
    //
    //       // right-right inner
    //       if (this.checkRectanglesIntersect(layoutItemRightSnapRectangle, itemRightSnapRectangle)) {
    //         const currentSnapOffsetLength = itemBoundingClientRect.right - layoutItemBoundingClientRect.right;
    //         const currentSnapOffset = new OffsetModel(currentSnapOffsetLength, 0);
    //
    //         if (currentSnapOffsetLength < snapOffsetLength) {
    //           snapOffsetLength = currentSnapOffsetLength;
    //           snapOffset = currentSnapOffset;
    //         }
    //       }
    //     }
    //   });
    //
    // if (snapOffsetLength < Infinity) {
    //   console.log(snapOffset);
    //   console.log(snapOffsetLength);
    // }
    //
    // offset.x += snapOffset.x;
    // offset.y += snapOffset.y;

    // check dashboard bounds for x axis
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

    // check dashboard bounds for y axis
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

  private getPercentageSize(
    containerElement: HTMLElement,
    size: SizeModel
  ): SizeModel {
    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
    return new SizeModel(
      Number((size.width / containerBoundingClientRect.width * 100)
        .toFixed(DEFAULT_PRESCISION_CHARS)),
      Number((size.height / containerBoundingClientRect.height * 100)
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

  private checkRectanglesIntersect(firstRectangle: RectangleModel, secondRectangle: RectangleModel): boolean {
    return !(firstRectangle.left > secondRectangle.right
      || firstRectangle.right < secondRectangle.left
      || firstRectangle.top > secondRectangle.bottom
      || firstRectangle.bottom < secondRectangle.top);
  }

  private getSiblings(dashboardLayoutItem) {
    const containerElement = this.dashboardLayoutItemContainerElementMap.get(dashboardLayoutItem);

    const result = [];
    (this.containerElementDashboardLayoutItemsMap.get(containerElement) || [])
      .forEach(item => {
        if (item !== dashboardLayoutItem
          && this.dashboardLayoutItemElementMap.get(item)
            !== this.dashboardLayoutItemElementMap.get(dashboardLayoutItem)
          && result.every(resultItem => this.dashboardLayoutItemElementMap.get(resultItem)
              !== this.dashboardLayoutItemElementMap.get(item))
        ) {
          result.push(item);
        }
      });

    return result;
  }
}
