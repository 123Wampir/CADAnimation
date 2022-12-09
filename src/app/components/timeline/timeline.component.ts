import { Component, Renderer2, Input, OnChanges, OnInit, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { AnimationService } from 'src/app/services/animation.service';
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
  constructor(public AnimationService: AnimationService, private renderer: Renderer2) { }
  timeLine: AnimationModel.TimelineModel = { tracks: [], duration: 20, scale: 50 };
  onCurrentTimeMove = false;
  onTimeLineExpand = true;
  startPos = 0;
  center!: THREE.Vector3;
  point!: THREE.Object3D;
  offsets: any[] = [];

  OnSceneColorChange(event: Event) {
    let e = event as any;
    this.AnimationService.renderer.setClearColor(e.target.value);
  }
  CLIPPINGTEST(event: Event) {
    let idk = event?.target as any;
    this.AnimationService.EnableClipping(idk.checked)
  }
  OnExplode(event: Event) {
    let arr: any[] = [];
    // console.log(this.center);
    this.AnimationService.FindMeshes(this.AnimationService.scene, arr);
    if (this.center == undefined) {
      // this.AnimationService.boundingBox.getCenter(this.center);
      if (this.AnimationService.boundingSphere == null) {
        //console.log(this.AnimationService.boundingSphere);
        return;
      }
      this.center = new THREE.Vector3();
      this.center = this.AnimationService.boundingSphere.center.clone();
      console.log(this.AnimationService.boundingSphere);
      let geom = new THREE.SphereGeometry(this.AnimationService.boundingSphere.radius);
      let mat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.7, alphaToCoverage: true });
      this.point = new THREE.Mesh(geom, mat);
      this.point.type = "point";
      this.point.position.add(this.center)
      //this.scene.add(this.point)
      //console.log(this.point);
    }
    arr.forEach((item, index) => {
      if (this.AnimationService.startPos.length != arr.length) {
        this.AnimationService.startPos.push(item.position.clone());
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
      let pos = item.worldToLocal(ps.clone().add(this.offsets[index].clone().multiplyScalar((event.target as any).value))).add(this.AnimationService.startPos[index])
      item.position.set(pos.x, pos.y, pos.z);
    })
    //console.log(this.AnimationService.startPos);
  }
  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    this.AnimationService.angRenderer = this.renderer;
    this.AnimationService.timeLine = this.timeLine;
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

  ngOnChanges(changes: SimpleChanges): void {
    //console.log(changes)
    if (changes["newFile"] != undefined) {
      console.log(changes["newFile"]);
      if (!changes["newFile"].firstChange)
        if (changes["newFile"].currentValue == this.AnimationService.newFileLoading) {
          this.CreateTreeView();
        }
    }
    // if (changes["scene"] != undefined)
    //   if (changes["scene"].currentValue != undefined) {
    //     this.CreateTreeView();
    //   }
    if (changes["curTime"] != undefined) {
      let currentTime = document.getElementById("curTime")!;
      this.renderer.setStyle(currentTime, "left", `${this.AnimationService.currentTime * this.timeLine.scale}px`);
    }
  }
  CreateTreeView() {
    let ln = document.getElementById("lines");
    ln?.replaceChildren();
    this.CreateRulerElement(ln!);
    this.CreateTreeViewElements(this.scene);
    setTimeout(() => {
      this.UpdateTracks();
    }, 1000);
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
  CreateTreeViewElements(obj: THREE.Object3D, tabIndex: number = 0) {
    if (obj.children.length != 0) {
      let ln = document.getElementById("lines")
      for (let item of obj.children) {
        if (item.type == "TransformControls" || item.type == "Group" || item.type == "Stencil") {
          continue;
        }
        let line = this.renderer.createElement("div");
        line.className = "line";
        let part = this.renderer.createElement("div");
        this.renderer.appendChild(line, part)
        let partname = this.renderer.createElement("div");
        if (item.name == "") {
          item.name = item.type + " " + item.id.toString();
          partname.innerText = item.name
        }
        partname.innerText = `${"  " + "  ".repeat(tabIndex) + item.name}`;
        this.renderer.appendChild(part, partname)
        this.renderer.setAttribute(partname, "name", item.name)
        let track = this.renderer.createElement("div");
        this.renderer.addClass(track, "track")
        this.renderer.setStyle(track, "width", `${this.timeLine.duration * this.timeLine.scale}px`);
        this.renderer.appendChild(line, track)
        this.renderer.appendChild(ln, line)
        this.renderer.listen(line, "click", (event) => {
          //let part = this.FindPartByName(event.target.attributes["name"].nodeValue)
          console.log(item);
          this.AnimationService.Select(item, this.AnimationService.CTRLPressed);
        })
        let keyframeTrack: AnimationModel.KeyframeTrackModel = { DOMElement: track, name: item.name, keyframes: [], actions: [] };
        this.timeLine.tracks.push(keyframeTrack);

        if (item.type == "Object3D" || item.type == "Container") {
          this.renderer.addClass(part, "part");
          this.renderer.addClass(partname, "partname")
          let button = this.renderer.createElement("button");
          this.renderer.addClass(button, "expand-first");
          button.innerText = "▼";
          this.renderer.setAttribute(button, "show", "1")
          this.renderer.appendChild(part, button);
          this.renderer.listen(button, "click", (event) => {
            let a = event.target as HTMLElement;
            let show;
            if (a.getAttribute("show") == "1")
              show = false;
            else show = true;
            let name = a.parentElement?.getElementsByClassName("partname")[0].getAttribute("name");
            console.log(name, a.getAttribute("show"), show);
            this.ShowChildren(name!, show);
            if (show) {
              a.setAttribute("show", "1")
              this.renderer.removeClass(a, "expand-second");
              this.renderer.addClass(a, "expand-first");
            }
            else {
              a.setAttribute("show", "0");
              this.renderer.removeClass(a, "expand-first");
              this.renderer.addClass(a, "expand-second");
            }
          })
          if (item.children.length != 0) {
            tabIndex++
            this.CreateTreeViewElements(item, tabIndex)
            tabIndex--;
          }
        }
        else if (item.type == "Mesh") {
          this.renderer.addClass(part, "mesh");
          this.renderer.addClass(partname, "meshname")
        }
        else if (/(Camera)/g.exec(item.type) != undefined) {
          this.renderer.addClass(part, "camera");
          this.renderer.addClass(partname, "cameraname")
        }
        else if (/(Light)/g.exec(item.type) != undefined) {
          this.renderer.addClass(part, "light");
          this.renderer.addClass(partname, "lightname")
        }
        else if (item.type == "zeroPlane") {
          this.renderer.addClass(part, "camera");
          this.renderer.addClass(partname, "cameraname")
        }
        else if (item.type == "PlaneHelper") {
          this.renderer.addClass(part, "camera");
          this.renderer.addClass(partname, "cameraname")
        }
      }
    }
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
      let keyframeTrack = AnimationModel.FindKeyframeTrack(this.timeLine, name);
      AnimationModel.CreateActions(keyframeTrack, clip);
      // console.log(keyframeTrack);
      // clip.tracks.forEach(track => {

      //   track.times.forEach(time => {
      //     let key = AnimationModel.CreateKeyframe(time, keyframeTrack, clip)
      //   })
      // })
    })
    this.timeLine.tracks.forEach(track => {
      this.AppendActions(track);
    })
    // this.timeLine.tracks.forEach(track => {
    //   this.AppendKeyframes(track)
    // })
    console.log(this.timeLine);
  }

  AppendActions(keyframeTrack: AnimationModel.KeyframeTrackModel) {
    for (let i = 0; i < keyframeTrack.actions.length; i++) {
      this.AnimationService.CreateActionDOM(keyframeTrack, keyframeTrack.actions[i]);
      this.AppendKeyframes(keyframeTrack.actions[i])
    }
  }
  AppendKeyframes(action: AnimationModel.KeyframeActionModel) {
    for (let i = 0; i < action.keyframes.length; i++) {
      this.AnimationService.CreateKeyframeDOM(action, action.keyframes[i]);
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
  OnResizeTimeline($event: Event) {
    let rulerTrack = document.getElementById("rulerTrack")!;
    this.renderer.setStyle(rulerTrack, "width", `${this.timeLine.duration * this.timeLine.scale}px`);
    let curTime = document.getElementById("curTime")!;
    this.renderer.setStyle(curTime, "left", `${this.AnimationService.currentTime * this.timeLine.scale}px`);
    this.timeLine.tracks.forEach(track => {
      let partline = this.FindPartLineByName(track.name);
      this.renderer.setStyle(track.DOMElement, "width", `${this.timeLine.duration * this.timeLine.scale}px`);
      track.actions.forEach(action => {
        if (action.DOMElement != undefined) {
          this.renderer.setStyle(action.DOMElement, "left", `${action.start * this.timeLine.scale}px`)
          this.renderer.setStyle(action.DOMElement, "width", `${action.length * this.timeLine.scale}px`)
          action.keyframes.forEach(keyframe => {
            if (keyframe.DOMElement != undefined)
              this.renderer.setStyle(keyframe.DOMElement, "left", `${(keyframe.time - action.start) * this.timeLine.scale}px`)
          })
        }
      })
    })
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
      if (time >= 0 && time <= this.timeLine.duration * this.timeLine.scale) {
        curTime.style.left = `${time}px`;
        this.AnimationService.currentTime = time / this.timeLine.scale;
      }
    }
  }
  OnCurrentTimeMouseDown(event: MouseEvent) {
    this.onCurrentTimeMove = true;
    this.AnimationService.currentTimeChange = true;
    this.startPos = event.clientX - this.AnimationService.currentTime * this.timeLine.scale;
  }
}

