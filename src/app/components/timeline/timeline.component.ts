import { Component, Renderer2, Input, OnChanges, OnInit, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { AnimationService } from 'src/app/services/animation/animation.service';
import { SceneUtilsService } from 'src/app/services/utils/scene.utils.service';
import * as AnimationModel from 'src/app/shared/animation.model';
import THREE = require('three');



@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() actions!: THREE.AnimationAction[];
  @Input() scene!: THREE.Object3D;
  @Input() curTime = 0;
  @Input() newFile!: boolean;
  constructor(public AnimationService: AnimationService, private renderer: Renderer2, public SceneUtilsService: SceneUtilsService) { }
  id: number = 0;
  persons: any;
  onCurrentTimeMove = false;
  onTimeLineExpand = true;
  startPos = 0;
  center!: THREE.Vector3;
  point!: THREE.Object3D;
  offsets: any[] = [];
  timeline = this.AnimationService.timeLine;

  OnSceneColorChange(event: Event) {
    let e = event as any;
    this.SceneUtilsService.renderer.setClearColor(e.target.value);
  }
  CLIPPINGTEST(event: Event) {
    let idk = event?.target as any;
    this.SceneUtilsService.EnableClipping(idk.checked)
  }
  OnExplode(event: Event) {
    let arr: any[] = [];
    // console.log(this.center);
    if (this.SceneUtilsService.startPos.length == 0) {
      this.offsets = [];
      (this.center as any) = undefined;
    }
    this.SceneUtilsService.FindMeshes(this.SceneUtilsService.scene, arr);
    if (this.center == undefined) {
      // this.AnimationService.boundingBox.getCenter(this.center);
      if (this.SceneUtilsService.boundingSphere == null) {
        //console.log(this.AnimationService.boundingSphere);
        return;
      }
      this.center = new THREE.Vector3();
      this.center = this.SceneUtilsService.boundingSphere.center.clone();
      console.log(this.SceneUtilsService.boundingSphere);
      let geom = new THREE.SphereGeometry(this.SceneUtilsService.boundingSphere.radius);
      let mat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.7, alphaToCoverage: true });
      this.point = new THREE.Mesh(geom, mat);
      this.point.type = "point";
      this.point.position.add(this.center)
      //this.scene.add(this.point)
      //console.log(this.point);
    }

    arr.forEach((item, index) => {
      if (this.SceneUtilsService.startPos.length != arr.length) {
        this.SceneUtilsService.startPos.push(item.position.clone());
        let pts: any[] = [];
        item.updateWorldMatrix(true, true);
        pts.push(this.center.clone());
        let wPos = new THREE.Vector3();
        item.getWorldPosition(wPos);
        let offset = wPos.clone().sub(this.center).normalize();
        pts.push(item.getWorldPosition(new THREE.Vector3()));
        let geom = new THREE.BufferGeometry().setFromPoints(pts);
        let mat = new THREE.LineBasicMaterial({ color: 0xff0000 });
        let line = new THREE.Line(geom, mat);
        //this.scene.add(line);
        this.offsets.push(offset);
      }
      let ps = new THREE.Vector3();
      item.getWorldPosition(ps);
      let pos = item.worldToLocal(ps.clone().add(this.offsets[index].clone().multiplyScalar((event.target as any).value))).add(this.SceneUtilsService.startPos[index])
      item.position.set(pos.x, pos.y, pos.z);
    })
  }
  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    this.AnimationService.angRenderer = this.renderer;
    // this.AnimationService.timeLine = this.AnimationService.timeLine;
    const ro = new ResizeObserver(entries => {
      for (let entry of entries) {
        const height = entry.contentBoxSize ? entry.contentBoxSize[0].blockSize : entry.contentRect.height;
        let curTime = document.getElementById("curTime")!;
        curTime.style.height = `${height}px`;
      }
    })
    let ln = document.getElementById("lines")!;
    ro.observe(ln);
  }

  TrackByFunction(index: number, item: any) {
    return index;
  }
  SetLineNameStyle(type: string): string {
    return `${type}name`;
  }
  ngOnChanges(changes: SimpleChanges): void {
    //console.log(changes)
    if (changes["newFile"] != undefined) {
      console.log(changes["newFile"]);
      if (!changes["newFile"].firstChange)
        if (changes["newFile"].currentValue == this.SceneUtilsService.newFileLoading) {
          this.CreateTreeView();
        }
    }
    // if (changes["scene"] != undefined)
    //   if (changes["scene"].currentValue != undefined) {
    //     this.CreateTreeView();
    //   }
    if (changes["curTime"] != undefined) {
      //console.log("curTime");
      let currentTime = document.getElementById("curTime")!;
      this.renderer.setStyle(currentTime, "left", `${this.AnimationService.currentTime * this.AnimationService.timeLine.scale}px`);
    }
  }
  CreateTreeView() {
    this.id = 0;
    this.CreateTreeViewElements(this.SceneUtilsService.scene);
    this.UpdateTracks();
  }
  CreateRulerElement(lines: HTMLElement) {
    let line = this.renderer.createElement("div");
    this.renderer.addClass(line, "line");
    let part = this.renderer.createElement("div");
    this.renderer.addClass(part, "part");
    this.renderer.appendChild(line, part);
    let partname = this.renderer.createElement("div");
    this.renderer.addClass(partname, "partname");
    this.renderer.appendChild(part, partname);
    let ruler = this.renderer.createElement("div");
    this.renderer.addClass(ruler, "ruler-track");
    this.renderer.setAttribute(ruler, "id", "rulerTrack");
    this.renderer.appendChild(line, ruler);
    let currentTime = this.renderer.createElement("div");
    this.renderer.addClass(currentTime, "current-time");
    this.renderer.listen(currentTime, "mousedown", (event) => this.OnCurrentTimeMouseDown(event));
    this.renderer.setAttribute(currentTime, "id", "curTime");
    this.renderer.appendChild(ruler, currentTime);
    this.renderer.appendChild(lines, line);
  }
  CreateTreeViewElements(obj: THREE.Object3D, tabIndex: number = 0, parent?: AnimationModel.KeyframeTrackModel) {
    if (obj.children.length != 0) {
      for (let item of obj.children) {
        if (item.type == "TransformControls" || item.type == "Group" || item.type == "Stencil") {
          continue;
        }
        let keyframeTrack: AnimationModel.KeyframeTrackModel = { id: this.id, children: [], object: item, name: item.name, type: "Part", actions: [], level: tabIndex };
        this.id++;
        if (parent != undefined) {
          parent.children.push(keyframeTrack.id);
        }
        this.AnimationService.timeLine.tracks.push(keyframeTrack);

        if (item.type == "Object3D" || item.type == "Container") {
          if (item.children.length != 0) {
            tabIndex++;
            this.CreateTreeViewElements(item, tabIndex, keyframeTrack)
            tabIndex--;
          }
        }
        else if (item.type == "Mesh") {
          keyframeTrack.type = "Mesh";
        }
        else if (/(Camera)/g.exec(item.type) != undefined) {
          keyframeTrack.type = "Camera";
        }
        else if (/(Light)/g.exec(item.type) != undefined) {
          keyframeTrack.type = "Light";
        }
        else if (item.type == "zeroPlane") {
          keyframeTrack.type = "Plane";
        }
        else if (item.type == "PlaneHelper") {
          keyframeTrack.type = "Plane";
        }
      }
    }
    this.timeline = this.AnimationService.timeLine;
  }

  OnLineClick(id: number) {
    console.log(id);
    let item = this.timeline.tracks[id].object;
    console.log(item);
    this.SceneUtilsService.Select(item, this.SceneUtilsService.CTRLPressed);
    // let part = this.FindPartByName(event.target.attributes["name"].nodeValue)
    // console.log(item);
  }
  ShowLine(show: boolean) {
    if (show)
      return { 'content-visibility': 'visible' }
    else return { 'content-visibility': 'hidden' }
  }
  SetLineExpandClass(expand: boolean) {
    if (expand)
      return "expand-first";
    else return "expand-second";
  }
  OnExpandLineClick(track: any) {
    track.children.forEach((i: any) => {
      let item = AnimationModel.FindTrackById(this.timeline, i);
      this.timeline.array![item!].show = !this.timeline.array![item!].show;
      this.OnExpandLineClick(this.timeline.array![item!]);
    })
    track.expand = !track.expand;
  }

  FindPartByName(name: string) {
    //console.log(this.scene.getObjectByName(name));
    return this.scene.getObjectByName(name);
  }
  FindPartLineByName(name: string) {
    //console.log(name);
    return document.getElementsByName(name)[0].parentElement?.parentElement;
  }
  SelectChildrenParts(obj: THREE.Object3D, arr: any[]) {
    if (obj.children.length != 0) {
      obj.children.forEach(item => {
        if (item.type != "LineSegments") {
          if (item.type == "PlaneHelper") {
            arr.push(item);
          }
          else {
            arr.push(item);
            this.SelectChildrenParts(item, arr);
          }
        }
      })
    }
  }
  UpdateTracks() {
    this.AnimationService.actions.forEach(action => {
      let name = action.getRoot().name;
      let clip = action.getClip();
      let keyframeTrack = AnimationModel.FindKeyframeTrack(this.AnimationService.timeLine, name);
      AnimationModel.CreateActions(keyframeTrack, clip);
      // console.log(keyframeTrack);
      // clip.tracks.forEach(track => {

      //   track.times.forEach(time => {
      //     let key = AnimationModel.CreateKeyframe(time, keyframeTrack, clip)
      //   })
      // })
    })
    this.AnimationService.timeLine.tracks.forEach(track => {
      this.AppendActions(track);
    })
    // this.timeLine.tracks.forEach(track => {
    //   this.AppendKeyframes(track)
    // })
    AnimationModel.GetArrayTimeLine(this.AnimationService.timeLine);
    console.log(this.AnimationService.timeLine);
  }

  AppendActions(keyframeTrack: AnimationModel.KeyframeTrackModel) {
    for (let i = 0; i < keyframeTrack.actions.length; i++) {
      //this.AnimationService.CreateActionDOM(keyframeTrack, keyframeTrack.actions[i]);
      this.AppendKeyframes(keyframeTrack.actions[i])
    }
  }
  AppendKeyframes(action: AnimationModel.KeyframeActionModel) {
    for (let i = 0; i < action.keyframes.length; i++) {
      //this.AnimationService.CreateKeyframeDOM(action, action.keyframes[i]);
    }
  }

  //UI
  ShowChildren(name: string, show: boolean) {
    // console.log(show);
    let arr: any[] = [];
    let obj = this.FindPartByName(name);
    this.SelectChildrenParts(obj!, arr)
    arr.forEach(item => {
      let line = this.FindPartLineByName(item.name);
      let btn = line?.getElementsByTagName("button");
      if (show) {
        line!.style.display = "grid";
        if (btn?.length != 0) {
          btn![0].setAttribute("show", "1");
        }
      }
      else {
        line!.style.display = "none";
        if (btn?.length != 0) {
          btn![0].setAttribute("show", "0");
        }
      }
    })
  }
  OnTimelineExpand(event: MouseEvent) {
    let container = document.getElementById("timeline-container");
    if (this.onTimeLineExpand) {
      this.renderer.removeClass(event.target, "expand-first");
      this.renderer.addClass(event.target, "expand-second");
      container!.style.height = "40px";
      this.onTimeLineExpand = false;
    }
    else {
      this.renderer.removeClass(event.target, "expand-second");
      this.renderer.addClass(event.target, "expand-first");
      container!.style.height = "30%";
      this.onTimeLineExpand = true;
    }
  }
  OnStopClick($event: MouseEvent) {
    this.AnimationService.stop = true;
    console.log(this.AnimationService.stop);
  }
  OnPlayClick($event: MouseEvent) {
    if (this.AnimationService.play)
      this.AnimationService.play = false;
    else this.AnimationService.play = true;
    console.log(this.AnimationService.play, this.AnimationService.stop);
  }
  SetTrackStyle() {
    return { 'width': `${this.AnimationService.timeLine.duration * this.AnimationService.timeLine.scale}px` };
  }
  SetActionStyle(action: AnimationModel.KeyframeActionModel) {
    return {
      'width': `${action.length * this.AnimationService.timeLine.scale}px`,
      'left': `${action.start * this.AnimationService.timeLine.scale}px`
    };
  }
  SetKeyframeStyle(keyframe: AnimationModel.KeyframeModel) {
    return { 'left': `${(keyframe.time - keyframe.action.start) * this.AnimationService.timeLine.scale}px` };
  }
  OnCurrentTimeMouseUp(event: MouseEvent) {
    this.AnimationService.currentTimeChange = false;
    this.onCurrentTimeMove = false;
  }
  OnCurrentTimeMouseMove(event: MouseEvent) {
    if (this.onCurrentTimeMove) {
      (this.AnimationService.selectedAction as any) = undefined;
      (this.AnimationService.selectedKeyframe as any) = undefined;
      this.AnimationService.currentTimeChange = true;
      let curTime = document.getElementById("curTime")!;
      let time = event.clientX - this.startPos;
      if (time >= 0 && time <= this.AnimationService.timeLine.duration * this.AnimationService.timeLine.scale) {
        curTime.style.left = `${time}px`;
        this.AnimationService.currentTime = time / this.AnimationService.timeLine.scale;
      }
    }
  }
  OnCurrentTimeMouseDown(event: MouseEvent) {
    this.onCurrentTimeMove = true;
    this.AnimationService.currentTimeChange = true;
    this.startPos = event.clientX - this.AnimationService.currentTime * this.AnimationService.timeLine.scale;
  }
}

