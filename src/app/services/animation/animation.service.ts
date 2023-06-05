import { Injectable } from '@angular/core';
import THREE = require('three');
import * as AnimationModel from 'src/app/shared/animation.model';
import { SceneUtilsService } from '../utils/scene.utils.service';
import { CanvasCapture } from "canvas-capture"
import * as rasterizeHTML from 'rasterizehtml';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  constructor(public SceneUtilsService: SceneUtilsService) { }
  currentTime = 0;
  play = false;
  stop = false;
  currentTimeChange = false;
  ignore = false;
  selAction: AnimationModel.KeyframeActionModel[] = [];
  selKeyframe: AnimationModel.KeyframeModel[] = [];
  pos = 0;
  id = 0;
  actions: THREE.AnimationAction[] = [];
  mixers: THREE.AnimationMixer[] = [];
  timeLine: AnimationModel.TimelineModel = { tracks: [], duration: 30, scale: 50 };
  recorder = CanvasCapture;
  recording = false;
  recordStart = 0;
  recordEnd = this.timeLine.duration;
  framerate = 60;
  MP4Support = true;
  GIFSupport = true;
  currentFrame = 0;
  duration = this.recordEnd - this.recordStart;
  targetCanvas!: HTMLCanvasElement;

  async LoadAnimationFile(event: Event) {
    console.log(event);
    let f = event.target as any;
    console.log(f.files);
    let str = window.URL.createObjectURL(f.files[0]);
    console.log(str);
    if (str.length != 0) {
      this.ClearAnimation(true);
      await this.LoadAnimation(str, f.files[0].name);
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

  async RenderFrame(canvas: HTMLCanvasElement, width: number, height: number, resize = true) {
    canvas.width = width;
    canvas.height = height
    const aspect = width / height;
    // console.log(this.canvas.width, this.canvas.height);
    let context = canvas.getContext("2d");
    if (this.SceneUtilsService.currentCamera.type == "PerspectiveCamera") {
      this.SceneUtilsService.perspectiveCamera.aspect = aspect;
      this.SceneUtilsService.perspectiveCamera.updateProjectionMatrix();
    }
    else {
      this.SceneUtilsService.orthographicCamera.left = -this.SceneUtilsService.frustumSize * aspect / 2;
      this.SceneUtilsService.orthographicCamera.right = this.SceneUtilsService.frustumSize * aspect / 2;
      this.SceneUtilsService.orthographicCamera.top = this.SceneUtilsService.frustumSize / 2;
      this.SceneUtilsService.orthographicCamera.bottom = -this.SceneUtilsService.frustumSize / 2;
      this.SceneUtilsService.orthographicCamera.updateProjectionMatrix();
    }
    this.SceneUtilsService.renderer.setSize(width, height);
    this.SceneUtilsService.CSSRenderer.setSize(width, height);
    this.SceneUtilsService.renderer.render(this.SceneUtilsService.scene, this.SceneUtilsService.currentCamera);
    this.SceneUtilsService.CSSRenderer.render(this.SceneUtilsService.scene, this.SceneUtilsService.currentCamera);
    if (this.SceneUtilsService.outline)
      if (this.SceneUtilsService.model != undefined)
        this.SceneUtilsService.AppComponent.effect.renderOutline(this.SceneUtilsService.model as any, this.SceneUtilsService.currentCamera);
    context?.drawImage(this.SceneUtilsService.renderer.domElement, 0, 0, width, height);
    await this.RenderHTMLToCanvas(canvas, this.SceneUtilsService.CSSRenderer.domElement);
    if (resize)
      this.SceneUtilsService.onResize();
  }

  async RenderHTMLToCanvas(canvas: HTMLCanvasElement, element: HTMLElement) {
    let scale = 1.15 * canvas.height / window.screen.height;
    // if (scale > 1)
    element.style.fontSize = `${16 * scale}px`;
    element.style.fontFamily = "Roboto, 'Helvetica Neue', sans-serif;";
    console.log(element.style.fontSize);

    await rasterizeHTML.drawHTML(element.outerHTML, canvas);
    element.style.fontSize = `${16}px`;
  }

  CreateTreeViewElements(obj: THREE.Object3D, tabIndex: number = 0, parent?: AnimationModel.KeyframeTrackModel) {
    if (obj.children.length != 0) {
      for (let item of obj.children) {
        if (item.type == "Ignore") {
          continue;
        }
        let keyframeTrack: AnimationModel.KeyframeTrackModel;
        if (parent != undefined) {
          keyframeTrack = {
            id: this.id,
            children: [],
            object: item,
            name: item.name,
            type: "Part",
            actions: [],
            level: tabIndex,
            parent: parent!.id
          };
          parent.children.push(keyframeTrack.id);
        }
        else keyframeTrack = {
          id: this.id,
          children: [],
          object: item,
          name: item.name,
          type: "Part",
          actions: [],
          level: tabIndex,
          parent: -1
        };
        this.id++;
        this.timeLine.tracks.push(keyframeTrack);
        if (item.type == "Object3D" || item.type == "Group") {
          if (item.children.length != 0) {
            tabIndex++;
            this.CreateTreeViewElements(item, tabIndex, keyframeTrack)
            tabIndex--;
          }
        }
        else if (item.type == "Mesh") {
          keyframeTrack.type = "Mesh";
        }
        else if (item.type.includes("Camera")) {
          keyframeTrack.type = "Camera";
        }
        else if (item.type.includes("Light")) {
          keyframeTrack.type = "Light";
        }
        else if (item.type == "zeroPlane") {
          keyframeTrack.type = "Plane";
        }
        else if (item.type == "PlaneHelper") {
          keyframeTrack.type = "Plane";
        }
        else if (item.type == "Annotation") {
          keyframeTrack.type = "Annotation";
        }
      }
    }
  }
  CreateTreeViewElement(obj: THREE.Object3D, parent: AnimationModel.KeyframeTrackModel) {
    let keyframeTrack: AnimationModel.KeyframeTrackModel = {
      id: this.id,
      children: [],
      object: obj,
      name: obj.name,
      type: "Part",
      actions: [],
      level: parent.level + 1,
      parent: parent.id
    };
    this.id++;
    parent.children.push(keyframeTrack.id);
    this.timeLine.tracks.push(keyframeTrack);
    if (/(Light)/g.exec(obj.type) != undefined) {
      keyframeTrack.type = "Light";
    }
    else if (obj.type == "Annotation") {
      keyframeTrack.type = "Annotation";
    }
    else if (obj.type == "Axis") {
      keyframeTrack.type = "Axis";
    }
  }

  DeleteTrack(track: AnimationModel.KeyframeTrackModel) {
    this.ClearTrack(track);
    this.SceneUtilsService.ClearSelection(this.SceneUtilsService.targetArray);
    let parent = this.timeLine.tracks.find(item => item.id == track.parent);
    let n = this.timeLine.tracks.findIndex(item => item.name == track.name);
    let id = parent?.children.findIndex(item => item == track.id);
    parent?.children.splice(id!, 1);
    this.timeLine.tracks.splice(n, 1);
    AnimationModel.GetArrayTimeLine(this.timeLine);
  }
  ClearTrack(track: AnimationModel.KeyframeTrackModel) {
    for (let i = track.actions.length - 1; i >= 0; i--) {
      this.DeleteAction(track.actions[i]);
    }
  }

  CreateAction(track: AnimationModel.KeyframeTrackModel, type: string, valueTypeName: string) {
    let action: AnimationModel.KeyframeActionModel;
    action = { keyframes: [], valueTypeName: valueTypeName, length: 0, start: 0, trackDOM: track, type: type, active: false };
    track.actions.push(action);
    return action;
  }
  UpdateActionDuration(action: AnimationModel.KeyframeActionModel) {
    if (action.track != undefined) {
      action.start = action.track!.times[0];
      action.length = action.track!.times[action.track!.times.length - 1] - action.start;
    }
    this.ignore = false;
  }
  DeleteAction(action: AnimationModel.KeyframeActionModel) {
    for (let i = action.keyframes.length - 1; i >= 0; i--) {
      this.DeleteKeyframe(action.keyframes[i]);
    }
  }
  CreateKeyframe(action: AnimationModel.KeyframeActionModel, type: string, time: number, value: any) {
    let clip: THREE.AnimationClip;
    if (action.trackDOM.object.animations.length == 0) {
      clip = new THREE.AnimationClip(`${action.trackDOM.object.name}`, -1, []);
      action.trackDOM.object.animations.push(clip);
    }
    clip = action.trackDOM.object.animations[0];
    let keyframe: AnimationModel.KeyframeModel = { action: action, time: time, clip: clip, value: value, active: false };
    this.ChangeKeyframe(keyframe);
    action.keyframes.push(keyframe);
    action.track = clip.tracks.find(tr => tr.name == type);
    this.UpdateActionDuration(action);
  }
  ChangeKeyframe(keyframe: AnimationModel.KeyframeModel) {
    let track = keyframe.clip.tracks.find(track => (track.name == keyframe.action.type));
    if (track != undefined) {
      let updateTrack = true;
      for (let i = 0; i < track.times.length; i++) {
        if (Number(track.times[i].toFixed(3)) == Number(keyframe.time.toFixed(3))) {
          updateTrack = false;
          let n = keyframe.value.length;
          for (let j = 0; j < n; j++) {
            track.values[i * n + j] = keyframe.value[j];
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
        this.AddValuesToTrack(keyframe);
      }
    }
    else {
      // Создать трек
      this.AddTrackToClip(keyframe);
    }

    keyframe.clip.resetDuration()
  }
  AddTrackToClip(keyframe: AnimationModel.KeyframeModel) {
    let track = this.CreateKeyframeTrack(keyframe.action.type, keyframe.action.valueTypeName, [keyframe.time], keyframe.value);
    keyframe.clip.tracks.push(track);
    keyframe.clip.resetDuration();
    this.UpdateAnimationAction(keyframe);
  }
  CreateKeyframeTrack(name: string, type: string, times: number[], values: any[]): THREE.KeyframeTrack {
    let newTrack: any;
    switch (type) {
      case "vector":
        newTrack = new THREE.VectorKeyframeTrack(name, times, values);
        break;
      case "quaternion":
        newTrack = new THREE.QuaternionKeyframeTrack(name, times, values);
        break;
      case "number":
        newTrack = new THREE.NumberKeyframeTrack(name, times, values);
        break;
      case "bool":
        newTrack = new THREE.BooleanKeyframeTrack(name, times, values);
        break;
      case "color":
        newTrack = new THREE.ColorKeyframeTrack(name, times, values);
        break;
      case "string":
        newTrack = new THREE.StringKeyframeTrack(name, times, values);
        break;
    }
    return newTrack;
  }
  AddValuesToTrack(keyframe: AnimationModel.KeyframeModel) {
    let times: any[] = [];
    let values: any[] = [];
    let insert = false;
    let track = keyframe.clip.tracks.find(track => (track.name == keyframe.action.type))
    if (track != undefined) {
      for (let i = 0; i < track.times.length; i++) {
        if (!insert)
          if (Number(track.times[i].toFixed(3)) > Number(keyframe.time.toFixed(3))) {
            times.push(Number(keyframe.time.toFixed(3)));
            insert = true;
            let n = keyframe.value.length;
            for (let j = 0; j < n; j++) {
              values.push(keyframe.value[j]);
            }
          }
        times.push(track.times[i]);
        let n = keyframe.value.length;
        for (let j = 0; j < n; j++) {
          values.push(track.values[i * n + j]);
        }
      }
      if (!insert) {
        times.push(keyframe.time);
        insert = true;
        let n = keyframe.value.length;
        for (let j = 0; j < n; j++) {
          values.push(keyframe.value[j]);
        }
      }
      let newTrack = this.CreateKeyframeTrack(track.name, keyframe.action.valueTypeName, times, values);
      keyframe.clip.tracks.find((tr, index) => {
        if (tr.name == newTrack.name)
          keyframe.clip.tracks.splice(index, 1, newTrack);
      })
      keyframe.clip.resetDuration();
      this.UpdateAnimationAction(keyframe);
    }
  }

  UpdateAnimationAction(keyframe: AnimationModel.KeyframeModel) {
    let mixer!: THREE.AnimationMixer;
    let i = this.actions.findIndex(action => action.getClip() == keyframe.clip);
    if (i != -1) {
      let action = this.actions[i];
      action.stop();
      mixer = action.getMixer();
      mixer.uncacheAction(keyframe.clip);
    }
    else {
      mixer = this.mixers.find(mixer => mixer.getRoot() == keyframe.action.trackDOM.object)!;
      if (mixer == undefined) {
        mixer = new THREE.AnimationMixer(keyframe.action.trackDOM.object);
        this.mixers.push(mixer);
      }
    }
    let newAction = mixer.clipAction(keyframe.clip);
    if (i != -1)
      this.actions.splice(i, 1, newAction);
    else this.actions.push(newAction);
    this.UpdatePropertyBinding(newAction, keyframe.action.trackDOM);
    newAction.setLoop(THREE.LoopRepeat, 1);
    newAction.play();
    newAction.clampWhenFinished = true;
    mixer.setTime(keyframe.time);
    if ((mixer as any)._listeners == undefined)
      mixer.addEventListener('finished', function (e) {
        let act = e["action"];
        act.paused = false;
      });
  }

  UpdatePropertyBinding(action: any, track: AnimationModel.KeyframeTrackModel) {
    track.actions.forEach(act => {
      let i = action._propertyBindings.findIndex((mixer: THREE.PropertyMixer) => mixer.binding.path == act.type);
      if (i != undefined) {
        switch (act.type) {
          case ".plane.constant":
            let pl = track.object as any;
            action._propertyBindings[i].binding.propertyName = "constant";
            action._propertyBindings[i].binding.parsedPath.objectName = "plane";
            action._propertyBindings[i].binding.targetObject = pl.plane;
            break;
          case ".element.innerHTML":
            let css2d = track.object as any;
            action._propertyBindings[i].binding.propertyName = "innerHTML";
            action._propertyBindings[i].binding.parsedPath.objectName = "element";
            action._propertyBindings[i].binding.targetObject = css2d.element;
            break;
          case ".userData.angle":
            let axis = track.object as any;
            action._propertyBindings[i].binding.propertyName = "angle";
            action._propertyBindings[i].binding.parsedPath.objectName = "userData";
            action._propertyBindings[i].binding.targetObject = axis.userData;
            break;
        }
      }
    })
  }

  DeleteKeyframe(keyframe: AnimationModel.KeyframeModel) {
    let i = keyframe.clip.tracks.findIndex(track => track.name == keyframe.action.type);
    if (i != -1) {
      let times: any[] = [];
      let values: any[] = [];
      for (let j = 0; j < keyframe.clip.tracks[i].times.length; j++) {
        if (Number(keyframe.clip.tracks[i].times[j].toFixed(3)) != Number(keyframe.time.toFixed(3))) {
          times.push(keyframe.clip.tracks[i].times[j]);
          let n = keyframe.value.length;
          for (let k = 0; k < n; k++) {
            values.push(keyframe.clip.tracks[i].values[j * n + k]);
          }
        }
      }
      if (times.length != 0) {
        let newTrack = this.CreateKeyframeTrack(keyframe.action.type, keyframe.action.valueTypeName, times, values);
        keyframe.clip.tracks.splice(i, 1, newTrack);
        keyframe.action.track = newTrack;
      }
      else {
        keyframe.clip.tracks.splice(i, 1);
        keyframe.action.track = undefined;
        let index = keyframe.action.trackDOM.actions.findIndex(action => action == keyframe.action);
        if (index != -1) {
          keyframe.action.trackDOM.actions.splice(index, 1);
        }
      }
      if (keyframe.clip.tracks.length != 0) {
        keyframe.clip.resetDuration();
        this.UpdateAnimationAction(keyframe);
      }
      else {
        keyframe.action.trackDOM.object.animations = [];
        let index = this.actions.findIndex(action => action.getClip() == keyframe.clip);
        if (index != -1) {
          this.actions.splice(index, 1);
        }
      }
      let index = keyframe.action.keyframes.findIndex(key => key == keyframe);
      keyframe.action.keyframes.splice(index, 1);
      this.UpdateActionDuration(keyframe.action);
    }
  }

  FindMixer(mixers: THREE.AnimationMixer[], obj: any, mix: any[]) {
    let items: any[] = [];
    if (obj.type == "Object3D" || obj.type == "Scene")
      this.SceneUtilsService.FindMeshes(obj, items);
    else {
      items.push(obj);
    }
    items.forEach(item => {
      mixers.forEach(mixer => {
        if (mixer.getRoot() == item) {
          mix.push(mixer);
        }
      });
    });
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

  async LoadAnimation(url: string, fileName: string): Promise<boolean> {
    console.log(fileName);

    if (/(.(xml|xmla)$)/.test(fileName!)) {
      console.log(/(.(xml|xmla)$)/.exec(fileName!)![2]);
      await this.LoadAnimationFromKompasXML(url);
      return true;
    }
    else if (/(.(json|JSON)$)/.test(fileName!)) {
      console.log(/(.(json|JSON)$)/.exec(fileName!)![2]);
      await this.LoadAnimationFromThreeJSON(url);
      return true;
    }
    else return false;
  }

  async LoadAnimationFromThreeJSON(url: string) {
    let response = await fetch(url);
    let buffer = await response.text();
    let json = JSON.parse(buffer);
    console.log(json);
    (json as Array<any>).forEach(item => {
      let clip: THREE.AnimationClip = THREE.AnimationClip.parse(item);
      let animTrack = this.timeLine.tracks.find(track => track.name == item.name);
      if (item.type == "PlaneHelper") {
        if (item.normal != undefined)
          (animTrack?.object as THREE.PlaneHelper).plane.normal.set(item.normal.x, item.normal.y, item.normal.z);
      }
      if (animTrack == undefined) {
        if ((item.type as string).includes("Light")) {
          switch (item.type) {
            case "DirectionalLight":
              this.SceneUtilsService.SceneManagerService.AddDirectionalLight(item.name);
              break;
            case "PointLight":
              this.SceneUtilsService.SceneManagerService.AddPointLight(item.name);
              break;
            case "SpotLight":
              this.SceneUtilsService.SceneManagerService.AddSpotLight(item.name);
              break;
          }
        }
        else if (item.type == "Annotation") {
          let annotation = this.SceneUtilsService.SceneManagerService.AddAnnotation(item.name);
          let track = this.timeLine.tracks.find(track => track.name == item.target);
          if (track) {
            annotation.children[0].userData["target"] = track.object;
          }

        }
        else if (item.type == "Axis") {
          let axis = this.SceneUtilsService.SceneManagerService.AddAxis(item.name);
          if (item.parent != "") {
            let track = this.timeLine.tracks.find(track => track.name == item.parent);
            if (track != undefined) {
              track.object.attach(axis);
              axis.rotation.set(0, 0, 0);
            }
          }
          axis.position.set(item.position.x, item.position.y, item.position.z);
          axis.userData["direction"] = new THREE.Vector3(item.direction.x, item.direction.y, item.direction.z);
          let objects: THREE.Object3D[] = [];
          (item.objects as Array<any>).forEach(objName => {
            let track = this.timeLine.tracks.find(track => track.name == objName);
            if (track != undefined)
              objects.push(track.object);
          });
          axis.userData["objects"] = objects.slice(0);
        }
        animTrack = this.timeLine.tracks.find(track => track.name == item.name);
      }
      clip.tracks.forEach(track => {
        let action = this.CreateAction(animTrack!, track.name, track.ValueTypeName);
        let n = track.getValueSize();
        track.times.forEach((time, i) => {
          let values: any[] = [];
          for (let j = 0; j < n; j++) {
            values.push(track.values[i * n + j]);
          }
          this.CreateKeyframe(action, track.name, time, values);
        })
      })
    })
  }

  async LoadAnimationFromKompasXML(url: string) {
    // Чтение анимации
    // Создание объекта парсера XML/HTML-файлов
    let parser = new DOMParser();
    let response = await fetch(url);
    let buffer = await response.text();
    // Преобразование файла в DOM элемент
    let dom = parser.parseFromString(buffer, "text/xml");
    // Текущий шаг анимации
    let currentStep = 0;
    let stepTime = 0;
    let maxTime = -1;
    //перебор шагов анимации
    dom.children[0].childNodes.forEach(step => {
      if (step.nodeName == "Step") {
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
              }
              if (par! > maxTime) {
                maxTime = par!;
              }
              // Перебор деталей используемых в анимации
              parts.forEach((part: any) => {
                let partMixer: any[] = [];
                // Поиск миксеров(дорожек) анимации
                this.FindMixer(this.mixers, part, partMixer);
                if (partMixer.length != 0) {
                  partMixer.forEach(mixer => {
                    // Добавление анимации перемещения в миксер детали
                    let mesh = mixer.getRoot() as THREE.Mesh;
                    if (move) {
                      mesh.updateWorldMatrix(true, true);
                      let vec = new THREE.Vector3(dx, dy, dz);
                      vec.add(part.position);
                      let startPos = mesh.position;
                      part.worldToLocal(vec);
                      let finalPos = vec.multiplyScalar(par).add(startPos);
                      let track = this.timeLine.tracks.find(track => track.object == mesh);
                      let action = AnimationModel.FindActionByType(track!, ".position");
                      if (action == undefined) {
                        action = this.CreateAction(track!, '.position', 'vector');
                      }
                      this.CreateKeyframe(action, ".position", stepTime, startPos.toArray());
                      this.CreateKeyframe(action, ".position", stepTime + par, finalPos.toArray());
                    }
                    // Добавление анимации прозрачности в миксер детали
                    if (transparancy) {
                      let track = this.timeLine.tracks.find(track => track.object == mesh);
                      let action = AnimationModel.FindActionByType(track!, ".material.opacity");
                      if (action == undefined) {
                        action = this.CreateAction(track!, '.material.opacity', 'number');
                      }
                      this.CreateKeyframe(action, ".material.opacity", stepTime, [start]);
                      this.CreateKeyframe(action, ".material.opacity", stepTime + par, [stop]);

                      let action2 = AnimationModel.FindActionByType(track!, ".visible");
                      if (action2 == undefined) {
                        action2 = this.CreateAction(track!, '.visible', 'bool');
                      }
                      if (stop == 1) {
                        this.CreateKeyframe(action2, ".visible", stepTime, [true]);
                        this.CreateKeyframe(action2, ".visible", stepTime + par, [Boolean(stop)]);
                      }
                      else {
                        this.CreateKeyframe(action2, ".visible", stepTime, [Boolean(start)]);
                        this.CreateKeyframe(action2, ".visible", stepTime + par, [Boolean(stop)]);
                      }
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
    console.log(this.timeLine);
  }

  SaveAnimationAsJSON() {
    let arr: any[] = [];
    console.log(this.actions);
    this.actions.forEach(action => {
      let clip = action.getClip();
      let json = THREE.AnimationClip.toJSON(clip);
      let obj = action.getRoot();
      json.type = obj.type;
      if (obj.type == "PlaneHelper") {
        json.normal = (obj as THREE.PlaneHelper).plane.normal;
      }
      else if (obj.type == "Annotation") {
        json.target = obj.children[0].userData["target"].name;
      }
      else if (obj.type == "Axis") {
        let nameArr: string[] = [];
        (obj.userData["objects"] as Array<THREE.Object3D>).forEach(item => {
          nameArr.push(item.name);
        })
        json.position = obj.position;
        json.parent = obj.parent?.name;
        json.direction = obj.userData["direction"];
        json.objects = nameArr;
      }
      arr.push(JSON.stringify(json));
      console.log(JSON.stringify(json));
    })
    const a = document.createElement("a");
    const file = new Blob(["[" + arr.toString() + "]"], { type: "application/json" });
    a.href = URL.createObjectURL(file);
    a.download = "Animation";
    a.click();
  }

  ClearAnimation(clearTree: boolean = false) {
    this.timeLine.tracks.forEach(track => {
      this.ClearTrack(track);
    })
    this.timeLine.tracks = [];
    console.log(this.actions);
    this.actions = [];
    this.mixers = [];
    this.timeLine.array = [];
    if (clearTree) {
      this.id = 0;
      this.CreateTreeViewElements(this.SceneUtilsService.scene);
      this.CreateMixers(this.SceneUtilsService.model);
      AnimationModel.GetArrayTimeLine(this.timeLine);
    }
  }
}
