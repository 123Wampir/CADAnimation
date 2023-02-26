import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { AnimationService } from './services/animation/animation.service';
import { degToRad } from 'three/src/math/MathUtils';
import { ModelloaderService } from './services/model/modelloader.service';
import { SceneUtilsService } from './services/utils/scene.utils.service';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { Reflector } from './shared/Reflector/Reflector';
import { SceneManagerService } from './services/scene.manager/scene.manager.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  constructor(public AnimationService: AnimationService,
    private ModelloaderService: ModelloaderService,
    public SceneUtilsService: SceneUtilsService,
    private SceneManagerService: SceneManagerService) { }

  @ViewChild('canvas') canvasRef!: ElementRef;
  get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement
  }
  title = 'CADAnimation';
  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  orthographicCamera: any;
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
    this.SceneUtilsService.scene = this.scene;
    // Добавление и настройка камеры
    this.SceneUtilsService.perspectiveCamera = new THREE.PerspectiveCamera(45, this.getAspectRatio(), 1.0, 50000.0);
    this.SceneUtilsService.perspectiveCamera.layers.enable(1);
    this.SceneUtilsService.perspectiveCamera.name = "Camera";
    this.SceneUtilsService.perspectiveCamera.position.set(50.0, 150.0, 100.0);
    this.SceneUtilsService.perspectiveCamera.up.set(0.0, 0.0, 1.0);
    this.SceneUtilsService.perspectiveCamera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
    this.scene.add(this.SceneUtilsService.perspectiveCamera);
    this.SceneUtilsService.currentCamera = this.SceneUtilsService.perspectiveCamera;
    let aspect = this.getAspectRatio();
    this.SceneUtilsService.orthographicCamera = new THREE.OrthographicCamera(
      this.SceneUtilsService.frustumSize * aspect / -2,
      this.SceneUtilsService.frustumSize * aspect / 2,
      this.SceneUtilsService.frustumSize / 2,
      this.SceneUtilsService.frustumSize / - 2, 0, 100000.0);
    this.SceneUtilsService.orthographicCamera.layers.enable(1);
    (this.SceneUtilsService.orthographicCamera.type as any) = "Ignore";
    this.scene.add(this.SceneUtilsService.orthographicCamera);


    // Добавление глобального освещения
    this.SceneUtilsService.lightGroup = new THREE.Group();
    this.SceneUtilsService.lightGroup.name = "Lights";
    this.scene.add(this.SceneUtilsService.lightGroup);
    const ambientLight = new THREE.AmbientLight(0xffffff);
    ambientLight.name = ambientLight.type;
    this.SceneUtilsService.lightGroup.add(ambientLight);
    // Добавление направленного света
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
    directionalLight.name = directionalLight.type;
    var lightHelper = new THREE.DirectionalLightHelper(directionalLight, 10, directionalLight.color);
    lightHelper.matrixWorld = directionalLight.matrixWorld;
    directionalLight.add(lightHelper);
    directionalLight.position.add(this.SceneUtilsService.perspectiveCamera.position);
    let cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    directionalLight.add(cameraHelper);
    cameraHelper.matrixWorld = directionalLight.shadow.camera.matrixWorld;
    this.SceneUtilsService.lightGroup.add(directionalLight);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    const planeGeometry = new THREE.PlaneGeometry(10000, 10000, 32, 32);
    const planeMaterial = new THREE.ShadowMaterial({ color: 0x000000, side: THREE.DoubleSide, alphaToCoverage: true })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.name = "Zero Plane";
    plane.type = "Ignore";
    const planeHelper = new THREE.GridHelper(1000, 100, 0x000000, 0xaaaaaa);
    plane.add(planeHelper.rotateX(degToRad(90)));
    planeHelper.visible = false;
    plane.receiveShadow = true;
    let mirror = new Reflector(planeGeometry, {
      clipBias: 0.003,
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
      color: 0xb5b5b5
    });
    mirror.position.z = -0.05;
    mirror.camera.layers.set(0);
    plane.add(mirror);
    this.scene.add(plane);
    this.SceneUtilsService.zeroPlane = plane;
    this.SceneUtilsService.planeHelpers.name = "CuttingPlanes";
    this.scene.add(this.SceneUtilsService.planeHelpers);


    this.SceneUtilsService.annotationGroup = new THREE.Group();
    this.SceneUtilsService.annotationGroup.name = "Annotations";
    this.scene.add(this.SceneUtilsService.annotationGroup);
  }
  startRenderingLoop() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, failIfMajorPerformanceCaveat: true });
    this.SceneUtilsService.renderer = this.renderer;
    this.renderer.shadowMap.enabled = true;
    // this.renderer.localClippingEnabled = true;
    this.renderer.physicallyCorrectLights = true;
    console.log(this.renderer);
    this.renderer.setSize(window.innerWidth * 0.99, window.innerHeight * 0.99);
    // this.renderer.sortObjects = false;
    this.renderer.setClearColor(0xffffff);
    let rendererDOM = this.SceneUtilsService.angRenderer.createElement('div');
    this.SceneUtilsService.CSSRenderer = new CSS2DRenderer({ element: rendererDOM });
    this.SceneUtilsService.CSSRenderer.setSize(window.innerWidth, window.innerHeight);
    this.SceneUtilsService.CSSRenderer.domElement.style.position = 'absolute';
    this.SceneUtilsService.CSSRenderer.domElement.style.top = '0px';
    this.SceneUtilsService.CSSRenderer.domElement.style.pointerEvents = 'none';
    this.SceneUtilsService.angRenderer.addClass(this.SceneUtilsService.CSSRenderer.domElement, "annotation-renderer");
    document.body.appendChild(this.SceneUtilsService.CSSRenderer.domElement);

    this.effect = new OutlineEffect(this.renderer);

    this.orbitControls = new TrackballControls(this.SceneUtilsService.currentCamera, this.renderer.domElement);
    console.log(this.orbitControls);
    this.orbitControls.rotateSpeed = 10;
    this.orbitControls.panSpeed = 1.5;
    this.orbitControls.staticMoving = true;
    this.SceneUtilsService.orbit = this.orbitControls;
    this.orbitControls.addEventListener('change', (event: any) => {
      this.firstClick = true;
    })
    this.transformControls = new TransformControls(this.SceneUtilsService.currentCamera, this.renderer.domElement);
    this.transformControls.type = "Ignore";
    this.transformControls.space = "local";
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
      requestAnimationFrame(animate);
      //component.renderer.shadowMap.needsUpdate = true;
      component.SceneUtilsService.stats.update();
      component.orbitControls.update()
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
      component.SceneUtilsService.CopyCameraPlacement();
      component.renderer.render(component.scene, component.SceneUtilsService.currentCamera);
      component.SceneUtilsService.CSSRenderer.render(component.scene, component.SceneUtilsService.currentCamera);

      //effects
      if (component.SceneUtilsService.outline)
        if (component.SceneUtilsService.model != undefined)
          component.effect.renderOutline(component.SceneUtilsService.model as any, component.SceneUtilsService.currentCamera);
    }());
  }
  ngOnInit() {
  }
  async ngAfterViewInit() {
    this.SceneUtilsService.AnimationService = this.AnimationService;
    this.SceneUtilsService.ModelloaderService = this.ModelloaderService;
    this.SceneUtilsService.SceneManagerService = this.SceneManagerService;
    this.SceneUtilsService.AppComponent = this;
    this.CreateScene()
    this.startRenderingLoop()
    this.mainObject = new THREE.Object3D();
    this.mainObject.name = "Model";
    this.SceneUtilsService.model = this.mainObject;
    this.scene.add(this.mainObject)
    console.log(this.scene);
  }

  async LoadModelFile(event: Event) {
    let f = event.target as any;
    // console.log(event);
    // console.log(f.files);
    if (f.files.length != 0) {
      let str = window.URL.createObjectURL(f.files[0]);
      console.log(str);
      let res: boolean = await this.ModelloaderService.LoadModel(str, f.files[0].name, this.SceneUtilsService.model);
      if (res) {
        this.PrepareModel();
      }
    }
  }

  async SaveFile(event: Event) {
    const exporter = new GLTFExporter();
    console.log('save');
    this.mainObject.updateWorldMatrix(false, true);
    // Parse the input and generate the glTF output
    exporter.parse(
      this.mainObject.children[0],
      // called when the gltf has been generated
      function (gltf) {
        console.log(gltf);
        const output = JSON.stringify(gltf, null, 2);
        const link = document.createElement('a');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.href = URL.createObjectURL(new Blob([output], { type: 'text/plain' }));
        link.download = "model.gltf";
        link.click();
      },
      // called when there is an error in the generation
      function (error) {
        console.log('An error happened');
      },
      {
        trs: true
      }
    );
  }
  PrepareModel() {
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
        let pos = geom.position.clone();
        let vec = new THREE.Vector3(0, 0, 0);
        var geometry = geom.geometry;
        geometry.computeBoundingBox();
        var center = new THREE.Vector3();
        geometry.boundingBox?.getCenter(center);
        geom.localToWorld(center);
        geometry.center()
        geom.position.set(center.x, center.y, center.z);
        geom.position.add(pos);
      })
    })
  }
  CreateUniqueMaterial(obj: THREE.Object3D) {
    let arr: any[] = [];
    this.SceneUtilsService.FindMeshes(obj, arr);
    if (arr.length != 0) {
      arr.forEach(mesh => {
        mesh.material = mesh.material.clone();
        //mesh.material = new THREE.MeshToonMaterial({ color: mesh.material.color });
        if (mesh.geometry.hasAttribute('color')) {
          mesh.material.vertexColors = true;
        }
        mesh.material.side = THREE.FrontSide;
        //mesh.material.transparent = true;
        mesh.material.clipIntersection = true;
        // mesh.material.wireframe = true;
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
    this.raycaster.setFromCamera(this.pointer, this.SceneUtilsService.currentCamera);
    // Рассчитывается какие объекты пересеклись с лучом
    let intersects = this.raycaster.intersectObjects(this.mainObject.children);
    let axis = this.raycaster.intersectObjects(this.SceneUtilsService.axisGroup);
    intersects.concat(axis);
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
    if (this.SceneUtilsService.ContextmenuComponent != undefined)
      this.SceneUtilsService.ContextmenuComponent.component.contextMenu = false;
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
    if (event.key == "Shift") {
      this.SceneUtilsService.SHIFTPressed = true;
    }

  }
  onKeyUp(event: KeyboardEvent) {
    if (event.key == "Control") {
      this.SceneUtilsService.CTRLPressed = false;
    }
    if (event.key == "Shift") {
      this.SceneUtilsService.SHIFTPressed = false;
    }
  }
}
