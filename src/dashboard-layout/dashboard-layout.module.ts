import { NgModule } from '@angular/core';

import {DraggableDirective} from './directives/draggable.directive';
import {DragHandleDirective} from './directives/drag-handle.directive';
import {ResizableDirective} from './directives/resizable.directive';
import {ResizeHandleDirective} from './directives/resize-handle.directive';
import {DashboardLayoutService} from './services/dashboard-layout.service';
import {DashboardLayoutItemDirective} from './directives/dashboard-layout-item.directive';


@NgModule({
  declarations: [
    DashboardLayoutItemDirective,
    DraggableDirective,
    DragHandleDirective,
    ResizableDirective,
    ResizeHandleDirective
  ],
  exports: [
    DraggableDirective,
    DragHandleDirective,
    ResizableDirective,
    ResizeHandleDirective
  ],
  providers: [
    DashboardLayoutService
  ]
})
export class DashboardLayoutModule {
}
