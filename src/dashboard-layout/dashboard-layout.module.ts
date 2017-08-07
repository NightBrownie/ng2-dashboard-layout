import { NgModule } from '@angular/core';

import {DraggableDirective} from "./directives/draggable.directive";
import {DraggerDirective} from "./directives/dragger.directive";
import {ResizableDirective} from "./directives/resizable.directive";
import {ResizerDirective} from "./directives/resizer.directive";
import {DashboardLayoutService} from "./services/dashboard-layout.service";

@NgModule({
  declarations: [
    DraggableDirective,
    DraggerDirective,
    ResizableDirective,
    ResizerDirective
  ],
  providers: [
    DashboardLayoutService
  ]
})
export class DashboardLayoutModule {
}
