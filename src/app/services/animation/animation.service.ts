import { Injectable, Renderer2 } from '@angular/core';
import THREE = require('three');
import * as AnimationModel from 'src/app/shared/animation.model';
import { SceneUtilsService } from '../utils/scene.utils.service';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  constructor(public SceneUtilsService: SceneUtilsService) { }
  currentTime = 0;
  play = false;
  stop = false;
  currentTimeChange = false;
  actionDragged = false;
  actionMoved = false;
  keyframeDragged = false;
  keyframeMoved = false;
  pos = 0;


  selectedAction!: AnimationModel.KeyframeActionModel;
  selectedKeyframe!: AnimationModel.KeyframeModel;
  actions: THREE.AnimationAction[] = [];
  mixers: THREE.AnimationMixer[] = [];
  timeLine: AnimationModel.TimelineModel = { tracks: [], duration: 30, scale: 50 };
  //orbit!: OrbitControls;

  // orbit!: ArcballControls;
  angRenderer!: Renderer2;
  dialogShow = false;
  dialogModal = false;
  dialogType = "";

  contextMenu = false;


  async LoadAnimationFile(event: Event) {
    console.log(event);
    let f = event.target as any;
    console.log(f.files);
    let str = window.URL.createObjectURL(f.files[0]);
    console.log(str);
    if (str.length != 0) {
      this.ClearAnimation();
      this.CreateMixers(this.SceneUtilsService.model);
      await this.LoadAnimation(str, this.SceneUtilsService.model, this.mixers);
      this.SceneUtilsService.newFileLoading = !this.SceneUtilsService.newFileLoading;
      console.log("LOAD ANIMATION!");
      (event.target as any).value = "";
    }
  }

  async CreateMixers(obj: any) {
    if (obj.children.length != 0) {
      for (let item of obj.children) {
        if (item.type == "Object3D") {
          this.CreateMixers(item);
        }
        else if (item.type == "Mesh") {
          let mixer = new THREE.AnimationMixer(item);
          this.mixers.push(mixer);
          this.CreateMixers(item);
        }
      }
    }
  }

  CreateActionDOM(keyframeTrack: AnimationModel.KeyframeTrackModel, action: AnimationModel.KeyframeActionModel) {
    // let trackline = keyframeTrack.DOMElement;
    // let actionDOM = this.angRenderer.createElement("div");
    // action.DOMElement = actionDOM;
    // this.angRenderer.addClass(actionDOM, "action");
    // this.angRenderer.setStyle(actionDOM, "left", `${action.start * this.timeLine.scale}px`);
    // this.angRenderer.setStyle(actionDOM, "width", `${action.length * this.timeLine.scale + 10}px`);
    // this.angRenderer.setStyle(actionDOM, "background", `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`);
    // this.angRenderer.setAttribute(actionDOM, "part", keyframeTrack.name);
    // this.angRenderer.setAttribute(actionDOM, "show", "0");
    // this.angRenderer.appendChild(trackline, actionDOM);
    // this.angRenderer.listen(actionDOM, "mousedown", (event) => {
    //   this.actionDragged = true;
    //   this.pos = event.clientX - action.start * this.timeLine.scale;
    // })
    // this.angRenderer.listen(actionDOM.parentElement, "mousemove", (event) => {
    //   // НУЖНО НАПИСАТЬ МЕТОД ChangeKeyframeTime
    //   /*if (this.keyframeDragged) {
    //     if (this.selectedKeyframe != undefined) {
    //       this.keyframeMoved = true;
    //       let time = event.clientX - this.pos;
    //       if (time >= -1 && time <= this.timeLine.duration * this.timeLine.scale) {
    //         this.selectedKeyframe.DOMElement!.style.left = `${time}px`;
    //         let offset = time / this.timeLine.scale - this.selectedKeyframe.time;
    //         this.selectedKeyframe.time += offset;
    //       }
    //     }
    //   }*/
    //   if (this.actionDragged && !this.keyframeMoved) {
    //     if (this.selectedAction != undefined) {
    //       if (this.selectedAction == action) {
    //         this.actionMoved = true;
    //         let time = event.clientX - this.pos;
    //         if (time >= 0 && time + action.length * this.timeLine.scale <= this.timeLine.duration * this.timeLine.scale) {
    //           action.DOMElement!.style.left = `${time}px`;
    //           let offset = time / this.timeLine.scale - action.start;
    //           action.track?.shift(offset);
    //           action.keyframes[0].clip.resetDuration();
    //           action.start = time / this.timeLine.scale;
    //           action.keyframes.forEach(keyframe => {
    //             keyframe.time += offset;
    //           })
    //         }
    //       }
    //     }
    //   }
    // })
    // this.angRenderer.listen(actionDOM.parentElement, "mouseup", (event) => {
    //   this.actionDragged = false;
    // })
    // this.angRenderer.listen(actionDOM, "click", (event) => {
    //   this.selectedAction = action;
    //   console.log(this.selectedAction);

    //   if (action.DOMElement?.getAttribute("show") == "0") {
    //     this.angRenderer.setAttribute(actionDOM, "show", "1");
    //     action.DOMElement?.childNodes.forEach(child => {
    //       this.angRenderer.setStyle(child, "visibility", "visible");
    //     })
    //   }
    //   else if (!this.actionMoved) {
    //     if (this.selectedKeyframe == undefined) {
    //       this.angRenderer.setAttribute(actionDOM, "show", "0");
    //       action.DOMElement?.childNodes.forEach(child => {
    //         this.angRenderer.setStyle(child, "visibility", "hidden");
    //       })
    //     }
    //     else if (this.selectedKeyframe.action != action) {
    //       this.angRenderer.setAttribute(actionDOM, "show", "0");
    //       action.DOMElement?.childNodes.forEach(child => {
    //         this.angRenderer.setStyle(child, "visibility", "hidden");
    //       })
    //     }
    //   }
    //   this.actionMoved = false;
    // });
  }
  CreateAction(track: AnimationModel.KeyframeTrackModel, type: string) {
    let action: AnimationModel.KeyframeActionModel;
    action = { keyframes: [], length: 0, start: 0, trackDOM: track, type: type };
    track.actions.push(action);
    return action;
  }
  UpdateAction(action: AnimationModel.KeyframeActionModel) {
    action.start = action.track!.times[0];
    action.length = action.track!.times[action.track!.times.length - 1] - action.start;
    // if (action.DOMElement != undefined) {
    //   this.angRenderer.setStyle(action.DOMElement, "left", `${action.start * this.timeLine.scale}px`);
    //   this.angRenderer.setStyle(action.DOMElement, "width", `${action.length * this.timeLine.scale}px`);
    //   action.keyframes.forEach(keyframe => {
    //     if (keyframe.DOMElement != undefined)
    //       this.angRenderer.setStyle(keyframe.DOMElement, "left", `${(keyframe.time - action.start) * this.timeLine.scale}px`)
    //   })
    // }
    // else {
    //   this.CreateActionDOM(action.trackDOM, action);
    // }
  }
  DeleteAction(action: AnimationModel.KeyframeActionModel) {
    action.keyframes.forEach(key => {
      this.DeleteKeyframe(key);
    })
    action.keyframes = [];
    // action.DOMElement?.remove();
    action.trackDOM.actions.find((item, index) => {
      if (item == action) {
        action.trackDOM.actions.splice(index, 1);
        return;
      }
    })
  }
  CreateKeyframeDOM(action: AnimationModel.KeyframeActionModel, keyframe: AnimationModel.KeyframeModel) {
    // let trackline = action.DOMElement;
    // if (keyframe.DOMElement == undefined) {
    //   let keyframeDOM = this.angRenderer.createElement("div");
    //   keyframe.DOMElement = keyframeDOM;
    //   this.angRenderer.addClass(keyframeDOM, "keyframe");
    //   this.angRenderer.setStyle(keyframeDOM, "left", `${(keyframe.time - action.start) * this.timeLine.scale}px`);
    //   // this.renderer.setStyle(keyframe, "visibility", `hidden`);
    //   this.angRenderer.setAttribute(keyframeDOM, "time", keyframe.time.toString())
    //   // this.angRenderer.setAttribute(keyframeDOM, "part", keyframeTrack.name)
    //   this.angRenderer.appendChild(trackline, keyframeDOM);
    //   this.angRenderer.listen(keyframeDOM, "mousedown", (event) => {
    //     this.selectedKeyframe = keyframe;
    //     this.keyframeDragged = true;
    //     this.pos = event.clientX - keyframe.time * this.timeLine.scale;
    //   })
    //   this.angRenderer.listen(keyframeDOM.parentElement, "mouseup", (event) => {
    //     this.keyframeDragged = false;
    //     this.keyframeMoved = false;
    //     //console.log(action);
    //   })
    //   this.angRenderer.listen(keyframeDOM, "click", (event) => {
    //     console.log(keyframe);
    //     // this.selectedKeyframe = keyframe;
    //     this.currentTime = keyframe.time;
    //     this.currentTimeChange = true;
    //   })
    // }
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
            case ".intensity":
              track.values[i] = value;
              break;
            case ".plane.constant":
              track.values[i] = value;
              break;
            default:
              break;
          }
          this.actions.find((action) => {
            if (action.getClip() == keyframe.clip) {
              let mixer = action.getMixer();
              mixer.setTime(keyframe.time);
            }
          })
        }
      }
      if (updateTrack) {
        // Добавить новые значения в трек
        this.AddValuesToTrack(keyframe.clip, type, keyframe.time, value);
      }
    }
    else {
      // Создать трек
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
      case ".intensity":
        newTrack = new THREE.NumberKeyframeTrack('.intensity', [time], [value]);
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
              case ".intensity":
                values.push(value);
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
          case ".intensity":
            values.push(track.values[i]);
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
          case ".intensity":
            values.push(value);
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
        case ".intensity":
          newTrack = new THREE.NumberKeyframeTrack('.intensity', times, values);
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
    // keyframe.DOMElement?.remove();
    (this.selectedKeyframe as any) = undefined;
    keyframe.clip.tracks.find((track, index) => {
      if (track.name == keyframe.action.type) {
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
              case ".intensity":
                values.push(track.values[i]);
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
            case ".intensity":
              newTrack = new THREE.NumberKeyframeTrack('.intensity', times, values);
              break;
            case ".plane.constant":
              newTrack = new THREE.NumberKeyframeTrack('.plane.constant', times, values);
              break;
          }
          keyframe.clip.tracks.splice(index, 1, newTrack);
        }
        else {
          keyframe.clip.tracks.splice(index, 1);
          // console.log(keyframe.clip.tracks);
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
        return;
      }
    })
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

  FindPartByName(name: string) {
    let arr: THREE.Object3D[] = [];
    // console.log(this.model);
    for (let i = 0; i < this.SceneUtilsService.model.children[0].children.length; i++) {
      name = name.replace((/\s/g), '_');
      //if (mainObject.children[0].children[i].name.includes(name)) {
      if (this.SceneUtilsService.model.children[0].children[i].name == name) {
        arr.push(this.SceneUtilsService.model.children[0].children[i]);
      }
    }
    return arr;
  }

  async LoadAnimation(URL: string, mainObject: THREE.Object3D, mixers: THREE.AnimationMixer[]) {
    // Чтение анимации
    // Создание объекта парсера XML/HTML-файлов
    let parser = new DOMParser();
    let fileUrl1 = URL;
    // let fileUrl1 = 'http://127.0.0.1:5500/src/Animations/Разрез.xml';
    let response1 = await fetch(fileUrl1);
    let buffer1 = await response1.text();
    // Преобразование файла в DOM элемент
    let dom = parser.parseFromString(buffer1, "text/xml");
    // console.log(dom);
    // Текущий шаг анимации
    let currentStep = 0;
    let stepTime = 0;
    let maxTime = -1;
    //перебор шагов анимации
    dom.children[0].childNodes.forEach(step => {
      if (step.nodeName == "Step") {
        //console.log(step)
        let stepHTML = step as HTMLElement;
        currentStep = Number.parseInt(stepHTML.attributes.getNamedItem("Number")?.nodeValue!);
        // Поиск деталей в шаге
        step.childNodes.forEach(stepNode => {
          if (stepNode.nodeName == "Part") {
            let stepNodeHTML = stepNode as HTMLElement;
            // Получение имени и id детали
            let str = stepNodeHTML.attributes.getNamedItem("Name")?.nodeValue!;
            let id = parseInt(stepNodeHTML.attributes.getNamedItem("Number")?.nodeValue!);
            // Поиск деталей по имени в файле анимации
            let parts = this.FindPartByName(str);
            stepNodeHTML.childNodes.forEach(partNode => {
              // Переменные перемещения
              let dx: number, dy: number, dz: number;
              // Переменная параметра времени
              let par: number;
              // Переменные прозрачности
              let start: number, stop: number;
              // Переменная угла поворота
              let angle: number;
              // Переменные используемых анимаций
              let move = false, transparancy = false, rotation = false;
              // Анимация перемещения
              if (partNode.nodeName == "Move") {
                move = true;
                let partNodeHTML = partNode as HTMLElement;
                let path = partNodeHTML.children[0] as HTMLElement;
                let line = path.attributes.getNamedItem("Line")?.nodeValue;

                par = Number.parseFloat(path.attributes.getNamedItem("Param")?.nodeValue!);
                dx = Number.parseFloat(/[X][=](-?\d+.\d+)/.exec(line!)![1]);
                dy = Number.parseFloat(/[Y][=](-?\d+.\d+)/.exec(line!)![1]);
                dz = Number.parseFloat(/[Z][=](-?\d+.\d+)/.exec(line!)![1]);
                // console.log(dx, dy, dz)
              }
              // Анимация прозрачности
              if (partNode.nodeName == "Transparency") {
                transparancy = true;
                let partNodeHTML = partNode as HTMLElement;
                let params = partNodeHTML.children[0] as HTMLElement;
                par = Number.parseFloat(params.attributes.getNamedItem("Param")?.nodeValue!);
                stop = Number.parseFloat(params.attributes.getNamedItem("Start")?.nodeValue!);
                start = Number.parseFloat(params.attributes.getNamedItem("Stop")?.nodeValue!);
              }
              if (partNode.nodeName == "Rotate") {
                //rotation = true;
                let partNodeHTML = partNode as HTMLElement;
                let axis = partNodeHTML.children[0] as HTMLElement;
                let dir = Number.parseInt(axis.attributes.getNamedItem("Direct")?.nodeValue!) * 2 - 1;
                angle = Number.parseFloat(axis.attributes.getNamedItem("Angle")?.nodeValue!) * dir;
                par = Number.parseFloat(axis.attributes.getNamedItem("Param")?.nodeValue!);
                //console.log(axis, dir, angle)
              }
              if (par! > maxTime) {
                maxTime = par!;
              }

              // Перебор деталей используемых в анимации
              parts.forEach((part: any) => {
                let partMixer: any[] = [];
                let edgeMixer: any[] = [];
                // Поиск миксеров(дорожек) анимации
                this.FindMixer(this.mixers, part, partMixer);
                // this.FindMixer(this.edgeMixers, part, edgeMixer);
                if (partMixer.length != 0) {
                  partMixer.forEach(mixer => {
                    // Добавление анимации перемещения в миксер детали
                    if (move) {
                      let mesh = mixer.getRoot() as THREE.Mesh;
                      mesh.updateWorldMatrix(true, true)
                      let vec = new THREE.Vector3(dx, dy, dz);
                      vec.add(part.position)
                      let startPos = mesh.position
                      part.worldToLocal(vec);
                      const times = [stepTime, stepTime + par];
                      const values = [startPos.x, startPos.y, startPos.z, startPos.x + vec.x * par, startPos.y + vec.y * par, startPos.z + vec.z * par];
                      const positionKF = new THREE.VectorKeyframeTrack('.position', times, values);
                      const tracks = [positionKF];
                      const length = -1;
                      const clip = new THREE.AnimationClip(`${mixer.getRoot()?.name}`, length, tracks);
                      mixer.getRoot()?.animations.push(clip);
                    }
                    // Добавление анимации прозрачности в миксер детали
                    if (transparancy) {
                      const times = [stepTime, stepTime + par];
                      const values = [start, stop];
                      const transparancyKF = new THREE.NumberKeyframeTrack('.material.opacity', times, values);
                      let visibleKF!: any;
                      if (stop == 1)
                        visibleKF = new THREE.BooleanKeyframeTrack('.visible', times, [true, Boolean(stop)]);
                      else visibleKF = new THREE.BooleanKeyframeTrack('.visible', times, [Boolean(start), Boolean(stop)]);
                      const tracks = [transparancyKF, visibleKF];
                      const length = -1;
                      const clip = new THREE.AnimationClip(`${mixer.getRoot()?.name}`, length, tracks);
                      mixer.getRoot()?.animations.push(clip);
                    }
                    if (rotation) {
                      let mesh = mixer.getRoot() as THREE.Mesh;
                      //mesh.updateWorldMatrix(true, true)
                      //vec.add(part.position)
                      let startRot = mesh.quaternion;
                      let vec = new THREE.Quaternion().setFromEuler(new THREE.Euler(angle + mesh.rotation.x, mesh.rotation.y, mesh.rotation.z));
                      console.log(vec)
                      //mesh.worldToLocal(vec);
                      const times = [stepTime, stepTime + par];
                      const values = [startRot.x, startRot.y, startRot.z, startRot.w, vec.x, vec.y, vec.z, vec.w];
                      const rotationKF = new THREE.QuaternionKeyframeTrack('.quaternion', times, values);
                      const tracks = [rotationKF];
                      const length = -1;
                      const clip = new THREE.AnimationClip(`${mixer.getRoot()?.name}`, length, tracks);
                      mixer.getRoot()?.animations.push(clip);
                    }
                  })
                }
              })
            })
          }
        })
        stepTime += maxTime;
      }
    })
    this.CombineClips(this.SceneUtilsService.scene);
    this.AppendClips(this.SceneUtilsService.scene);
  }

  CombineClips(obj: THREE.Object3D) {
    let arr: THREE.Object3D[] = [];
    this.FindMeshes(obj, arr);
    if (arr.length != 0) {
      arr.forEach(item => {
        if (item.animations.length > 1) {
          for (let i = 1; i < item.animations.length; i++) {
            item.animations[0].tracks.forEach(track1 => {
              item.animations[i].tracks.forEach((track2, index) => {
                if (track1.name == track2.name) {
                  let times: any[] = [];
                  let values: any[] = [];
                  track1.times.forEach(time => {
                    times.push(time);
                  })
                  track2.times.forEach(time => {
                    times.push(time);
                  })
                  track1.values.forEach(value => {
                    values.push(value);
                  })
                  track2.values.forEach(value => {
                    values.push(value);
                  })
                  switch (track1.name) {
                    case ".material.opacity":
                      let transparancyKF = new THREE.NumberKeyframeTrack('.material.opacity', times, values);
                      track1 = transparancyKF.clone();
                      item.animations[i].tracks.splice(index, 1);
                      break;
                    case ".position":
                      let positionKF = new THREE.VectorKeyframeTrack('.position', times, values);
                      track1 = positionKF.clone();
                      item.animations[i].tracks.splice(index, 1);
                      break;
                    case ".quaternion":
                      let rotationKF = new THREE.QuaternionKeyframeTrack('.quaternion', times, values);
                      track1 = rotationKF.clone();
                      item.animations[i].tracks.splice(index, 1);
                      break;
                    case ".visible":
                      let visibleKF = new THREE.BooleanKeyframeTrack('.visible', times, values);
                      track1 = visibleKF.clone();
                      item.animations[i].tracks.splice(index, 1);
                      break;
                    default:
                      break;
                  }
                }
                else {
                  item.animations[0].tracks.push(track2.clone())
                  item.animations[0].resetDuration();
                }
              })
            })
            item.animations.splice(i, 1);
          }
        }
      })
    }
  }

  AppendClips(obj: THREE.Object3D) {
    // let arr: THREE.Object3D[] = [];
    // this.FindMeshes(obj, arr);
    let partMixer: THREE.AnimationMixer[] = [];
    this.FindMixer(this.mixers, obj, partMixer)
    partMixer.forEach(mixer => {
      let item = mixer.getRoot() as THREE.Object3D;
      if (item.animations.length != 0) {
        item.animations.forEach(clip => {
          let action = mixer.clipAction(clip);
          mixer.addEventListener('finished', function (e) {

            let act = e["action"];
            act.paused = false;
          });
          action.setLoop(THREE.LoopRepeat, 1);
          action.play();
          action.clampWhenFinished = true;
          this.actions.push(action);
        })
      }
    })
  }

  ClearAnimation() {
    if (this.SceneUtilsService.model != undefined) {
      this.SceneUtilsService.model.traverse(item => {
        if (item.type == "Mesh" || item.type == "LineSegments") {
          item.animations = [];
        }
      })
      this.timeLine.tracks.forEach(track => {
        // track.DOMElement.remove();
        track.actions.forEach(action => {
          // action.DOMElement?.remove();
          // action.keyframes.forEach(keyframe => {
          //   keyframe.DOMElement?.remove();
          // })
          action.keyframes = [];
        })
        track.actions = [];
      })
      this.timeLine.tracks = [];
      this.actions.forEach(action => {
        action.stop();
        let mixer = action.getMixer();
        mixer.uncacheRoot(mixer.getRoot());
      })
      this.actions = [];
      this.mixers = [];
    }
  }
}
