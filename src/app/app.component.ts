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

  public isDraggingFirstContainer;
  public isDraggingFirstConrainerInner;
  public isDraggingSecondContainer;
  public isDraggingSecondContainerInner;
  public isDraggingThirdContainer;
  public isDraggingThirdContainerInner;

  public isResizingFirstContainer;
  public isResizingFirstContainerInner;
  public isResizingSecondContainer;
  public isResizingSecondContainerInner;
  public isResizingThirdContainer;
  public isResizingThirdContainerInner;

  public baseZIndex = 5;
  public firstContainerPriority;
  public firstContainerInnerPriority;
  public secondContainerPriority;
  public secondContainerInnerPriority;
  public thirdContainerPriority;
  public thirdContainerInnerPriority;

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
