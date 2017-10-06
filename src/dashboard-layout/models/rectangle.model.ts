import {CoordinatesModel} from './coordinates.model';

export class RectangleModel {
  get left()  {
    return this.topLeftCoordinates.x;
  }

  get right() {
    return this.bottomRightCoordinates.x;
  }

  get top() {
    return this.topLeftCoordinates.y;
  }

  get bottom() {
    return this.bottomRightCoordinates.y;
  }

  constructor(
    public topLeftCoordinates: CoordinatesModel = new CoordinatesModel(0, 0),
    public bottomRightCoordinates: CoordinatesModel = new CoordinatesModel(0, 0)
  ) {
  }
}
