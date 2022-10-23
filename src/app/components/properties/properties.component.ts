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
  propertiesObject!: any;
  expanded = true;
  width = 300;
  height = 300;
  constructor(public AnimationService: AnimationService) { }

  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes["selected"] != undefined) {
      // console.log(changes["selected"]);
      if (this.AnimationService.selected.length != 0) {
        if (this.AnimationService.selected.length == 1) {
          this.propertiesObject = this.AnimationService.selected[0];
        }
        else {
        }
      }
      else {
        this.propertiesObject = undefined;
      }
    }
    if (changes["curTime"] != undefined) {
      // console.log(this.AnimationService.currentTime);
      if (this.propertiesObject != undefined) {
        let track = FindKeyframeTrack(this.AnimationService.timeLine, this.propertiesObject.name);
        let keyframe = FindKeyframeByTime(track, this.curTime);
        if (keyframe != undefined) {
          console.log(keyframe);
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

  // OnPositionChange(event: Event) {
  //   this.keyframe.position = this.propertiesObject.position;
  //   let track = this.keyframe.clip.tracks.find(track => (track.name == ".position"))
  //   if (track != undefined) {
  //     for (let i = 0; i < track.times.length; i++) {
  //       if (track.times[i] == this.keyframe.time) {
  //         track.values[i * 3] = this.position.x;
  //         track.values[i * 3 + 1] = this.position.y;
  //         track.values[i * 3 + 2] = this.position.z;
  //         console.log(track)
  //       }
  //     }
  //   }
  //   else {
  //     // Создать трек
  //   }
  //   this.keyframe.clip.resetDuration()
  // }
  // OnOpacityChange($event: Event) {
  //   this.keyframe.opacity = this.opacity;
  //   this.keyframe.clip.tracks.forEach(track => {
  //     if (track.name == ".material.opacity") {
  //       for (let i = 0; i < track.times.length; i++) {
  //         if (track.times[i] == this.keyframe.time) {
  //           track.values[i] = this.opacity;
  //           console.log(track)
  //         }
  //       }
  //     }
  //   })
  //   this.keyframe.clip.resetDuration()
  // }
  // OnVisibleChange($event: Event) {
  //   this.keyframe.visible = this.visible;
  //   this.keyframe.clip.tracks.forEach((track, index) => {
  //     if (track.name == ".visible") {
  //       for (let i = 0; i < track.times.length; i++) {
  //         if (track.times[i] == this.keyframe.time) {
  //           let newTrack = new THREE.BooleanKeyframeTrack("newTrack", [0], [this.visible]);
  //           console.log(track.values[i]);
  //           console.log(this.visible);
  //           track.values[i] = newTrack.values[0];
  //           console.log(track.values[i]);
  //         }
  //       }
  //     }
  //   })
  //   this.keyframe.clip.resetDuration()
  // }

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
