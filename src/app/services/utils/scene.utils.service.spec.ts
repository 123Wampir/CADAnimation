import { TestBed } from '@angular/core/testing';

import { SceneUtilsService } from './scene.utils.service';

describe('SceneUtilsService', () => {
  let service: SceneUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SceneUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
