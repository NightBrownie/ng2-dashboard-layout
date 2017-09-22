import { Component } from '@angular/core';

import {SnappingMode} from '../dashboard-layout/enums/snapping-mode.enum';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  public SnappingMode = SnappingMode;

  public firstContainerDragging;
  public firstContainerInnerDragging;
  public secondContainerDragging;
  public secondContainerInnerDragging;

  public firstContainerResizing;
  public firstContainerInnerResizing;
  public secondContainerResizing;
  public secondContainerInnerResizing;

  public bitwiseOr() {
    return Array.prototype.reduce.call(
      arguments,
      (accumulator, current) => {
        // noinspection TsLint
        return accumulator | current;
      },
      0);
  }
}
