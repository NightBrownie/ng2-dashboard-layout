import { CoordinatesModel } from './';
import { SnappingMode, RectangleSideType } from '../enums';


export class RectangleSideModel {
  constructor(
    public beginningCoordinates: CoordinatesModel,
    public endingCoordinates: CoordinatesModel,
    public sideType: RectangleSideType
  ) {
  }
}
