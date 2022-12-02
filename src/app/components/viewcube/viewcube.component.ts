import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AnimationService } from 'src/app/services/animation.service';
import THREE = require('three');

@Component({
  selector: 'app-viewcube',
  templateUrl: './viewcube.component.html',
  styleUrls: ['./viewcube.component.css']
})
export class ViewcubeComponent implements OnInit, AfterViewChecked {
  @ViewChild('cube') cubeRef!: ElementRef;
  get cube(): HTMLCanvasElement {
    return this.cubeRef.nativeElement;
  }
  constructor(public AnimationService: AnimationService) { }
  ngAfterViewChecked(): void {
    if (this.AnimationService.currentCamera != undefined) {
      let matrix = new THREE.Matrix4();
      matrix.extractRotation(this.AnimationService.currentCamera.matrixWorldInverse);
      this.cube.style.transform = `translateZ(-300px) ${this.getCameraCSSMatrix(matrix)}`;
    }
  }

  ngOnInit(): void {
  }

  setView(x: number, y: number, z: number) {
    let vec = new THREE.Vector3(x, y, z);
    // this.AnimationService.currentCamera.rota
    const offsetUnit = this.AnimationService.currentCamera.position.length();
    const offset = new THREE.Vector3(
      offsetUnit * vec.x,
      offsetUnit * vec.y,
      offsetUnit * vec.z
    );
    const center = new THREE.Vector3();
    const finishPosition = center.add(offset);
    this.AnimationService.currentCamera.position.set(finishPosition.x, finishPosition.y, finishPosition.z);
    this.AnimationService.orbit.target.set(0, 0, 0);
    this.AnimationService.orbit.update();
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
