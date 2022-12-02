import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AnimationCreatorService } from 'src/app/services/animation.creator.service';
import { AnimationService } from 'src/app/services/animation.service';
import * as AnimationModel from 'src/app/shared/animation.model';
import THREE = require('three');

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.css']
})
export class PropertiesComponent implements OnInit, OnChanges {
  @Input() curTime = 0;
  @Input() keyframe!: AnimationModel.KeyframeModel;
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
  cutPlane = false;
  shadowWidth = 5;
  shadowHeight = 5;
  shadowDist = 300;
  width = 300;
  height = 300;
  opacity = 1;
  hex = "";
  constructor(public AnimationService: AnimationService, public AnimationCreatorService: AnimationCreatorService) { }

  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes["selected"] != undefined) {
      if (this.AnimationService.selected.length != 0) {
        if (this.AnimationService.selected.length == 1) {
          this.group = false;
          this.posParam = true;
          this.rotParam = true;
          this.opacityParam = true;
          this.propertiesObject = this.AnimationService.selected[0];
          if (/(Camera)/g.exec(this.propertiesObject.type) != undefined) {
            this.camera = true;
            this.opacityParam = false;
          }
          else this.camera = false;
          if (/(Light)/g.exec(this.propertiesObject.type) != undefined) {
            this.light = true;
            this.opacityParam = false;
            this.hex = "#" + this.propertiesObject.color.getHexString();
            if (this.propertiesObject.type == "DirectionalLight") {
              this.dirLight = true;
              this.shadowWidth = -this.propertiesObject.shadow.camera.left + this.propertiesObject.shadow.camera.right;
              this.shadowHeight = -this.propertiesObject.shadow.camera.bottom + this.propertiesObject.shadow.camera.top;
              this.shadowDist = this.propertiesObject.shadow.camera.far;
            }
            else this.dirLight = false;
            if (this.propertiesObject.type == "AmbientLight") {
              this.ambLight = true;
              this.posParam = false;
              this.rotParam = false;
              this.opacityParam = false;
            }
            else this.ambLight = false;
          }
          else this.light = false;
          if (this.propertiesObject.type == "PlaneHelper") {
            {
              this.cutPlane = true;
              this.posParam = false;
              this.rotParam = false;
              this.opacityParam = false;
            }
          }
          else this.cutPlane = false;
        }
        else {
          this.propertiesObject = new THREE.Mesh();
          this.propertiesObject.type = "Group";
          this.propertiesObject.name = "Group";
          this.group = true;
          this.posParam = true;
          this.opacityParam = true;
          this.cutPlane = false;
          this.light = false;
          this.camera = false;
        }
      }
      else {
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
      this.OnPositionChange(new Event(""));
    }
    if (changes["curTime"] != undefined) {
      if (this.propertiesObject != undefined) {
        if (this.propertiesObject.type == "Mesh") {
          let track = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, this.propertiesObject.name);
          // let keyframe = AnimationModel.FindKeyframeByTime(track, this.curTime);
          // if (keyframe != undefined) {
          //   this.AnimationService.selectedKeyframe = keyframe;
          // }
          // else { (this.AnimationService.selectedKeyframe as any) = undefined; }
        }
        if (this.propertiesObject.color != undefined) {
          this.hex = "#" + this.propertiesObject.color.getHexString();
        }
      }
    }
  }

  OnPositionChange(event: Event) {
    this.AnimationCreatorService.OnPositionChange(this.propertiesObject);
  }
  OnRotationChange(event: Event) {
    this.AnimationCreatorService.OnRotationChange(this.propertiesObject);
  }
  OnOpacityChange(event: Event) {
    this.AnimationCreatorService.OnOpacityChange(this.propertiesObject);
  }
  OnVisibleChange(event: Event) {
    this.AnimationCreatorService.OnVisibleChange(this.propertiesObject);
  }
  OnColorChange(event: Event) {
    this.AnimationCreatorService.OnColorChange(this.propertiesObject, this.hex);
  }
  OnConstantChange(event: Event) {
    this.AnimationCreatorService.OnConstantChange(this.propertiesObject);
  }

  DeleteKeyframe(event: MouseEvent) {
    // this.AnimationCreatorService.DeleteKeyframe(this.propertiesObject);
    this.AnimationService.DeleteKeyframe(this.AnimationService.selectedKeyframe);
  }
  DeleteAction(event: MouseEvent) {
    this.AnimationService.DeleteAction(this.AnimationService.selectedAction);
  }

  OnCameraChange($event: MouseEvent) {
    this.AnimationCreatorService.OnCameraChange(this.propertiesObject);
  }
  OnCameraRotation($event: MouseEvent) {
    console.log(this.AnimationService.currentCamera.rotation);
    console.log(this.AnimationService.scene.position);

    this.AnimationService.currentCamera.lookAt(this.AnimationService.scene.position);
    console.log(this.AnimationService.currentCamera.rotation);
    this.AnimationService.dialogType = "CameraRotation";
    this.AnimationService.dialogShow = true;
  }
  OnShadowChange($event: Event) {
  }
  OnShadowCameraChange(event: Event) {
    this.propertiesObject.shadow.camera.left = -this.shadowWidth / 2;
    this.propertiesObject.shadow.camera.right = this.shadowWidth / 2;
    this.propertiesObject.shadow.camera.top = this.shadowHeight / 2;
    this.propertiesObject.shadow.camera.bottom = -this.shadowHeight / 2;
    this.propertiesObject.shadow.camera.far = this.shadowDist;
    // this.propertiesObject.target.updateMatrixWorld();
    this.propertiesObject.shadow.camera.updateProjectionMatrix();
    this.propertiesObject.children[1].update();
  }
  ShowPlane(event: Event) {
    // this.propertiesObject.material.visible = (event.target as any).checked;
    this.propertiesObject.children[0].material.visible = (event.target as any).checked;
  }
  OnFOVChange($event: Event) {
    this.propertiesObject.updateProjectionMatrix();
  }
  OnExpandClick(event: MouseEvent) {
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
