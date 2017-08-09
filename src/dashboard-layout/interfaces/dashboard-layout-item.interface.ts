import {CoordinatesModel, OffsetModel} from '../models';

export interface DashboardLayoutItem {
  getElementClientBoundingRect(): ClientRect;
  setTranslate(offset: OffsetModel);
  setPosition(coordinates: CoordinatesModel);

  // TODO: update when start implementing resize functionality
  setScale();
  setSize();
}
