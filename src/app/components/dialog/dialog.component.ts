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
  constructor(public AnimationService: AnimationService, private AnimationCreatorService: AnimationCreatorService, private SceneUtilsService:SceneUtilsService) { }

  @ViewChild('container') containerRef!: ElementRef;
  get container(): HTMLCanvasElement {
    return this.containerRef.nativeElement
  }
  @Input() show = false;
  @Input() modal = false;
  @Input() type = "";
  drag = false;
  pointer = new THREE.Vector2();

  endTime = 5;
  rotAngle = 360;
  rotDirection = true;

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
    // console.log(this.AnimationService.currentTime, this.endTime, this.rotAngle, this.rotDirection);
    this.SceneUtilsService.currentCamera.lookAt(this.SceneUtilsService.scene.position);
    // this.AnimationService.orbit.enabled = false;
    if (this.endTime == this.AnimationService.currentTime)
      this.endTime += 1;
    //this.AnimationCreatorService.OnRotationChange(this.AnimationService.currentCamera.parent!);
    this.AnimationCreatorService.OnCameraChange(this.SceneUtilsService.currentCamera);
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
      let pos = this.SceneUtilsService.currentCamera.position;
      pos.applyAxisAngle(new THREE.Vector3(0, 0, 1), step * Math.PI / 180);
      this.SceneUtilsService.currentCamera.position.set(pos.x, pos.y, pos.z);
      this.SceneUtilsService.currentCamera.lookAt(new THREE.Vector3())
      //this.AnimationService.currentCamera.rotateOnAxis(new THREE.Vector3(0, 1, 0), (step * Math.PI / 180));
      //this.AnimationCreatorService.OnRotationChange(this.AnimationService.currentCamera.parent!);
      this.AnimationCreatorService.OnCameraChange(this.SceneUtilsService.currentCamera);
    }
    // this.AnimationService.orbit.enabled = true;
  }

  CancelClick(event: MouseEvent) {
    this.container.style.visibility = "hidden";
    this.show = false;
    this.AnimationService.dialogShow = false;
  }
  AcceptClick(event: MouseEvent) {
    this.container.style.visibility = "hidden";
    this.show = false;
    this.AnimationService.dialogShow = false;
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
