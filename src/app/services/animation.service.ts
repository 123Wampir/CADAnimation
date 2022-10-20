import { Injectable } from '@angular/core';
import { KeyframeModel } from '../shared/animation.model';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {

  constructor() { }
  play: boolean = false;
  stop: boolean = false;
  scene!: THREE.Scene;
  actions: THREE.AnimationAction[] = [];
  mixers: THREE.AnimationMixer[] = [];
  selected: any[] = []
  selectedKeyframe!: KeyframeModel;
}
