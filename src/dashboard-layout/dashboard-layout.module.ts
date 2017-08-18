import { NgModule } from '@angular/core';

import {DraggableDirective} from './directives/draggable.directive';
import {DragHandleDirective} from './directives/drag-handle.directive';
import {ResizableDirective} from './directives/resizable.directive';
import {ResizerDirective} from './directives/resizer.directive';
import {DashboardLayoutService} from './services/dashboard-layout.service';
import {DashboardLayoutItemDirective} from './directives/dashboard-layout-item.directive';


@NgModule({
  declarations: [
    DashboardLayoutItemDirective,
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
