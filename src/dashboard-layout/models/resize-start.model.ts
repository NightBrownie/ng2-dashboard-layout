import {CoordinatesModel} from './coordinates.model';
import {ResizeDirection} from '../enums/resizer-direction.enum';

export class ResizeStartModel {
  constructor(public coordinates: CoordinatesModel, resizeDirection: ResizeDirection) {

  }
}
