import { Component, ElementRef, ViewChild } from '@angular/core';
import { AnimationService } from 'src/app/services/animation/animation.service';
import { SceneManagerService } from 'src/app/services/scene.manager/scene.manager.service';
import { SceneUtilsService } from 'src/app/services/utils/scene.utils.service';
import THREE = require('three');

@Component({
  selector: 'app-menubar',
  templateUrl: './menubar.component.html',
  styleUrls: ['./menubar.component.css']
})
export class MenubarComponent {
  posX = 0;
  posY = 0;
  @ViewChild('file') fileRef!: ElementRef;
  get file(): HTMLCanvasElement {
    return this.fileRef.nativeElement;
  }
  constructor(public SceneUtilsService: SceneUtilsService,
    public AnimationService: AnimationService,
    public SceneManagerService: SceneManagerService) { }
  NewProject() {
    // this.AnimationService.ClearAnimation();
    this.SceneUtilsService.ClearScene();
  }
  SetZeroPlaneGrid(event: Event) {
    let e = event?.target as any;
    this.SceneUtilsService.zeroPlane.children[0].visible = e.checked;
  }
  SetReflection(event: Event) {
    let e = event?.target as any;
    this.SceneUtilsService.zeroPlane.children[1].visible = e.checked;
  }
  OnSceneColorChange(event: Event) {
    let color: THREE.Color = new THREE.Color((event as any).target.value);
    let target: any = {};
    color.getHSL(target);
    let l = Math.abs(Math.round(target.l) - 1);
    this.SceneUtilsService.backgroundColor = color;
    this.SceneUtilsService.renderer.setClearColor(color);
    this.SceneUtilsService.scene.fog!.color = color;
    (this.SceneUtilsService.selectBox.material as THREE.LineBasicMaterial).color.setHSL(0, 0, l);
  }
  OnGroundColorChange(event: Event) {
    let color: THREE.Color = new THREE.Color((event as any).target.value);
    (this.SceneUtilsService.zeroPlane.material as THREE.MeshBasicMaterial).color = color;
  }
  SetSceneFog(event: Event) {
    let n = (event as any).target.value / 10000;
    (this.SceneUtilsService.scene.fog as THREE.FogExp2).density = n;
  }
  SetClipping(event: Event) {
    let e = event?.target as any;
    this.SceneUtilsService.EnableClipping(e.checked);
  }
  ShowPlaneX(event: Event) {
    (this.SceneUtilsService.planeHelpers.children[0] as any).children[0].material.visible = (event.target as any).checked;
    (this.SceneUtilsService.planeHelpers.children[0] as any).material.visible = (event.target as any).checked;
  }
  ShowPlaneY(event: Event) {
    (this.SceneUtilsService.planeHelpers.children[1] as any).children[0].material.visible = (event.target as any).checked;
    (this.SceneUtilsService.planeHelpers.children[1] as any).material.visible = (event.target as any).checked;
  }
  ShowPlaneZ(event: Event) {
    (this.SceneUtilsService.planeHelpers.children[2] as any).children[0].material.visible = (event.target as any).checked;
    (this.SceneUtilsService.planeHelpers.children[2] as any).material.visible = (event.target as any).checked;
  }
  SetWireframe(event: Event) {
    let arr: any[] = [];
    this.SceneUtilsService.FindMeshes(this.SceneUtilsService.model, arr);
    arr.forEach(mesh => {
      mesh.material.wireframe = this.SceneUtilsService.wireframe;
    })
  }
  CreateSnapshot() {
    this.SceneUtilsService.dialogType = "snapshot";
    this.SceneUtilsService.dialogShow = true;
  }
  SetEnviroment() {
    this.SceneUtilsService.dialogType = "enviroment";
    this.SceneUtilsService.dialogShow = true;
  }
  SetTheme(type: number) {
    switch (type) {
      case 0:
        document.body.style.setProperty('--main-color', 'ghostwhite');
        document.body.style.setProperty('--second-color', 'gray');
        document.body.style.setProperty('--third-color', '#eee');
        document.body.style.setProperty('--text-color', 'black');
        document.body.style.setProperty('--invert', '0');
        break;
      case 1:
        document.body.style.setProperty('--main-color', '#333');
        document.body.style.setProperty('--second-color', '#222');
        document.body.style.setProperty('--third-color', 'gray');
        document.body.style.setProperty('--text-color', 'ghostwhite');
        document.body.style.setProperty('--invert', '1');
        break;
      case 2:
        document.body.style.setProperty('--main-color', '#fb5');
        document.body.style.setProperty('--second-color', '#b85');
        document.body.style.setProperty('--third-color', '#ec7');
        document.body.style.setProperty('--text-color', 'black');
        document.body.style.setProperty('--invert', '0');
        break;
      case 3:
        document.body.style.setProperty('--main-color', '#1a1a1d');
        document.body.style.setProperty('--second-color', '#6f2232');
        document.body.style.setProperty('--third-color', '#6a2232');
        document.body.style.setProperty('--text-color', '#cc073f');
        document.body.style.setProperty('--invert', '1');
        break;
    }
  }
}
