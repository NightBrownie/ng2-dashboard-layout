import {OffsetModel} from '../models/coordinates.model';
import {OffsetModel} from '../models/offset.model';

export interface DashboardLayoutItem {
  getElementClientBoundingRect(): ClientRect;
  setTranslate(offset: OffsetModel);
  setPosition(coordinates: OffsetModel);

  // TODO: update when start implementing resize functionality
  setScale();
  setSize();
}
