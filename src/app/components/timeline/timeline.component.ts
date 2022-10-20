import { Component, Renderer2, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { AnimationService } from 'src/app/services/animation.service';
import * as AnimationModel from 'src/app/shared/animation.model';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnInit, OnChanges {
  @Input() mixers: THREE.AnimationMixer[] = [];
  @Input() actions!: THREE.AnimationAction[];
  @Input() scene!: THREE.Object3D;
  constructor(public AnimationService: AnimationService, private renderer: Renderer2) { }
  timeLine: AnimationModel.TimelineModel = { tracks: [], duration: 30, scale: 50 };
  keyframes: AnimationModel.KeyframeModel[] = []

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes)

    if (changes["scene"].currentValue != undefined) {
      this.CreateTreeView();
      //console.log(changes["actions"].previousValue[0])
    }
  }



  CreateTreeView() {
    this.CreateTreeViewElements(this.scene)
    setTimeout(() => {
      this.UpdateTracks();
    }, 1000);
  }

  CreateTreeViewElements(obj: THREE.Object3D, tabIndex: number = 0) {
    if (obj.children.length != 0) {
      let ln = document.getElementById("lines")
      for (let item of obj.children) {
        if (item.type == "Object3D") {
          let line = this.renderer.createElement("div");
          line.className = "line";

          let part = this.renderer.createElement("div");
          this.renderer.addClass(part, "part");
          this.renderer.appendChild(line, part)

          let partname = this.renderer.createElement("div");
          this.renderer.addClass(partname, "partname")
          if (item.name == "") {
            item.name = item.id.toString();
            partname.innerText = item
          }
          partname.innerText = `${"╠" + "═".repeat(tabIndex) + item.name}`;
          this.renderer.setAttribute(partname, "name", item.name)
          this.renderer.appendChild(part, partname)

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

          let track = this.renderer.createElement("div");
          this.renderer.addClass(track, "track")
          this.renderer.setStyle(track, "width", `${this.timeLine.duration * this.timeLine.scale}px`);
          this.renderer.appendChild(line, track)
          this.renderer.appendChild(ln, line)

          this.renderer.listen(partname, "click", (event) => {
            this.FindPartByName(event.target.attributes["name"].nodeValue)
          })

          let keyframeTrack: AnimationModel.KeyframeTrackModel = { name: item.name, keyframes: [] };
          //console.log(keyframeTrack);
          this.timeLine.tracks.push(keyframeTrack);

          if (item.children.length != 0) {
            tabIndex++
            this.CreateTreeViewElements(item, tabIndex)
            tabIndex--;
          }
        }
        if (item.type == "Mesh") {
          let line = this.renderer.createElement("div");
          line.className = "line";

          let mesh = this.renderer.createElement("div");
          this.renderer.addClass(mesh, "mesh");
          this.renderer.appendChild(line, mesh)

          let meshname = this.renderer.createElement("div");
          this.renderer.addClass(meshname, "meshname")
          if (item.name != "")
            meshname.innerText = `${"╠" + "═".repeat(tabIndex) + item.name}`;
          else meshname.innerText = "Node"
          this.renderer.setAttribute(meshname, "name", item.name)
          this.renderer.appendChild(mesh, meshname)

          let track = this.renderer.createElement("div");
          this.renderer.addClass(track, "track")
          this.renderer.setStyle(track, "width", `${this.timeLine.duration * this.timeLine.scale}px`);
          this.renderer.appendChild(line, track)
          this.renderer.appendChild(ln, line)

          this.renderer.listen(meshname, "click", (event) => {
            this.FindPartByName(event.target.attributes["name"].nodeValue)
          })

          let keyframeTrack: AnimationModel.KeyframeTrackModel = { name: item.name, keyframes: [] };
          //console.log(keyframeTrack);
          this.timeLine.tracks.push(keyframeTrack);
        }
        if (item.type == "Camera") {

        }
      }
    }
  }
  FindPartByName(name: string) {
    console.log(this.scene.getObjectByName(name));
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
    this.actions.forEach(action => {
      let name = action.getRoot().name;
      let clip = action.getClip();
      let keyframeTrack = AnimationModel.FindKeyframeTrack(this.timeLine, name);
      clip.tracks.forEach(track => {
        track.times.forEach(time => {
          let key = AnimationModel.CreateKeyframe(time, keyframeTrack, clip)
        })
      })
      //console.log(keyframeTrack);
      //console.log(action, name)
    })
    this.timeLine.tracks.forEach(track => {
      let partline = this.FindPartLineByName(track.name);
      this.CreateKeyframes(partline!, track)
    })
    //console.log(this.mixers)
  }

  CreateKeyframes(partline: HTMLElement, keyframeTrack: AnimationModel.KeyframeTrackModel) {
    let trackline = partline.getElementsByClassName("track")
    for (let i = 0; i < keyframeTrack.keyframes.length; i++) {
      let keyframe = this.renderer.createElement("div");
      this.renderer.addClass(keyframe, "keyframe")
      this.renderer.setStyle(keyframe, "left", `${keyframeTrack.keyframes[i].time * this.timeLine.scale}px`)
      this.renderer.setAttribute(keyframe, "time", keyframeTrack.keyframes[i].time.toString())
      this.renderer.setAttribute(keyframe, "part", keyframeTrack.name)
      this.renderer.appendChild(trackline[0], keyframe)
      this.renderer.listen(keyframe, "click", (event) => {
        let time = Number.parseFloat(event.target.attributes["time"].nodeValue);
        let name = event.target.attributes["part"].nodeValue;
        let track = AnimationModel.FindKeyframeTrack(this.timeLine, name);
        let keyframe = AnimationModel.FindKeyframeByTime(track, time)
        console.log(keyframe);
        this.AnimationService.selectedKeyframe = keyframe;
      })
    }
  }

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
    console.log(this.AnimationService.play,this.AnimationService.stop);
  }
}
