import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { AnimationService } from './services/animation/animation.service';
import { degToRad } from 'three/src/math/MathUtils';
import { ModelloaderService } from './services/model/modelloader.service';
import { SceneUtilsService } from './services/utils/scene.utils.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  constructor(public AnimationService: AnimationService, private ModelloaderService: ModelloaderService, public SceneUtilsService: SceneUtilsService) { }

  @ViewChild('canvas') canvasRef!: ElementRef;
  get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement
  }
  title = 'CADAnimation';
  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  camera: any;
  firstClick = false;
  mainObject!: THREE.Object3D;
  intersection: any;
  pointer!: THREE.Vector2;
  raycaster!: THREE.Raycaster;
  orbitControls!: TrackballControls;
  transformControls!: TransformControls;
  meshArr: THREE.Mesh[] = [];
  counter = 0;
  delta = 0.016;
  effect!: OutlineEffect;


  CreateScene() {
    this.scene = new THREE.Scene();
    // Добавление и настройка камеры
    this.camera = new THREE.PerspectiveCamera(45, this.getAspectRatio(), 1.0, 100000.0);
    this.camera.name = this.camera.type;
    this.camera.position.set(50.0, 150.0, 100.0);
    this.camera.up.set(0.0, 0.0, 1.0);
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
    let CamerasContainer = new THREE.Object3D();
    CamerasContainer.name = "Cameras";
    CamerasContainer.type = "Container";
    this.scene.add(CamerasContainer);
    CamerasContainer.add(this.camera);
    this.SceneUtilsService.currentCamera = this.camera;


    // Добавление глобального освещения
    const ambientLight = new THREE.AmbientLight(0xffffff);
    ambientLight.name = ambientLight.type;
    this.scene.add(ambientLight);
    // Добавление направленного света
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
    directionalLight.name = directionalLight.type;
    var lightHelper = new THREE.DirectionalLightHelper(directionalLight, 10, directionalLight.color);
    lightHelper.matrixWorld = directionalLight.matrixWorld;
    directionalLight.add(lightHelper);
    directionalLight.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
    let cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    directionalLight.add(cameraHelper);
    cameraHelper.matrixWorld = directionalLight.shadow.camera.matrixWorld;
    this.scene.add(directionalLight);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    const planeGeometry = new THREE.PlaneGeometry(10000, 10000, 32, 32);
    const planeMaterial = new THREE.ShadowMaterial({ color: 0x000000, side: THREE.DoubleSide, alphaToCoverage: true })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.name = "Zero Plane";
    plane.type = "zeroPlane";
    const planeHelper = new THREE.GridHelper(1000, 100, 0x000000, 0xaaaaaa);
    plane.add(planeHelper.rotateX(degToRad(90)));
    planeHelper.visible = false;
    plane.receiveShadow = true;
    this.scene.add(plane);
    this.SceneUtilsService.zeroPlane = plane;
    this.SceneUtilsService.planeHelpers.type = "Container";
    this.SceneUtilsService.planeHelpers.name = "CuttingPlanes";
    this.scene.add(this.SceneUtilsService.planeHelpers);
  }
  startRenderingLoop() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, failIfMajorPerformanceCaveat: true });
    this.SceneUtilsService.scene = this.scene;
    this.SceneUtilsService.renderer = this.renderer;
    this.renderer.shadowMap.enabled = true;
    // this.renderer.localClippingEnabled = true;
    this.renderer.physicallyCorrectLights = true;
    console.log(this.renderer);
    this.renderer.setSize(window.innerWidth * 0.99, window.innerHeight * 0.99);
    this.renderer.setClearColor(0xffffff);
    this.orbitControls = new TrackballControls(this.camera, this.renderer.domElement);
    console.log(this.orbitControls);


    this.effect = new OutlineEffect(this.renderer);

    this.orbitControls.rotateSpeed = 10;
    this.orbitControls.panSpeed = 1.5;
    this.orbitControls.staticMoving = true;
    this.SceneUtilsService.orbit = this.orbitControls;
    this.orbitControls.addEventListener('change', (event: any) => {
      this.firstClick = true;
    })
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.space = "local";
    this.transformControls.type = "TransformControls";
    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.orbitControls.enabled = !event["value"];
    });
    this.transformControls.addEventListener('mouseUp', (event) => {
      this.firstClick = true;
    });
    this.SceneUtilsService.transform = this.transformControls;
    this.scene.add(this.transformControls);
    this.SceneUtilsService.stats = Stats();
    this.SceneUtilsService.stats.dom.style.right = "0px";
    this.SceneUtilsService.stats.dom.style.left = "";
    this.canvas.parentElement?.appendChild(this.SceneUtilsService.stats.dom);
    let component = this;
    (function animate() {
      if (component.mainObject != undefined) {
        component.FindIntersection();
        if (component.SceneUtilsService.stencilNeedUpdate && component.renderer.localClippingEnabled)
          if (component.meshArr.length != 0) {
            for (let i = 0; i < component.SceneUtilsService.stencilGroups.children.length; i++) {
              component.SceneUtilsService.UpdateStencilGeometry(component.meshArr, component.SceneUtilsService.stencilGroups.children[i])
            }
            component.SceneUtilsService.stencilNeedUpdate = false;
          }
      }
      //component.renderer.shadowMap.needsUpdate = true;
      component.orbitControls.update()
      requestAnimationFrame(animate);

      component.SceneUtilsService.stats.update();
      if (component.AnimationService.play) {
        component.AnimationService.currentTime += component.delta;
        if (component.AnimationService.currentTime > component.AnimationService.timeLine.duration) {
          component.AnimationService.play = false;
          component.AnimationService.currentTime = component.AnimationService.timeLine.duration;
        }
        component.AnimationService.actions.forEach(action => {
          let mixer = action.getMixer();
          mixer.setTime(0);
          mixer.update(component.AnimationService.currentTime);
        })
      }
      else {
        if (component.AnimationService.currentTimeChange) {
          component.AnimationService.actions.forEach(action => {
            let mixer = action.getMixer();
            mixer.setTime(0);
            mixer.update(component.AnimationService.currentTime);
          })
          component.AnimationService.currentTimeChange = false;
        }
      }
      if (component.AnimationService.stop) {
        component.AnimationService.currentTime = 0;
        component.AnimationService.play = false;
        component.AnimationService.actions.forEach(action => {
          let mixer = action.getMixer();
          mixer.setTime(0);
          action.reset();
        })
        component.AnimationService.stop = false;
      }
      component.counter++;
      if (component.counter == 2) {
        component.SceneUtilsService.stencilNeedUpdate = true;
        component.counter = 0;
      }
      component.renderer.render(component.scene, component.SceneUtilsService.currentCamera);

      //effects
      // component.AnimationService.planeHelpers.removeFromParent();
      // component.AnimationService.zeroPlane.removeFromParent();
      // component.effect.renderOutline(component.scene, component.camera);
      // component.scene.add(component.AnimationService.planeHelpers);
      // component.scene.add(component.AnimationService.zeroPlane);
    }());
  }
  ngOnInit() {
  }
  async ngAfterViewInit() {
    this.SceneUtilsService.AnimationService = this.AnimationService;
    this.CreateScene()
    this.startRenderingLoop()
    this.mainObject = new THREE.Object3D();
    this.mainObject.name = "Model";
    this.scene.add(this.mainObject)
    console.log(this.scene);
  }
  async LoadFile(event: Event) {
    console.log(event);
    let f = event.target as any;
    console.log(f.files);
    if (f.files.length != 0) {
      f.files[0]
    }
    let str = window.URL.createObjectURL(f.files[0]);
    console.log(str);
    let res: boolean = await this.ModelloaderService.LoadModel(str, f.files[0].name, this.mainObject)
    console.log(res);
    if (res) {
      this.PrepareScene();
    }
  }
  PrepareScene() {
    this.meshArr.forEach(mesh => {
      (mesh as any).geometry.dispose();
      (mesh as any).material.dispose();
    });
    this.meshArr = [];
    this.CreateUniqueGeometry(this.mainObject);
    this.CreateUniqueMaterial(this.mainObject);
    this.FixMeshPivot(this.mainObject);
    this.SceneUtilsService.model = this.mainObject;
    this.SceneUtilsService.FindMeshes(this.mainObject, this.meshArr);
    //console.log(component.meshArr);
    let arr: any[] = [];
    this.SceneUtilsService.FindMeshes(this.mainObject, arr);
    this.SceneUtilsService.CreateClippingPlanes(arr);
    this.SceneUtilsService.SetZeroPlane();
    // Создание миксеров(дорожек) для модели
    this.AnimationService.CreateMixers(this.mainObject);
    this.SceneUtilsService.newFileLoading = !this.SceneUtilsService.newFileLoading;
  }
  FixMeshPivot(obj: THREE.Object3D) {
    obj.children.forEach(part => {
      let arr: any[] = [];
      this.SceneUtilsService.FindMeshes(part, arr);
      let vec = new THREE.Vector3(0, 0, 0);
      arr.forEach(mesh => {
        let geom = mesh as THREE.Mesh;
        let vec = new THREE.Vector3(0, 0, 0);
        var geometry = geom.geometry;
        geometry.computeBoundingBox();
        var center = new THREE.Vector3();
        geometry.boundingBox?.getCenter(center);
        geom.localToWorld(center);
        geometry.center()
        geom.position.set(center.x, center.y, center.z);
      })
    })
  }
  CreateUniqueMaterial(obj: THREE.Object3D) {
    let arr: any[] = [];
    this.SceneUtilsService.FindMeshes(obj, arr);
    if (arr.length != 0) {
      arr.forEach(mesh => {
        mesh.material = mesh.material.clone();
        mesh.material.side = THREE.FrontSide;
        mesh.material.transparent = true;
        mesh.material.alphaToCoverage = true;
        mesh.material.clipIntersection = true;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
      })
    }
  }
  CreateUniqueGeometry(obj: THREE.Object3D) {
    let arr: any[] = [];
    this.SceneUtilsService.FindMeshes(obj, arr);
    if (arr.length != 0) {
      arr.forEach(mesh => {
        mesh.geometry = mesh.geometry.clone();
      })
    }
  }
  getAspectRatio() {
    return window.innerWidth / window.innerHeight;
  }
  FindIntersection() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    // Рассчитывается какие объекты пересеклись с лучом
    const intersects = this.raycaster.intersectObjects(this.mainObject.children);
    if (intersects.length != 0) {
      if (this.intersection != intersects[0].object) {
        if (this.intersection) {
          if (this.SceneUtilsService.selected.find((item) => (item == this.intersection)) == undefined)
            if (this.intersection.material.emissive)
              this.intersection.material.emissive.set(0x000000);
        }
        this.intersection = intersects[0].object;
        if (this.intersection.material.emissive)
          this.intersection.material.emissive.set(0x004400);
      }
    }
    else {
      if (this.intersection) {
        if (this.SceneUtilsService.selected.find((item) => (item == this.intersection)) == undefined)
          if (this.intersection.material.emissive)
            this.intersection.material.emissive.set(0x000000);
        this.intersection = null;
      }
    }
  }
  async CreateEdgesForMeshes(obj: any, threshold: number) {
    if (obj.children.length != 0) {
      for (let item of obj.children) {
        if (item.type == "Object3D") {
          this.CreateEdgesForMeshes(item, threshold);
        }
        else if (item.type == "Mesh") {

          let edges = new THREE.EdgesGeometry(item.geometry, threshold);
          let line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1/*, depthTest: false */ }));
          item.add(line)
        }
      }
    }
  }
  async CreateEdges(obj: THREE.Object3D, show: boolean, threshold: number) {
    if (show) {
      if (obj.children.length != 0) {
        for (let item of obj.children) {
          if (item.type == "Object3D") {
            await this.CreateEdgesForMeshes(item, threshold);
          }
        }
      }
    }
  }
  onClick(event: MouseEvent) {
    this.AnimationService.contextMenu = false;
    if (!this.firstClick) {
      if (this.intersection != undefined) {
        this.SceneUtilsService.Select(this.intersection, this.SceneUtilsService.CTRLPressed);
      }
      else {
        this.SceneUtilsService.ClearSelection()
      }
    }
    else { this.firstClick = false }
  }
  onPointerMove(event: MouseEvent) {
    // console.log(event)
    this.pointer.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.pointer.y = - (event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
  }
  onKeyDown(event: KeyboardEvent) {
    if (event.key == "Control") {
      this.SceneUtilsService.CTRLPressed = true;
    }

  }
  onKeyUp(event: KeyboardEvent) {
    if (event.key == "Control") {
      this.SceneUtilsService.CTRLPressed = false;
    }
  }
}
