import { Component } from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  public firstContainerDragging;
  public firstContainerInnerDragging;
  public secondContainerDragging;
  public secondContainerInnerDragging;

  public firstContainerResizing;
  public firstContainerInnerResizing;
  public secondContainerResizing;
  public secondContainerInnerResizing;
}
