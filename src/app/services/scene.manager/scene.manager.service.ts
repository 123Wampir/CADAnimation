import { Injectable } from '@angular/core';
import THREE = require('three');
import { SceneUtilsService } from '../utils/scene.utils.service';
import * as AnimationModel from 'src/app/shared/animation.model';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

@Injectable({
  providedIn: 'root'
})
export class SceneManagerService {

  id: number = 0;
  constructor(public SceneUtilsService: SceneUtilsService) { }


  AddDirectionalLight(name?: string): THREE.DirectionalLight {
    let light = new THREE.DirectionalLight(0xffffff, 2.2);
    name != undefined ? light.name = name : light.name = light.type + `_${++this.id}`;
    let lightHelper = new THREE.DirectionalLightHelper(light, 10, light.color);
    light.add(lightHelper);
    lightHelper.matrixWorld = light.matrixWorld;
    lightHelper.children[0].onBeforeRender = function () {
      lightHelper.update();
    }
    let cameraHelper = new THREE.CameraHelper(light.shadow.camera);
    cameraHelper.visible = false;
    light.add(cameraHelper);
    this.SceneUtilsService.lightGroup.add(light);
    this.SceneUtilsService.Select(this.SceneUtilsService.targetArray, light, false);
    let track = AnimationModel.FindKeyframeTrack(this.SceneUtilsService.AnimationService.timeLine, this.SceneUtilsService.lightGroup.name);
    this.SceneUtilsService.AnimationService.CreateTreeViewElement(light, track);
    AnimationModel.GetArrayTimeLine(this.SceneUtilsService.AnimationService.timeLine);
    return light;
  }
  AddPointLight(name?: string): THREE.PointLight {
    let light = new THREE.PointLight(0xffffff, 2.2, 10000);
    name != undefined ? light.name = name : light.name = light.type + `_${++this.id}`;
    let lightHelper = new THREE.PointLightHelper(light, 5, light.color);
    lightHelper.matrixWorld = light.matrixWorld;
    light.add(lightHelper);
    this.SceneUtilsService.lightGroup.add(light);
    this.SceneUtilsService.Select(this.SceneUtilsService.targetArray, light, false);
    let track = AnimationModel.FindKeyframeTrack(this.SceneUtilsService.AnimationService.timeLine, this.SceneUtilsService.lightGroup.name);
    this.SceneUtilsService.AnimationService.CreateTreeViewElement(light, track);
    AnimationModel.GetArrayTimeLine(this.SceneUtilsService.AnimationService.timeLine);
    return light;
  }
  AddSpotLight(name?: string): THREE.SpotLight {
    let light = new THREE.SpotLight(0xffffff, 2.2, 0, 0.5, 1);
    name != undefined ? light.name = name : light.name = light.type + `_${++this.id}`;
    let lightHelper = new THREE.SpotLightHelper(light, light.color);
    lightHelper.matrixWorld = light.matrixWorld;
    lightHelper.children[0].onBeforeRender = function () {
      lightHelper.update();
    }
    light.add(lightHelper);
    this.SceneUtilsService.lightGroup.add(light);
    this.SceneUtilsService.Select(this.SceneUtilsService.targetArray, light, false);
    let track = AnimationModel.FindKeyframeTrack(this.SceneUtilsService.AnimationService.timeLine, this.SceneUtilsService.lightGroup.name);
    this.SceneUtilsService.AnimationService.CreateTreeViewElement(light, track);
    AnimationModel.GetArrayTimeLine(this.SceneUtilsService.AnimationService.timeLine);
    return light;
  }

  AddAnnotation(name?: string): CSS2DObject {
    let annDiv = this.SceneUtilsService.angRenderer.createElement('div');
    this.SceneUtilsService.angRenderer.addClass(annDiv, "annotation-container");
    annDiv.innerText = "Text";
    let annotation = new CSS2DObject(annDiv);
    annotation.type = "Annotation";
    name != undefined ? annotation.name = name : annotation.name = `Annotation_${++this.id}`;
    this.SceneUtilsService.annotationGroup.add(annotation);
    annotation.position.set(10, -10, 30);
    let pts = [];
    annotation.updateMatrixWorld(true);
    pts.push(annotation.worldToLocal(new THREE.Vector3(0)));
    pts.push(new THREE.Vector3(0));
    let geom = new THREE.BufferGeometry().setFromPoints(pts);
    let mat = new THREE.LineBasicMaterial({ color: 0x000000 });
    let line = new THREE.Line(geom, mat);
    line.userData = { target: line };
    line.type = "Ignore";
    line.onAfterRender = function () {
      this.updateMatrixWorld(true);
      let vec!: THREE.Vector3;
      let pos = new THREE.Vector3().setFromMatrixPosition(this.userData['target'].matrixWorld);
      vec = this.worldToLocal(pos);
      let points = [];
      points.push(vec);
      points.push(new THREE.Vector3(0));
      this.geometry.setFromPoints(points);
      this.geometry.attributes['position'].needsUpdate = true;
    }
    annotation.add(line);
    this.SceneUtilsService.Select(this.SceneUtilsService.targetArray, annotation, false);
    let track = AnimationModel.FindKeyframeTrack(this.SceneUtilsService.AnimationService.timeLine, this.SceneUtilsService.annotationGroup.name);
    this.SceneUtilsService.AnimationService.CreateTreeViewElement(annotation, track);
    AnimationModel.GetArrayTimeLine(this.SceneUtilsService.AnimationService.timeLine);
    return annotation;
  }

  AddAxis(name?: string): THREE.Line {
    let pt = [new THREE.Vector3(0), new THREE.Vector3(0, 0, 10)];
    let geom = new THREE.BufferGeometry().setFromPoints(pt);
    let mat = new THREE.LineBasicMaterial({ color: 0x0000FF });
    let line = new THREE.Line(geom, mat);
    this.SceneUtilsService.scene.add(line);
    this.SceneUtilsService.axisArray.push(line);
    name != undefined ? line.name = name : line.name = `Axis_${++this.id}`;
    line.type = "Axis";
    line.userData['direction'] = new THREE.Vector3(0);
    line.userData['objects'] = new Array<THREE.Object3D>(0);
    line.userData['angle'] = 0;
    line.userData['oldAngle'] = 0;
    let scope = this;
    line.onAfterRender = function (renderer, scene, camera, geometry) {
      let offset = Number(this.userData['angle'].toFixed(3)) - Number(this.userData['oldAngle'].toFixed(3));
      if (offset != 0) {
        this.updateMatrixWorld(true);
        let axisPos = new THREE.Vector3().setFromMatrixPosition(this.matrixWorld);
        let direction: THREE.Vector3 = (this as THREE.Line).userData['direction'];
        let dir = direction.clone();
        let q = new THREE.Quaternion().setFromRotationMatrix(this.matrixWorld);
        dir.applyQuaternion(q);
        dir.normalize();
        let globalQ = scope.SceneUtilsService.model.quaternion.clone().invert();
        (this.userData['objects'] as Array<THREE.Object3D>).forEach(item => {
          item.updateMatrixWorld(true);
          let pos = new THREE.Vector3().setFromMatrixPosition(item.matrixWorld);
          let diff = pos.clone().sub(axisPos!);
          diff.applyAxisAngle(dir, offset * Math.PI / 180);
          diff.add(axisPos!);
          item.rotateOnWorldAxis(dir.clone().applyQuaternion(globalQ), offset * Math.PI / 180);
          diff.applyQuaternion(globalQ);
          item.position.set(diff.x, diff.y, diff.z);
          item.updateMatrixWorld(true);
        })
        this.updateMatrixWorld(true);
      }
      this.userData['oldAngle'] = this.userData['angle'];
    }

    this.SceneUtilsService.Select(this.SceneUtilsService.targetArray, line, false);
    let track = AnimationModel.FindKeyframeTrack(this.SceneUtilsService.AnimationService.timeLine, this.SceneUtilsService.axisGroup.name);
    this.SceneUtilsService.AnimationService.CreateTreeViewElement(line, track);
    AnimationModel.GetArrayTimeLine(this.SceneUtilsService.AnimationService.timeLine);
    return line;
  }

  DeleteObject(obj: any) {
    if (obj != undefined) {
      if (obj.type.includes("Light")) {
        let light = obj as THREE.Light;
        light.removeFromParent();
        light.dispose();
        let track = this.SceneUtilsService.AnimationService.timeLine.tracks.find(item => item.name == light.name);
        if (track != undefined)
          this.SceneUtilsService.AnimationService.DeleteTrack(track);
        let i = this.SceneUtilsService.AnimationService.mixers.findIndex(mixer => mixer.getRoot() == light);
        if (i != -1)
          this.SceneUtilsService.AnimationService.mixers.splice(i, 1);
      }
      else if (obj.type == "Annotation") {
        let css2d = obj as CSS2DObject;
        css2d.removeFromParent();
        (css2d.children[0] as THREE.Line).geometry.dispose();
        (css2d.children[0] as any).material.dispose();
        css2d.clear();
        let track = this.SceneUtilsService.AnimationService.timeLine.tracks.find(item => item.name == css2d.name);
        if (track != undefined)
          this.SceneUtilsService.AnimationService.DeleteTrack(track);
        let i = this.SceneUtilsService.AnimationService.mixers.findIndex(mixer => mixer.getRoot() == css2d);
        if (i != -1)
          this.SceneUtilsService.AnimationService.mixers.splice(i, 1);
      }
      else if (obj.type == "Axis") {
        let axis = obj as THREE.Line;
        axis.removeFromParent();
        axis.geometry.dispose();
        (axis.material as THREE.Material).dispose();
        let index = this.SceneUtilsService.axisArray.findIndex(item => item == axis);
        if (index != -1) {
          this.SceneUtilsService.axisArray.splice(index, 1);
        }
        console.log(this.SceneUtilsService.axisArray);
        let track = this.SceneUtilsService.AnimationService.timeLine.tracks.find(item => item.name == axis.name);
        if (track != undefined)
          this.SceneUtilsService.AnimationService.DeleteTrack(track);
        let i = this.SceneUtilsService.AnimationService.mixers.findIndex(mixer => mixer.getRoot() == axis);
        if (i != -1)
          this.SceneUtilsService.AnimationService.mixers.splice(i, 1);
      }
      console.log(obj);
    }
  }
}
