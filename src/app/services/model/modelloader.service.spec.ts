import { TestBed } from '@angular/core/testing';

import { ModelloaderService } from './modelloader.service';

describe('ModelloaderService', () => {
  let service: ModelloaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModelloaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
