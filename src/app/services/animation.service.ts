import { Injectable } from '@angular/core';
import { TimelineModel } from '../shared/animation.model';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {

  constructor() { }
  currentTime = 0;
  play: boolean = false;
  stop: boolean = false;
  selectionChange: boolean = false;
  CTRLPressed: boolean = false;
  scene!: THREE.Scene;
  selected: THREE.Object3D[] = [];
  actions: THREE.AnimationAction[] = [];
  timeLine!: TimelineModel;

  CreateKeyframe() {
    if (this.selected.length != 0) {
      if (this.selected.length == 1) {

      }
      else {
        //Если массив деталей
      }
    }
  }

  ClearSelection() {
    if (this.selected.length != 0) {
      let arr: any[] = [];
      this.selected.forEach(item => {
        //this.FindMeshes(item, arr);
        let mesh = item as any;
        mesh.material.emissive.set(0x000000);
      })
      this.selected = [];
    }
    this.selectionChange = !this.selectionChange;
  }
  Select(obj: any, CTRLPressed: boolean) {
    if (!CTRLPressed) {
      this.selectionChange = !this.selectionChange;
      this.ClearSelection();
    }
    if (obj.type == "Mesh") {
      obj.material.emissive.set(0x004400);
      this.selected.push(obj);
    }
    else {
      if (obj.type == "Object3D") {
        let arr: any[] = [];
        this.FindMeshes(obj, arr);
        arr.forEach(mesh => {
          mesh.material.emissive.set(0x004400);
          this.selected.push(mesh);
        })
      }
    }
    this.selectionChange = !this.selectionChange;
  }
  FindMeshes(obj: THREE.Object3D, meshes: any[]) {
    if (obj.children.length != 0) {
      for (let item of obj.children) {
        if (item.type == "Object3D") {
          this.FindMeshes(item, meshes)
        }
        else {
          if (item.type == "Mesh") {
            meshes.push(item);
            this.FindMeshes(item, meshes)
          }
        }
      }
    }
  }
}
