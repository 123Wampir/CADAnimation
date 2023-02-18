import { Injectable } from '@angular/core';
import THREE = require('three');
import { SceneUtilsService } from '../utils/scene.utils.service';
import * as AnimationModel from 'src/app/shared/animation.model';

@Injectable({
  providedIn: 'root'
})
export class SceneManagerService {

  constructor(public SceneUtilsService: SceneUtilsService) { }


  AddDirectionalLight(): THREE.DirectionalLight {
    let light = new THREE.DirectionalLight(0xffffff, 2.2);
    light.name = light.type + `_${this.SceneUtilsService.lightGroup.children.length}`;
    let lightHelper = new THREE.DirectionalLightHelper(light, 10, light.color);
    lightHelper.matrixWorld = light.matrixWorld;
    light.add(lightHelper);
    let cameraHelper = new THREE.CameraHelper(light.shadow.camera);
    light.add(cameraHelper);
    cameraHelper.matrixWorld = light.shadow.camera.matrixWorld;
    this.SceneUtilsService.lightGroup.add(light);
    this.SceneUtilsService.Select(light, false);
    let track = AnimationModel.FindKeyframeTrack(this.SceneUtilsService.AnimationService.timeLine, this.SceneUtilsService.lightGroup.name);
    this.SceneUtilsService.AnimationService.CreateTreeViewElement(light, track);
    AnimationModel.GetArrayTimeLine(this.SceneUtilsService.AnimationService.timeLine);
    return light;
  }
  AddPointLight(): THREE.PointLight {
    let light = new THREE.PointLight(0xffffff, 2.2, 10000);
    light.name = light.type + `_${this.SceneUtilsService.lightGroup.children.length}`;
    let lightHelper = new THREE.PointLightHelper(light, 5, light.color);
    lightHelper.matrixWorld = light.matrixWorld;
    light.add(lightHelper);
    // let cameraHelper = new THREE.CameraHelper(light.shadow.camera);
    // light.add(cameraHelper);
    // cameraHelper.matrixWorld = light.shadow.camera.matrixWorld;
    light.shadow.bias = - 0.005;
    this.SceneUtilsService.lightGroup.add(light);
    this.SceneUtilsService.Select(light, false);
    let track = AnimationModel.FindKeyframeTrack(this.SceneUtilsService.AnimationService.timeLine, this.SceneUtilsService.lightGroup.name);
    this.SceneUtilsService.AnimationService.CreateTreeViewElement(light, track);
    AnimationModel.GetArrayTimeLine(this.SceneUtilsService.AnimationService.timeLine);
    return light;
  }
}
