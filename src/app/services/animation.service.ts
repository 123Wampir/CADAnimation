import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {

  constructor() { }

  scene!: THREE.Scene;
  actions: THREE.AnimationAction[] = [];
  mixers: THREE.AnimationMixer[] = [];
}
