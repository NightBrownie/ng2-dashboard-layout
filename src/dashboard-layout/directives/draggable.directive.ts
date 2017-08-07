import {
  AfterContentInit, ContentChildren, Directive, ElementRef, Input, OnDestroy, OnInit, QueryList
} from "@angular/core";

import {DashboardLayoutService} from "../services/dashboard-layout.service";
import {DraggerDirective} from "./dragger.directive";


@Directive({
  selector: '[draggable]'
})
export class DraggableDirective implements OnInit, OnDestroy, AfterContentInit {
  @Input() private draggable: boolean;
  @ContentChildren(DraggerDirective) private draggers: QueryList<DraggerDirective>;

  constructor(private element: ElementRef,
    private dashboardLayoutService: DashboardLayoutService
  ) {

  }

  ngOnInit(): void {
  }

  ngAfterContentInit(): void {
  }

  ngOnDestroy(): void {
  }
}
