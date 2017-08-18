import {CoordinatesModel} from './coordinates.model';


export class ResizeStartModel {
  constructor(public coordinates: CoordinatesModel, public resizeDirection: string) {
  }
}
