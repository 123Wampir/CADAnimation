import { Component, Renderer2, Input, OnChanges, OnInit, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { AnimationService } from 'src/app/services/animation.service';
import * as AnimationModel from 'src/app/shared/animation.model';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() actions!: THREE.AnimationAction[];
  @Input() scene!: THREE.Object3D;
  @Input() curTime = 0;
  // @Input() appendKeyframe = false;
  constructor(public AnimationService: AnimationService, private renderer: Renderer2) { }
  timeLine: AnimationModel.TimelineModel = { tracks: [], duration: 20, scale: 50 };
  keyframes: AnimationModel.KeyframeModel[] = [];
  onCurrentTimeMove = false;
  startPos = 0;

  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    this.AnimationService.renderer = this.renderer;
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
    if (changes["scene"] != undefined)
      if (changes["scene"].currentValue != undefined) {
        this.CreateTreeView();
      }
    if (changes["curTime"] != undefined) {
      let currentTime = document.getElementById("curTime")!;
      this.renderer.setStyle(currentTime, "left", `${this.AnimationService.currentTime * this.timeLine.scale}px`);
    }
  }
  CreateTreeView() {
    this.CreateTreeViewElements(this.scene);
    setTimeout(() => { this.UpdateTracks(); }, 1000);
  }
  CreateTreeViewElements(obj: THREE.Object3D, tabIndex: number = 0) {
    if (obj.children.length != 0) {
      let ln = document.getElementById("lines")
      for (let item of obj.children) {
        if (item.type == "TransformControls") {
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
        partname.innerText = `${"╠" + "═".repeat(tabIndex) + item.name}`;
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
        let keyframeTrack: AnimationModel.KeyframeTrackModel = { DOMElement: track, name: item.name, keyframes: [] };
        this.timeLine.tracks.push(keyframeTrack);

        if (item.type == "Object3D") {
          this.renderer.addClass(part, "part");
          this.renderer.addClass(partname, "partname")
          let button = this.renderer.createElement("button");
          this.renderer.addClass(button, "expand");
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
            if (show)
              a.setAttribute("show", "1")
            else a.setAttribute("show", "0");
          })
          if (item.children.length != 0) {
            tabIndex++
            this.CreateTreeViewElements(item, tabIndex)
            tabIndex--;
          }
        }
        if (item.type == "Mesh") {
          this.renderer.addClass(part, "mesh");
          this.renderer.addClass(partname, "meshname")
        }
        if (item.type == "Camera") {
          this.renderer.addClass(part, "mesh");
          this.renderer.addClass(partname, "meshname")
        }
        if (/(Light)/g.exec(item.type) != undefined) {
          this.renderer.addClass(part, "light");
          this.renderer.addClass(partname, "lightname")
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
          arr.push(item);
          this.SelectChildrenParts(item, arr);
        }
      })
    }
  }
  UpdateTracks() {
    this.AnimationService.actions.forEach(action => {
      let name = action.getRoot().name;
      let clip = action.getClip();
      let keyframeTrack = AnimationModel.FindKeyframeTrack(this.timeLine, name);
      clip.tracks.forEach(track => {
        track.times.forEach(time => {
          let key = AnimationModel.CreateKeyframe(time, keyframeTrack, clip)
        })
      })
    })
    this.timeLine.tracks.forEach(track => {
      this.AppendKeyframes(track)
    })
    console.log(this.timeLine);
  }

  AppendKeyframes(keyframeTrack: AnimationModel.KeyframeTrackModel) {
    let trackline = keyframeTrack.DOMElement;
    for (let i = 0; i < keyframeTrack.keyframes.length; i++) {
      let keyframe = this.renderer.createElement("div");
      keyframeTrack.keyframes[i].DOMElement = keyframe;
      this.renderer.addClass(keyframe, "keyframe")
      this.renderer.setStyle(keyframe, "left", `${keyframeTrack.keyframes[i].time * this.timeLine.scale}px`)
      this.renderer.setAttribute(keyframe, "time", keyframeTrack.keyframes[i].time.toString())
      this.renderer.setAttribute(keyframe, "part", keyframeTrack.name)
      this.renderer.appendChild(trackline, keyframe)
      this.renderer.listen(keyframe, "click", (event) => {
        let time = Number.parseFloat(event.target.attributes["time"].nodeValue);
        let name = event.target.attributes["part"].nodeValue;
        let track = AnimationModel.FindKeyframeTrack(this.timeLine, name);
        let keyframe = AnimationModel.FindKeyframeByTime(track, time);
        console.log(keyframe);
        this.AnimationService.selectedKeyframe = keyframe;
        this.AnimationService.currentTime = time;
        this.AnimationService.currentTimeChange = true;
      })
    }
  }




  //UI
  ShowChildren(name: string, show: boolean) {
    console.log(show);
    let arr: any[] = [];
    let obj = this.FindPartByName(name);
    this.SelectChildrenParts(obj!, arr)
    arr.forEach(item => {
      let line = this.FindPartLineByName(item.name);
      let btn = line?.getElementsByClassName("expand");
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
      track.keyframes.forEach(keyframe => {
        if (keyframe.DOMElement != undefined) {
          this.renderer.setStyle(keyframe.DOMElement, "left", `${keyframe.time * this.timeLine.scale}px`)
        }
      })
    })
  }
  OnCurrentTimeMouseUp(event: MouseEvent) {
    this.AnimationService.currentTimeChange = false;
    this.onCurrentTimeMove = false;
    console.log(this.AnimationService.currentTime);
  }
  OnCurrentTimeMouseMove(event: MouseEvent) {
    if (this.onCurrentTimeMove) {
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
