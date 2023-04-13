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
  trackballControls!: TrackballControls;
  transformControls!: TransformControls;
  meshArr: THREE.Mesh[] = [];
  counter = 0;
  delta = 0.016;
  effect!: OutlineEffect;
  selectBox!: THREE.BoxHelper;


  CreateScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xffffff, 0.0002);
    this.SceneUtilsService.scene = this.scene;
    // Добавление и настройка камеры
    this.SceneUtilsService.perspectiveCamera = new THREE.PerspectiveCamera(45, this.getAspectRatio(), 1.0, 50000.0);
    this.SceneUtilsService.perspectiveCamera.layers.enable(1);
    this.SceneUtilsService.perspectiveCamera.name = "Camera";
    this.SceneUtilsService.perspectiveCamera.position.set(50.0, 100.0, 150.0);
    this.SceneUtilsService.perspectiveCamera.up.set(0.0, 1.0, 0.0);
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

    this.SceneUtilsService.selectBox = new THREE.BoxHelper(new THREE.Mesh(), 0x000000);
    this.SceneUtilsService.selectBox.type = "Ignore";
    this.scene.add(this.SceneUtilsService.selectBox);

    // Добавление глобального освещения
    this.SceneUtilsService.lightGroup = new THREE.Group();
    this.SceneUtilsService.lightGroup.name = "Lights";
    this.scene.add(this.SceneUtilsService.lightGroup);
    const ambientLight = new THREE.AmbientLight(0xffffff);
    ambientLight.name = ambientLight.type;
    this.SceneUtilsService.lightGroup.add(ambientLight);

    this.SceneUtilsService.axisGroup = new THREE.Group();
    this.SceneUtilsService.axisGroup.name = "Axis";
    this.scene.add(this.SceneUtilsService.axisGroup);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    const planeGeometry = new THREE.CircleGeometry(10000);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotateX(degToRad(-90));
    plane.name = "Zero Plane";
    plane.type = "Ignore";
    const planeHelper = new THREE.GridHelper(2000, 200, 0x000000, 0xaaaaaa);
    plane.add(planeHelper.rotateX(degToRad(-90)));
    planeHelper.visible = false;
    plane.receiveShadow = true;
    let mirror = new Reflector(planeGeometry, {
      clipBias: 0.003,
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
      color: 0xb5b5b5
    });
    mirror.position.z = 0.05;
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
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, failIfMajorPerformanceCaveat: true });
    this.SceneUtilsService.renderer = this.renderer;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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

    this.trackballControls = new TrackballControls(this.SceneUtilsService.currentCamera, this.renderer.domElement);
    console.log(this.trackballControls);
    this.trackballControls.rotateSpeed = 10;
    this.trackballControls.panSpeed = 1.5;
    this.trackballControls.staticMoving = true;
    this.SceneUtilsService.trackball = this.trackballControls;
    this.trackballControls.addEventListener('change', (event: any) => {
      this.firstClick = true;
    })
    this.transformControls = new TransformControls(this.SceneUtilsService.currentCamera, this.renderer.domElement);
    this.transformControls.type = "Ignore";
    this.transformControls.space = "local";
    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.trackballControls.enabled = !event["value"];
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
    (async function animate() {
      if (component.mainObject != undefined) {
        if (!component.AnimationService.recorder.isRecording())
          component.FindIntersection();
        // if (component.SceneUtilsService.stencilNeedUpdate && component.renderer.localClippingEnabled)
        //   if (component.meshArr.length != 0) {
        //     for (let i = 0; i < component.SceneUtilsService.stencilGroups.children.length; i++) {
        //       component.SceneUtilsService.UpdateStencilGeometry(component.meshArr, component.SceneUtilsService.stencilGroups.children[i])
        //     }
        //     component.SceneUtilsService.stencilNeedUpdate = false;
        //   }
      }
      requestAnimationFrame(animate);
      //component.renderer.shadowMap.needsUpdate = true;
      component.SceneUtilsService.stats.update();
      component.trackballControls.update()
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
      if (component.AnimationService.recorder.isRecording()) {
        await component.AnimationService.RenderFrame(component.AnimationService.targetCanvas, component.AnimationService.targetCanvas.width, component.AnimationService.targetCanvas.height);
        if (component.AnimationService.currentFrame < component.AnimationService.duration * component.AnimationService.framerate) {
          component.AnimationService.recorder.recordFrame();
          component.AnimationService.currentFrame++;
          component.AnimationService.currentTime = component.AnimationService.recordStart + component.AnimationService.currentFrame / component.AnimationService.framerate;
          component.AnimationService.currentTimeChange = !component.AnimationService.currentTimeChange;
        }
        else {
          component.AnimationService.recorder.stopRecord();
          component.AnimationService.currentFrame = 0;
          console.log("capture finished!");
          component.SceneUtilsService.onResize();
          requestAnimationFrame(animate);
        }
      }
      else {
        component.renderer.render(component.scene, component.SceneUtilsService.currentCamera);
        component.SceneUtilsService.CSSRenderer.render(component.scene, component.SceneUtilsService.currentCamera);
        //effects
        if (component.SceneUtilsService.outline)
          if (component.SceneUtilsService.model != undefined)
            component.effect.renderOutline(component.SceneUtilsService.model as any, component.SceneUtilsService.currentCamera);
      }
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
    let theme = localStorage.getItem("theme");
    if (theme != null) {
      this.SceneUtilsService.MenubarComponent.SetTheme(Number(theme));
    }
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
    (event.target as any).value = "";
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
      arr.forEach(mesh => {
        let geom = mesh as THREE.Mesh;
        let pos = geom.position.clone();
        var geometry = geom.geometry;
        geometry.computeBoundingBox();
        var center = new THREE.Vector3();
        geometry.boundingBox?.getCenter(center);
        geometry.center()
        geom.position.set(center.x, center.y, center.z);
        geom.position.add(pos);
      })
    })
    this.SceneUtilsService.CalculateBounding(obj);
    let modelCenter = this.SceneUtilsService.boundingSphere.center.clone().negate();
    modelCenter.y = -this.SceneUtilsService.boundingBox.min.y;
    obj.children.forEach(part => {
      let arr: any[] = [];
      this.SceneUtilsService.FindMeshes(part, arr);
      arr.forEach(mesh => {
        let geom = mesh as THREE.Mesh;
        let pos = new THREE.Vector3();
        geom.getWorldPosition(pos);
        let q = new THREE.Quaternion();
        geom.getWorldQuaternion(q);
        let vec = modelCenter.clone().applyQuaternion(q.invert()).add(geom.position);
        geom.updateWorldMatrix(true, true)
        geom.position.set(vec.x, vec.y, vec.z);
      })
    })
  }
  CreateUniqueMaterial(obj: THREE.Object3D) {
    let arr: any[] = [];
    this.SceneUtilsService.FindMeshes(obj, arr);
    if (arr.length != 0) {
      arr.forEach(mesh => {
        let material = new THREE.MeshPhysicalMaterial({
          color: mesh.material.color,
          metalness: mesh.material.metalness,
          roughness: mesh.material.roughness,
          opacity: mesh.material.opacity,
          transparent: mesh.material.transparent,
          side: THREE.DoubleSide,
          shadowSide: THREE.BackSide,
          clipIntersection: true
        });
        mesh.material = material;
        if (mesh.geometry.hasAttribute('color')) {
          mesh.material.vertexColors = true;
        }
        // mesh.material.side = THREE.DoubleSide;
        // mesh.material.shadowSide = THREE.BackSide;
        // mesh.material.clipIntersection = true;
        // mesh.material.forceSinglePass = true;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        (mesh as THREE.Mesh).onBeforeRender = function (renderer, scene, camera, geometry, material) {
          if (material.opacity != 1)
            material.transparent = true;
          else material.transparent = false;
        }
        mesh.material.onBeforeCompile = function (shader: any) {
          shader.fragmentShader = shader.fragmentShader.replace(
            `#include <output_fragment>`,
            `#ifdef OPAQUE
               diffuseColor.a = 1.0;
               #endif
               // https://github.com/mrdoob/three.js/pull/22425
               #ifdef USE_TRANSMISSION
               diffuseColor.a *= material.transmissionAlpha + 0.1;
               #endif
               gl_FragColor = ( gl_FrontFacing ) ? vec4( outgoingLight, opacity ) : vec4(diffuse*0.2, 1.0 );
              `
          );
        };
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
    // let axis = this.raycaster.intersectObjects(this.SceneUtilsService.axisArray);
    // intersects.concat(axis);
    if (intersects.length != 0) {
      if (this.intersection != intersects[0].object) {
        // if (this.intersection) {
        //   if (this.SceneUtilsService.selected.find((item) => (item == this.intersection)) == undefined)
        //     if (this.intersection.material.emissive)
        //       this.intersection.material.emissive.set(0x000000);
        // }
        this.SceneUtilsService.selectBox.visible = true;
        this.intersection = intersects[0].object;
        this.SceneUtilsService.selectBox.setFromObject(this.intersection);
        // if (this.intersection.material.emissive)
        //   this.intersection.material.emissive.set(0x004400);
      }
    }
    else {
      this.SceneUtilsService.selectBox.visible = false;
      if (this.intersection) {
        // this.box.update();
        if (this.SceneUtilsService.selected.find((item) => (item == this.intersection)) == undefined)
          if (this.intersection.material.emissive)
            this.intersection.material.emissive.set(0x000000);
        this.intersection = null;
      }
    }
  }
  onClick(event: MouseEvent) {
    if (this.SceneUtilsService.ContextmenuComponent != undefined)
      this.SceneUtilsService.ContextmenuComponent.component.contextMenu = false;
    if (!this.firstClick) {
      if (this.intersection != undefined) {
        this.SceneUtilsService.Select(this.SceneUtilsService.targetArray, this.intersection, this.SceneUtilsService.CTRLPressed);
      }
      else {
        this.SceneUtilsService.ClearSelection(this.SceneUtilsService.targetArray);
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
