import {Injectable} from '@angular/core';

import {DashboardLayoutItem} from '../interfaces/dashboard-layout-item.interface';
import {OffsetModel, CoordinatesModel, ScaleModel, SizeModel} from '../models';
import {DimensionType} from '../enums/dimension-type.enum';
import {DEFAULT_PRESCISION_CHARS} from '../constants/default-config';
import {RectangleModel} from '../models/rectangle.model';
import {SnappingMode} from '../enums/snapping-mode.enum';
import {RectangleSideModel} from '../models/rectangle-side.model';
import {RectangleSideType} from '../enums/rectangle-side-type.enum';


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
      dashboardLayoutItem.setTranslate(this.getDragOffset(containerElement, dashboardLayoutItem, offset));
      dashboardLayoutItem.updateTransform();
    }
  }

  public endDrag(dashboardLayoutItem: DashboardLayoutItem, offset: OffsetModel) {
    const containerElement = this.dashboardLayoutItemContainerElementMap.get(dashboardLayoutItem);

    if (containerElement) {
      const possibleOffset = this.getDragOffset(containerElement, dashboardLayoutItem, offset);

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
    resizeOffset: OffsetModel,
    resizeDirection: string,
    minSize: SizeModel = new SizeModel(0, 0),
    scalePreferred: boolean = false
  ) {
    const containerElement = this.dashboardLayoutItemContainerElementMap.get(dashboardLayoutItem);
    const currentItemClientBoundingRect = dashboardLayoutItem.getElementClientBoundingRect();

    // try to snap item to other items
    const siblingVisibleRectangleSides = this.getSiblingVisibleRectangleSides(dashboardLayoutItem)
      .filter((side: RectangleSideModel) => {
        let sideShouldBeProcessed = false;

        // noinspection TsLint
        if (dashboardLayoutItem.snapToDashboardItemsMode & SnappingMode.outer) {
          switch (resizeDirection) {
            case 'n':
              sideShouldBeProcessed = side.sideType === RectangleSideType.bottom;
              break;
            case 'w':
              sideShouldBeProcessed = side.sideType === RectangleSideType.right;
              break;
            case 's':
              sideShouldBeProcessed = side.sideType === RectangleSideType.top;
              break;
            case 'e':
              sideShouldBeProcessed = side.sideType === RectangleSideType.left;
              break;
            case 'nw':
              sideShouldBeProcessed = side.sideType === RectangleSideType.bottom
                || side.sideType === RectangleSideType.right;
              break;
            case 'ne':
              sideShouldBeProcessed = side.sideType === RectangleSideType.bottom
                || side.sideType === RectangleSideType.left;
              break;
            case 'sw':
              sideShouldBeProcessed = side.sideType === RectangleSideType.top
                || side.sideType === RectangleSideType.right;
              break;
            case 'se':
              sideShouldBeProcessed = side.sideType === RectangleSideType.top
                || side.sideType === RectangleSideType.left;
              break;
          }
        }

        // noinspection TsLint
        if (dashboardLayoutItem.snapToDashboardItemsMode & SnappingMode.inner) {
          switch (resizeDirection) {
            case 'n':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.top;
              break;
            case 'w':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.left;
              break;
            case 's':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.bottom;
              break;
            case 'e':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.right;
              break;
            case 'nw':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.top
                || side.sideType === RectangleSideType.left;
              break;
            case 'ne':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.top
                || side.sideType === RectangleSideType.right;
              break;
            case 'sw':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.bottom
                || side.sideType === RectangleSideType.left;
              break;
            case 'se':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.bottom
                || side.sideType === RectangleSideType.right;
              break;
          }
        }

        return sideShouldBeProcessed;
      });

    const precalculatedResizeSize = this.getResizeSize(dashboardLayoutItem, resizeOffset, resizeDirection);
    const precalculatedResizeOffset = this.getResizeOffset(resizeOffset, resizeDirection);

    const snapOffset = this.getSnapOffset(
      new CoordinatesModel(
        currentItemClientBoundingRect.left + precalculatedResizeOffset.x,
        currentItemClientBoundingRect.top + precalculatedResizeOffset.y
      ),
      new CoordinatesModel(
        currentItemClientBoundingRect.left + precalculatedResizeSize.width + precalculatedResizeOffset.x,
        currentItemClientBoundingRect.top + precalculatedResizeSize.height + precalculatedResizeOffset.y
      ),
      siblingVisibleRectangleSides,
      dashboardLayoutItem.snapToDashboardItemsMode,
      dashboardLayoutItem.snapRadius
    );

    const possibleOffset = this.boundResizeOffsetToDashboard(
      containerElement,
      dashboardLayoutItem,
      new OffsetModel(resizeOffset.x + snapOffset.x, resizeOffset.y + snapOffset.y),
      resizeDirection
    );

    const resultSize = this.getResizeSize(dashboardLayoutItem, possibleOffset, resizeDirection);

    if (scalePreferred) {
      dashboardLayoutItem.setScale(new ScaleModel(resultSize.width / currentItemClientBoundingRect.width,
        resultSize.height / currentItemClientBoundingRect.height));
    } else {
      dashboardLayoutItem.setSize(this.getPercentageSize(containerElement, resultSize));
    }

    dashboardLayoutItem.setTranslate(this.getResizeOffset(possibleOffset, resizeDirection));
    dashboardLayoutItem.updateTransform();
  }

  public endResize(
    dashboardLayoutItem: DashboardLayoutItem,
    resizeOffset: OffsetModel,
    resizeDirection,
    minSize: SizeModel = new SizeModel(0, 0)
  ) {
    const containerElement = this.dashboardLayoutItemContainerElementMap.get(dashboardLayoutItem);
    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
    const currentItemClientBoundingRect = dashboardLayoutItem.getElementClientBoundingRect();

    // try to snap item to other items
    const siblingVisibleRectangleSides = this.getSiblingVisibleRectangleSides(dashboardLayoutItem)
      .filter((side: RectangleSideModel) => {
        let sideShouldBeProcessed = false;

        // noinspection TsLint
        if (dashboardLayoutItem.snapToDashboardItemsMode & SnappingMode.outer) {
          switch (resizeDirection) {
            case 'n':
              sideShouldBeProcessed = side.sideType === RectangleSideType.bottom;
              break;
            case 'w':
              sideShouldBeProcessed = side.sideType === RectangleSideType.right;
              break;
            case 's':
              sideShouldBeProcessed = side.sideType === RectangleSideType.top;
              break;
            case 'e':
              sideShouldBeProcessed = side.sideType === RectangleSideType.left;
              break;
            case 'nw':
              sideShouldBeProcessed = side.sideType === RectangleSideType.bottom
                || side.sideType === RectangleSideType.right;
              break;
            case 'ne':
              sideShouldBeProcessed = side.sideType === RectangleSideType.bottom
                || side.sideType === RectangleSideType.left;
              break;
            case 'sw':
              sideShouldBeProcessed = side.sideType === RectangleSideType.top
                || side.sideType === RectangleSideType.right;
              break;
            case 'se':
              sideShouldBeProcessed = side.sideType === RectangleSideType.top
                || side.sideType === RectangleSideType.left;
              break;
          }
        }

        // noinspection TsLint
        if (dashboardLayoutItem.snapToDashboardItemsMode & SnappingMode.inner) {
          switch (resizeDirection) {
            case 'n':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.top;
              break;
            case 'w':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.left;
              break;
            case 's':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.bottom;
              break;
            case 'e':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.right;
              break;
            case 'nw':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.top
                || side.sideType === RectangleSideType.left;
              break;
            case 'ne':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.top
                || side.sideType === RectangleSideType.right;
              break;
            case 'sw':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.bottom
                || side.sideType === RectangleSideType.left;
              break;
            case 'se':
              sideShouldBeProcessed = sideShouldBeProcessed
                || side.sideType === RectangleSideType.bottom
                || side.sideType === RectangleSideType.right;
              break;
          }
        }

        return sideShouldBeProcessed;
      });

    const precalculatedResizeSize = this.getResizeSize(dashboardLayoutItem, resizeOffset, resizeDirection);
    const precalculatedResizeOffset = this.getResizeOffset(resizeOffset, resizeDirection);

    const snapOffset = this.getSnapOffset(
      new CoordinatesModel(
        currentItemClientBoundingRect.left + precalculatedResizeOffset.x,
        currentItemClientBoundingRect.top + precalculatedResizeOffset.y
      ),
      new CoordinatesModel(
        currentItemClientBoundingRect.left + precalculatedResizeSize.width + precalculatedResizeOffset.x,
        currentItemClientBoundingRect.top + precalculatedResizeSize.height + precalculatedResizeOffset.y
      ),
      siblingVisibleRectangleSides,
      dashboardLayoutItem.snapToDashboardItemsMode,
      dashboardLayoutItem.snapRadius
    );

    const possibleOffset = this.boundResizeOffsetToDashboard(
      containerElement,
      dashboardLayoutItem,
      new OffsetModel(resizeOffset.x + snapOffset.x, resizeOffset.y + snapOffset.y),
      resizeDirection
    );

    const resultOffset = this.getResizeOffset(possibleOffset, resizeDirection);
    const resultSize = this.getResizeSize(dashboardLayoutItem, possibleOffset, resizeDirection);

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

  private getDragOffset(
    containerElement: HTMLElement,
    dashboardLayoutItem: DashboardLayoutItem,
    offset: OffsetModel
  ): OffsetModel {
    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
    const layoutItemBoundingClientRect = dashboardLayoutItem.getElementClientBoundingRect();

    // try to snap item to other items
    const siblingVisibleRectangleSides = this.getSiblingVisibleRectangleSides(dashboardLayoutItem);

    const snapOffset = this.getSnapOffset(
      new CoordinatesModel(
        layoutItemBoundingClientRect.left + offset.x,
        layoutItemBoundingClientRect.top + offset.y
      ),
      new CoordinatesModel(
        layoutItemBoundingClientRect.right + offset.x,
        layoutItemBoundingClientRect.bottom + offset.y
      ),
      siblingVisibleRectangleSides,
      dashboardLayoutItem.snapToDashboardItemsMode,
      dashboardLayoutItem.snapRadius
    );

    return this.boundItemOffsetToDashboard(
      containerBoundingClientRect,
      new CoordinatesModel(
        layoutItemBoundingClientRect.left,
        layoutItemBoundingClientRect.top
      ),
      new CoordinatesModel(
        layoutItemBoundingClientRect.right,
        layoutItemBoundingClientRect.bottom
      ),
      new OffsetModel(offset.x + snapOffset.x, offset.y + snapOffset.y)
    );
  }

  private boundResizeOffsetToDashboard(
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

    // offset x coordinate
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

    // offset y coordinate
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

  // calculate offset to show dashboard item on resize
  private getResizeOffset(
    resizeOffset: OffsetModel,
    resizeDirection
  ): OffsetModel {
    const resultOffset = new OffsetModel(0, 0);

    switch (resizeDirection) {
      case 'nw':
        resultOffset.x = resizeOffset.x;
        resultOffset.y = resizeOffset.y;
        break;
      case 'w':
      case 'sw':
        resultOffset.x = resizeOffset.x;
        break;
      case 'n':
      case 'ne':
        resultOffset.y = resizeOffset.y;
        break;
    }

    return resultOffset;
  }

  private getResizeSize(
    dashboardLayoutItem: DashboardLayoutItem,
    resizeOffset: OffsetModel,
    resizeDirection
  ): SizeModel {
    const currentItemClientBoundingRect = dashboardLayoutItem.getElementClientBoundingRect();
    const resultSize = new SizeModel(
      currentItemClientBoundingRect.width,
      currentItemClientBoundingRect.height,
      DimensionType.pixels
    );

    switch (resizeDirection) {
      case 'w':
        resultSize.width -= resizeOffset.x;
        break;
      case 'nw':
        resultSize.width -= resizeOffset.x;
        resultSize.height -= resizeOffset.y;
        break;
      case 'n':
        resultSize.height -= resizeOffset.y;
        break;
      case 'ne':
        resultSize.width += resizeOffset.x;
        resultSize.height -= resizeOffset.y;
        break;
      case 'e':
        resultSize.width += resizeOffset.x;
        break;
      case 'se':
        resultSize.width += resizeOffset.x;
        resultSize.height += resizeOffset.y;
        break;
      case 's':
        resultSize.height += resizeOffset.y;
        break;
      case 'sw':
        resultSize.width -= resizeOffset.x;
        resultSize.height += resizeOffset.y;
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

  private getSiblingVisibleRectangleSides(dashboardLayoutItem: DashboardLayoutItem) {
    const siblingVisibleRectangleSides = [];
    // TODO: add filtering for visible sides
    this.getSiblings(dashboardLayoutItem)
      .forEach(item => {
        const itemBoundingClientRect = item.getElementClientBoundingRect();

        siblingVisibleRectangleSides.push(new RectangleSideModel(
          new CoordinatesModel(itemBoundingClientRect.left, itemBoundingClientRect.top),
          new CoordinatesModel(itemBoundingClientRect.left, itemBoundingClientRect.bottom),
          RectangleSideType.left,
          item.snapToDashboardItemsMode,
          item.snapRadius
        ));

        siblingVisibleRectangleSides.push(new RectangleSideModel(
          new CoordinatesModel(itemBoundingClientRect.right, itemBoundingClientRect.top),
          new CoordinatesModel(itemBoundingClientRect.right, itemBoundingClientRect.bottom),
          RectangleSideType.right,
          item.snapToDashboardItemsMode,
          item.snapRadius
        ));

        siblingVisibleRectangleSides.push(new RectangleSideModel(
          new CoordinatesModel(itemBoundingClientRect.left, itemBoundingClientRect.top),
          new CoordinatesModel(itemBoundingClientRect.right, itemBoundingClientRect.top),
          RectangleSideType.top,
          item.snapToDashboardItemsMode,
          item.snapRadius
        ));

        siblingVisibleRectangleSides.push(new RectangleSideModel(
          new CoordinatesModel(itemBoundingClientRect.left, itemBoundingClientRect.bottom),
          new CoordinatesModel(itemBoundingClientRect.right, itemBoundingClientRect.bottom),
          RectangleSideType.bottom,
          item.snapToDashboardItemsMode,
          item.snapRadius
        ));
      });

    return siblingVisibleRectangleSides;
  }

  private checkParallelLinesOverlapOnX(
    firstLineBeginningXCoordinate: number,
    firstLineEndingXCoordinate: number,
    secondLineBeginningXCoordinate: number,
    secondLineEndingXCoordinate: number
  ): boolean {
    return !(firstLineBeginningXCoordinate > secondLineEndingXCoordinate
      || firstLineEndingXCoordinate < secondLineBeginningXCoordinate);
  }

  private checkParallelLinesOverlapOnY(
    firstLineBeginningYCoordinate: number,
    firstLineEndingYCoordinate: number,
    secondLineBeginningYCoordinate: number,
    secondLineEndingYCoordinate: number
  ): boolean {
    return !(firstLineBeginningYCoordinate > secondLineEndingYCoordinate
    || firstLineEndingYCoordinate < secondLineBeginningYCoordinate);
  }

  private getSnapOffset(
    layoutItemTopLeftCoordinates: CoordinatesModel,
    layoutItemBottomRightCoordinates: CoordinatesModel,
    siblingVisibleRectangleSides: RectangleSideModel[],
    snapMode: SnappingMode,
    snapRadius: number
  ): OffsetModel {
    const snapOffset = new OffsetModel(0, 0);
    siblingVisibleRectangleSides.forEach((side: RectangleSideModel) => {
      //noinspection TsLint
      const currentSnapMode = snapMode | side.snapMode;
      const currentSnapSize = Math.max(snapRadius, side.snapRadius);

      //noinspection TsLint
      if (currentSnapMode & SnappingMode.outer) {
        switch (side.sideType) {
          case RectangleSideType.left:
            if (this.checkParallelLinesOverlapOnY(
                layoutItemTopLeftCoordinates.y,
                layoutItemBottomRightCoordinates.y,
                side.beginningCoordinates.y,
                side.endingCoordinates.y)
            ) {
              const dist = side.beginningCoordinates.x - layoutItemBottomRightCoordinates.x;

              if (Math.abs(dist) <= currentSnapSize
                && (Math.abs(dist) < Math.abs(snapOffset.x) || snapOffset.x === 0)
              ) {
                snapOffset.x = dist;
              }
            }
            break;
          case RectangleSideType.right:
            if (this.checkParallelLinesOverlapOnY(
                layoutItemTopLeftCoordinates.y,
                layoutItemBottomRightCoordinates.y,
                side.beginningCoordinates.y,
                side.endingCoordinates.y)
            ) {
              const dist = side.beginningCoordinates.x - layoutItemTopLeftCoordinates.x;

              if (Math.abs(dist) <= currentSnapSize
                && (Math.abs(dist) < Math.abs(snapOffset.x) || snapOffset.x === 0)
              ) {
                snapOffset.x = dist;
              }
            }
            break;
          case RectangleSideType.top:
            if (this.checkParallelLinesOverlapOnX(
                layoutItemTopLeftCoordinates.x,
                layoutItemBottomRightCoordinates.x,
                side.beginningCoordinates.x,
                side.endingCoordinates.x)
            ) {
              const dist = side.beginningCoordinates.y - layoutItemBottomRightCoordinates.y;

              if (Math.abs(dist) <= currentSnapSize
                && (Math.abs(dist) < Math.abs(snapOffset.y) || snapOffset.y === 0)
              ) {
                snapOffset.y = dist;
              }
            }
            break;
          case RectangleSideType.bottom:
            if (this.checkParallelLinesOverlapOnX(
                layoutItemTopLeftCoordinates.x,
                layoutItemBottomRightCoordinates.x,
                side.beginningCoordinates.x,
                side.endingCoordinates.x)
            ) {
              const dist = side.beginningCoordinates.y - layoutItemTopLeftCoordinates.y;

              if (Math.abs(dist) <= currentSnapSize
                && (Math.abs(dist) < Math.abs(snapOffset.y) || snapOffset.y === 0)
              ) {
                snapOffset.y = dist;
              }
            }
            break;
        }
      }

      //noinspection TsLint
      if (currentSnapMode & SnappingMode.inner) {
        switch (side.sideType) {
          case RectangleSideType.left:
            if (this.checkParallelLinesOverlapOnY(
                layoutItemTopLeftCoordinates.y,
                layoutItemBottomRightCoordinates.y,
                side.beginningCoordinates.y,
                side.endingCoordinates.y)
            ) {
              const dist = side.beginningCoordinates.x - layoutItemTopLeftCoordinates.x;

              if (Math.abs(dist) <= currentSnapSize
                && (Math.abs(dist) < Math.abs(snapOffset.x) || snapOffset.x === 0)
              ) {
                snapOffset.x = dist;
              }
            }
            break;
          case RectangleSideType.right:
            if (this.checkParallelLinesOverlapOnY(
                layoutItemTopLeftCoordinates.y,
                layoutItemBottomRightCoordinates.y,
                side.beginningCoordinates.y,
                side.endingCoordinates.y)
            ) {
              const dist = side.beginningCoordinates.x - layoutItemBottomRightCoordinates.x;

              if (Math.abs(dist) <= currentSnapSize
                && (Math.abs(dist) < Math.abs(snapOffset.x) || snapOffset.x === 0)
              ) {
                snapOffset.x = dist;
              }
            }
            break;
          case RectangleSideType.top:
            if (this.checkParallelLinesOverlapOnX(
                layoutItemTopLeftCoordinates.x,
                layoutItemBottomRightCoordinates.x,
                side.beginningCoordinates.x,
                side.endingCoordinates.x)
            ) {
              const dist = side.beginningCoordinates.y - layoutItemTopLeftCoordinates.y;

              if (Math.abs(dist) <= currentSnapSize
                && (Math.abs(dist) < Math.abs(snapOffset.y) || snapOffset.y === 0)
              ) {
                snapOffset.y = dist;
              }
            }
            break;
          case RectangleSideType.bottom:
            if (this.checkParallelLinesOverlapOnX(
                layoutItemTopLeftCoordinates.x,
                layoutItemBottomRightCoordinates.x,
                side.beginningCoordinates.x,
                side.endingCoordinates.x)
            ) {
              const dist = side.beginningCoordinates.y - layoutItemBottomRightCoordinates.y;

              if (Math.abs(dist) <= currentSnapSize
                && (Math.abs(dist) < Math.abs(snapOffset.y) || snapOffset.y === 0)
              ) {
                snapOffset.y = dist;
              }
            }
            break;
        }
      }
    });

    return snapOffset;
  }

  private boundItemOffsetToDashboard (
    containerBoundingClientRect,
    layoutItemTopLeftCoordinates: CoordinatesModel,
    layoutItemBottomRightCoordinates: CoordinatesModel,
    offset: OffsetModel
  ) {
    const boundedOffset = new OffsetModel(0, 0);

    // check dashboard bounds for x axis
    if (layoutItemTopLeftCoordinates.x + offset.x >= containerBoundingClientRect.left
      && layoutItemBottomRightCoordinates.x + offset.x <= containerBoundingClientRect.right
    ) {
      boundedOffset.x = offset.x;
    } else if (layoutItemBottomRightCoordinates.x - layoutItemTopLeftCoordinates.x <= containerBoundingClientRect.width
      && layoutItemBottomRightCoordinates.x + offset.x > containerBoundingClientRect.right
    ) {
      boundedOffset.x = containerBoundingClientRect.right - layoutItemBottomRightCoordinates.x;
    } else {
      boundedOffset.x = containerBoundingClientRect.left - layoutItemTopLeftCoordinates.x;
    }

    // check dashboard bounds for y axis
    if (layoutItemTopLeftCoordinates.y + offset.y >= containerBoundingClientRect.top
      && layoutItemBottomRightCoordinates.y + offset.y <= containerBoundingClientRect.bottom
    ) {
      boundedOffset.y = offset.y;
    } else if (layoutItemBottomRightCoordinates.y - layoutItemTopLeftCoordinates.y <= containerBoundingClientRect.height
      && layoutItemBottomRightCoordinates.y + offset.y > containerBoundingClientRect.bottom
    ) {
      boundedOffset.y = containerBoundingClientRect.bottom - layoutItemBottomRightCoordinates.y;
    } else {
      boundedOffset.y = containerBoundingClientRect.top - layoutItemTopLeftCoordinates.y;
    }

    return boundedOffset;
  }
}
