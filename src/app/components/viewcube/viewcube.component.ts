import { AfterViewChecked, AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { SceneUtilsService } from 'src/app/services/utils/scene.utils.service';
import THREE = require('three');

@Component({
  selector: 'app-viewcube',
  templateUrl: './viewcube.component.html',
  styleUrls: ['./viewcube.component.css']
})
export class ViewcubeComponent implements AfterViewInit, AfterViewChecked {
  line = new THREE.Line();
  contextMenu = false;
  posX = 0;
  posY = 0;
  @ViewChild('cube') cubeRef!: ElementRef;
  get cube(): HTMLCanvasElement {
    return this.cubeRef.nativeElement;
  }
  constructor(public SceneUtilsService: SceneUtilsService) { }
  ngAfterViewChecked(): void {
    if (this.SceneUtilsService.perspectiveCamera != undefined) {
      let matrix = new THREE.Matrix4();
      matrix.extractRotation(this.SceneUtilsService.perspectiveCamera.matrixWorldInverse);
      this.cube.style.transform = `translateZ(-300px) ${this.getCameraCSSMatrix(matrix)}`;
    }
  }

  ngAfterViewInit(): void {
    this.SceneUtilsService.ViewcubeComponent = this;
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
    if (this.SceneUtilsService.boundingSphere != undefined) {
      this.SceneUtilsService.CalculateBounding(this.SceneUtilsService.model);
      finishPosition = center.copy(offset.normalize().multiplyScalar(this.SceneUtilsService.boundingSphere.radius * 3));
    }
    else finishPosition = center.copy(offset.normalize().multiplyScalar(this.SceneUtilsService.perspectiveCamera.position.length()));
    this.SceneUtilsService.perspectiveCamera.position.set(finishPosition.x, finishPosition.y, finishPosition.z);
    this.SceneUtilsService.trackball.target.set(0, 0, 0);
    let up = this.SceneUtilsService.perspectiveCamera.up.clone();
    const zero = 10e-4;
    if (vec.x != 0) {
      (Math.abs(up.y) > Math.abs(up.z)) ? up.z = 0 : up.y = 0;
      (up.x > 0) ? up.x = zero : up.x = -zero;
    }
    else if (vec.z != 0) {
      (Math.abs(up.x) > Math.abs(up.y)) ? up.y = 0 : up.x = 0;
      (up.z > 0) ? up.z = zero : up.z = -zero;
    }
    else {
      (Math.abs(up.x) > Math.abs(up.z)) ? up.z = 0 : up.x = 0;
      (up.y > 0) ? up.y = zero : up.y = -zero;
    }
    up.normalize()
    this.SceneUtilsService.perspectiveCamera.up.copy(up);
  }

  ShowContextMenu(event: MouseEvent) {
    event.preventDefault();
    if (this.SceneUtilsService.ContextmenuComponent != undefined)
      this.SceneUtilsService.ContextmenuComponent.component.contextMenu = false;
    this.posX = event.clientX - this.cube.parentElement?.offsetLeft! + 5;
    this.posY = event.clientY - this.cube.parentElement?.offsetTop! + 5;
    this.contextMenu = true;
  }
  SetAsView(type: number) {
    switch (type) {
      case 0:
        this.SceneUtilsService.model.quaternion.copy(this.SceneUtilsService.perspectiveCamera.quaternion.clone());
        this.SceneUtilsService.model.updateMatrixWorld(true);
        this.SceneUtilsService.CalculateBounding(this.SceneUtilsService.model);
        this.SceneUtilsService.SetZeroPlane();
        break;
      case 1:
        let oldq = this.SceneUtilsService.perspectiveCamera.quaternion.clone();
        let q = this.SceneUtilsService.perspectiveCamera.rotateOnAxis(new THREE.Vector3(1, 0, 0), 90 * Math.PI / 180).quaternion.clone();
        this.SceneUtilsService.perspectiveCamera.quaternion.copy(oldq);
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
