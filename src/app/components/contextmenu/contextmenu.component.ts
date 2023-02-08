import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AnimationService } from 'src/app/services/animation/animation.service';

@Component({
  selector: 'app-contextmenu',
  templateUrl: './contextmenu.component.html',
  styleUrls: ['./contextmenu.component.css']
})
export class ContextmenuComponent implements OnInit, AfterViewInit {


  @ViewChild('context') contextRef!: ElementRef;
  get context(): HTMLCanvasElement {
    return this.contextRef.nativeElement;
  }
  @Input() posX = 0;
  @Input() posY = 0;
  @Input() type = "";
  @Output() SetAsView = new EventEmitter<number>();
  constructor(public AnimationService: AnimationService) { }
  ngAfterViewInit(): void {
    this.context.style.left = `${this.posX}px`;
    this.context.style.top = `${this.posY}px`;
  }

  ngOnInit(): void {
  }

  Click(event: MouseEvent) {
    this.AnimationService.contextMenu = false;
  }

  SetFrontView(event: MouseEvent) {
    this.SetAsView.emit(0);
  }
  SetTopView(event: MouseEvent) {
    this.SetAsView.emit(1);
  }
}
