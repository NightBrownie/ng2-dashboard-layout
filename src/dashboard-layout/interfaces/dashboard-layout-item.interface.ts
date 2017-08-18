import {CoordinatesModel, OffsetModel, ScaleModel, SizeModel} from '../models';


export interface DashboardLayoutItem {
  getElementClientBoundingRect(): ClientRect;
  setTranslate(offset: OffsetModel);
  setPosition(coordinates: CoordinatesModel);
  setScale(scale: ScaleModel);
  setSize(size: SizeModel);
  updateTransform();
}
