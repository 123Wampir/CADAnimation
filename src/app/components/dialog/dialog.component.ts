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


  RotateOnAxis(id: string) {
    // let axis = this.SceneUtilsService.axisGroup.find(item => item.id == Number.parseInt(id));
    // if (axis != undefined) {
    //   axis.updateWorldMatrix(true, true);
    //   let axisPos = new THREE.Vector3().setFromMatrixPosition(axis.matrixWorld);
    //   let direction: THREE.Vector3 = (axis as THREE.Line).userData['direction'];
    //   let dir = direction.clone();
    //   let q = new THREE.Quaternion().setFromRotationMatrix(axis.matrixWorld);
    //   dir.applyQuaternion(q);
    //   dir.normalize();
    //   console.log(q, dir);
    //   let rot = dir.clone().multiplyScalar(this.rotAngle * Math.PI / 180);
    //   console.log(rot);
    //   this.SceneUtilsService.selected.forEach(item => {
    //     item.updateMatrixWorld(true);
    //     let pos = new THREE.Vector3().setFromMatrixPosition(item.matrixWorld);
    //     let diff = pos.clone().sub(axisPos!);
    //     diff.applyAxisAngle(dir, this.rotAngle * Math.PI / 180);
    //     diff.add(axisPos!);
    //     item.position.set(diff.x, diff.y, diff.z);
    //     item.rotateOnWorldAxis(dir, this.rotAngle * Math.PI / 180)
    //     //how to rotate around axis
    //   })
    // }
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
