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
    this.RenderFrame(this.canvasWidth, this.canvasHeight);
    this.canvas.toBlob(function (blob) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob!);
      a.download = "snapshot";
      a.click();
    });
  }
  RenderFrame(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height
    console.log(this.canvas.width, this.canvas.height);
    let context = this.canvas.getContext("2d");
    if (this.SceneUtilsService.currentCamera.type == "PerspectiveCamera") {
      this.SceneUtilsService.perspectiveCamera.aspect = this.aspect;
      this.SceneUtilsService.perspectiveCamera.updateProjectionMatrix();
    }
    else {
      this.SceneUtilsService.orthographicCamera.left = -this.SceneUtilsService.frustumSize * this.aspect / 2;
      this.SceneUtilsService.orthographicCamera.right = this.SceneUtilsService.frustumSize * this.aspect / 2;
      this.SceneUtilsService.orthographicCamera.top = this.SceneUtilsService.frustumSize / 2;
      this.SceneUtilsService.orthographicCamera.bottom = -this.SceneUtilsService.frustumSize / 2;
      this.SceneUtilsService.orthographicCamera.updateProjectionMatrix();
    }
    this.SceneUtilsService.renderer.setSize(width, height);
    this.SceneUtilsService.CSSRenderer.setSize(width, height);
    this.SceneUtilsService.renderer.render(this.SceneUtilsService.scene, this.SceneUtilsService.currentCamera);
    this.SceneUtilsService.CSSRenderer.render(this.SceneUtilsService.scene, this.SceneUtilsService.currentCamera);
    if (this.SceneUtilsService.outline)
      if (this.SceneUtilsService.model != undefined)
        this.SceneUtilsService.AppComponent.effect.renderOutline(this.SceneUtilsService.scene, this.SceneUtilsService.currentCamera);
    context?.drawImage(this.SceneUtilsService.renderer.domElement, 0, 0, width, height);
    this.SceneUtilsService.onResize();
  }
  SetCanvasWidth() {
    // this.canvas.width = this.canvasWidth;
    this.canvasHeight = Math.round(this.canvasWidth / this.aspect);
    // this.canvas.height = this.canvasHeight;
    if (this.canvasWidth != 0)
      this.RenderFrame(this.canvasPreviewWidth, this.canvasPreviewHeight);
  }
  SetCanvasHeight() {
    // this.canvas.height = this.canvasHeight;
    this.canvasWidth = Math.round(this.canvasHeight * this.aspect);
    // this.canvas.width = this.canvasWidth;
    if (this.canvasHeight != 0)
      this.RenderFrame(this.canvasPreviewWidth, this.canvasPreviewHeight);
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

  OnStartRecord() {
    this.AnimationService.currentTime = this.recordStart;
    this.AnimationService.currentTimeChange = !this.AnimationService.currentTimeChange;
    this.AnimationService.play = true;
    let stream = this.SceneUtilsService.renderer.domElement.captureStream(this.framerate);
    // let track = stream.getVideoTracks()[0];
    this.startRecording(stream, this.recordStart, this.recordEnd)
      .then((recordedChunks) => {
        this.AnimationService.play = false;
        let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(recordedBlob);
        a.download = "Animation";
        a.click();
        console.log(
          `Successfully recorded ${recordedBlob.size} bytes of ${recordedBlob.type} media.`
        );
      })
      .catch((error) => {
        if (error.name === "NotFoundError") {
          console.log("Camera or microphone not found. Can't record.");
        } else {
          console.log(error);
        }
      });
  }

  async startRecording(stream: MediaStream, start: number, end: number) {
    console.log(start, end);
    let recorder = new MediaRecorder(stream);
    let data: any[] = [];
    recorder.ondataavailable = (event) => {
      data.push(event.data);
      if (this.AnimationService.currentTime >= end)
        if (recorder.state === "recording") {
          console.log(this.AnimationService.currentTime);
          recorder.stop();
        }
    }
    recorder.start(1 / this.framerate);
    let duration = end - start;
    console.log(`${recorder.state} for ${duration} seconds…`);
    let stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (event: any) => reject(event.name);
    });
    return Promise.all([stopped]).then(() => data);
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
