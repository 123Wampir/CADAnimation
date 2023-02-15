import { AfterViewChecked, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { AnimationService } from 'src/app/services/animation/animation.service';
import { SceneUtilsService } from 'src/app/services/utils/scene.utils.service';
import THREE = require('three');

@Component({
  selector: 'app-viewcube',
  templateUrl: './viewcube.component.html',
  styleUrls: ['./viewcube.component.css']
})
export class ViewcubeComponent implements OnInit, AfterViewChecked {
  line = new THREE.Line();
  posX = 0;
  posY = 0;
  @ViewChild('cube') cubeRef!: ElementRef;
  get cube(): HTMLCanvasElement {
    return this.cubeRef.nativeElement;
  }
  constructor(public AnimationService: AnimationService, private renderer: Renderer2, private SceneUtilsService: SceneUtilsService) { }
  ngAfterViewChecked(): void {
    if (this.SceneUtilsService.currentCamera != undefined) {
      let matrix = new THREE.Matrix4();
      matrix.extractRotation(this.SceneUtilsService.currentCamera.matrixWorldInverse);
      this.cube.style.transform = `translateZ(-300px) ${this.getCameraCSSMatrix(matrix)}`;
    }
  }

  ngOnInit(): void {
  }

  setView(x: number, y: number, z: number) {
    let vec = new THREE.Vector3(x, y, z);
    const offsetUnit = 1;
    const offset = new THREE.Vector3(
      offsetUnit * vec.x,
      offsetUnit * vec.y,
      offsetUnit * vec.z
    );
    const center = new THREE.Vector3();
    let finishPosition = new THREE.Vector3();
    if (this.SceneUtilsService.boundingSphere != undefined)
      finishPosition = center.copy(offset.normalize().multiplyScalar(this.SceneUtilsService.boundingSphere.radius * 3));
    else finishPosition = center.copy(offset.normalize().multiplyScalar(this.SceneUtilsService.currentCamera.position.length()));
    this.SceneUtilsService.currentCamera.position.set(finishPosition.x, finishPosition.y, finishPosition.z);
    this.SceneUtilsService.orbit.target.set(0, 0, 0);
    let rot = this.SceneUtilsService.currentCamera.rotation.clone();
    // console.log(rot.x * 180 / Math.PI, rot.y * 180 / Math.PI, rot.z * 180 / Math.PI);
    // console.log(vec);
    let up = this.SceneUtilsService.currentCamera.up.clone();
    const zero = 10e-4;
    // console.log(rot);
    if (vec.x != 0) {
      (Math.abs(up.y) > Math.abs(up.z)) ? up.z = 0 : up.y = 0;
      (up.x > 0) ? up.x = zero : up.x = -zero;
    }
    else if (vec.y != 0) {
      (Math.abs(up.x) > Math.abs(up.z)) ? up.z = 0 : up.x = 0;
      (up.y > 0) ? up.y = zero : up.y = -zero;
    }
    else {
      (Math.abs(up.x) > Math.abs(up.y)) ? up.y = 0 : up.x = 0;
      (up.z > 0) ? up.z = zero : up.z = -zero;
    }
    up.normalize()
    let pts: any[] = [];
    pts.push(new THREE.Vector3())
    pts.push(up.clone().normalize().multiplyScalar(50));
    this.SceneUtilsService.currentCamera.up.copy(up);
  }

  ShowContextMenu(event: MouseEvent) {
    event.preventDefault();
    this.posX = event.clientX - this.cube.parentElement?.offsetLeft! + 5;
    this.posY = event.clientY - this.cube.parentElement?.offsetTop! + 5;
    this.AnimationService.contextMenu = true;
  }
  SetAsView(type: number) {
    switch (type) {
      case 0:
        this.SceneUtilsService.model.quaternion.copy(this.SceneUtilsService.currentCamera.quaternion.clone());
        this.SceneUtilsService.CalculateBounding(this.SceneUtilsService.model);
        this.SceneUtilsService.SetZeroPlane();
        break;
      case 1:
        let oldq = this.SceneUtilsService.currentCamera.quaternion.clone();
        let q = this.SceneUtilsService.currentCamera.rotateOnAxis(new THREE.Vector3(1, 0, 0), 90 * Math.PI / 180).quaternion.clone();
        this.SceneUtilsService.currentCamera.quaternion.copy(oldq);
        this.SceneUtilsService.model.quaternion.copy(q);
        this.SceneUtilsService.CalculateBounding(this.SceneUtilsService.model);
        this.SceneUtilsService.SetZeroPlane();
        break;
    }

  }

  epsilon(value: number) {
    return Math.abs(value) < 1e-10 ? 0 : value;
  }

  getCameraCSSMatrix(matrix: THREE.Matrix4) {
    const { elements } = matrix;

    return `matrix3d(
      ${this.epsilon(elements[0])},
      ${this.epsilon(-elements[1])},
      ${this.epsilon(elements[2])},
      ${this.epsilon(elements[3])},
      ${this.epsilon(elements[4])},
      ${this.epsilon(-elements[5])},
      ${this.epsilon(elements[6])},
      ${this.epsilon(elements[7])},
      ${this.epsilon(elements[8])},
      ${this.epsilon(-elements[9])},
      ${this.epsilon(elements[10])},
      ${this.epsilon(elements[11])},
      ${this.epsilon(elements[12])},
      ${this.epsilon(-elements[13])},
      ${this.epsilon(elements[14])},
      ${this.epsilon(elements[15])})`;
  }
}
