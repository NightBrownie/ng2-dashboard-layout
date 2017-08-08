import { NgModule } from '@angular/core';

import {DraggableDirective} from "./directives/draggable.directive";
import {DragHandleDirective} from "./directives/drag-handle.directive";
import {ResizableDirective} from "./directives/resizable.directive";
import {ResizerDirective} from "./directives/resizer.directive";
import {DashboardLayoutService} from "./services/dashboard-layout.service";

@NgModule({
  declarations: [
    DraggableDirective,
    DragHandleDirective,
    ResizableDirective,
    ResizerDirective
  ],
  exports: [
    DraggableDirective,
    DragHandleDirective,
    ResizableDirective,
    ResizerDirective
  ],
  providers: [
    DashboardLayoutService
  ]
})
export class DashboardLayoutModule {
}
