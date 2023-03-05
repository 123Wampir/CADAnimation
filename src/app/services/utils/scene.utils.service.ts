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

@Injectable({
  providedIn: 'root'
})
export class SceneUtilsService {

  newFileLoading = false;
  scene!: THREE.Scene;
  model!: THREE.Object3D;
  renderer!: THREE.WebGLRenderer;
  CSSRenderer!: CSS2DRenderer;

  angRenderer!: Renderer2;

  zeroPlane: THREE.Mesh = new THREE.Mesh();

  lightGroup!: THREE.Group;
  annotationGroup!: THREE.Group;
  axisGroup: THREE.Line[] = [];

  planes: THREE.Plane[] = [];
  planeHelpers = new THREE.Group();
  boundingBox!: THREE.Box3;
  boundingSphere!: THREE.Sphere;
  stencilGroups: THREE.Object3D = new THREE.Object3D();
  stencilNeedUpdate: boolean = false;

  selected: THREE.Object3D[] = [];
  selectReturn: boolean = false;
  selectTarget: string = "";
  selectionChange: boolean = false;
  transform!: TransformControls;
  group: THREE.Mesh = new THREE.Mesh();
  transformChange: boolean = false;
  startPos: THREE.Vector3[] = [];

  orthographic = false;
  perspectiveCamera!: THREE.PerspectiveCamera;
  orthographicCamera!: THREE.OrthographicCamera;
  frustumSize = 150;
  zoom = 1;
  currentCamera!: THREE.Camera;
  orbit!: TrackballControls;
  renderScale: number = 1;
  stats!: Stats;

  outline: boolean = false;
  wireframe: boolean = false;

  AnimationService!: AnimationService;
  SceneManagerService!: SceneManagerService;
  ModelloaderService!: ModelloaderService;
  AppComponent!: AppComponent;
  ContextmenuComponent!: ContextmenuComponent;
  ViewcubeComponent!:ViewcubeComponent;

  CTRLPressed: boolean = false;
  SHIFTPressed: boolean = false;

  constructor() { }

  LoadModelFile(event: Event) {
    this.AppComponent.LoadModelFile(event);
  }
  SaveModelAsGLTF(event: Event) {
    this.AppComponent.SaveFile(event);
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
    this.zoom = this.orbit.position0.length() / this.perspectiveCamera.position.length() / (2 * Math.atan(Math.PI * this.perspectiveCamera.fov / 360));
    this.zoom /= 1.2;
    this.orthographicCamera.zoom = this.zoom;
    this.orthographicCamera.updateProjectionMatrix();
    this.orthographicCamera.up = this.perspectiveCamera.up;
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
    mergedGeom.computeBoundingBox();
    mergedGeom.computeBoundingSphere();
    this.boundingBox = mergedGeom.boundingBox!;
    this.boundingSphere = mergedGeom.boundingSphere!;
    geomArr.forEach(geo => {
      geo.dispose();
    })
    let planeGeom = new THREE.PlaneGeometry(1000, 1000);
    let planeMat =
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
    for (let i = 0; i < 3; i++) {
      // let stencil = this.createPlaneStencilGroup(mergedGeom, this.planes[i], i + 1);
      // let po = new THREE.Mesh(planeGeom, planeMat);
      // po.layers.set(1);
      // po.onAfterRender = function (render) {
      //   render.clearStencil();
      // };
      // po.renderOrder = i + 2;
      // this.stencilGroups.add(stencil);
      // this.planeHelpers.children[i].add(po);
    }
    mergedGeom.dispose();
    planeGeom.dispose();
    planeMat.dispose();
    this.stencilGroups.type = "Ignore";
    this.scene.add(this.stencilGroups);
    this.stencilNeedUpdate = true;
  }

  CalculateBounding(object: any) {
    let arr: any[] = [];
    this.FindMeshes(object, arr);
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
    mergedGeom.computeBoundingBox();
    mergedGeom.computeBoundingSphere();
    this.boundingBox = mergedGeom.boundingBox!;
    this.boundingSphere = mergedGeom.boundingSphere!;
    geomArr.forEach(geo => {
      geo.dispose();
    })
    mergedGeom.dispose();
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
    this.zeroPlane.position.set(this.zeroPlane.position.x, this.zeroPlane.position.y, this.boundingBox.min.z);
  }

  ClearSelection() {
    if (this.selected.length != 0) {
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
    if (this.selectReturn) {
      switch (this.selectTarget) {
        case "Annotation":
          (this.selected[0].children[0] as THREE.Line).geometry.userData["target"] = obj;
          break;
        case "Axis":
          obj.attach(this.selected[0]);
          break;
      }
      this.selectionChange = !this.selectionChange;
      this.selectReturn = false;
      return obj;
    }
    if (!CTRLPressed) {
      this.selectionChange = !this.selectionChange;
      this.ClearSelection();
    }
    if (obj.type == "Mesh") {
      if (obj.material.emissive)
        obj.material.emissive.set(0x004400);
      let i = this.selected.findIndex(item => item == obj);
      if (i == -1) {
        this.selected.push(obj);
        this.transform.attach(obj);
      }
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
      this.selected = [];
      this.selected.push(obj);
      this.transform.attach(obj);
    }
    else if (/(Camera)/g.exec(obj.type) != undefined) {
      this.selected = [];
      this.selected.push(obj);
      this.transform.detach();
    }
    else if (obj.type == "Axis") {
      this.selected = [];
      this.selected.push(obj);
      this.transform.attach(obj);
    }
    else if (obj.type == "PlaneHelper") {
      this.selected = [];
      this.selected.push(obj);
      this.transform.detach();
    }
    else if (obj.type == "Annotation") {
      this.selected = [];
      this.selected.push(obj);
      this.transform.attach(obj);
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

  ClearScene() {
    if (this.model != undefined) {
      console.log(this.scene);
      this.model.traverse(item => {
        if (item.type == "Mesh" || item.type == "LineSegments") {
          // console.log(item);
          (item as any).geometry.dispose();
          (item as any).material.dispose();
        }
      })
      this.model.clear();
      this.startPos = [];
      this.AnimationService.ClearAnimation();
      this.planeHelpers.traverse(obj => {
        if (obj.type == "Mesh" || obj.type == "PlaneHelper" || obj.type == "Stencil") {
          (obj as any).geometry.dispose();
          (obj as any).material.dispose();
        }
      })
      this.planeHelpers.clear();
      this.stencilGroups.traverse(obj => {
        if (obj.type == "Mesh" || obj.type == "LineSegments") {
          (obj as any).geometry.dispose();
          (obj as any).material.dispose();
        }
      })
      this.stencilGroups.clear();
      this.renderer.renderLists.dispose();
      this.renderer.getRenderTarget()?.dispose();
      this.renderer.clear();
      console.log(this.renderer.info.render);
      console.log(this.renderer.info.memory);
    }
  }

  onResize(event?: any) {
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
