import { Component, ElementRef, ViewChild } from '@angular/core';
import { AnimationService } from 'src/app/services/animation/animation.service';
import { SceneManagerService } from 'src/app/services/scene.manager/scene.manager.service';
import { SceneUtilsService } from 'src/app/services/utils/scene.utils.service';

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
  OnSceneColorChange(event: Event) {
    let e = event as any;
    this.SceneUtilsService.renderer.setClearColor(e.target.value);
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

  SetTheme(type: number) {
    switch (type) {
      case 0:
        document.body.style.setProperty('--main-color', 'ghostwhite');
        document.body.style.setProperty('--second-color', 'lightgray');
        document.body.style.setProperty('--third-color', 'gray');
        document.body.style.setProperty('--text-color', 'black');
        document.body.style.setProperty('--invert', '0');
        break;
      case 1:
        document.body.style.setProperty('--main-color', '#333');
        document.body.style.setProperty('--second-color', 'lightgray');
        document.body.style.setProperty('--third-color', 'gray');
        document.body.style.setProperty('--text-color', 'ghostwhite');
        document.body.style.setProperty('--invert', '1');
        break;
    }
  }
}
