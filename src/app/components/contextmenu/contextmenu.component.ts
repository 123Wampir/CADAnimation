import { AfterViewChecked } from '@angular/core';
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { SceneUtilsService } from 'src/app/services/utils/scene.utils.service';

@Component({
  selector: 'app-contextmenu',
  templateUrl: './contextmenu.component.html',
  styleUrls: ['./contextmenu.component.css']
})
export class ContextmenuComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild('context') contextRef!: ElementRef;
  get context(): HTMLCanvasElement {
    return this.contextRef.nativeElement;
  }
  @Input() object!: any;
  @Input() component!: any;
  @Input() posX = 0;
  @Input() posY = 0;
  @Input() type = "";
  constructor(public SceneUtilsService: SceneUtilsService) { }
  ngAfterViewChecked(): void {
    this.context.style.left = `${this.posX}px`;
    this.context.style.top = `${this.posY}px`;
  }
  ngAfterViewInit(): void {
    this.SceneUtilsService.ContextmenuComponent = this;
  }

  ngOnInit(): void {
  }
  Click(event: MouseEvent) {
    this.component.contextMenu = false;
  }
}
