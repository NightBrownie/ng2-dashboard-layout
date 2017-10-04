import {CoordinatesModel, OffsetModel, ScaleModel, SizeModel} from '../models';
import {SnappingMode} from '../enums/snapping-mode.enum';


export interface DashboardLayoutItem {
  priority: number;
  snapToDashboardItemsMode: SnappingMode;
  snapRadius: number;

  getElementClientBoundingRect(): ClientRect;
  setTranslate(offset: OffsetModel);
  setPosition(coordinates: CoordinatesModel);
  setScale(scale: ScaleModel);
  setSize(size: SizeModel);
  updateTransform();
}
