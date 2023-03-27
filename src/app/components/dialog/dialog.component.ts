import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { AnimationCreatorService } from 'src/app/services/animation/animation.creator.service';
import { AnimationService } from 'src/app/services/animation/animation.service';
import { SceneUtilsService } from 'src/app/services/utils/scene.utils.service';
import THREE = require('three');

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent implements OnInit, OnChanges {
  constructor(public AnimationService: AnimationService,
    private AnimationCreatorService: AnimationCreatorService,
    public SceneUtilsService: SceneUtilsService) { }

  @ViewChild('container') containerRef!: ElementRef;
  @ViewChild('canvas') canvasRef!: ElementRef;
  get container(): HTMLCanvasElement {
    return this.containerRef.nativeElement
  }
  get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement
  }
  @Input() show = false;
  @Input() modal = false;
  @Input() type = "";
  drag = false;
  pointer = new THREE.Vector2();

  endTime = 5;
  rotAngle = 360;
  rotDirection = true;

  canvasPreviewWidth = 300;
  canvasPreviewHeight = 300;
  canvasWidth = 1920;
  canvasHeight = 1080;
  aspect = 16 / 9;

  recordStart = 0;
  recordEnd = this.AnimationService.timeLine.duration;
  framerate = 60;

  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes["show"]) {
      if (this.containerRef != undefined)
        if (this.show)
          this.container.style.visibility = "visible";
    }
  }

  OnCameraRotationCreate(event: MouseEvent) {
    this.SceneUtilsService.perspectiveCamera.lookAt(this.SceneUtilsService.scene.position);
    if (this.endTime == this.AnimationService.currentTime)
      this.endTime += 1;
    this.AnimationCreatorService.OnCameraChange(this.SceneUtilsService.perspectiveCamera);
    let ang = 0;
    if (!this.rotDirection)
      ang = this.rotAngle;
    else ang = -this.rotAngle;
    let duration = this.endTime - this.AnimationService.currentTime;
    let step = 0;
    let time = this.AnimationService.currentTime;
    let offset = 5;
    for (let i = 0; i <= Math.abs(ang / offset); i++) {
      if (((Math.abs(ang) - (i * offset)) / offset) < 1) {
        step = ang % offset;
      }
      else {
        if (ang > 0)
          step = offset;
        else step = -offset;
      }
      let mult = step / this.rotAngle;
      let dt = duration * Math.abs(mult);
      time += dt;
      this.AnimationService.currentTime = time;
      let pos = this.SceneUtilsService.perspectiveCamera.position;
      pos.applyAxisAngle(this.SceneUtilsService.perspectiveCamera.up, step * Math.PI / 180);
      this.SceneUtilsService.perspectiveCamera.position.set(pos.x, pos.y, pos.z);
      this.SceneUtilsService.perspectiveCamera.lookAt(this.SceneUtilsService.scene.position);
      this.AnimationCreatorService.OnCameraChange(this.SceneUtilsService.perspectiveCamera);
    }
  }
  SaveSnapshot() {
    this.AnimationService.RenderFrame(this.canvas, this.canvasWidth, this.canvasHeight, false);
    this.canvas.toBlob(function (blob) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob!);
      a.download = "snapshot";
      a.click();
    });
  }
  SetCanvasWidth() {
    this.canvasHeight = Math.round(this.canvasWidth / this.aspect);
    if (this.canvasWidth != 0)
      this.AnimationService.RenderFrame(this.canvas, this.canvasPreviewWidth, this.canvasPreviewHeight);
  }
  SetCanvasHeight() {
    this.canvasWidth = Math.round(this.canvasHeight * this.aspect);
    if (this.canvasHeight != 0)
      this.AnimationService.RenderFrame(this.canvas, this.canvasPreviewWidth, this.canvasPreviewHeight);
  }
  OnAspectRatioChange(event: Event) {
    this.aspect = Number((event.target as any).value);
    this.canvas.height = this.canvas.width / this.aspect;
    this.SetCanvasWidth();
  }
  SetCanvasStyle() {
    const width = 300;
    return {
      'width': `${width}px`,
      'height': `${width / this.aspect}px`
    }
  }
  SetProgressBarStyle() {
    return {
      'width': `${100 * this.AnimationService.currentFrame / (this.framerate * this.AnimationService.duration)}%`
    }
  }
  SetProgressBarLabelStyle() {
    return {
      'width': `${100 * this.AnimationService.currentFrame / (this.framerate * this.AnimationService.duration)}%`,
      'text-align': `end`,
      'position': 'relative'
    }
  }

  OnStartRecord() {
    this.AnimationService.targetCanvas = this.canvas;
    this.AnimationService.recorder.init(this.canvas, { verbose: false });
    this.AnimationService.recordEnd = this.recordEnd;
    this.AnimationService.recordStart = this.recordStart;
    this.AnimationService.framerate = this.framerate;
    let duration = this.recordEnd - this.recordStart;
    this.AnimationService.duration = duration;
    this.AnimationService.RenderFrame(this.canvas, this.canvasWidth, this.canvasHeight, false);
    this.AnimationService.recorder.beginVideoRecord({
      format: "webm",
      fps: this.framerate
    });
    let frames = duration * this.framerate;
    console.log(duration, frames);
  }

  CloseClick(event: MouseEvent) {
    this.container.style.visibility = "hidden";
    this.show = false;
    this.SceneUtilsService.dialogShow = false;
  }

  OnMouseUp(event: MouseEvent) {
    this.drag = false;
  }
  OnMouseMove(event: MouseEvent) {
    if (this.drag) {
      let offsetX = event.clientX + this.pointer.x;
      let offsetY = event.clientY + this.pointer.y;
      this.container.style.left = offsetX.toString() + "px";
      this.container.style.top = offsetY.toString() + "px";
    }
  }
  OnMouseDown(event: MouseEvent) {
    this.drag = true;
    this.pointer.x = this.container.offsetLeft - event.clientX;
    this.pointer.y = this.container.offsetTop - event.clientY;
  }
}
