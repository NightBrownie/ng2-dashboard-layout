import {Directive, OnInit, ViewChildren} from "@angular/core";

import {DashboardLayoutService} from "../services/dashboard-layout.service";
import {DraggerDirective} from "./dragger.directive";


@Directive({
  selector: 'draggable'
})
export class DraggableDirective implements OnInit {

  @ViewChildren(DraggerDirective)
  private draggers: Array<DraggerDirective>;

  constructor(private dashboardLayoutService: DashboardLayoutService) {
  }

  ngOnInit(): void {
    throw new Error("Method not implemented.");
  }
}
