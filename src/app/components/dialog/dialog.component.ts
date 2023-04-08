import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { AnimationCreatorService } from 'src/app/services/animation/animation.creator.service';
import { AnimationService } from 'src/app/services/animation/animation.service';
import { SceneUtilsService } from 'src/app/services/utils/scene.utils.service';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GroundProjectedEnv } from 'three/examples/jsm/objects/GroundProjectedEnv';
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

  scale = 1;
  material = new THREE.Material();

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
    this.SceneUtilsService.CalculateBounding(this.SceneUtilsService.model);
    let center = new THREE.Vector3();
    this.SceneUtilsService.boundingBox.getCenter(center);
    this.SceneUtilsService.perspectiveCamera.lookAt(center);
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
      this.SceneUtilsService.perspectiveCamera.lookAt(center);
      this.AnimationCreatorService.OnCameraChange(this.SceneUtilsService.perspectiveCamera);
    }
  }
  async SaveSnapshot() {
    await this.AnimationService.RenderFrame(this.canvas, this.canvasWidth, this.canvasHeight);
    this.canvas.toBlob(function (blob) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob!);
      a.download = "snapshot";
      a.click();
    });
  }
  SetCanvasWidth() {
    this.canvasHeight = Math.round(this.canvasWidth / this.aspect);
    this.canvasPreviewHeight = Math.round(this.canvasPreviewWidth / this.aspect);
    if (this.canvasWidth != 0)
      this.AnimationService.RenderFrame(this.canvas, this.canvasPreviewWidth, this.canvasPreviewHeight);
  }
  SetCanvasHeight() {
    this.canvasWidth = Math.round(this.canvasHeight * this.aspect);
    this.canvasPreviewHeight = Math.round(this.canvasPreviewWidth / this.aspect);
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

  async LoadEnviroment(event: Event) {
    console.log(event);
    let f = event.target as any;
    console.log(f.files);
    let str = window.URL.createObjectURL(f.files[0]);
    console.log(str);
    if (str.length != 0) {
      const hdrLoader = new RGBELoader();
      let envMap = await hdrLoader.loadAsync(str);
      if (this.SceneUtilsService.scene.environment != null) {
        this.SceneUtilsService.scene.environment.dispose();
        this.SceneUtilsService.scene.environment = null;
      }
      envMap.mapping = THREE.EquirectangularReflectionMapping;
      this.SceneUtilsService.scene.environment = envMap;
      this.SceneUtilsService.scene.background = envMap;
      if (this.SceneUtilsService.skybox != undefined) {
        this.SceneUtilsService.skybox.removeFromParent();
        (this.SceneUtilsService.skybox.children[0] as THREE.Mesh).geometry.dispose();
        (this.SceneUtilsService.skybox.children[0] as any).material.dispose();
        this.SceneUtilsService.skybox.clear();
        this.SceneUtilsService.skybox.geometry.dispose();
        this.SceneUtilsService.skybox.material.dispose();
      }
      this.SceneUtilsService.skybox = new GroundProjectedEnv(envMap);
      let r = 100;
      let x = 0;
      let z = 0;
      if (this.SceneUtilsService.boundingSphere != undefined) {
        r = this.SceneUtilsService.boundingSphere.radius;
        x = (this.SceneUtilsService.boundingBox.max.x + this.SceneUtilsService.boundingBox.min.x) / 2;
        z = (this.SceneUtilsService.boundingBox.max.z + this.SceneUtilsService.boundingBox.min.z) / 2;
      }
      this.SceneUtilsService.skybox.position.set(x, 0, z);
      this.SceneUtilsService.zeroPlane.visible = false;
      this.SceneUtilsService.skybox.scale.setScalar(10000);
      this.SceneUtilsService.skybox.radius = r * 16;
      this.SceneUtilsService.skybox.type = "Ignore";
      this.SceneUtilsService.scene.add(this.SceneUtilsService.skybox);
      const planeMaterial = new THREE.ShadowMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
      const plane = new THREE.Mesh(this.SceneUtilsService.zeroPlane.geometry, planeMaterial);
      plane.receiveShadow = true;
      plane.rotateX(-90 * Math.PI / 180);
      plane.name = "ShadowPlane";
      plane.type = "Ignore";
      this.SceneUtilsService.skybox.add(plane);
    }
  }

  OnToneMappingChange(event: Event) {
    let value = (event.target as any).value;
    switch (value) {
      case "noToneMapping":
        this.SceneUtilsService.renderer.toneMapping = THREE.NoToneMapping;
        break;
      case "linear":
        this.SceneUtilsService.renderer.toneMapping = THREE.LinearToneMapping;
        break;
      case "Reinhard":
        this.SceneUtilsService.renderer.toneMapping = THREE.ReinhardToneMapping;
        break;
      case "Cineon":
        this.SceneUtilsService.renderer.toneMapping = THREE.CineonToneMapping;
        break;
      case "ACESFilmic":
        this.SceneUtilsService.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        break;
    }
  }

  OnModelScaleChange(scale: number) {
    this.SceneUtilsService.model.scale.setScalar(scale);
  }
  OnEnviromentDisplayChange(event: Event) {
    let value = (event.target as any).checked;
    if (value) {
      this.SceneUtilsService.scene.background = this.SceneUtilsService.scene.environment;
      this.SceneUtilsService.zeroPlane.visible = false;
    }
    else {
      this.SceneUtilsService.scene.background = null;
      this.SceneUtilsService.skybox.visible = false;
      this.SceneUtilsService.zeroPlane.visible = true;
    }
  }
  OnEnviromentGroundChange() {
    if (this.SceneUtilsService.scene.environment != null)
      this.SceneUtilsService.zeroPlane.visible = false;
    else this.SceneUtilsService.zeroPlane.visible = !this.SceneUtilsService.skybox.visible;
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
