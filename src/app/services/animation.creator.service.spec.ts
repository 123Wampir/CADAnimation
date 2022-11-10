import { TestBed } from '@angular/core/testing';

import { AnimationCreatorService } from './animation.creator.service';

describe('AnimationCreatorService', () => {
  let service: AnimationCreatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnimationCreatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
