import {Injectable} from '@angular/core';

import {DashboardLayoutItem} from '../interfaces/dashboard-layout-item.interface';
import {OffsetModel, CoordinatesModel, ScaleModel, SizeModel, RectangleSideModel} from '../models';
import {DimensionType, SnappingMode, RectangleSideType, DirectionType} from '../enums';

import {DEFAULT_PRESCISION_CHARS} from '../configs/default.config';


@Injectable()
export class DashboardLayoutService {
  // dashboard layout items register
  private containerElementDashboardLayoutItemsMap: Map<HTMLElement, DashboardLayoutItem[]>
    = new Map<HTMLElement, DashboardLayoutItem[]>();
  private dashboardLayoutItemElementMap: Map<DashboardLayoutItem, HTMLElement>
    = new Map<DashboardLayoutItem, HTMLElement>();
  private dashboardLayoutItemContainerElementMap: Map<DashboardLayoutItem, HTMLElement>
    = new Map<DashboardLayoutItem, HTMLElement>();

  private elementClientBoundingRectCache: Map<HTMLElement, ClientRect> = new Map<HTMLElement, ClientRect>();

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
    const layoutItemHtmlElement = this.dashboardLayoutItemElementMap.get(dashboardLayoutItem);
    let siblings = this.getSiblings(dashboardLayoutItem, false);

    const sameElementItems = [];
    siblings = siblings.filter((item: DashboardLayoutItem) => {
      if (layoutItemHtmlElement !== this.dashboardLayoutItemElementMap.get(item)) {
        return true;
      }

      sameElementItems.push(item);
      return false;
    });

    siblings.sort((firstItem: DashboardLayoutItem, secondItem: DashboardLayoutItem) => {
      return firstItem.priority - secondItem.priority;
    });

    const elementPriorities = new Map<HTMLElement, number>();
    let currentPriority = 0;
    siblings.forEach((item: DashboardLayoutItem) => {
      const itemHtmlElement = this.dashboardLayoutItemElementMap.get(item);

      if (elementPriorities.has(itemHtmlElement)) {
        item.priority = elementPriorities.get(itemHtmlElement);
      } else {
        elementPriorities.set(itemHtmlElement, item.priority = currentPriority);
        currentPriority++;
      }
    });

    sameElementItems.forEach(item => {
      item.priority = currentPriority;
    });

    dashboardLayoutItem.priority = currentPriority;
  }

  public drag(dashboardLayoutItem: DashboardLayoutItem, offset: OffsetModel) {
    const containerElement = this.getItemContainerElement(dashboardLayoutItem);

    if (containerElement) {
      dashboardLayoutItem.setTranslate(this.getDragOffset(containerElement, dashboardLayoutItem, offset));
      dashboardLayoutItem.updateTransform();
    }
  }

  public endDrag(dashboardLayoutItem: DashboardLayoutItem, offset: OffsetModel) {
    const containerElement = this.getItemContainerElement(dashboardLayoutItem);

    const possibleOffset = this.getDragOffset(containerElement, dashboardLayoutItem, offset);

    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
    const layoutItemBoundingClientRect = this.getItemElementClientBoundingRect(dashboardLayoutItem);

    const updatedCoordinates = new CoordinatesModel(
      layoutItemBoundingClientRect.left - containerBoundingClientRect.left  + possibleOffset.x,
      layoutItemBoundingClientRect.top - containerBoundingClientRect.top + possibleOffset.y
    );

    dashboardLayoutItem.setPosition(this.getPercentageCoordinates(containerElement, updatedCoordinates));
    dashboardLayoutItem.setTranslate(new OffsetModel(0, 0));
    dashboardLayoutItem.updateTransform();

    this.clearClientBoundingRectCaches(dashboardLayoutItem);
  }

  public resize(
    dashboardLayoutItem: DashboardLayoutItem,
    resizeOffset: OffsetModel,
    resizeDirection: string,
    minSize: SizeModel = new SizeModel(0, 0),
    scalePreferred: boolean = false
  ) {
    const containerElement = this.getItemContainerElement(dashboardLayoutItem);
    const currentItemClientBoundingRect = this.getItemElementClientBoundingRect(dashboardLayoutItem);

    const resizeSubDirections = (resizeDirection || '').split('');

    // todo: move filtering based on direction to helper function
    const siblingVisibleRectangleSides = this.getSiblingVisibleRectangleSides(dashboardLayoutItem)
      .filter((side: RectangleSideModel) => {
        let sideShouldBeProcessed = false;

        //noinspection TsLint
        const isOuterSnappingEnabled = dashboardLayoutItem.snapToDashboardItemsMode & SnappingMode.outer;
        //noinspection TsLint
        const isInnerSnappingEnabled = dashboardLayoutItem.snapToDashboardItemsMode & SnappingMode.inner;

        resizeSubDirections.forEach((resizeSubDirection: string) => {
          switch (resizeSubDirection) {
            case DirectionType.north:
              sideShouldBeProcessed = sideShouldBeProcessed
                || (isOuterSnappingEnabled && side.sideType === RectangleSideType.bottom)
                || (isInnerSnappingEnabled && side.sideType === RectangleSideType.top);
              break;
            case DirectionType.east:
              sideShouldBeProcessed = sideShouldBeProcessed
                || (isOuterSnappingEnabled && side.sideType === RectangleSideType.left)
                || (isInnerSnappingEnabled && side.sideType === RectangleSideType.right);
              break;
            case DirectionType.west:
              sideShouldBeProcessed = sideShouldBeProcessed
                || (isOuterSnappingEnabled && side.sideType === RectangleSideType.right)
                || (isInnerSnappingEnabled && side.sideType === RectangleSideType.left);
              break;
            case DirectionType.south:
              sideShouldBeProcessed = sideShouldBeProcessed
                || (isOuterSnappingEnabled && side.sideType === RectangleSideType.top)
                || (isInnerSnappingEnabled && side.sideType === RectangleSideType.bottom);
              break;
          }
        });

        return sideShouldBeProcessed;
      });

    const precalculatedResizeSize = this.getResizeSize(dashboardLayoutItem, resizeOffset, resizeDirection);
    const precalculatedResizeOffset = this.getResizeOffset(resizeOffset, resizeDirection);

    // try to snap item to other items
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
      dashboardLayoutItem.snapRadius,
      resizeDirection
    );

    const possibleOffset = this.boundResizeOffsetToDashboard(
      containerElement,
      dashboardLayoutItem,
      new OffsetModel(resizeOffset.x + snapOffset.x, resizeOffset.y + snapOffset.y),
      resizeDirection,
      minSize
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
    const containerElement = this.getItemContainerElement(dashboardLayoutItem);
    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
    const currentItemClientBoundingRect = this.getItemElementClientBoundingRect(dashboardLayoutItem);

    const resizeSubDirections = (resizeDirection || '').split('');

    // todo: move filtering based on direction to helper function
    const siblingVisibleRectangleSides = this.getSiblingVisibleRectangleSides(dashboardLayoutItem)
      .filter((side: RectangleSideModel) => {
        let sideShouldBeProcessed = false;

        //noinspection TsLint
        const isOuterSnappingEnabled = dashboardLayoutItem.snapToDashboardItemsMode & SnappingMode.outer;
        //noinspection TsLint
        const isInnerSnappingEnabled = dashboardLayoutItem.snapToDashboardItemsMode & SnappingMode.inner;

        resizeSubDirections.forEach((resizeSubDirection: string) => {
          switch (resizeSubDirection) {
            case DirectionType.north:
              sideShouldBeProcessed = sideShouldBeProcessed
                || (isOuterSnappingEnabled && side.sideType === RectangleSideType.bottom)
                || (isInnerSnappingEnabled && side.sideType === RectangleSideType.top);
              break;
            case DirectionType.east:
              sideShouldBeProcessed = sideShouldBeProcessed
                || (isOuterSnappingEnabled && side.sideType === RectangleSideType.left)
                || (isInnerSnappingEnabled && side.sideType === RectangleSideType.right);
              break;
            case DirectionType.west:
              sideShouldBeProcessed = sideShouldBeProcessed
                || (isOuterSnappingEnabled && side.sideType === RectangleSideType.right)
                || (isInnerSnappingEnabled && side.sideType === RectangleSideType.left);
              break;
            case DirectionType.south:
              sideShouldBeProcessed = sideShouldBeProcessed
                || (isOuterSnappingEnabled && side.sideType === RectangleSideType.top)
                || (isInnerSnappingEnabled && side.sideType === RectangleSideType.bottom);
              break;
          }
        });

        return sideShouldBeProcessed;
      });

    const precalculatedResizeSize = this.getResizeSize(dashboardLayoutItem, resizeOffset, resizeDirection);
    const precalculatedResizeOffset = this.getResizeOffset(resizeOffset, resizeDirection);

    // try to snap item to other items
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
      dashboardLayoutItem.snapRadius,
      resizeDirection
    );

    const possibleOffset = this.boundResizeOffsetToDashboard(
      containerElement,
      dashboardLayoutItem,
      new OffsetModel(resizeOffset.x + snapOffset.x, resizeOffset.y + snapOffset.y),
      resizeDirection,
      minSize
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

    this.clearClientBoundingRectCaches(dashboardLayoutItem);
  }

  private getDragOffset(
    containerElement: HTMLElement,
    dashboardLayoutItem: DashboardLayoutItem,
    offset: OffsetModel
  ): OffsetModel {
    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
    const layoutItemBoundingClientRect = this.getItemElementClientBoundingRect(dashboardLayoutItem);

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
    resizeDirection: string,
    minSize: SizeModel = new SizeModel(0, 0)
  ): OffsetModel {
    const containerBoundingClientRect = this.getContainerBoundingClientRect(containerElement);
    const currentItemClientBoundingRect = this.getItemElementClientBoundingRect(dashboardLayoutItem);

    let minWidth = minSize.width;
    let minHeight = minSize.height;

    // todo: create converter
    if (minSize.sizeType === DimensionType.persentile) {
      minWidth = containerBoundingClientRect.width * minSize.width / 100;
      minHeight = containerBoundingClientRect.height * minSize.height / 100;
    }

    const possibleOffset = new OffsetModel(offset.x, offset.y);

    (resizeDirection || '').split('').forEach((resizeSubDirection: string) => {
      switch (resizeSubDirection) {
        case DirectionType.north:
          if ((currentItemClientBoundingRect.top - containerBoundingClientRect.top) + possibleOffset.y < 0) {
            possibleOffset.y = -(currentItemClientBoundingRect.top - containerBoundingClientRect.top);
          } else if (possibleOffset.y > currentItemClientBoundingRect.height - minHeight) {
            possibleOffset.y = currentItemClientBoundingRect.height - minHeight;
          }
          break;
        case DirectionType.east:
          if (currentItemClientBoundingRect.width - minWidth + possibleOffset.x < 0) {
            possibleOffset.x = -(currentItemClientBoundingRect.width + minWidth);
          } else if (possibleOffset.x > containerBoundingClientRect.right - currentItemClientBoundingRect.right) {
            possibleOffset.x = containerBoundingClientRect.right - currentItemClientBoundingRect.right;
          }
          break;
        case DirectionType.west:
          if ((currentItemClientBoundingRect.left - containerBoundingClientRect.left) + possibleOffset.x < 0) {
            possibleOffset.x = -(currentItemClientBoundingRect.left - containerBoundingClientRect.left);
          } else if (possibleOffset.x > currentItemClientBoundingRect.width - minWidth) {
            possibleOffset.x = currentItemClientBoundingRect.width - minWidth;
          }
          break;
        case DirectionType.south:
          if (currentItemClientBoundingRect.height - minHeight + possibleOffset.y < 0) {
            possibleOffset.y = -(currentItemClientBoundingRect.height + minHeight);
          } else if (possibleOffset.y > containerBoundingClientRect.bottom - currentItemClientBoundingRect.bottom) {
            possibleOffset.y = containerBoundingClientRect.bottom - currentItemClientBoundingRect.bottom;
          }
          break;
      }
    });

    return possibleOffset;
  }

  // calculate offset to show dashboard item on resize
  private getResizeOffset(
    resizeOffset: OffsetModel,
    resizeDirection: string
  ): OffsetModel {
    const resultOffset = new OffsetModel(0, 0);

    (resizeDirection || '').split('').forEach((resizeSubDirection: string) => {
      switch (resizeSubDirection) {
        case DirectionType.west:
          resultOffset.x = resizeOffset.x;
          break;
        case DirectionType.north:
          resultOffset.y = resizeOffset.y;
          break;
      }
    });

    return resultOffset;
  }

  private getResizeSize(
    dashboardLayoutItem: DashboardLayoutItem,
    resizeOffset: OffsetModel,
    resizeDirection: string
  ): SizeModel {
    const currentItemClientBoundingRect = this.getItemElementClientBoundingRect(dashboardLayoutItem);
    const resultSize = new SizeModel(
      currentItemClientBoundingRect.width,
      currentItemClientBoundingRect.height,
      DimensionType.pixels
    );

    (resizeDirection || '').split('').forEach((resizeSubDirection: string) => {
      switch (resizeSubDirection) {
        case DirectionType.north:
          resultSize.height -= resizeOffset.y;
          break;
        case DirectionType.east:
          resultSize.width += resizeOffset.x;
          break;
        case DirectionType.west:
          resultSize.width -= resizeOffset.x;
          break;
        case DirectionType.south:
          resultSize.height += resizeOffset.y;
          break;
      }
    });

    return resultSize;
  }

  private getSnapOffset(
    layoutItemTopLeftCoordinates: CoordinatesModel,
    layoutItemBottomRightCoordinates: CoordinatesModel,
    siblingVisibleRectangleSides: RectangleSideModel[],
    snapMode: SnappingMode,
    snapRadius: number,
    snapDirection?: string
  ): OffsetModel {
    const snapOffset = new OffsetModel(0, 0);
    siblingVisibleRectangleSides.forEach((side: RectangleSideModel) => {
      //noinspection TsLint
      const isOuterSnappingEnabled = snapMode & SnappingMode.outer;
      //noinspection TsLint
      const isInnerSnappingEnabled = snapMode & SnappingMode.inner;

      if (isOuterSnappingEnabled || isInnerSnappingEnabled) {
        switch (side.sideType) {
          case RectangleSideType.left:
            if (this.checkParallelLinesOverlapOnY(
                layoutItemTopLeftCoordinates.y - snapRadius,
                layoutItemBottomRightCoordinates.y + snapRadius,
                side.beginningCoordinates.y,
                side.endingCoordinates.y)
            ) {
              let dist;

              if (isOuterSnappingEnabled && (!snapDirection || snapDirection.includes(DirectionType.east))) {
                dist = side.beginningCoordinates.x - layoutItemBottomRightCoordinates.x;

                if (Math.abs(dist) <= snapRadius
                  && (Math.abs(dist) < Math.abs(snapOffset.x) || snapOffset.x === 0)
                ) {
                  snapOffset.x = dist;
                }
              }

              if (isInnerSnappingEnabled && (!snapDirection || snapDirection.includes(DirectionType.west))) {
                dist = side.beginningCoordinates.x - layoutItemTopLeftCoordinates.x;

                if (Math.abs(dist) <= snapRadius
                  && (Math.abs(dist) < Math.abs(snapOffset.x) || snapOffset.x === 0)
                ) {
                  snapOffset.x = dist;
                }
              }
            }
            break;
          case RectangleSideType.right:
            if (this.checkParallelLinesOverlapOnY(
                layoutItemTopLeftCoordinates.y - snapRadius,
                layoutItemBottomRightCoordinates.y + snapRadius,
                side.beginningCoordinates.y,
                side.endingCoordinates.y)
            ) {
              let dist;

              if (isOuterSnappingEnabled && (!snapDirection || snapDirection.includes(DirectionType.west))) {
                dist = side.beginningCoordinates.x - layoutItemTopLeftCoordinates.x;

                if (Math.abs(dist) <= snapRadius
                  && (Math.abs(dist) < Math.abs(snapOffset.x) || snapOffset.x === 0)
                ) {
                  snapOffset.x = dist;
                }
              }

              if (isInnerSnappingEnabled && (!snapDirection || snapDirection.includes(DirectionType.east))) {
                dist = side.beginningCoordinates.x - layoutItemBottomRightCoordinates.x;

                if (Math.abs(dist) <= snapRadius
                  && (Math.abs(dist) < Math.abs(snapOffset.x) || snapOffset.x === 0)
                ) {
                  snapOffset.x = dist;
                }
              }
            }
            break;
          case RectangleSideType.top:
            if (this.checkParallelLinesOverlapOnX(
                layoutItemTopLeftCoordinates.x - snapRadius,
                layoutItemBottomRightCoordinates.x + snapRadius,
                side.beginningCoordinates.x,
                side.endingCoordinates.x)
            ) {
              let dist;

              if (isOuterSnappingEnabled && (!snapDirection || snapDirection.includes(DirectionType.south))) {
                dist = side.beginningCoordinates.y - layoutItemBottomRightCoordinates.y;

                if (Math.abs(dist) <= snapRadius
                  && (Math.abs(dist) < Math.abs(snapOffset.y) || snapOffset.y === 0)
                ) {
                  snapOffset.y = dist;
                }
              }

              if (isInnerSnappingEnabled && (!snapDirection || snapDirection.includes(DirectionType.north))) {
                dist = side.beginningCoordinates.y - layoutItemTopLeftCoordinates.y;

                if (Math.abs(dist) <= snapRadius
                  && (Math.abs(dist) < Math.abs(snapOffset.y) || snapOffset.y === 0)
                ) {
                  snapOffset.y = dist;
                }
              }
            }
            break;
          case RectangleSideType.bottom:
            if (this.checkParallelLinesOverlapOnX(
                layoutItemTopLeftCoordinates.x - snapRadius,
                layoutItemBottomRightCoordinates.x + snapRadius,
                side.beginningCoordinates.x,
                side.endingCoordinates.x)
            ) {
              let dist;

              if (isOuterSnappingEnabled && (!snapDirection || snapDirection.includes(DirectionType.north))) {
                dist = side.beginningCoordinates.y - layoutItemTopLeftCoordinates.y;

                if (Math.abs(dist) <= snapRadius
                  && (Math.abs(dist) < Math.abs(snapOffset.y) || snapOffset.y === 0)
                ) {
                  snapOffset.y = dist;
                }
              }

              if (isInnerSnappingEnabled && (!snapDirection || snapDirection.includes(DirectionType.south))) {
                dist = side.beginningCoordinates.y - layoutItemBottomRightCoordinates.y;

                if (Math.abs(dist) <= snapRadius
                  && (Math.abs(dist) < Math.abs(snapOffset.y) || snapOffset.y === 0)
                ) {
                  snapOffset.y = dist;
                }
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

  private getPercentageCoordinates(
    containerElement: HTMLElement,
    coordinates: CoordinatesModel
  ): CoordinatesModel {
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

  private getSiblings(
    dashboardLayoutItem: DashboardLayoutItem,
    filterSameHtmlElementItems = true
  ) {
    const containerElement = this.getItemContainerElement(dashboardLayoutItem);

    const result = [];
    (this.containerElementDashboardLayoutItemsMap.get(containerElement) || [])
      .forEach(item => {
        if (item !== dashboardLayoutItem
          && (!filterSameHtmlElementItems || (this.dashboardLayoutItemElementMap.get(item)
              !== this.dashboardLayoutItemElementMap.get(dashboardLayoutItem)
            && result.every(resultItem => this.dashboardLayoutItemElementMap.get(resultItem)
              !== this.dashboardLayoutItemElementMap.get(item))))
        ) {
          result.push(item);
        }
      });

    return result;
  }

  private getSiblingVisibleRectangleSides(dashboardLayoutItem: DashboardLayoutItem) {
    const siblingsVisibleRectangleSides = [];
    const siblingDashboardLayoutItems = this.getSiblings(dashboardLayoutItem);
    siblingDashboardLayoutItems.forEach((item: DashboardLayoutItem) => {
        const itemBoundingClientRect = this.getItemElementClientBoundingRect(item);

        this.getVisibleRectangleSideParts(
          siblingDashboardLayoutItems,
          new RectangleSideModel(
            new CoordinatesModel(itemBoundingClientRect.left, itemBoundingClientRect.top),
            new CoordinatesModel(itemBoundingClientRect.left, itemBoundingClientRect.bottom),
            RectangleSideType.left
          ),
          item.priority
        ).forEach((side: RectangleSideModel) => siblingsVisibleRectangleSides.push(side));

        this.getVisibleRectangleSideParts(
          siblingDashboardLayoutItems,
          new RectangleSideModel(
            new CoordinatesModel(itemBoundingClientRect.right, itemBoundingClientRect.top),
            new CoordinatesModel(itemBoundingClientRect.right, itemBoundingClientRect.bottom),
            RectangleSideType.right,
          ),
          item.priority
        ).forEach((side: RectangleSideModel) => siblingsVisibleRectangleSides.push(side));

        this.getVisibleRectangleSideParts(
          siblingDashboardLayoutItems,
          new RectangleSideModel(
            new CoordinatesModel(itemBoundingClientRect.left, itemBoundingClientRect.top),
            new CoordinatesModel(itemBoundingClientRect.right, itemBoundingClientRect.top),
            RectangleSideType.top,
          ),
          item.priority
        ).forEach((side: RectangleSideModel) => siblingsVisibleRectangleSides.push(side));

        this.getVisibleRectangleSideParts(
          siblingDashboardLayoutItems,
          new RectangleSideModel(
            new CoordinatesModel(itemBoundingClientRect.left, itemBoundingClientRect.bottom),
            new CoordinatesModel(itemBoundingClientRect.right, itemBoundingClientRect.bottom),
            RectangleSideType.bottom,
          ),
          item.priority
        ).forEach((side: RectangleSideModel) => siblingsVisibleRectangleSides.push(side));
      });

    return siblingsVisibleRectangleSides;
  }

  private getVisibleRectangleSideParts(
    siblingDashboardLayoutItems: DashboardLayoutItem[],
    side: RectangleSideModel,
    sidePriority: number
  ): RectangleSideModel[] {
    let sideParts = [side];

    siblingDashboardLayoutItems
      .filter((dashboardLayoutItem: DashboardLayoutItem) => dashboardLayoutItem.priority > sidePriority)
      .forEach((dashboardLayoutItem: DashboardLayoutItem) => {
        const newSideParts = [];

        const itemBoundingClientRect = this.getItemElementClientBoundingRect(dashboardLayoutItem);

        sideParts.forEach((sidePart: RectangleSideModel) => {
          switch (side.sideType) {
            case RectangleSideType.top:
            case RectangleSideType.bottom:
              if (itemBoundingClientRect.top > sidePart.endingCoordinates.y
                || itemBoundingClientRect.top + itemBoundingClientRect.height < sidePart.beginningCoordinates.y
                || itemBoundingClientRect.left >= sidePart.endingCoordinates.x
                || itemBoundingClientRect.left + itemBoundingClientRect.width <= sidePart.beginningCoordinates.x
              ) {
                newSideParts.push(sidePart);
              } else if (itemBoundingClientRect.left > sidePart.beginningCoordinates.x
                && itemBoundingClientRect.left + itemBoundingClientRect.width < sidePart.endingCoordinates.x
              ) {
                // left side
                newSideParts.push(new RectangleSideModel(
                  sidePart.beginningCoordinates,
                  new CoordinatesModel(itemBoundingClientRect.left, sidePart.endingCoordinates.y),
                  side.sideType
                ));

                // right side
                newSideParts.push(new RectangleSideModel(
                  new CoordinatesModel(
                    itemBoundingClientRect.left + itemBoundingClientRect.width,
                    sidePart.beginningCoordinates.y
                  ),
                  sidePart.endingCoordinates,
                  side.sideType
                ));
              } else if (itemBoundingClientRect.left > sidePart.beginningCoordinates.x
                && itemBoundingClientRect.left + itemBoundingClientRect.width >= sidePart.endingCoordinates.x
              ) {
                // left side
                newSideParts.push(new RectangleSideModel(
                  sidePart.beginningCoordinates,
                  new CoordinatesModel(itemBoundingClientRect.left, sidePart.endingCoordinates.y),
                  side.sideType
                ));
              } else if (itemBoundingClientRect.left <= sidePart.beginningCoordinates.x
                && itemBoundingClientRect.left + itemBoundingClientRect.width < sidePart.endingCoordinates.x
              ) {
                // right side
                newSideParts.push(new RectangleSideModel(
                  new CoordinatesModel(
                    itemBoundingClientRect.left + itemBoundingClientRect.width,
                    sidePart.beginningCoordinates.y
                  ),
                  sidePart.endingCoordinates,
                  side.sideType
                ));
              }
              break;
            case RectangleSideType.left:
            case RectangleSideType.right:
              if (itemBoundingClientRect.top >= sidePart.endingCoordinates.y
                || itemBoundingClientRect.top + itemBoundingClientRect.height <= sidePart.beginningCoordinates.y
                || itemBoundingClientRect.left > sidePart.endingCoordinates.x
                || itemBoundingClientRect.left + itemBoundingClientRect.width < sidePart.beginningCoordinates.x
              ) {
                newSideParts.push(sidePart);
              } else if (itemBoundingClientRect.top > sidePart.beginningCoordinates.y
                && itemBoundingClientRect.top + itemBoundingClientRect.height < sidePart.endingCoordinates.y
              ) {
                // top side
                newSideParts.push(new RectangleSideModel(
                  sidePart.beginningCoordinates,
                  new CoordinatesModel(sidePart.endingCoordinates.x, itemBoundingClientRect.top),
                  side.sideType
                ));

                // bottom side
                newSideParts.push(new RectangleSideModel(
                  new CoordinatesModel(
                    sidePart.beginningCoordinates.x,
                    itemBoundingClientRect.top + itemBoundingClientRect.height
                  ),
                  sidePart.endingCoordinates,
                  side.sideType
                ));
              } else if (itemBoundingClientRect.top > sidePart.beginningCoordinates.y
                && itemBoundingClientRect.top + itemBoundingClientRect.height >= sidePart.endingCoordinates.y
              ) {
                // top side
                newSideParts.push(new RectangleSideModel(
                  sidePart.beginningCoordinates,
                  new CoordinatesModel(sidePart.endingCoordinates.x, itemBoundingClientRect.top),
                  side.sideType
                ));
              } else if (itemBoundingClientRect.top <= sidePart.beginningCoordinates.y
                && itemBoundingClientRect.top + itemBoundingClientRect.height < sidePart.endingCoordinates.y
              ) {
                // bottom side
                newSideParts.push(new RectangleSideModel(
                  new CoordinatesModel(
                    sidePart.beginningCoordinates.x,
                    itemBoundingClientRect.top + itemBoundingClientRect.height
                  ),
                  sidePart.endingCoordinates,
                  side.sideType
                ));
              }
              break;
          }
        });

        sideParts = newSideParts;
      });

    return sideParts;
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

  private getItemContainerElement(dashboardLayoutItem: DashboardLayoutItem) {
    return this.dashboardLayoutItemContainerElementMap.get(dashboardLayoutItem);
  }

  private getContainerBoundingClientRect(containerElement: HTMLElement): ClientRect {
    let containerBoundingClientRect = this.elementClientBoundingRectCache.get(containerElement);
    if (!containerBoundingClientRect) {
      containerBoundingClientRect = containerElement.getBoundingClientRect();
      this.elementClientBoundingRectCache.set(containerElement, containerBoundingClientRect);
    }

    return containerBoundingClientRect;
  }

  private getItemElementClientBoundingRect(dashboardLayoutItem: DashboardLayoutItem) {
    const itemHtmlElement = this.dashboardLayoutItemElementMap.get(dashboardLayoutItem);

    let itemElementClientBoundingRect = null;
    if (itemHtmlElement) {
      itemElementClientBoundingRect = this.elementClientBoundingRectCache.get(itemHtmlElement);

      if (!itemElementClientBoundingRect) {
        itemElementClientBoundingRect = dashboardLayoutItem.getElementClientBoundingRect();
        this.elementClientBoundingRectCache.set(itemHtmlElement, itemElementClientBoundingRect);
      }
    }

    return itemElementClientBoundingRect;
  }

  // must me called to invalidate caches after drag end (probably should be called in drag start)
  private clearClientBoundingRectCaches(dashboardLayoutItem: DashboardLayoutItem) {
    const containerElement = this.getItemContainerElement(dashboardLayoutItem);

    if (this.elementClientBoundingRectCache.has(containerElement)) {
      this.elementClientBoundingRectCache.delete(containerElement);
    }

    const currentDashboardItems = this.containerElementDashboardLayoutItemsMap.get(containerElement);
    if (currentDashboardItems) {
      currentDashboardItems.forEach((item: DashboardLayoutItem) => {
        const itemHtmlElement = this.dashboardLayoutItemElementMap.get(dashboardLayoutItem);

        if (itemHtmlElement && this.elementClientBoundingRectCache.has(itemHtmlElement)) {
          this.elementClientBoundingRectCache.delete(itemHtmlElement);
        }
      });
    }
  }
}
