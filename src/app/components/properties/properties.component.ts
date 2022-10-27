import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AnimationService } from 'src/app/services/animation.service';
import { FindKeyframeByTime, FindKeyframeTrack, KeyframeModel } from 'src/app/shared/animation.model';
import THREE = require('three');

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.css']
})
export class PropertiesComponent implements OnInit, OnChanges {

  @Input() curTime = 0;
  @Input() keyframe!: KeyframeModel;
  @Input() selected: boolean = false;
  @Input() transformed: boolean = false;
  propertiesObject!: any;
  expanded = true;
  group = false;
  width = 300;
  height = 300;
  opacity = 1;
  constructor(public AnimationService: AnimationService) { }

  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes["selected"] != undefined) {
      // console.log(changes["selected"]);
      if (this.AnimationService.selected.length != 0) {
        if (this.AnimationService.selected.length == 1) {
          this.group = false;
          this.propertiesObject = this.AnimationService.selected[0];
        }
        else {
          //console.log(this.AnimationService.selected);
          this.propertiesObject = new THREE.Mesh();
          // console.log(this.AnimationService.group);

          this.propertiesObject.type = "Group";
          this.propertiesObject.name = "Group";
          //console.log(this.propertiesObject);
          this.group = true;
        }
      }
      else {
        this.propertiesObject = undefined;
      }
    }
    if (changes["transformed"] != undefined) {
      this.OnPositionChange(new Event(""));
    }
    if (changes["curTime"] != undefined) {
      // console.log(this.AnimationService.currentTime);
      if (this.propertiesObject != undefined) {
        if (this.propertiesObject.type == "Mesh") {
          let track = FindKeyframeTrack(this.AnimationService.timeLine, this.propertiesObject.name);
          let keyframe = FindKeyframeByTime(track, this.curTime);
          if (keyframe != undefined) {
            this.AnimationService.selectedKeyframe = keyframe;
            // console.log(this.propertiesObject);
          }
          else { (this.AnimationService.selectedKeyframe as any) = undefined; }
        }
      }
    }
    // if (changes["keyframe"] != undefined)
    //   if (changes["keyframe"].currentValue != undefined) {
    //     if (this.keyframe.position != undefined)
    //       this.position = this.keyframe.position;
    //     if (this.keyframe.rotation != undefined)
    //       this.rotation = this.keyframe.rotation;
    //     if (this.keyframe.opacity != undefined)
    //       this.opacity = this.keyframe.opacity;
    //     if (this.keyframe.visible != undefined)
    //       this.visible = this.keyframe.visible;
    //   }
  }

  OnPositionChange(event: Event) {
    if (this.propertiesObject != undefined) {
      if (this.propertiesObject.type == "Mesh" || /(Light)/g.exec(this.propertiesObject.type) != undefined) {
        let track = FindKeyframeTrack(this.AnimationService.timeLine, this.propertiesObject.name);
        let keyframe = FindKeyframeByTime(track, this.curTime);
        if (keyframe != undefined) {
          this.AnimationService.ChangeKeyframe(keyframe, ".position", this.propertiesObject.position);
        }
        else {
          this.AnimationService.CreateKeyframe(track, this.curTime, this.propertiesObject, ".position", this.propertiesObject.position);
        }
      }
      else if (this.propertiesObject.type == "Group") {
        //console.log(this.AnimationService.selected);
        this.AnimationService.selected.forEach((item, index) => {
          let track = FindKeyframeTrack(this.AnimationService.timeLine, item.name);
          let keyframe = FindKeyframeByTime(track, this.curTime);
          // console.log(keyframe);
          let q = new THREE.Quaternion();
          item.getWorldQuaternion(q);
          let position = this.propertiesObject.position.clone().applyQuaternion(q.invert()).add(this.AnimationService.startPos[index]);
          if (keyframe != undefined) {
            this.AnimationService.ChangeKeyframe(keyframe, ".position", position);
          }
          else {
            this.AnimationService.CreateKeyframe(track, this.curTime, item, ".position", position);
          }
        })
        let vec = this.AnimationService.group.position;
        this.propertiesObject.position.set(vec.x, vec.y, vec.z)
      }
    }
  }
  OnRotationChange(event: Event) {
    if (this.propertiesObject != undefined) {
      if (this.propertiesObject.type == "Mesh" || /(Light)/g.exec(this.propertiesObject.type) != undefined) {
        let track = FindKeyframeTrack(this.AnimationService.timeLine, this.propertiesObject.name);
        let keyframe = FindKeyframeByTime(track, this.curTime);
        if (keyframe != undefined) {
          this.AnimationService.ChangeKeyframe(keyframe, ".quaternion", this.propertiesObject.quaternion);
        }
        else {
          this.AnimationService.CreateKeyframe(track, this.curTime, this.propertiesObject, ".quaternion", this.propertiesObject.quaternion);
        }
      }
      else if (this.propertiesObject.type == "Group") {
        //console.log(this.AnimationService.selected);
        this.AnimationService.selected.forEach((item, index) => {
          let track = FindKeyframeTrack(this.AnimationService.timeLine, item.name);
          let keyframe = FindKeyframeByTime(track, this.curTime);
          // console.log(keyframe);
          let q = new THREE.Quaternion();
          item.getWorldQuaternion(q);
          // let position = this.propertiesObject.position.clone().applyQuaternion(q.invert()).add(this.AnimationService.startPos[index]);
          if (keyframe != undefined) {
            this.AnimationService.ChangeKeyframe(keyframe, ".quaternion", this.propertiesObject.quaternion);
          }
          else {
            this.AnimationService.CreateKeyframe(track, this.curTime, item, ".quaternion", this.propertiesObject.quaternion);
          }
        })
        let quat = this.AnimationService.group.quaternion;
        this.propertiesObject.quaternion.set(quat.x, quat.y, quat.z, quat.w)
      }
    }
  }
  OnOpacityChange(event: Event) {
    if (this.propertiesObject != undefined) {
      if (this.propertiesObject.type == "Mesh" || /(Light)/g.exec(this.propertiesObject.type) != undefined) {
        let track = FindKeyframeTrack(this.AnimationService.timeLine, this.propertiesObject.name);
        let keyframe = FindKeyframeByTime(track, this.curTime);
        if (keyframe != undefined) {
          this.AnimationService.ChangeKeyframe(keyframe, ".material.opacity", this.propertiesObject.material.opacity);
        }
        else {
          this.AnimationService.CreateKeyframe(track, this.curTime, this.propertiesObject, ".material.opacity", this.propertiesObject.material.opacity);
        }
      }
      else if (this.propertiesObject.type == "Group") {
        //console.log(this.AnimationService.selected);

        this.AnimationService.selected.forEach((item, index) => {
          let track = FindKeyframeTrack(this.AnimationService.timeLine, item.name);
          let keyframe = FindKeyframeByTime(track, this.curTime);
          // console.log(keyframe);
          if (keyframe != undefined) {
            this.AnimationService.ChangeKeyframe(keyframe, ".material.opacity", this.propertiesObject.material.opacity);
          }
          else {
            this.AnimationService.CreateKeyframe(track, this.curTime, item, ".material.opacity", this.propertiesObject.material.opacity);
          }
        })
        this.propertiesObject.material.opacity = (this.AnimationService.group as any).material.opacity;
      }
    }
  }
  OnVisibleChange(event: Event) {
    if (this.propertiesObject != undefined) {
      if (this.propertiesObject.type == "Mesh" || /(Light)/g.exec(this.propertiesObject.type) != undefined) {
        let track = FindKeyframeTrack(this.AnimationService.timeLine, this.propertiesObject.name);
        let keyframe = FindKeyframeByTime(track, this.curTime);
        if (keyframe != undefined) {
          this.AnimationService.ChangeKeyframe(keyframe, ".visible", this.propertiesObject.visible);
        }
        else {
          this.AnimationService.CreateKeyframe(track, this.curTime, this.propertiesObject, ".visible", this.propertiesObject.visible);
        }
      }
      else if (this.propertiesObject.type == "Group") {
        //console.log(this.AnimationService.selected);

        this.AnimationService.selected.forEach((item, index) => {
          let track = FindKeyframeTrack(this.AnimationService.timeLine, item.name);
          let keyframe = FindKeyframeByTime(track, this.curTime);
          // console.log(keyframe);
          if (keyframe != undefined) {
            this.AnimationService.ChangeKeyframe(keyframe, ".visible", this.propertiesObject.visible);
          }
          else {
            this.AnimationService.CreateKeyframe(track, this.curTime, item, ".visible", this.propertiesObject.visible);
          }
        })
        this.propertiesObject.visible = this.AnimationService.group.visible;
      }
    }
  }

  OnExpandClick(event: MouseEvent) {
    let container = document.getElementById("container")!;
    if (container != undefined) {
      if (this.expanded) {
        container.style.width = "0";
        this.expanded = false;
      }
      else {
        container.style.width = `${this.width}px`;
        this.expanded = true;
      }
    }
  }
}
