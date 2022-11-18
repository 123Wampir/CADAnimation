import { Injectable, Renderer2 } from '@angular/core';
import THREE = require('three');
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import * as AnimationModel from 'src/app/shared/animation.model';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
  stencilNeedUpdate = false;
  actionDragged = false;
  actionMoved = true;
  pos = 0;

  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  group: THREE.Mesh = new THREE.Mesh();
  stencilGroups = new THREE.Group();
  planes: any[] = [];
  planeHelpers = new THREE.Object3D();
  startPos: THREE.Vector3[] = [];
  selected: THREE.Object3D[] = [];
  selectedAction!: AnimationModel.KeyframeActionModel;
  selectedKeyframe!: AnimationModel.KeyframeModel;
  actions: THREE.AnimationAction[] = [];
  mixers: THREE.AnimationMixer[] = [];
  helpers: any[] = [];
  timeLine!: AnimationModel.TimelineModel;
  transform!: TransformControls;
  orbit!: OrbitControls;
  angRenderer!: Renderer2;
  currentCamera!: THREE.Camera;
  boundingBoxSize!: THREE.Vector3;

  dialogShow = false;
  dialogModal = false;
  dialogType = "";


  CreateActionDOM(keyframeTrack: AnimationModel.KeyframeTrackModel, action: AnimationModel.KeyframeActionModel) {
    let trackline = keyframeTrack.DOMElement;
    let actionDOM = this.angRenderer.createElement("div");
    action.DOMElement = actionDOM;
    this.angRenderer.addClass(actionDOM, "action");
    this.angRenderer.setStyle(actionDOM, "left", `${action.start * this.timeLine.scale}px`);
    this.angRenderer.setStyle(actionDOM, "width", `${action.length * this.timeLine.scale + 10}px`);
    this.angRenderer.setStyle(actionDOM, "background", `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`);
    // this.renderer.setAttribute(actionDOM, "time", keyframeTrack.keyframes[i].time.toString())
    this.angRenderer.setAttribute(actionDOM, "part", keyframeTrack.name);
    this.angRenderer.setAttribute(actionDOM, "show", "0");
    this.angRenderer.appendChild(trackline, actionDOM);
    this.angRenderer.listen(actionDOM, "mousedown", (event) => {
      this.actionDragged = true;
      this.pos = event.clientX - action.start * this.timeLine.scale;
    })
    // let h = (actionDOM as HTMLElement);
    // console.log(h.parentElement);
    this.angRenderer.listen(actionDOM.parentElement, "mousemove", (event) => {
      if (this.actionDragged) {
        if (this.selectedAction != undefined) {
          if (this.selectedAction == action) {
            this.actionMoved = true;
            let time = event.clientX - this.pos;
            if (time >= 0 && time + action.length * this.timeLine.scale <= this.timeLine.duration * this.timeLine.scale) {
              action.DOMElement!.style.left = `${time}px`;
              let offset = time / this.timeLine.scale - action.start;
              action.track?.shift(offset);
              action.keyframes[0].clip.resetDuration();
              action.start = time / this.timeLine.scale;
              action.keyframes.forEach(keyframe => {
                keyframe.time += offset;
              })
            }
          }
        }
      }
    })
    this.angRenderer.listen(actionDOM.parentElement, "mouseup", (event) => {
      this.actionDragged = false;
      //console.log(action);
    })
    this.angRenderer.listen(actionDOM, "click", (event) => {
      this.selectedAction = action;
      if (action.DOMElement?.getAttribute("show") == "0") {
        this.angRenderer.setAttribute(actionDOM, "show", "1");
        action.DOMElement?.childNodes.forEach(child => {
          this.angRenderer.setStyle(child, "visibility", "visible");
        })
      }
      else if (!this.actionMoved) {
        if (this.selectedKeyframe == undefined) {
          this.angRenderer.setAttribute(actionDOM, "show", "0");
          action.DOMElement?.childNodes.forEach(child => {
            this.angRenderer.setStyle(child, "visibility", "hidden");
          })
        }
        else if (this.selectedKeyframe.action != action) {
          this.angRenderer.setAttribute(actionDOM, "show", "0");
          action.DOMElement?.childNodes.forEach(child => {
            this.angRenderer.setStyle(child, "visibility", "hidden");
          })
        }
      }
      this.actionMoved = false;
    });
  }
  CreateAction(track: AnimationModel.KeyframeTrackModel, type: string) {
    let action: AnimationModel.KeyframeActionModel;
    action = { keyframes: [], length: 0, start: 0, trackDOM: track, type: type };
    track.actions.push(action);
    //console.log(action);
    return action;
  }
  UpdateAction(action: AnimationModel.KeyframeActionModel) {
    action.start = action.track!.times[0];
    action.length = action.track!.times[action.track!.times.length - 1] - action.start;
    if (action.DOMElement != undefined) {
      this.angRenderer.setStyle(action.DOMElement, "left", `${action.start * this.timeLine.scale}px`);
      this.angRenderer.setStyle(action.DOMElement, "width", `${action.length * this.timeLine.scale}px`);
      action.keyframes.forEach(keyframe => {
        if (keyframe.DOMElement != undefined)
          this.angRenderer.setStyle(keyframe.DOMElement, "left", `${(keyframe.time - action.start) * this.timeLine.scale}px`)
      })
    }
    else {
      this.CreateActionDOM(action.trackDOM, action);
    }
  }
  CreateKeyframeDOM(action: AnimationModel.KeyframeActionModel, keyframe: AnimationModel.KeyframeModel) {
    let trackline = action.DOMElement;
    if (keyframe.DOMElement == undefined) {
      let keyframeDOM = this.angRenderer.createElement("div");
      keyframe.DOMElement = keyframeDOM;
      this.angRenderer.addClass(keyframeDOM, "keyframe");
      this.angRenderer.setStyle(keyframeDOM, "left", `${(keyframe.time - action.start) * this.timeLine.scale}px`);
      // this.renderer.setStyle(keyframe, "visibility", `hidden`);
      this.angRenderer.setAttribute(keyframeDOM, "time", keyframe.time.toString())
      // this.angRenderer.setAttribute(keyframeDOM, "part", keyframeTrack.name)
      this.angRenderer.appendChild(trackline, keyframeDOM);
      this.angRenderer.listen(keyframeDOM, "click", (event) => {
        console.log(keyframe);
        this.selectedKeyframe = keyframe;
        this.currentTime = keyframe.time;
        this.currentTimeChange = true;
      })
    }
  }
  CreateKeyframe(act: AnimationModel.KeyframeActionModel, time: number, obj: THREE.Object3D, type: string, value: any) {
    // console.log("create key");
    let clip: THREE.AnimationClip;
    if (obj.animations.length == 0) {
      clip = new THREE.AnimationClip(`${obj.name}`, -1, []);
      obj.animations.push(clip);
    }
    clip = obj.animations[0];
    let keyframe = AnimationModel.CreateKeyframe(time, act, clip);
    keyframe.value = value;
    this.ChangeKeyframe(keyframe, type, value);
    act.keyframes.push(keyframe);
    act.track = clip.tracks.find(tr => tr.name == type);
    let mixers: any[] = [];
    this.FindMixer(this.mixers, obj, mixers);
    let mixer!: THREE.AnimationMixer;
    if (mixers.length != 0)
      mixer = mixers[0] as THREE.AnimationMixer;
    else {
      mixer = new THREE.AnimationMixer(obj);
      this.mixers.push(mixer);
    }
    let action = mixer.clipAction(clip);
    if ((mixer as any)._listeners == undefined)
      mixer.addEventListener('finished', function (e) {
        let act = e["action"];
        act.paused = false;
      });
    this.actions.push(action);
    if (type == ".plane.constant") {
      let act = action as any;
      act._propertyBindings[0].binding.propertyName = "constant";
      let pl = obj as any;
      act._propertyBindings[0].binding.parsedPath.objectName = "plane";
      act._propertyBindings[0].binding.targetObject = pl.plane;
    }
    action.setLoop(THREE.LoopRepeat, 1);
    action.play();
    action.clampWhenFinished = true;
    mixer.setTime(time);
    this.UpdateAction(act);
    this.CreateKeyframeDOM(act, keyframe)
  }
  ChangeKeyframe(keyframe: AnimationModel.KeyframeModel, type: string, value: any) {
    // console.log(keyframe);
    keyframe.value = value;
    let track = keyframe.clip.tracks.find(track => (track.name == type))
    if (track != undefined) {
      let updateTrack = true;
      for (let i = 0; i < track.times.length; i++) {
        if (Number(track.times[i].toFixed(3)) == Number(keyframe.time.toFixed(3))) {
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
            case ".color":
              track.values[i * 3] = value.r;
              track.values[i * 3 + 1] = value.g;
              track.values[i * 3 + 2] = value.b;
              break;
            case ".plane.constant":
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
      case ".color":
        newTrack = new THREE.ColorKeyframeTrack('.color', [time], [value.r, value.g, value.b]);
        break;
      case ".plane.constant":
        newTrack = new THREE.NumberKeyframeTrack('.plane.constant', [time], [value]);
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
          if (Number(track.times[i].toFixed(3)) > Number(time.toFixed(3))) {
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
              case ".color":
                values.push(value.r);
                values.push(value.g);
                values.push(value.b);
                break;
              case ".plane.constant":
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
          case ".color":
            values.push(track.values[i * 3]);
            values.push(track.values[i * 3 + 1]);
            values.push(track.values[i * 3 + 2]);
            break;
          case ".plane.constant":
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
          case ".color":
            values.push(value.r);
            values.push(value.g);
            values.push(value.b);
            break;
          case ".plane.constant":
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
        case ".color":
          newTrack = new THREE.ColorKeyframeTrack('.color', times, values);
          break;
        case ".plane.constant":
          newTrack = new THREE.NumberKeyframeTrack('.plane.constant', times, values);
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
          if (type == ".plane.constant") {
            let act = newAction as any;
            act._propertyBindings[0].binding.propertyName = "constant";
            let pl = newAction.getRoot() as any;
            act._propertyBindings[0].binding.parsedPath.objectName = "plane";
            act._propertyBindings[0].binding.targetObject = pl.plane;
          }
          newAction.setLoop(THREE.LoopRepeat, 1);
          newAction.play();
          newAction.clampWhenFinished = true;
          this.actions.splice(index, 1, newAction);
          mixer.setTime(time);
          if ((mixer as any)._listeners == undefined)
            mixer.addEventListener('finished', function (e) {
              let act = e["action"];
              act.paused = false;
              console.log(act);
            });
        }
      })
    }
  }
  DeleteKeyframe(keyframe: AnimationModel.KeyframeModel) {
    keyframe.DOMElement?.remove();
    (this.selectedKeyframe as any) = undefined;
    keyframe.clip.tracks.forEach((track, index) => {
      let times: any[] = [];
      let values: any[] = [];
      for (let i = 0; i < track.times.length; i++) {
        if (Number(track.times[i].toFixed(3)) != Number(keyframe.time.toFixed(3))) {
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
            case ".color":
              values.push(track.values[i * 3]);
              values.push(track.values[i * 3 + 1]);
              values.push(track.values[i * 3 + 2]);
              break;
            case ".plane.constant":
              values.push(track.values[i]);
              break;
          }
        }
      }
      let newTrack: any;
      if (times.length != 0) {
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
          case ".color":
            newTrack = new THREE.ColorKeyframeTrack('.color', times, values);
            break;
          case ".plane.constant":
            newTrack = new THREE.NumberKeyframeTrack('.plane.constant', times, values);
            break;
        }
        keyframe.clip.tracks.splice(index, 1, newTrack);

      }
      else {
        keyframe.clip.tracks.splice(index, 1);
        console.log(keyframe.clip.tracks);
      }
      keyframe.clip.resetDuration();
      this.actions.find((action, index) => {
        if (action.getClip() == keyframe.clip) {
          // console.log(action);
          action.stop();
          let mixer = action.getMixer();
          mixer.uncacheAction(keyframe.clip);
          let newAction = mixer.clipAction(keyframe.clip);
          keyframe.clip.tracks.forEach(track => {
            if (track.name == ".plane.constant") {
              // console.log(keyframe.clip);
              let act = newAction as any;
              act._propertyBindings[0].binding.propertyName = "constant";
              let pl = newAction.getRoot() as any;
              act._propertyBindings[0].binding.parsedPath.objectName = "plane";
              act._propertyBindings[0].binding.targetObject = pl.plane;
            }
          })
          newAction.setLoop(THREE.LoopRepeat, 1);
          newAction.play();
          newAction.clampWhenFinished = true;
          this.actions.splice(index, 1, newAction);
          mixer.setTime(keyframe.time);
        }
      })
    })
  }
  createPlaneStencilGroup(geometry: any, plane: THREE.Plane, renderOrder: number) {
    const group = new THREE.Group();
    const baseMat = new THREE.MeshBasicMaterial();
    baseMat.depthWrite = false;
    baseMat.depthTest = false;
    baseMat.colorWrite = false;
    baseMat.stencilWrite = true;
    baseMat.stencilFunc = THREE.AlwaysStencilFunc;
    baseMat.clipIntersection = false;
    // back faces
    const mat0 = baseMat.clone();
    mat0.side = THREE.BackSide;
    mat0.clippingPlanes = [plane];
    mat0.stencilFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZPass = THREE.IncrementWrapStencilOp;
    const mesh0 = new THREE.Mesh(geometry, mat0);
    mesh0.renderOrder = renderOrder;
    group.add(mesh0);
    // front faces
    const mat1 = baseMat.clone();
    mat1.side = THREE.FrontSide;
    mat1.clippingPlanes = [plane];
    mat1.stencilFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZPass = THREE.DecrementWrapStencilOp;
    const mesh1 = new THREE.Mesh(geometry, mat1);
    mesh1.renderOrder = renderOrder;
    group.add(mesh1);
    return group;
  }
  UpdateStencilGeometry(arr: any[], group: THREE.Object3D) {
    let geomArr: THREE.BufferGeometry[] = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].visible) {
        if (arr[i].type == "Mesh") {
          arr[i].updateWorldMatrix(true, true);
          let newGeom = arr[i].geometry.clone().applyMatrix4(arr[i].matrixWorld);
          geomArr.push(newGeom);
        }
      }
    }
    if (geomArr.length != 0) {
      let mergedGeom = BufferGeometryUtils.mergeBufferGeometries(geomArr);
      for (let i = 0; i < geomArr.length; i++) {
        geomArr[i].dispose();
      }
      for (let i = 0; i < group.children.length; i++) {
        let mesh = group.children[i] as any;
        mesh.geometry.dispose();
        mesh.geometry = mergedGeom.clone();
      }
    }
  }

  EnableClipping(enabled: boolean) {
    this.renderer.localClippingEnabled = enabled;
  }

  CreateClippingPlanes(arr: any[]) {
    this.planes = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    ];
    let x = new THREE.PlaneHelper(this.planes[0], 100, 0xff0000);
    x.name = "X";
    let y = new THREE.PlaneHelper(this.planes[1], 100, 0x00ff00);
    y.name = "Y";
    let z = new THREE.PlaneHelper(this.planes[2], 100, 0x0000ff);
    z.name = "Z";
    this.planeHelpers.add(x);
    this.planeHelpers.add(y);
    this.planeHelpers.add(z);
    arr.forEach(item => {
      if (item.type == "Mesh") {
        item.material.clippingPlanes = this.planes;
        item.material.clipShadows = true;
      }
    })
    let geomArr: THREE.BufferGeometry[] = [];
    arr.forEach((obj) => {
      if (obj.type == "Mesh") {
        if (obj.visible) {
          let item = (obj as any)
          item.updateWorldMatrix(true, true);
          let newGeom = item.geometry.clone().applyMatrix4(item.matrixWorld);
          geomArr.push(newGeom);
        }
      }
    })
    let mergedGeom = BufferGeometryUtils.mergeBufferGeometries(geomArr);
    geomArr.forEach(geo => {
      geo.dispose();
    })
    const planeGeom = new THREE.PlaneGeometry(1000, 1000);
    for (let i = 0; i < 3; i++) {
      let stencilGroup = this.createPlaneStencilGroup(mergedGeom.clone(), this.planes[i], i + 1);
      const planeMat =
        new THREE.MeshBasicMaterial({
          color: 0x555555,
          // clippingPlanes: this.planes.filter(p => p !== this.planes[i]),
          stencilWrite: true,
          stencilRef: 0,
          stencilFunc: THREE.NotEqualStencilFunc,
          stencilFail: THREE.ReplaceStencilOp,
          stencilZFail: THREE.ReplaceStencilOp,
          stencilZPass: THREE.ReplaceStencilOp,
          side: THREE.DoubleSide,
          clipIntersection: true

        });
      const po = new THREE.Mesh(planeGeom, planeMat);
      po.type = "Stencil";
      po.onAfterRender = function (angRenderer) {
        angRenderer.clearStencil();
      };
      po.renderOrder = i + 1.1;
      this.stencilGroups.add(stencilGroup);
      this.planeHelpers.children[i].add(po);
    }
    this.scene.add(this.stencilGroups)
    this.stencilNeedUpdate = true;
  }

  ClearSelection() {
    if (this.selected.length != 0) {
      let arr: any[] = [];
      this.selected.forEach(item => {
        let mesh = item as any;
        if (mesh.material != undefined)
          if (mesh.material.emissive != undefined)
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
      if (obj.material.emissive)
        obj.material.emissive.set(0x004400);
      this.selected.push(obj);
      this.transform.attach(obj);
    }
    else if (obj.type == "Object3D") {
      let arr: any[] = [];
      this.FindMeshes(obj, arr);
      arr.forEach(mesh => {
        if (mesh.material.emissive != undefined)
          mesh.material.emissive.set(0x004400);
        this.selected.push(mesh);
      })
    }
    else if (/(Light)/g.exec(obj.type) != undefined) {
      this.selected.push(obj);
      this.transform.attach(obj);
    }
    else if (/(Camera)/g.exec(obj.type) != undefined) {
      this.selected.push(obj);
    }
    else if (obj.type == "Container") {
      // this.selected.push(obj);
    }
    else if (obj.type == "PlaneHelper") {
      this.selected.push(obj);
      // this.transform.attach(obj);
    }
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

  FindGeometry(meshes: THREE.Mesh[], geomArr: any[]) {
    meshes.forEach((obj) => {
      if (obj.visible) {
        let item = (obj as any)
        item.updateWorldMatrix(true, true);
        let newGeom = item.geometry.clone().applyMatrix4(item.matrixWorld);
        geomArr.push(newGeom);
      }
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
