import { Injectable } from '@angular/core';
import { AnimationService } from './animation.service';
import * as AnimationModel from 'src/app/shared/animation.model';
import THREE = require('three');
import { SceneUtilsService } from '../utils/scene.utils.service';

@Injectable({
  providedIn: 'root'
})
export class AnimationCreatorService {
  constructor(private AnimationService: AnimationService, private SceneUtilsService: SceneUtilsService) { }

  OnPositionChange(obj: THREE.Object3D) {
    if (obj != undefined) {
      this.SceneUtilsService.selected.forEach((item, index) => {
        let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, item.name);
        let action = AnimationModel.FindActionByType(track, ".position");
        if (action == undefined) {
          action = this.AnimationService.CreateAction(track, ".position");
        }
        let keyframe = AnimationModel.FindKeyframeByTime(action, this.AnimationService.currentTime);
        let position!: THREE.Vector3;
        if (obj.type != "Group") {
          position = obj.position;
        }
        else {
          let q = new THREE.Quaternion();
          item.getWorldQuaternion(q);
          position = obj.position.clone().applyQuaternion(q.invert()).add(this.SceneUtilsService.startPos[index]);
        }
        if (keyframe != undefined) {
          keyframe.value = position.toArray();
          this.AnimationService.ChangeKeyframe(keyframe);
        }
        else {
          this.AnimationService.CreateKeyframe(action, ".position", this.AnimationService.currentTime, position.toArray());
        }
      })
      if (obj.type == "Group") {
        let vec = this.SceneUtilsService.group.position;
        obj.position.set(vec.x, vec.y, vec.z)
      }
    }
  }
  OnRotationChange(obj: THREE.Object3D) {
    if (obj != undefined) {
      if (obj.type != "Group") {
        let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
        let action = AnimationModel.FindActionByType(track, ".quaternion");
        if (action == undefined) {
          action = this.AnimationService.CreateAction(track, ".quaternion");
        }
        let keyframe = AnimationModel.FindKeyframeByTime(action, this.AnimationService.currentTime);
        if (keyframe != undefined) {
          keyframe.value = obj.quaternion.toArray();
          this.AnimationService.ChangeKeyframe(keyframe);
        }
        else {
          this.AnimationService.CreateKeyframe(action, ".quaternion", this.AnimationService.currentTime, obj.quaternion.toArray());
        }
      }
    }
  }
  OnOpacityChange(obj: any) {
    if (obj != undefined) {
      this.SceneUtilsService.selected.forEach((item) => {
        let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, item.name);
        let action = AnimationModel.FindActionByType(track, ".material.opacity");
        if (action == undefined) {
          action = this.AnimationService.CreateAction(track, ".material.opacity");
        }
        let keyframe = AnimationModel.FindKeyframeByTime(action, this.AnimationService.currentTime);
        if (keyframe != undefined) {
          keyframe.value = [obj.material.opacity];
          this.AnimationService.ChangeKeyframe(keyframe);
        }
        else {
          this.AnimationService.CreateKeyframe(action, ".material.opacity", this.AnimationService.currentTime, [obj.material.opacity]);
        }
      })
    }
  }
  OnVisibleChange(obj: THREE.Object3D) {
    if (obj != undefined) {
      this.SceneUtilsService.selected.forEach((item, index) => {
        let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, item.name);
        let action = AnimationModel.FindActionByType(track, ".visible");
        if (action == undefined) {
          action = this.AnimationService.CreateAction(track, ".visible");
        }
        let keyframe = AnimationModel.FindKeyframeByTime(action, this.AnimationService.currentTime);
        // console.log(keyframe);
        if (keyframe != undefined) {
          keyframe.value = [obj.visible];
          this.AnimationService.ChangeKeyframe(keyframe);
        }
        else {
          this.AnimationService.CreateKeyframe(action, ".visible", this.AnimationService.currentTime, [obj.visible]);
        }
      })
    }
  }
  OnColorChange(obj: any, hex: string) {
    obj.color.set(hex);
    if (obj.children.length != 0)
      obj.children[0].update();
    let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
    let action = AnimationModel.FindActionByType(track, ".color");
    if (action == undefined) {
      action = this.AnimationService.CreateAction(track, ".color");
    }
    let keyframe = AnimationModel.FindKeyframeByTime(action, this.AnimationService.currentTime);
    if (keyframe != undefined) {
      keyframe.value = obj.color.toArray();
      this.AnimationService.ChangeKeyframe(keyframe);
    }
    else {
      this.AnimationService.CreateKeyframe(action, ".color", this.AnimationService.currentTime, obj.color.toArray());
    }
  }
  OnIntencityChange(obj: any) {
    if (obj != undefined) {
      let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
      let action = AnimationModel.FindActionByType(track, ".intensity");
      if (action == undefined) {
        action = this.AnimationService.CreateAction(track, ".intensity");
      }
      let keyframe = AnimationModel.FindKeyframeByTime(action, this.AnimationService.currentTime);
      if (keyframe != undefined) {
        keyframe.value = [obj.intensity];
        this.AnimationService.ChangeKeyframe(keyframe);
      }
      else {
        this.AnimationService.CreateKeyframe(action, ".intensity", this.AnimationService.currentTime, [obj.intensity]);
      }
    }
  }
  OnLightAngleChange(obj: any) {
    if (obj != undefined) {
      let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
      let action = AnimationModel.FindActionByType(track, ".angle");
      if (action == undefined) {
        action = this.AnimationService.CreateAction(track, ".angle");
      }
      let keyframe = AnimationModel.FindKeyframeByTime(action, this.AnimationService.currentTime);
      if (keyframe != undefined) {
        keyframe.value = [obj.angle];
        this.AnimationService.ChangeKeyframe(keyframe);
      }
      else {
        this.AnimationService.CreateKeyframe(action, ".angle", this.AnimationService.currentTime, [obj.angle]);
      }
    }
  }
  OnConstantChange(obj: any) {
    if (obj != undefined) {
      let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
      let action = AnimationModel.FindActionByType(track, ".plane.constant");
      if (action == undefined) {
        action = this.AnimationService.CreateAction(track, ".plane.constant");
      }
      let keyframe = AnimationModel.FindKeyframeByTime(action, this.AnimationService.currentTime);
      if (keyframe != undefined) {
        keyframe.value = [obj.plane.constant];
        this.AnimationService.ChangeKeyframe(keyframe);
      }
      else {
        this.AnimationService.CreateKeyframe(action, ".plane.constant", this.AnimationService.currentTime, [obj.plane.constant]);
      }
    }
  }
  OnTextChange(obj: any) {
    if (obj != undefined) {
      let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
      let action = AnimationModel.FindActionByType(track, ".element.innerHTML");
      if (action == undefined) {
        action = this.AnimationService.CreateAction(track, ".element.innerHTML");
      }
      let keyframe = AnimationModel.FindKeyframeByTime(action, this.AnimationService.currentTime);
      if (keyframe != undefined) {
        keyframe.value = [obj.element.innerHTML];
        this.AnimationService.ChangeKeyframe(keyframe);
      }
      else {
        this.AnimationService.CreateKeyframe(action, ".element.innerHTML", this.AnimationService.currentTime, [obj.element.innerHTML]);
      }
    }
  }
  OnAxisAngleChange(obj: any) {
    if (obj != undefined) {
      let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
      let action = AnimationModel.FindActionByType(track, ".userData.angle");
      if (action == undefined) {
        action = this.AnimationService.CreateAction(track, ".userData.angle");
      }
      let keyframe = AnimationModel.FindKeyframeByTime(action, this.AnimationService.currentTime);
      if (keyframe != undefined) {
        keyframe.value = [obj.userData.angle];
        this.AnimationService.ChangeKeyframe(keyframe);
      }
      else {
        this.AnimationService.CreateKeyframe(action, ".userData.angle", this.AnimationService.currentTime, [obj.userData.angle]);
      }
    }
  }
  DeleteKeyframe(obj: THREE.Object3D) {
    // if (obj != undefined) {
    //   if (this.AnimationService.selected.length == 1) {
    //     let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
    //     track.keyframes.find((key, index) => {
    //       if (key == this.AnimationService.selectedKeyframe) {
    //         track.keyframes.splice(index, 1);
    //       }
    //     })
    //     this.AnimationService.DeleteKeyframe(this.AnimationService.selectedKeyframe)
    //   }
    // }
  }
  OnCameraChange(obj: THREE.Object3D) {
    let pos = obj.position.clone();
    this.OnRotationChange(obj);
    obj.position.set(pos.x, pos.y, pos.z);
    this.OnPositionChange(obj);
  }
}
