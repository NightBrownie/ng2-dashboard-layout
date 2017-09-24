import { CoordinatesModel } from './';
import { SnappingMode, RectangleSideType } from '../enums';


export class RectangleSide {
  constructor(
    public topCoordinates: CoordinatesModel = new CoordinatesModel(0, 0),
    public bottomCoordinates: CoordinatesModel = new CoordinatesModel(0, 0),
    public sideType: RectangleSideType = RectangleSideType.Left,
    public snappingMode: SnappingMode = SnappingMode.none,
    public snappingSize: number = 0
  ) {
  }
}
