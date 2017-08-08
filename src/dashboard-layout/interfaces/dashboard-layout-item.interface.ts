import {CoordinatesModel} from "../models/coordinates.model";
import {OffsetModel} from "../models/offset.model";

export interface DashboardLayoutItem {
  getElementClientBoundingRect(): ClientRect;
  // TODO: remove this from interface
  startDrag(coordinates: CoordinatesModel);

  setTranslate(offset: OffsetModel);
  setOffset(coordinates: CoordinatesModel);
}
