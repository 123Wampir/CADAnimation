import { Injectable } from '@angular/core';
import { AnimationService } from './animation.service';
import * as AnimationModel from 'src/app/shared/animation.model';
import THREE = require('three');

@Injectable({
  providedIn: 'root'
})
export class AnimationCreatorService {

  constructor(private AnimationService: AnimationService) { }

  OnPositionChange(obj: THREE.Object3D) {
    if (obj != undefined) {
      if (obj.type != "Group") {
        let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
        let keyframe = AnimationModel.FindKeyframeByTime(track, this.AnimationService.currentTime);
        if (keyframe != undefined) {
          this.AnimationService.ChangeKeyframe(keyframe, ".position", obj.position);
        }
        else {
          this.AnimationService.CreateKeyframe(track, this.AnimationService.currentTime, obj, ".position", obj.position);
        }
      }
      else if (obj.type == "Group") {
        this.AnimationService.selected.forEach((item, index) => {
          let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, item.name);
          let keyframe = AnimationModel.FindKeyframeByTime(track, this.AnimationService.currentTime);
          let q = new THREE.Quaternion();
          item.getWorldQuaternion(q);
          let position = obj.position.clone().applyQuaternion(q.invert()).add(this.AnimationService.startPos[index]);
          if (keyframe != undefined) {
            this.AnimationService.ChangeKeyframe(keyframe, ".position", position);
          }
          else {
            this.AnimationService.CreateKeyframe(track, this.AnimationService.currentTime, item, ".position", position);
          }
        })
        let vec = this.AnimationService.group.position;
        obj.position.set(vec.x, vec.y, vec.z)
      }
    }
  }
  OnRotationChange(obj: THREE.Object3D) {
    if (obj != undefined) {
      if (obj.type != "Group") {
        let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
        let keyframe = AnimationModel.FindKeyframeByTime(track, this.AnimationService.currentTime);
        if (keyframe != undefined) {
          this.AnimationService.ChangeKeyframe(keyframe, ".quaternion", obj.quaternion);
        }
        else {
          this.AnimationService.CreateKeyframe(track, this.AnimationService.currentTime, obj, ".quaternion", obj.quaternion);
        }
      }
      else if (obj.type == "Group") {
        this.AnimationService.selected.forEach((item, index) => {
          let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, item.name);
          let keyframe = AnimationModel.FindKeyframeByTime(track, this.AnimationService.currentTime);
          let q = new THREE.Quaternion();
          item.getWorldQuaternion(q);
          if (keyframe != undefined) {
            this.AnimationService.ChangeKeyframe(keyframe, ".quaternion", obj.quaternion);
          }
          else {
            this.AnimationService.CreateKeyframe(track, this.AnimationService.currentTime, item, ".quaternion", obj.quaternion);
          }
        })
        let quat = this.AnimationService.group.quaternion;
        obj.quaternion.set(quat.x, quat.y, quat.z, quat.w)
      }
    }
  }
  OnOpacityChange(obj: any) {
    if (obj != undefined) {
      if (obj.type != "Group") {
        let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
        let keyframe = AnimationModel.FindKeyframeByTime(track, this.AnimationService.currentTime);
        if (keyframe != undefined) {
          this.AnimationService.ChangeKeyframe(keyframe, ".material.opacity", obj.material.opacity);
        }
        else {
          this.AnimationService.CreateKeyframe(track, this.AnimationService.currentTime, obj, ".material.opacity", obj.material.opacity);
        }
      }
      else if (obj.type == "Group") {
        //console.log(this.AnimationService.selected);

        this.AnimationService.selected.forEach((item, index) => {
          let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, item.name);
          let keyframe = AnimationModel.FindKeyframeByTime(track, this.AnimationService.currentTime);
          // console.log(keyframe);
          if (keyframe != undefined) {
            this.AnimationService.ChangeKeyframe(keyframe, ".material.opacity", obj.material.opacity);
          }
          else {
            this.AnimationService.CreateKeyframe(track, this.AnimationService.currentTime, item, ".material.opacity", obj.material.opacity);
          }
        })
        obj.material.opacity = (this.AnimationService.group as any).material.opacity;
      }
    }
  }
  OnVisibleChange(obj: THREE.Object3D) {
    if (obj != undefined) {
      if (obj.type != "Group") {
        let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
        let keyframe = AnimationModel.FindKeyframeByTime(track, this.AnimationService.currentTime);
        if (keyframe != undefined) {
          this.AnimationService.ChangeKeyframe(keyframe, ".visible", obj.visible);
        }
        else {
          this.AnimationService.CreateKeyframe(track, this.AnimationService.currentTime, obj, ".visible", obj.visible);
        }
      }
      else if (obj.type == "Group") {
        //console.log(this.AnimationService.selected);

        this.AnimationService.selected.forEach((item, index) => {
          let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, item.name);
          let keyframe = AnimationModel.FindKeyframeByTime(track, this.AnimationService.currentTime);
          // console.log(keyframe);
          if (keyframe != undefined) {
            this.AnimationService.ChangeKeyframe(keyframe, ".visible", obj.visible);
          }
          else {
            this.AnimationService.CreateKeyframe(track, this.AnimationService.currentTime, item, ".visible", obj.visible);
          }
        })
        obj.visible = this.AnimationService.group.visible;
      }
    }
  }
  OnColorChange(obj: any, hex: string) {
    obj.color.set(hex);
    if (obj.children.length != 0)
      obj.children[0].update();
    console.log(obj.color);
    let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
    let keyframe = AnimationModel.FindKeyframeByTime(track, this.AnimationService.currentTime);
    if (keyframe != undefined) {
      this.AnimationService.ChangeKeyframe(keyframe, ".color", obj.color);
    }
    else {
      this.AnimationService.CreateKeyframe(track, this.AnimationService.currentTime, obj, ".color", obj.color);
    }
  }
  OnConstantChange(obj: any) {
    if (obj != undefined) {
      let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
      let keyframe = AnimationModel.FindKeyframeByTime(track, this.AnimationService.currentTime);
      if (keyframe != undefined) {
        this.AnimationService.ChangeKeyframe(keyframe, ".plane.constant", obj.plane.constant);
      }
      else {
        this.AnimationService.CreateKeyframe(track, this.AnimationService.currentTime, obj, ".plane.constant", obj.plane.constant);
      }
    }
  }
  DeleteKeyframe(obj: THREE.Object3D) {
    if (obj != undefined) {
      if (this.AnimationService.selected.length == 1) {
        let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, obj.name);
        track.keyframes.find((key, index) => {
          if (key == this.AnimationService.selectedKeyframe) {
            track.keyframes.splice(index, 1);
          }
        })
        this.AnimationService.DeleteKeyframe(this.AnimationService.selectedKeyframe)
      }
    }
  }
  OnCameraChange(obj: THREE.Object3D) {
    let pos = obj.position.clone();
    this.OnRotationChange(obj);
    obj.position.set(pos.x, pos.y, pos.z);
    this.OnPositionChange(obj);
  }
}
