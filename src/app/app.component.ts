import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { exec, execFile } from 'child_process'
import { AnimationService } from './services/animation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  constructor(public AnimationService: AnimationService) { }

  @ViewChild('canvas') canvasRef!: ElementRef;
  get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement
  }
  title = 'CADAnimation';
  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  camera: any;
  mixers: THREE.AnimationMixer[] = [];
  actions: THREE.AnimationAction[] = [];
  edgeMixers: THREE.AnimationMixer[] = [];
  mainObject!: THREE.Object3D;
  intersection: any;
  pointer!: THREE.Vector2;
  raycaster!: THREE.Raycaster;

  CreateScene() {
    this.scene = new THREE.Scene();
    // Добавление и настройка камеры
    this.camera = new THREE.PerspectiveCamera(45, this.getAspectRatio(), 1.0, 100000.0);
    this.camera.position.set(50.0, 150.0, 100.0);
    this.camera.up.set(0.0, 0.0, 1.0);
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
    // Добавление глобального освещения
    const ambientLight = new THREE.AmbientLight(0x444444);
    this.scene.add(ambientLight);
    // Добавление направленного света
    const directionalLight = new THREE.DirectionalLight(0x888888);
    directionalLight.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
    this.scene.add(directionalLight);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
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
        if (this.intersection.material.emissive)
          this.intersection.material.emissive.set(0x000000);
        this.intersection = null;
      }
    }
  }

  startRenderingLoop() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth * 0.99, window.innerHeight * 0.99);
    //this.canvas.appendChild(this.renderer.domElement)
    //this.renderer.setPixelRatio(devicePixelRatio)
    this.renderer.setClearColor(0xffffff);
    const controls = new OrbitControls(this.camera, this.renderer.domElement);

    let component = this;
    (function animate() {
      if (component.mainObject != undefined) {
        component.FindIntersection();
      }
      requestAnimationFrame(animate);
      component.mixers.forEach(mixer => {
        mixer.update(0.01);
      })
      component.edgeMixers.forEach(mixer => {
        mixer.update(0.01);
      })
      component.renderer.render(component.scene, component.camera);
    }());
  }

  ngOnInit() {


    // Создание сцены
    // Добавление контроля орбиты камеры с помощью мыши


    // Создание объекта для хранения загружаемой модели
    //this.mainObject = new THREE.Object3D();
    // Массив миксеров(дорожки) анимации для деталей модели
    // Загрука модели
    //this.LoadGeometry(this.mainObject);
    //console.log(this.mainObject);
    // Добавление модели в сцену
    //this.scene.add(this.mainObject);
    //console.log(this.scene)
    //const axes = new THREE.AxesHelper(100);
    // Создание объекта для хранения пересечений курсора с деталями модели
    // Создание объекта рейкастера
    // Вектор позиция курсора на экране
    // Добавление обработчиков событий
  }

  async ngAfterViewInit() {
    this.CreateScene()
    this.startRenderingLoop()
    //console.log(this.renderer.domElement)
    this.mainObject = new THREE.Object3D();
    this.scene.add(this.mainObject)
    await this.LoadGeometry(this.mainObject)
    console.log(this.mainObject)
    //console.log(this.mixers)

  }

  async LoadGeometry(targetObject: THREE.Object3D) {
    // Создание объекта загрузчика GLTF файлов
    let loader = new GLTFLoader();
    // Загрузка файла модели
    let component = this;
    loader.load(
      // Ссылка на ресурс
      // Вызывается когда ресурс загружен
      'http://127.0.0.1:5500/src/models/sborka.gltf',
      async function (gltf) {
        if (gltf.scene.children.length != 0) {
          // Добавление модели в контейнер
          targetObject.add(gltf.scene.children[0]);
          // Создание ребер для каждой детали модели
          component.CreateEdges(targetObject, true, 25);
          console.log(targetObject);
          component.AnimationService.scene = component.scene;
          // Создание миксеров(дорожек) для модели
          component.CreateMixers(targetObject)

          component.AnimationService.mixers = component.mixers;
          // Загрузка файла анимации
          component.LoadAnimation(targetObject, component.mixers);
          component.AnimationService.actions = component.actions;
        }
      },
      // Вызывается в процессе загрузки
      function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      // Вызывается если произошла ошибка
      function (error) {
        console.log('An error happened');
      }
    );
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
        else if (item.type == "LineSegments") {
          let mixer = new THREE.AnimationMixer(item);
          this.edgeMixers.push(mixer);
        }
      }
    }
  }

  FindMixer(mixers: THREE.AnimationMixer[], obj: any, mix: any[]) {
    let meshes: any[] = [];
    this.FindMeshes(obj, meshes)
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
          if (item.type == "LineSegments") {
            meshes.push(item);
          }
        }
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
          item.material.transparent = true;
          let edges = new THREE.EdgesGeometry(item.geometry, threshold);
          let line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1/*, depthTest: false */, transparent: true }));
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
    if (this.intersection != undefined)
      console.log(this.intersection)
  }
  onPointerMove(event: MouseEvent) {
    // console.log(event)
    this.pointer.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.pointer.y = - (event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
  }


  async LoadAnimation(mainObject: THREE.Object3D, mixers: THREE.AnimationMixer[]) {
    // Чтение анимации
    // Создание объекта парсера XML/HTML-файлов
    let parser = new DOMParser();
    let fileUrl1 = 'http://127.0.0.1:5500/src/Animations/АнимацияДиплом.xml';
    let response1 = await fetch(fileUrl1);
    let buffer1 = await response1.text();
    // Преобразование файла в DOM элемент
    let dom = parser.parseFromString(buffer1, "text/xml");
    //console.log(dom);
    // Текущий шаг анимации
    let currentStep = 0;
    //перебор шагов анимации
    dom.children[0].childNodes.forEach(step => {
      if (step.nodeName == "Step") {
        console.log(step)
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
                console.log(dx, dy, dz)
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
              // Перебор деталей используемых в анимации
              parts.forEach(part => {
                let partMixer: any[] = [];
                let edgeMixer: any[] = [];
                // Поиск миксеров(дорожек) анимации
                this.FindMixer(this.mixers, part, partMixer);
                this.FindMixer(this.edgeMixers, part, edgeMixer);
                if (partMixer.length != 0) {
                  partMixer.forEach(mixer => {
                    // Добавление анимации перемещения в миксер детали
                    if (move) {
                      let mesh = mixer.getRoot() as THREE.Mesh;
                      mesh.updateWorldMatrix(true, true)
                      let vec = new THREE.Vector3(dx, dy, dz);
                      vec.add(part.position)
                      let startPos = mesh.position
                      mesh.worldToLocal(vec);
                      const times = [currentStep, currentStep + par];
                      const values = [startPos.x, startPos.y, startPos.z, startPos.x + vec.x * par, startPos.y + vec.y * par, startPos.z + vec.z * par];
                      const positionKF = new THREE.VectorKeyframeTrack('.position', times, values);
                      const tracks = [positionKF];
                      const length = -1;
                      const clip = new THREE.AnimationClip('Step1', length, tracks);
                      const action = mixer.clipAction(clip);
                      action.setLoop(THREE.LoopPingPong, 1);
                      action.play();
                      action.clampWhenFinished = true;
                      this.actions.push(action)
                    }
                    // Добавление анимации прозрачности в миксер детали
                    if (transparancy) {
                      const times = [currentStep, currentStep + par];
                      const values = [start, stop];
                      const transparancyKF = new THREE.NumberKeyframeTrack('.material.opacity', times, values);
                      const visibleKF = new THREE.BooleanKeyframeTrack('.visible', times, [Boolean(start), Boolean(stop)]);
                      const tracks = [transparancyKF, visibleKF];
                      const length = -1;
                      const clip = new THREE.AnimationClip(`step - ${currentStep}`, length, tracks);
                      const action: THREE.AnimationAction = mixer.clipAction(clip);
                      action.setLoop(THREE.LoopPingPong, 1);
                      action.play();
                      action.clampWhenFinished = true;
                      this.actions.push(action)
                    }
                    if (rotation) {
                      let mesh = mixer.getRoot() as THREE.Mesh;
                      //mesh.updateWorldMatrix(true, true)
                      //vec.add(part.position)
                      let startRot = mesh.quaternion;
                      let vec = new THREE.Quaternion().setFromEuler(new THREE.Euler(mesh.rotation.x, angle + mesh.rotation.y, mesh.rotation.z));
                      console.log(vec)
                      //mesh.worldToLocal(vec);
                      const times = [currentStep, currentStep + par];
                      const values = [startRot.x, startRot.y, startRot.z, startRot.w, vec.x, vec.y, vec.z, vec.w];
                      const rotationKF = new THREE.QuaternionKeyframeTrack('.quaternion', times, values);
                      const tracks = [rotationKF];
                      const length = -1;
                      const clip = new THREE.AnimationClip('Step1', length, tracks);
                      const action = mixer.clipAction(clip);
                      action.setLoop(THREE.LoopPingPong, 1);
                      action.play();
                      action.clampWhenFinished = true;
                      this.actions.push(action)
                    }
                  })
                }
                if (edgeMixer.length != 0) {
                  edgeMixer.forEach(mixer => {
                    // Добавление анимации прозрачности в миксер ребер детали
                    if (transparancy) {
                      const times = [currentStep, currentStep + par];
                      const values = [1, 0];
                      const transparancyKF = new THREE.NumberKeyframeTrack('.material.opacity', times, values);
                      const tracks = [transparancyKF];
                      const length = -1;
                      const clip = new THREE.AnimationClip(`step - ${currentStep}`, length, tracks);
                      const action = mixer.clipAction(clip);
                      action.setLoop(THREE.LoopPingPong, 1);
                      action.play();
                      action.clampWhenFinished = true;
                    }
                  })
                }
              })
            })
          }
        })
      }
    })
  }


  FindPartByName(name: string) {
    let arr: THREE.Object3D[] = [];
    for (let i = 0; i < this.mainObject.children[0].children.length; i++) {
      name = name.replace((/\s/g), '_');
      //if (mainObject.children[0].children[i].name.includes(name)) {
      if (this.mainObject.children[0].children[i].name == name) {
        arr.push(this.mainObject.children[0].children[i]);
      }
    }
    return arr;
  }


  onResize(event: any) {
    this.camera.aspect = this.getAspectRatio();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth * 0.99, window.innerHeight * 0.99);
  }
}



















