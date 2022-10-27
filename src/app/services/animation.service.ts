import { Injectable, Renderer2 } from '@angular/core';
import THREE = require('three');
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import * as AnimationModel from 'src/app/shared/animation.model';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  constructor() { }
  currentTime = 0;
  play: boolean = false;
  stop: boolean = false;
  selectionChange: boolean = false;
  currentTimeChange: boolean = false;
  transformChange: boolean = false;
  CTRLPressed: boolean = false;

  scene!: THREE.Scene;
  group: THREE.Mesh = new THREE.Mesh();
  startPos: THREE.Vector3[] = [];
  selected: THREE.Object3D[] = [];
  selectedKeyframe!: AnimationModel.KeyframeModel;
  actions: THREE.AnimationAction[] = [];
  mixers: THREE.AnimationMixer[] = [];
  timeLine!: AnimationModel.TimelineModel;

  transform!: TransformControls;
  orbit!: OrbitControls;
  renderer!: Renderer2;

  CreateKeyframeDOM(track: AnimationModel.KeyframeTrackModel, keyframe: AnimationModel.KeyframeModel) {
    let trackline = track.DOMElement;
    let keyframeDOM = this.renderer.createElement("div");
    keyframe.DOMElement = keyframeDOM;
    this.renderer.addClass(keyframeDOM, "keyframe")
    this.renderer.setStyle(keyframeDOM, "left", `${keyframe.time * this.timeLine.scale}px`)
    this.renderer.setAttribute(keyframeDOM, "time", keyframe.time.toString())
    this.renderer.setAttribute(keyframeDOM, "part", track.name)
    this.renderer.appendChild(trackline, keyframeDOM)
    this.renderer.listen(keyframeDOM, "click", (event) => {
      let time = Number.parseFloat(event.target.attributes["time"].nodeValue);
      let name = event.target.attributes["part"].nodeValue;
      let track = AnimationModel.FindKeyframeTrack(this.timeLine, name);
      let keyframe = AnimationModel.FindKeyframeByTime(track, time);
      //console.log(keyframe);
      //this.AnimationService.selectedKeyframe = keyframe;
      this.currentTime = time;
      this.currentTimeChange = true;
    })

  }

  CreateKeyframe(track: AnimationModel.KeyframeTrackModel, time: number, obj: THREE.Object3D, type: string, value: any) {
    // console.log("create key");
    let clip: THREE.AnimationClip;
    if (obj.animations.length == 0) {
      clip = new THREE.AnimationClip(`${obj.name}`, -1, []);
      obj.animations.push(clip);
    }
    clip = obj.animations[0];
    // console.log(clip);
    let keyframe = AnimationModel.CreateKeyframe(time, track, clip);
    switch (type) {
      case ".position":
        keyframe.position = value;
        break;
      case ".quaternion":
        keyframe.quaternion = value;
        break;
      case ".material.opacity":
        keyframe.opacity = value;
        break;
      case ".visible":
        keyframe.visible = value;
        break;
      default:
        break;
    }
    this.ChangeKeyframe(keyframe, type, value);
    let mixers: any[] = [];
    this.FindMixer(this.mixers, obj, mixers);
    // console.log(obj, mixers);
    let mixer = mixers[0] as THREE.AnimationMixer;
    let action = mixer.clipAction(clip);
    // console.log((mixer as any)._listeners);
    if ((mixer as any)._listeners == undefined)
      mixer.addEventListener('finished', function (e) {
        let act = e["action"];
        act.paused = false;
      });
    this.actions.push(action);
    action.setLoop(THREE.LoopRepeat, 1);
    action.play();
    action.clampWhenFinished = true;
    mixer.setTime(time);
    this.CreateKeyframeDOM(track, keyframe)
  }
  ChangeKeyframe(keyframe: AnimationModel.KeyframeModel, type: string, value: any) {
    // console.log(keyframe.time);
    let track = keyframe.clip.tracks.find(track => (track.name == type))
    if (track != undefined) {
      let updateTrack = true;
      for (let i = 0; i < track.times.length; i++) {
        if (Number(track.times[i].toFixed(3)) == keyframe.time) {
          // console.log("change cur values");
          updateTrack = false;
          switch (type) {
            case ".position":
              track.values[i * 3] = value.x;
              track.values[i * 3 + 1] = value.y;
              track.values[i * 3 + 2] = value.z;
              break;
            case ".quaternion":
              track.values[i * 4] = value.x;
              track.values[i * 4 + 1] = value.y;
              track.values[i * 4 + 2] = value.z;
              track.values[i * 4 + 3] = value.w;
              break;
            case ".material.opacity":
              track.values[i] = value;
              break;
            case ".visible":
              track.values[i] = value;
              break;
            default:
              break;
          }
          this.actions.find((action) => {
            if (action.getClip() == keyframe.clip) {
              // console.log(action);
              let mixer = action.getMixer();
              mixer.setTime(keyframe.time);
              // console.log(mixer.time);
            }
          })
        }
      }
      if (updateTrack) {
        // Добавить новые значения в трек
        // console.log("need add new time and values to track");
        this.AddValuesToTrack(keyframe.clip, type, keyframe.time, value);
      }
    }
    else {
      // Создать трек
      // console.log("need create new track");
      this.AddTrackToClip(keyframe.clip, type, keyframe.time, value);
    }

    keyframe.clip.resetDuration()
  }
  AddTrackToClip(clip: THREE.AnimationClip, type: string, time: number, value: any) {
    let newTrack: any;
    switch (type) {
      case ".position":
        newTrack = new THREE.VectorKeyframeTrack('.position', [time], [value.x, value.y, value.z]);
        break;
      case ".quaternion":
        newTrack = new THREE.QuaternionKeyframeTrack('.quaternion', [time], [value.x, value.y, value.z, value.w]);
        break;
      case ".material.opacity":
        newTrack = new THREE.NumberKeyframeTrack('.material.opacity', [time], [value]);
        break;
      case ".visible":
        newTrack = new THREE.BooleanKeyframeTrack('.visible', [time], [value]);
        break;
    }
    clip.tracks.push(newTrack);
    clip.resetDuration();
  }

  AddValuesToTrack(clip: THREE.AnimationClip, type: string, time: number, value: any) {
    // console.log(clip);
    let times: any[] = [];
    let values: any[] = [];
    let insert = false;
    // console.log(track.times);
    let track = clip.tracks.find(track => (track.name == type))
    if (track != undefined) {
      for (let i = 0; i < track.times.length; i++) {
        // console.log(track.times[i]);
        if (!insert)
          if (Number(track.times[i].toFixed(3)) > time) {
            times.push(Number(time.toFixed(3)));
            insert = true;
            switch (track.name) {
              case ".position":
                values.push(value.x);
                values.push(value.y);
                values.push(value.z);
                break;
              case ".quaternion":
                values.push(value.x);
                values.push(value.y);
                values.push(value.z);
                values.push(value.w);
                break;
              case ".material.opacity":
                values.push(value);
                break;
              case ".visible":
                values.push(value);
                break;
            }
          }
        times.push(track.times[i]);
        switch (track.name) {
          case ".position":
            values.push(track.values[i * 3]);
            values.push(track.values[i * 3 + 1]);
            values.push(track.values[i * 3 + 2]);
            break;
          case ".quaternion":
            values.push(track.values[i * 4]);
            values.push(track.values[i * 4 + 1]);
            values.push(track.values[i * 4 + 2]);
            values.push(track.values[i * 4 + 3]);
            break;
          case ".material.opacity":
            values.push(track.values[i]);
            break;
          case ".visible":
            values.push(track.values[i]);
            break;
        }
      }
      if (!insert) {
        // console.log("!insert");
        times.push(time);
        insert = true;
        switch (track.name) {
          case ".position":
            values.push(value.x);
            values.push(value.y);
            values.push(value.z);
            break;
          case ".quaternion":
            values.push(value.x);
            values.push(value.y);
            values.push(value.z);
            values.push(value.w);
            break;
          case ".material.opacity":
            values.push(value);
            break;
          case ".visible":
            values.push(value);
            break;
        }
      }
      // console.log(times);
      // console.log(values);
      let newTrack: any;
      switch (track.name) {
        case ".position":
          newTrack = new THREE.VectorKeyframeTrack('.position', times, values);
          break;
        case ".quaternion":
          newTrack = new THREE.QuaternionKeyframeTrack('.quaternion', times, values);
          break;
        case ".material.opacity":
          newTrack = new THREE.NumberKeyframeTrack('.material.opacity', times, values);
          break;
        case ".visible":
          newTrack = new THREE.BooleanKeyframeTrack('.visible', times, values);
          break;
      }
      clip.tracks.find((tr, index) => {
        if (tr.name == newTrack.name)
          clip.tracks.splice(index, 1, newTrack);
      })
      clip.resetDuration();
      this.actions.find((action, index) => {
        if (action.getClip() == clip) {
          // console.log(action);
          action.stop();
          let mixer = action.getMixer();
          mixer.uncacheAction(clip);
          let newAction = mixer.clipAction(clip);
          newAction.setLoop(THREE.LoopRepeat, 1);
          newAction.play();
          newAction.clampWhenFinished = true;
          this.actions.splice(index, 1, newAction);
          mixer.setTime(time);
          // console.log(mixer.time);

        }
      })
    }
    //return clip
  }

  DeleteKeyframe(keyframe: AnimationModel.KeyframeModel) {
    keyframe.DOMElement?.remove();
    keyframe.clip.tracks.forEach(track => {
      let times: any[] = [];
      let values: any[] = [];
      let index = -1;
      for (let i = 0; i < track.times.length; i++) {
        if (Number(track.times[i].toFixed(3)) != keyframe.time) {
          times.push(track.times[i]);
          switch (track.name) {
            case ".position":
              values.push(track.values[i * 3]);
              values.push(track.values[i * 3 + 1]);
              values.push(track.values[i * 3 + 2]);
              break;
            case ".quaternion":
              values.push(track.values[i * 4]);
              values.push(track.values[i * 4 + 1]);
              values.push(track.values[i * 4 + 2]);
              values.push(track.values[i * 4 + 3]);
              break;
            case ".material.opacity":
              values.push(track.values[i]);
              break;
            case ".visible":
              values.push(track.values[i]);
              break;
          }
        }
      }
      let newTrack: any;
      switch (track.name) {
        case ".position":
          newTrack = new THREE.VectorKeyframeTrack('.position', times, values);
          break;
        case ".quaternion":
          newTrack = new THREE.QuaternionKeyframeTrack('.quaternion', times, values);
          break;
        case ".material.opacity":
          newTrack = new THREE.NumberKeyframeTrack('.material.opacity', times, values);
          break;
        case ".visible":
          newTrack = new THREE.BooleanKeyframeTrack('.visible', times, values);
          break;
      }
      keyframe.clip.tracks.find((tr, index) => {
        if (tr.name == newTrack.name)
          keyframe.clip.tracks.splice(index, 1, newTrack);
      })
      keyframe.clip.resetDuration();
      this.actions.find((action, index) => {
        if (action.getClip() == keyframe.clip) {
          // console.log(action);
          action.stop();
          let mixer = action.getMixer();
          mixer.uncacheAction(keyframe.clip);
          let newAction = mixer.clipAction(keyframe.clip);
          newAction.setLoop(THREE.LoopRepeat, 1);
          newAction.play();
          newAction.clampWhenFinished = true;
          this.actions.splice(index, 1, newAction);
          mixer.setTime(keyframe.time);
          // console.log(mixer.time);
        }
      })
    })
  }

  ClearSelection() {
    if (this.selected.length != 0) {
      let arr: any[] = [];
      this.selected.forEach(item => {
        let mesh = item as any;
        if (mesh.material != undefined)
          mesh.material.emissive.set(0x000000);
      })
      this.selected = [];
    }
    this.selectionChange = !this.selectionChange;
    this.transform.detach();
  }
  Select(obj: any, CTRLPressed: boolean) {
    // console.log(obj);
    if (!CTRLPressed) {
      this.selectionChange = !this.selectionChange;
      this.ClearSelection();
    }
    if (obj.type == "Mesh") {
      obj.material.emissive.set(0x004400);
      this.selected.push(obj);
      this.transform.attach(obj);
      // console.log(this.transform);

    }
    else if (obj.type == "Object3D") {
      let arr: any[] = [];
      this.FindMeshes(obj, arr);
      arr.forEach(mesh => {
        mesh.material.emissive.set(0x004400);
        this.selected.push(mesh);
      })
    }
    else if (/(Light)/g.exec(obj.type) != undefined) {
      //obj.material.emissive.set(0x004400);
      this.selected.push(obj);
      this.transform.attach(obj);
      console.log(obj);

    }
    //console.log(this.selected.length);
    if (this.selected.length > 1) {
      this.startPos = [];
      this.group.position.set(0, 0, 0);
      this.group.rotation.set(0, 0, 0);
      this.selected.forEach(item => {
        this.startPos.push(item.position.clone());
      })
      this.scene.add(this.group);
      this.transform.attach(this.group);
      (this.transform as any)._listeners["objectChange"] = [];
      this.transform.addEventListener("objectChange", (e) => {
        this.selected.forEach((item, index) => {
          let q = new THREE.Quaternion();
          item.getWorldQuaternion(q);
          let vec = this.group.position.clone().applyQuaternion(q.invert()).add(this.startPos[index]);
          item.updateWorldMatrix(true, true)
          item.position.set(vec.x, vec.y, vec.z);
        })
        this.transformChange = !this.transformChange;
      })
    }
    else {
      (this.transform as any)._listeners["objectChange"] = [];
      this.transform.addEventListener("objectChange", (e) => {
        let vec = this.selected[0].position;
        this.selected[0].position.set(vec.x, vec.y, vec.z);
        this.transformChange = !this.transformChange;
      })
    }
    this.selectionChange = !this.selectionChange;
    // console.log(this.transformChange);

  }

  FindMixer(mixers: THREE.AnimationMixer[], obj: any, mix: any[]) {
    let meshes: any[] = [];
    if (obj.type == "Object3D" || obj.type == "Scene")
      this.FindMeshes(obj, meshes);
    else if (obj.type == "Mesh")
      meshes.push(obj);
    meshes.forEach(mesh => {
      mixers.forEach(mixer => {
        if (mixer.getRoot() == mesh) {
          mix.push(mixer);
        }
      })
    })
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
