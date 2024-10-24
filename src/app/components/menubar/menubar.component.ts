import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { AnimationService } from 'src/app/services/animation/animation.service';
import { SceneManagerService } from 'src/app/services/scene.manager/scene.manager.service';
import { SceneUtilsService } from 'src/app/services/utils/scene.utils.service';
import THREE = require('three');

@Component({
  selector: 'app-menubar',
  templateUrl: './menubar.component.html',
  styleUrls: ['./menubar.component.css']
})
export class MenubarComponent implements AfterViewInit {
  posX = 0;
  posY = 0;
  @ViewChild('checkboxCutEnable') checkboxCutEnableRef!: ElementRef;
  @ViewChild('file') fileRef!: ElementRef;
  get file(): HTMLCanvasElement {
    return this.fileRef.nativeElement;
  }
  constructor(public SceneUtilsService: SceneUtilsService,
    public AnimationService: AnimationService,
    public SceneManagerService: SceneManagerService) { }
  ngAfterViewInit(): void {
    this.SceneUtilsService.MenubarComponent = this;
  }
  NewProject() {
    // this.AnimationService.ClearAnimation();
    this.SceneUtilsService.ClearScene();
  }

  async LoadExample(type: number) {
    this.checkboxCutEnableRef.nativeElement.checked = true;//change toolbar status
    this.SceneUtilsService.EnableClipping(true);
    this.SceneUtilsService.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    switch (type) {
      case 0: {
        let str = "../../../assets/Models/eSeries_UR16e.gltf";
        let filename = "eSeries_UR16e.gltf";
        console.log(str);
        let res: boolean = await this.SceneUtilsService.ModelloaderService.LoadModel(str, filename, this.SceneUtilsService.model);
        if (res) {
          this.SceneUtilsService.AppComponent.PrepareModel();
        }

        if (this.SceneUtilsService.skybox != undefined) {
          let x = (this.SceneUtilsService.boundingBox.max.x + this.SceneUtilsService.boundingBox.min.x) / 2;
          let z = (this.SceneUtilsService.boundingBox.max.z + this.SceneUtilsService.boundingBox.min.z) / 2;
          this.SceneUtilsService.skybox.position.set(x, 0, z);
        }
        str = "../../../assets/Anim/First.json";
        filename = "First.json";
        this.AnimationService.ClearAnimation();
        await this.AnimationService.LoadAnimation(str, filename);
        str = "../../../assets/Env/First.hdr";
        await this.SceneUtilsService.DialogComponent.LoadEnviroment(new Event(""), str);
        this.SceneUtilsService.DialogComponent.OnModelScaleChange(0.4);
        this.SceneUtilsService.ViewcubeComponent.setView(1, 1, 1);
        this.SceneUtilsService.skybox.height = 1500;
        break;
      }
      case 1: {
        let str = "../../../assets/Models/Gearbox Final Assembly.gltf";
        let filename = "Gearbox Final Assembly.gltf";
        console.log(str);
        let res: boolean = await this.SceneUtilsService.ModelloaderService.LoadModel(str, filename, this.SceneUtilsService.model);
        if (res) {
          this.SceneUtilsService.AppComponent.PrepareModel();
        }
        this.SceneUtilsService.ViewcubeComponent.setView(1, 1, 1);
        if (this.SceneUtilsService.skybox != undefined) {
          let x = (this.SceneUtilsService.boundingBox.max.x + this.SceneUtilsService.boundingBox.min.x) / 2;
          let z = (this.SceneUtilsService.boundingBox.max.z + this.SceneUtilsService.boundingBox.min.z) / 2;
          this.SceneUtilsService.skybox.position.set(x, 0, z);
        }
        str = "../../../assets/Anim/Second.json";
        filename = "Second.json";
        this.AnimationService.ClearAnimation();
        await this.AnimationService.LoadAnimation(str, filename);
        str = "../../../assets/Env/Second.hdr";
        await this.SceneUtilsService.DialogComponent.LoadEnviroment(new Event(""), str);
        this.SceneUtilsService.skybox.height = 500;
        break;
      }
      case 2: {
        let str = "../../../assets/Models/Ball Valve.gltf";
        let filename = "Ball Valve.gltf";
        console.log(str);
        let res: boolean = await this.SceneUtilsService.ModelloaderService.LoadModel(str, filename, this.SceneUtilsService.model);
        if (res) {
          this.SceneUtilsService.AppComponent.PrepareModel();
        }
        this.SceneUtilsService.ViewcubeComponent.setView(1, 1, 1);
        if (this.SceneUtilsService.skybox != undefined) {
          let x = (this.SceneUtilsService.boundingBox.max.x + this.SceneUtilsService.boundingBox.min.x) / 2;
          let z = (this.SceneUtilsService.boundingBox.max.z + this.SceneUtilsService.boundingBox.min.z) / 2;
          this.SceneUtilsService.skybox.position.set(x, 0, z);
        }
        str = "../../../assets/Anim/Third.json";
        filename = "Third.json";
        this.AnimationService.ClearAnimation();
        await this.AnimationService.LoadAnimation(str, filename);
        str = "../../../assets/Env/Third.hdr";
        await this.SceneUtilsService.DialogComponent.LoadEnviroment(new Event(""), str);
        this.SceneUtilsService.skybox.height = 305;
        break;
      }
      case 3: {
        let str = "../../../assets/Models/Coupling.gltf";
        let filename = "Coupling.gltf";
        console.log(str);
        let res: boolean = await this.SceneUtilsService.ModelloaderService.LoadModel(str, filename, this.SceneUtilsService.model);
        if (res) {
          this.SceneUtilsService.AppComponent.PrepareModel();
        }
        this.SceneUtilsService.ViewcubeComponent.setView(1, 1, 1);
        if (this.SceneUtilsService.skybox != undefined) {
          let x = (this.SceneUtilsService.boundingBox.max.x + this.SceneUtilsService.boundingBox.min.x) / 2;
          let z = (this.SceneUtilsService.boundingBox.max.z + this.SceneUtilsService.boundingBox.min.z) / 2;
          this.SceneUtilsService.skybox.position.set(x, 0, z);
        }
        str = "../../../assets/Anim/Fourth.xml";
        filename = "Fourth.xml";
        // this.AnimationService.ClearAnimation();
        await this.AnimationService.LoadAnimation(str, filename);
        str = "../../../assets/Env/Fourth.hdr";
        await this.SceneUtilsService.DialogComponent.LoadEnviroment(new Event(""), str);
        this.SceneUtilsService.DialogComponent.OnModelScaleChange(0.3);
        this.SceneUtilsService.skybox.radius = 2000;
        this.SceneUtilsService.skybox.height = 250;
        break;
      }
      case 4: {
        let str = "../../../assets/Models/Coupling.gltf";
        let filename = "Coupling.gltf";
        console.log(str);
        let res: boolean = await this.SceneUtilsService.ModelloaderService.LoadModel(str, filename, this.SceneUtilsService.model);
        if (res) {
          this.SceneUtilsService.AppComponent.PrepareModel();
        }
        this.SceneUtilsService.ViewcubeComponent.setView(1, 1, 1);
        if (this.SceneUtilsService.skybox != undefined) {
          let x = (this.SceneUtilsService.boundingBox.max.x + this.SceneUtilsService.boundingBox.min.x) / 2;
          let z = (this.SceneUtilsService.boundingBox.max.z + this.SceneUtilsService.boundingBox.min.z) / 2;
          this.SceneUtilsService.skybox.position.set(x, 0, z);
        }
        str = "../../../assets/Anim/Five.xml";
        filename = "Five.xml";
        // this.AnimationService.ClearAnimation();
        await this.AnimationService.LoadAnimation(str, filename);
        str = "../../../assets/Env/Fourth.hdr";
        await this.SceneUtilsService.DialogComponent.LoadEnviroment(new Event(""), str);
        this.SceneUtilsService.DialogComponent.OnModelScaleChange(0.3);
        this.SceneUtilsService.skybox.radius = 2000;
        this.SceneUtilsService.skybox.height = 250;
        break;
      }
      case 5: {
        let str = "../../../assets/Models/Serter.gltf";
        let filename = "Serter.gltf";
        console.log(str);
        let res: boolean = await this.SceneUtilsService.ModelloaderService.LoadModel(str, filename, this.SceneUtilsService.model);
        if (res) {
          this.SceneUtilsService.AppComponent.PrepareModel();
        }
        this.SceneUtilsService.ViewcubeComponent.setView(-1, 1, 1);
        if (this.SceneUtilsService.skybox != undefined) {
          let x = (this.SceneUtilsService.boundingBox.max.x + this.SceneUtilsService.boundingBox.min.x) / 2;
          let z = (this.SceneUtilsService.boundingBox.max.z + this.SceneUtilsService.boundingBox.min.z) / 2;
          this.SceneUtilsService.skybox.position.set(x, 0, z);
        }
        str = "../../../assets/Anim/Serter.json";
        filename = "Serter.json";
        this.AnimationService.ClearAnimation();
        await this.AnimationService.LoadAnimation(str, filename);
        this.SceneUtilsService.scene.environment = null;
        this.SceneUtilsService.renderer.setClearColor(0x000000);
        this.SceneUtilsService.scene.fog!.color = new THREE.Color(0x000000);
        this.SceneUtilsService.scene.background = null;
        if (this.SceneUtilsService.skybox)
          this.SceneUtilsService.skybox.visible = false;
        this.SceneUtilsService.zeroPlane.visible = true;
        break;
      }
      default:
        break;
    }
    this.SceneUtilsService.ClearSelection(this.SceneUtilsService.selected);
    this.AnimationService.currentTime = 0;
    this.AnimationService.currentTimeChange = !this.AnimationService.currentTimeChange;
  }

  SetZeroPlaneVisibility(event: Event) {
    let e = event?.target as any;
    (this.SceneUtilsService.zeroPlane as any).material.visible = e.checked;
  }
  SetZeroPlaneGrid(event: Event) {
    let e = event?.target as any;
    this.SceneUtilsService.zeroPlane.children[0].visible = e.checked;
  }
  SetReflection(event: Event) {
    let e = event?.target as any;
    this.SceneUtilsService.zeroPlane.children[1].visible = e.checked;
  }
  OnSceneColorChange(event: Event) {
    let color: THREE.Color = new THREE.Color((event as any).target.value);
    let target: any = {};
    color.getHSL(target);
    let l = Math.abs(Math.round(target.l) - 1);
    this.SceneUtilsService.backgroundColor = color;
    this.SceneUtilsService.renderer.setClearColor(color);
    this.SceneUtilsService.scene.fog!.color = color;
    (this.SceneUtilsService.selectBox.material as THREE.LineBasicMaterial).color.setHSL(0, 0, l);
  }
  OnGroundColorChange(event: Event) {
    let color: THREE.Color = new THREE.Color((event as any).target.value);
    (this.SceneUtilsService.zeroPlane.material as THREE.MeshBasicMaterial).color = color;
  }
  SetSceneFog(event: Event) {
    let n = (event as any).target.value / 10000;
    (this.SceneUtilsService.scene.fog as THREE.FogExp2).density = n;
  }
  SetClipping(event: Event) {
    let e = event?.target as any;
    this.SceneUtilsService.EnableClipping(e.checked);
  }
  ShowPlaneX(event: Event) {
    (this.SceneUtilsService.planeHelpers.children[0] as any).children[0].material.visible = (event.target as any).checked;
    (this.SceneUtilsService.planeHelpers.children[0] as any).material.visible = (event.target as any).checked;
  }
  ShowPlaneY(event: Event) {
    (this.SceneUtilsService.planeHelpers.children[1] as any).children[0].material.visible = (event.target as any).checked;
    (this.SceneUtilsService.planeHelpers.children[1] as any).material.visible = (event.target as any).checked;
  }
  ShowPlaneZ(event: Event) {
    (this.SceneUtilsService.planeHelpers.children[2] as any).children[0].material.visible = (event.target as any).checked;
    (this.SceneUtilsService.planeHelpers.children[2] as any).material.visible = (event.target as any).checked;
  }
  SetWireframe(event: Event) {
    let arr: any[] = [];
    this.SceneUtilsService.FindMeshes(this.SceneUtilsService.model, arr);
    arr.forEach(mesh => {
      mesh.material.wireframe = this.SceneUtilsService.wireframe;
    })
  }
  CreateSnapshot() {
    this.SceneUtilsService.dialogTitle = "Создание снимка";
    this.SceneUtilsService.dialogType = "snapshot";
    this.SceneUtilsService.dialogShow = true;
  }
  SetEnviroment() {
    this.SceneUtilsService.dialogTitle = "Настройка окружения";
    this.SceneUtilsService.dialogType = "enviroment";
    this.SceneUtilsService.dialogShow = true;
  }
  SetTheme(type: number) {
    switch (type) {
      case 0:
        document.body.style.setProperty('--main-color', 'ghostwhite');
        document.body.style.setProperty('--second-color', 'gray');
        document.body.style.setProperty('--third-color', '#eee');
        document.body.style.setProperty('--text-color', 'black');
        document.body.style.setProperty('--invert', '0');
        break;
      case 1:
        document.body.style.setProperty('--main-color', '#333');
        document.body.style.setProperty('--second-color', '#222');
        document.body.style.setProperty('--third-color', 'gray');
        document.body.style.setProperty('--text-color', 'ghostwhite');
        document.body.style.setProperty('--invert', '1');
        break;
      case 2:
        document.body.style.setProperty('--main-color', '#fb5');
        document.body.style.setProperty('--second-color', '#b85');
        document.body.style.setProperty('--third-color', '#ec7');
        document.body.style.setProperty('--text-color', 'black');
        document.body.style.setProperty('--invert', '0');
        break;
      case 3:
        document.body.style.setProperty('--main-color', '#1a1a1d');
        document.body.style.setProperty('--second-color', '#6f2232');
        document.body.style.setProperty('--third-color', '#6a2232');
        document.body.style.setProperty('--text-color', '#cc073f');
        document.body.style.setProperty('--invert', '1');
        break;
    }
    localStorage.setItem("theme", type.toString());
  }
}
