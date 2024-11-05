import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { AnimationCreatorService } from 'src/app/services/animation/animation.creator.service';
import { AnimationService } from 'src/app/services/animation/animation.service';
import { SceneUtilsService } from 'src/app/services/utils/scene.utils.service';
import * as AnimationModel from 'src/app/shared/animation.model';
import THREE = require('three');

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.css']
})
export class PropertiesComponent implements OnInit, OnChanges {
  @Input() curTime = 0;
  @Input() selected: boolean = false;
  @Input() transformed: boolean = false;
  propertiesObject!: any;
  posParam = false;
  rotParam = false;
  opacityParam = false;
  expanded = true;
  group = false;
  camera = false;
  light = false;
  dirLight = false;
  ambLight = false;
  spotLight = false;
  cutPlane = false;
  annotation = false;
  axisParams = false;
  targetName = "";
  targetSelect = false;
  objectsSelect = false;
  targetArray: THREE.Object3D[] = [];
  shadowWidth = 5;
  shadowHeight = 5;
  shadowDist = 300;
  width = 300;
  height = 300;
  opacity = 1;
  hex = "";
  editMaterial = false;
  editExplode = false;
  explodeOffset = 0;
  rename = false;
  oldName = "";
  constructor(public AnimationService: AnimationService, public AnimationCreatorService: AnimationCreatorService, public SceneUtilsService: SceneUtilsService) { }

  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes["selected"] != undefined) {
      if (this.SceneUtilsService.selected.length != 0) {
        this.OnExpandClick(false);
        if (this.SceneUtilsService.selected.length == 1) {
          this.rename = false;

          this.group = false;
          this.posParam = true;
          this.rotParam = true;
          this.opacityParam = true;

          this.camera = false;

          this.light = false;
          this.dirLight = false;
          this.ambLight = false;
          this.spotLight = false;

          this.cutPlane = false;

          this.annotation = false;
          this.targetName = "None";

          this.axisParams = false;

          this.editMaterial = false;
          this.editExplode = false;
          this.explodeOffset = 0;

          this.propertiesObject = this.SceneUtilsService.selected[0];
          if (this.propertiesObject.material != undefined) {
            this.hex = "#" + this.propertiesObject.material.color.getHexString();
          }
          if (this.propertiesObject.type.includes("Camera")) {
            this.camera = true;
            this.opacityParam = false;
          }
          else if (this.propertiesObject.type == "Object3D") {
            this.posParam = false;
            this.rotParam = false;
            this.opacityParam = false;
            this.oldName = this.propertiesObject.name;
            this.rename = true;
          }
          else if (this.propertiesObject.type.includes("Light")) {
            this.light = true;
            this.opacityParam = false;
            this.hex = "#" + this.propertiesObject.color.getHexString();
            if (this.propertiesObject.type == "DirectionalLight") {
              this.dirLight = true;
              this.rotParam = false;
              this.shadowWidth = -this.propertiesObject.shadow.camera.left + this.propertiesObject.shadow.camera.right;
              this.shadowHeight = -this.propertiesObject.shadow.camera.bottom + this.propertiesObject.shadow.camera.top;
              this.shadowDist = this.propertiesObject.shadow.camera.far;
            }
            else if (this.propertiesObject.type == "AmbientLight") {
              this.ambLight = true;
              this.posParam = false;
              this.rotParam = false;
            }
            else if (this.propertiesObject.type == "SpotLight") {
              this.spotLight = true;
              this.rotParam = false;
            }
          }
          else if (this.propertiesObject.type == "PlaneHelper") {
            {
              this.cutPlane = true;
              this.posParam = false;
              this.rotParam = false;
              this.opacityParam = false;
            }
          }
          else if (this.propertiesObject.type == "Axis") {
            this.posParam = false;
            this.rotParam = false;
            this.opacityParam = false;
            this.axisParams = true;
          }
          else if (this.propertiesObject.type == "Annotation") {
            this.annotation = true;
            this.rotParam = false;
            this.opacityParam = false;
            this.targetName = this.SceneUtilsService.selected[0].children[0].userData["target"].name;
          }
        }
        else {
          this.propertiesObject = new THREE.Mesh();
          this.propertiesObject.type = "Group";
          this.propertiesObject.name = "Group";
          this.group = true;
          this.posParam = true;
          this.rotParam = false;
          this.opacityParam = true;
          this.cutPlane = false;
          this.light = false;
          this.camera = false;
          this.axisParams = false;
        }
      }
      else {
        this.OnExpandClick(true);
        this.propertiesObject = undefined;
        this.light = false;
        this.camera = false;
        this.group = false;
        this.posParam = false;
        this.rotParam = false;
        this.opacityParam = false;
      }
    }
    if (changes["transformed"] != undefined) {
      if (!this.axisParams)
        this.AnimationCreatorService.OnPositionChange(this.propertiesObject);
    }
    if (changes["curTime"] != undefined) {
      if (this.propertiesObject != undefined) {
        if (this.propertiesObject.color != undefined) {
          this.hex = "#" + this.propertiesObject.color.getHexString();
        }
        else if (this.propertiesObject.material != undefined && !this.cutPlane) {
          this.hex = "#" + this.propertiesObject.material.color.getHexString();
        }
      }
    }
  }

  Rename() {
    this.rename = true;
    this.oldName = this.propertiesObject.name;
  }
  ApplyName() {
    let i = 0;
    this.SceneUtilsService.selected.forEach(obj => {
      this.AnimationService.timeLine.tracks.find(track => {
        if (track.object == obj) {
          if (i == 0)
            this.SceneUtilsService.RenameObject(track, this.propertiesObject.name);
          else this.SceneUtilsService.RenameObject(track, `${this.propertiesObject.name}_${i}`);
          return true;
        } else return false;
      })
      i++;
    })
    this.rename = false;
  }
  DiscardName() {
    this.propertiesObject.name = this.oldName;
    this.rename = false;
  }

  InitExplode() {
    this.SceneUtilsService.CalculateCenter(this.SceneUtilsService.selected);
    this.SceneUtilsService.CalculateOffsets(this.SceneUtilsService.selected);
    this.editExplode = !this.editExplode;
  }
  OnExplodeChange(event: Event) {
    this.SceneUtilsService.OnExplode(this.SceneUtilsService.selected, this.explodeOffset);
  }
  ApplyExplode() {
    this.AnimationCreatorService.OnPositionChange(this.propertiesObject, false);
    this.editExplode = false;
  }
  DiscardExplode() {
    this.SceneUtilsService.OnExplode(this.SceneUtilsService.selected, 0);
    this.editExplode = false;
  }

  MatColorSet(event: Event) {
    this.SceneUtilsService.selected.forEach(item => {
      (item as any).material.color.set(this.hex);
    })
  }
  MatRoughnessSet(event: Event) {
    this.SceneUtilsService.selected.forEach(item => {
      (item as any).material.roughness = (event as any).target.value;
    })
  }
  MatMetalnessSet(event: Event) {
    this.SceneUtilsService.selected.forEach(item => {
      (item as any).material.metalness = (event as any).target.value;
    })
  }
  MatReflectivitySet(event: Event) {
    this.SceneUtilsService.selected.forEach(item => {
      (item as any).material.reflectivity = (event as any).target.value;
    })
  }
  MatClearcoatSet(event: Event) {
    this.SceneUtilsService.selected.forEach(item => {
      (item as any).material.clearcoat = (event as any).target.value;
    })
  }
  MatClearcoatRoughnessSet(event: Event) {
    this.SceneUtilsService.selected.forEach(item => {
      (item as any).material.clearcoatRoughness = (event as any).target.value;
    })
  }
  MatIORSet(event: Event) {
    this.SceneUtilsService.selected.forEach(item => {
      (item as any).material.ior = (event as any).target.value;
    })
  }
  MatTransmissionSet(event: Event) {
    this.SceneUtilsService.selected.forEach(item => {
      (item as any).material.transmission = (event as any).target.value;
    })
  }
  MatVertColorSet(event: Event) {
    this.SceneUtilsService.selected.forEach(item => {
      (item as any).material.vertexColors = (event as any).target.checked;
      (item as any).material.needsUpdate = true;
    })
  }

  OnEditorCreated(event: any) {
    event.root.innerHTML = (this.SceneUtilsService.selected[0] as any).element.innerHTML;
  }
  OnTextChange(event: any) {
    (this.SceneUtilsService.selected[0] as any).element.innerHTML = (event.html as string);
    (this.SceneUtilsService.selected[0] as any).element.innerHTML = (this.SceneUtilsService.selected[0] as any).element.innerHTML.replaceAll("<p>", "<p style='margin:5px'>");
  }
  SelectTarget() {
    this.SceneUtilsService.targetArray = this.targetArray;
    this.SceneUtilsService.attachTransform = false;
    this.targetSelect = true;
  }
  DiscardTargetSelect() {
    this.targetSelect = false;
    this.SceneUtilsService.attachTransform = true;
    this.SceneUtilsService.targetArray = this.SceneUtilsService.selected;
  }
  ApplyTargetSelect() {
    this.targetSelect = false;
    this.SceneUtilsService.attachTransform = true;
    if (this.SceneUtilsService.targetArray.length != 0) {
      switch (this.propertiesObject.type) {
        case "Annotation":
          this.SceneUtilsService.selected[0].children[0].userData["target"] = this.SceneUtilsService.targetArray[0];
          break;
        case "Axis":
          this.SceneUtilsService.targetArray[0].attach(this.propertiesObject);
          this.propertiesObject.rotation.set(0, 0, 0);
          break;
      }
    }
    this.SceneUtilsService.targetArray = this.SceneUtilsService.selected;
    this.SceneUtilsService.selectionChange = !this.SceneUtilsService.selectionChange;
  }
  SelectObjects() {
    this.SceneUtilsService.targetArray = this.targetArray;
    this.SceneUtilsService.attachTransform = false;
    this.objectsSelect = true;
  }
  DiscardObjectsSelect() {
    this.objectsSelect = false;
    this.SceneUtilsService.attachTransform = true;
    this.SceneUtilsService.targetArray = this.SceneUtilsService.selected;
  }
  ApplyObjectsSelect() {
    this.objectsSelect = false;
    this.SceneUtilsService.attachTransform = true;
    if (this.SceneUtilsService.targetArray.length != 0) {
      switch (this.propertiesObject.type) {
        case "Axis":
          (this.propertiesObject as THREE.Line).userData["objects"] = this.SceneUtilsService.targetArray.slice();
          break;
      }
    }
    console.log((this.propertiesObject as THREE.Line).userData["objects"]);

    this.SceneUtilsService.targetArray = this.SceneUtilsService.selected;
    this.SceneUtilsService.selectionChange = !this.SceneUtilsService.selectionChange;
  }
  OnDirectionChange(event: Event) {
    (this.SceneUtilsService.selected[0] as THREE.Line).userData["direction"].normalize();
    let points = [];
    points.push(new THREE.Vector3(0));
    points.push((this.SceneUtilsService.selected[0] as THREE.Line).userData["direction"].clone().multiplyScalar(10));
    (this.SceneUtilsService.selected[0] as THREE.Line).geometry.setFromPoints(points);
    (this.SceneUtilsService.selected[0] as THREE.Line).geometry.attributes['position'].needsUpdate = true;
  }

  OnRotationChange(event: Event) {
    this.AnimationCreatorService.OnRotationChange(this.propertiesObject);
  }

  DeleteKeyframe(event: MouseEvent) {
    this.AnimationService.selKeyframe.forEach(keyframe => {
      this.AnimationService.DeleteKeyframe(keyframe);
    })
    this.AnimationService.selKeyframe = [];
  }
  DeleteAction(event: MouseEvent) {
    this.AnimationService.selAction.forEach(action => {
      this.AnimationService.DeleteAction(action);
    })
    this.AnimationService.selAction = [];
  }

  OnCameraRotation($event: MouseEvent) {
    this.SceneUtilsService.currentCamera.lookAt(this.SceneUtilsService.scene.position);
    this.SceneUtilsService.dialogTitle = "Поворотный круг камеры";
    this.SceneUtilsService.dialogType = "cameraRotation";
    this.SceneUtilsService.dialogShow = true;
  }
  OnShadowCameraChange(event: Event) {
    this.propertiesObject.shadow.camera.left = -this.shadowWidth / 2;
    this.propertiesObject.shadow.camera.right = this.shadowWidth / 2;
    this.propertiesObject.shadow.camera.top = this.shadowHeight / 2;
    this.propertiesObject.shadow.camera.bottom = -this.shadowHeight / 2;
    this.propertiesObject.shadow.camera.far = this.shadowDist;
    this.propertiesObject.shadow.camera.updateProjectionMatrix();
    this.propertiesObject.children[1].update();
  }
  ShowPlane(event: Event) {
    let checked = (event.target as any).checked;
    this.propertiesObject.children[0].material.visible = checked;
    this.SceneUtilsService.SetCutPlaneCheckStutas(this.propertiesObject.name, checked);
  }
  OnFOVChange($event: Event) {
    this.propertiesObject.updateProjectionMatrix();
  }
  OnExpandClick(expand?: boolean) {
    if (expand != undefined)
      this.expanded = expand;
    let container = document.getElementById("properties-container")!;
    if (container != undefined) {
      if (this.expanded) {
        container.style.width = "0";
        this.expanded = false;
      }
      else {
        container.style.width = `${this.width}px`;
        this.expanded = true;
      }
    }
  }
}
