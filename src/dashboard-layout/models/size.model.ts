import {DimensionType} from '../enums/dimension-type.enum';


export class SizeModel {
  constructor(
    public width: number,
    public height: number,
    public sizeType: DimensionType = DimensionType.persentile
  ) {
  }
}
