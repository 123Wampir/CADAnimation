import { Injectable, Renderer2 } from '@angular/core';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import THREE = require('three');
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { AnimationService } from '../animation/animation.service';
import { ModelloaderService } from '../model/modelloader.service';
import { AppComponent } from 'src/app/app.component';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { SceneManagerService } from '../scene.manager/scene.manager.service';
import { ContextmenuComponent } from 'src/app/components/contextmenu/contextmenu.component';
import { ViewcubeComponent } from 'src/app/components/viewcube/viewcube.component';
import * as AnimationModel from 'src/app/shared/animation.model';
import { GroundProjectedEnv } from 'three/examples/jsm/objects/GroundProjectedEnv';
import { MenubarComponent } from 'src/app/components/menubar/menubar.component';
import { DialogComponent } from 'src/app/components/dialog/dialog.component';

@Injectable({
  providedIn: 'root'
})
export class SceneUtilsService {

  newFileLoading = false;
  fileName = "";
  scene!: THREE.Scene;
  model!: THREE.Object3D;
  renderer!: THREE.WebGLRenderer;
  CSSRenderer!: CSS2DRenderer;

  angRenderer!: Renderer2;

  zeroPlane: THREE.Mesh = new THREE.Mesh();
  skybox!: GroundProjectedEnv;
  backgroundColor = new THREE.Color();

  lightGroup!: THREE.Group;
  annotationGroup!: THREE.Group;
  axisGroup!: THREE.Group;
  axisArray: THREE.Line[] = [];

  planes: THREE.Plane[] = [];
  planeHelpers = new THREE.Group();
  boundingBox!: THREE.Box3;
  boundingSphere!: THREE.Sphere;
  stencilGroups: THREE.Object3D = new THREE.Object3D();
  stencilNeedUpdate: boolean = false;

  selected: THREE.Object3D[] = [];
  selectBox!: THREE.BoxHelper;
  targetArray: THREE.Object3D[] = this.selected;
  selectionChange: boolean = false;
  transformChange: boolean = false;
  transform!: TransformControls;
  attachTransform = true;
  group: THREE.Mesh = new THREE.Mesh();
  startPos: THREE.Vector3[] = [];

  localCenter!: THREE.Vector3;
  offsets: THREE.Vector3[] = [];

  orthographic = false;
  perspectiveCamera!: THREE.PerspectiveCamera;
  orthographicCamera!: THREE.OrthographicCamera;
  frustumSize = 150;
  zoom = 1;
  currentCamera!: THREE.Camera;
  trackball!: TrackballControls;
  renderScale: number = 1;
  stats!: Stats;

  outline: boolean = false;
  wireframe: boolean = false;

  AnimationService!: AnimationService;
  SceneManagerService!: SceneManagerService;
  ModelloaderService!: ModelloaderService;
  AppComponent!: AppComponent;
  ContextmenuComponent!: ContextmenuComponent;
  ViewcubeComponent!: ViewcubeComponent;
  MenubarComponent!: MenubarComponent;
  DialogComponent!: DialogComponent;

  dialogType = "";
  dialogTitle = "";
  dialogShow = false;

  CTRLPressed: boolean = false;
  SHIFTPressed: boolean = false;

  constructor() { }

  async LoadModelFile(event: Event) {
    await this.AppComponent.LoadModelFile(event);
    this.ViewcubeComponent.setView(1, 1, 1);
    if (this.skybox != undefined) {
      let x = (this.boundingBox.max.x + this.boundingBox.min.x) / 2;
      let z = (this.boundingBox.max.z + this.boundingBox.min.z) / 2;
      this.skybox.position.set(x, 0, z);
    }
  }
  SaveModelAsGLTF(event: Event) {
    this.AppComponent.SaveFile(event);
  }

  SetCutPlaneCheckStutas(plane: string, checked: boolean) {
    this.MenubarComponent.SetCutPlaneCheckStutas(plane, checked);
  }

  SwitchCamera() {
    if (this.orthographic) {
      this.currentCamera = this.orthographicCamera;
      this.onResize()
      this.orthographicCamera.updateProjectionMatrix();
    }
    else {
      this.currentCamera = this.perspectiveCamera;
      this.perspectiveCamera.updateProjectionMatrix();
    }
  }
  CopyCameraPlacement() {
    this.orthographicCamera.position.set(this.perspectiveCamera.position.x, this.perspectiveCamera.position.y, this.perspectiveCamera.position.z);
    this.orthographicCamera.rotation.setFromQuaternion(this.perspectiveCamera.quaternion);
    this.zoom = this.trackball.position0.length() / this.perspectiveCamera.position.length() / (2 * Math.atan(Math.PI * this.perspectiveCamera.fov / 360));
    this.zoom /= 1.2;
    this.orthographicCamera.zoom = this.zoom;
    this.orthographicCamera.updateProjectionMatrix();
    this.orthographicCamera.up = this.perspectiveCamera.up;
  }
  UpdateCameraUpVector() {
    this.perspectiveCamera.updateProjectionMatrix();
    this.perspectiveCamera.updateMatrixWorld();
    let dir = new THREE.Vector3();
    this.perspectiveCamera.getWorldDirection(dir);
    let right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
    this.perspectiveCamera.up.crossVectors(right, dir).normalize();
  }

  CalculateCenter(arr: THREE.Object3D[]) {
    let bbox = new THREE.Box3();
    let geomArr: THREE.BufferGeometry[] = [];
    for (let i = 0; i < arr.length; i++) {
      arr[i].updateWorldMatrix(true, true);
      let newGeom = (arr[i] as THREE.Mesh).geometry.clone().applyMatrix4(arr[i].matrixWorld);
      if (newGeom.index != null)
        newGeom = newGeom.toNonIndexed();
      if (newGeom.hasAttribute("color"))
        newGeom.deleteAttribute("color");
      geomArr.push(newGeom);
    }
    if (geomArr.length != 0) {
      let mergedGeom = BufferGeometryUtils.mergeBufferGeometries(geomArr);
      for (let i = 0; i < geomArr.length; i++) {
        geomArr[i].dispose();
      }
      mergedGeom.computeBoundingBox();
      bbox = mergedGeom.boundingBox!.clone();
      this.localCenter = new THREE.Vector3();
      mergedGeom.boundingBox?.getCenter(this.localCenter);
      mergedGeom.dispose();
    }
    return bbox;
  }
  CalculateOffsets(arr: THREE.Object3D[]) {
    this.offsets = [];
    arr.forEach(item => {
      let wPos = new THREE.Vector3();
      item.getWorldPosition(wPos);
      let offset = wPos.clone().sub(this.localCenter).normalize();
      this.offsets.push(offset);
    })
  }
  OnExplode(arr: THREE.Object3D[], length: number) {
    arr.forEach((item, index) => {
      let ps = new THREE.Vector3();
      item.getWorldPosition(ps);
      let pos = item.worldToLocal(ps
        .clone()
        .add(this.offsets[index].clone().multiplyScalar(length)))
        .add(this.startPos[index]);
      item.position.set(pos.x, pos.y, pos.z);
      item.updateMatrixWorld(true);
    })
  }

  SetDisableStyle(value: boolean) {
    if (!value) {
      return {
        'pointer-events': 'none',
        'opacity': '0.5'
      };
    }
    return {};
  }

  RotateOnAxis(objects: THREE.Object3D[], position: THREE.Vector3, direction: THREE.Vector3, angle: number) {
    let dir = direction.clone();
    objects.forEach(item => {
      item.updateMatrixWorld(true);
      let pos = new THREE.Vector3().setFromMatrixPosition(item.matrixWorld);
      let diff = pos.clone().sub(position);
      diff.applyAxisAngle(dir, angle * Math.PI / 180);
      diff.add(position);
      let globalQ = this.model.quaternion.clone().invert();
      item.rotateOnWorldAxis(dir.clone().applyQuaternion(globalQ), angle * Math.PI / 180);
      diff.applyQuaternion(globalQ);
      item.position.set(diff.x, diff.y, diff.z);
      item.updateMatrixWorld(true);
    })
  }

  createPlaneStencilGroup(geometry: any, plane: THREE.Plane, renderOrder: number) {
    const group = new THREE.Object3D();
    group.type = "Ignore";
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
    baseMat.dispose();
    return group;
  }
  UpdateStencilGeometry(arr: any[], group: THREE.Object3D) {
    let geomArr: THREE.BufferGeometry[] = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].visible && arr[i].material.opacity != 0) {
        if (arr[i].type == "Mesh") {
          arr[i].updateWorldMatrix(true, true);
          let newGeom = arr[i].geometry.clone().applyMatrix4(arr[i].matrixWorld);
          if (newGeom.index != null)
            newGeom = newGeom.toNonIndexed();
          if (newGeom.hasAttribute("color"))
            newGeom.deleteAttribute("color");
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
        mesh.geometry = mergedGeom;
      }
    }
    else {
      for (let i = 0; i < group.children.length; i++) {
        let mesh = group.children[i] as any;
        mesh.geometry.dispose();
        mesh.geometry = new THREE.BufferGeometry();
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
    (x.material as any).visible = false;
    (x.children[0] as any).material.visible = false;
    (y.material as any).visible = false;
    (y.children[0] as any).material.visible = false;
    (z.material as any).visible = false;
    (z.children[0] as any).material.visible = false;
    this.planeHelpers.add(x);
    this.planeHelpers.add(y);
    this.planeHelpers.add(z);
    arr.forEach(item => {
      if (item.type == "Mesh") {
        item.material.clippingPlanes = this.planes;
        item.material.clipShadows = true;
      }
    })
  }

  CalculateBounding(object: any) {
    let arr: any[] = [];
    let bbox = new THREE.Box3();
    this.FindMeshes(object, arr);
    let geomArr: THREE.BufferGeometry[] = [];
    arr.forEach((obj) => {
      if (obj.type == "Mesh") {
        if (obj.visible) {
          let item = (obj as any)
          item.updateWorldMatrix(true, true);
          let newGeom = item.geometry.clone().applyMatrix4(item.matrixWorld);
          if (newGeom.index != null)
            newGeom = newGeom.toNonIndexed();
          if (newGeom.hasAttribute("color"))
            newGeom.deleteAttribute("color");
          geomArr.push(newGeom);
        }
      }
    })
    let mergedGeom = BufferGeometryUtils.mergeBufferGeometries(geomArr);
    mergedGeom.computeBoundingBox();
    bbox = mergedGeom.boundingBox!.clone();
    mergedGeom.computeBoundingSphere();
    this.boundingBox = mergedGeom.boundingBox!;
    this.boundingSphere = mergedGeom.boundingSphere!;
    geomArr.forEach(geo => {
      geo.dispose();
    })
    mergedGeom.dispose();
    return bbox;
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
  SetZeroPlane() {
    this.zeroPlane.position.set(this.zeroPlane.position.x, this.boundingBox.min.y, this.zeroPlane.position.z);
  }

  ClearSelection(target: THREE.Object3D[]) {
    if (target.length != 0) {
      target.forEach(item => {
        let mesh = item as any;
        if (mesh.material != undefined)
          if (mesh.material.emissive != undefined)
            mesh.material.emissive.set(0x000000);
      })
      target.splice(0, target.length);
    }
    console.log("HERE");

    this.selectionChange = !this.selectionChange;
    this.transform.detach();
  }
  Select(target: THREE.Object3D[], obj: any, CTRLPressed: boolean) {
    let transform = false;
    if (!CTRLPressed) {
      this.selectionChange = !this.selectionChange;
      this.ClearSelection(target);
    }
    switch (obj.type) {
      case "Mesh":
        if (obj.material.emissive)
          obj.material.emissive.set(0x004400);
        console.log(obj.material);

        let i = target.findIndex(item => item == obj);
        if (i == -1) {
          target.push(obj);
        }
        transform = true;
        break;
      case "Object3D":
        let arr: any[] = [];
        this.FindMeshes(obj, arr);
        arr.forEach(mesh => {
          if (mesh.material.emissive != undefined)
            mesh.material.emissive.set(0x004400);
          target.push(mesh);
        })
        transform = true;
        break;
      default:
        target.splice(0, target.length);
        if (obj.type != "Group") {
          target.push(obj);
          if (obj.type.includes("Camera") || obj.type == "PlaneHelper")
            transform = false;
          else transform = true;
        }
        break;
    }
    if (this.attachTransform && transform) {
      if (target.length > 1) {
        this.startPos = [];
        this.group.position.set(0, 0, 0);
        this.group.rotation.set(0, 0, 0);
        target.forEach(item => {
          this.startPos.push(item.position.clone());
        })
        this.scene.add(this.group);
        this.transform.attach(this.group);
        (this.transform as any)._listeners["objectChange"] = [];
        this.transform.addEventListener("objectChange", (e) => {
          target.forEach((item, index) => {
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
        this.transform.attach(obj);
        (this.transform as any)._listeners["objectChange"] = [];
        this.transform.addEventListener("objectChange", (e) => {
          let vec = target[0].position;
          target[0].position.set(vec.x, vec.y, vec.z);
          this.transformChange = !this.transformChange;
        })
      }
    }
    if (this.attachTransform)
      this.selectionChange = !this.selectionChange;
  }

  RenameObject(track: AnimationModel.KeyframeTrackModel, newName: string) {
    if (newName.length != 0) {
      this.AnimationService.timeLine.array?.find(item => {
        if (item.name == track.name) {
          item.name = newName;
          return true;
        } else return false
      });
      track.actions.forEach(action => {
        action.keyframes[0].clip.name = newName;
      })
      track.object.name = newName;
      track.name = newName;
    }
  }

  DisposeObject(obj: any) {
    if (obj.geometry != undefined) {
      obj.geometry.dispose();
      obj.material.dispose();
    }
    if (obj.material != undefined) {
      obj.material.dispose();
    }
    if (obj.dispose != undefined) {
      obj.dispose();
    }
  }

  ClearScene() {
    if (this.model != undefined) {
      this.transform.detach();
      console.log(this.scene);
      this.scene.traverse(obj => {
        if (obj != this.transform)
          this.DisposeObject(obj);
      })
      this.model.clear();
      this.model.scale.set(1, 1, 1);

      this.fileName = "";
      this.startPos = [];
      this.AnimationService.ClearAnimation();

      this.planeHelpers.traverse(obj => {
        this.DisposeObject(obj);
      });
      this.planeHelpers.clear();
      console.log(this.lightGroup);

      let ambient = this.lightGroup.children[0];
      this.lightGroup.traverse(obj => {
        if (obj.type != "AmbientLight" && obj != this.lightGroup) {
          this.DisposeObject(obj);
        }
      });
      this.lightGroup.clear();
      this.lightGroup.add(ambient);
      this.annotationGroup.traverse(obj => {
        this.DisposeObject(obj);
      });
      this.annotationGroup.clear();
      this.axisArray.forEach(obj => {
        this.DisposeObject(obj);
        obj.removeFromParent();
      })
      this.axisArray = [];

      this.renderer.renderLists.dispose();
      this.renderer.getRenderTarget()?.dispose();
      this.renderer.clear();
      console.log(this.renderer.info.render);
      console.log(this.renderer.info.memory);
    }
  }

  onResize(event?: any) {
    if (!this.AnimationService.recorder.isRecording()) {
      let aspect = window.innerWidth / window.innerHeight;
      let width = window.innerWidth * 0.99;
      let height = window.innerHeight * 0.99;
      if (this.currentCamera.type == "PerspectiveCamera") {
        this.perspectiveCamera.aspect = aspect;
        this.perspectiveCamera.updateProjectionMatrix();
      }
      else {
        this.orthographicCamera.left = -this.frustumSize * aspect / 2;
        this.orthographicCamera.right = this.frustumSize * aspect / 2;
        this.orthographicCamera.top = this.frustumSize / 2;
        this.orthographicCamera.bottom = -this.frustumSize / 2;
        this.orthographicCamera.updateProjectionMatrix();
      }
      this.renderer.setSize(width, height);
      this.CSSRenderer.setSize(width, height);
      this.renderer.setPixelRatio(window.devicePixelRatio * this.renderScale);
    }
  }
}
