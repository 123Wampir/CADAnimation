import THREE = require("three");

export interface KeyframeModel {
    time: number;
    clip: THREE.AnimationClip;
    DOMElement?: HTMLElement;
    position?: THREE.Vector3;
    quaternion?: THREE.Euler;
    opacity?: number;
    visible?: boolean;
    material?: THREE.Material;
    color?: THREE.Color;
    constant?: number;
}
export interface KeyframeTrackModel {
    keyframes: KeyframeModel[];
    name: string;
    DOMElement: HTMLElement;
}
export interface TimelineModel {
    tracks: KeyframeTrackModel[];
    duration: number;
    scale: number;
}

export function FindKeyframeTrack(timeline: TimelineModel, name: string): KeyframeTrackModel {
    let track: any;
    timeline.tracks.forEach(item => {
        if (item.name == name)
            track = item;
    })
    return track;
}
export function FindKeyframeByTime(track: KeyframeTrackModel, time: number): KeyframeModel {
    let key: any;
    track.keyframes.forEach(keyframe => {
        if (keyframe.time == time)
            key = keyframe;
    })
    return key;
}
export function CreateKeyframe(time: number, keyframeTrack: KeyframeTrackModel, clip: THREE.AnimationClip) {
    let push = false;
    let keyframe: KeyframeModel;
    let a = FindKeyframeByTime(keyframeTrack, time)
    if (a != undefined) {
        keyframe = a;
        push = false;
    }
    else {
        keyframe = { time: time, clip: clip }
        push = true;
    }
    if (clip.tracks.length != 0)
        clip.tracks.forEach(track => {
            for (let i = 0; i < track.times.length; i++) {
                if (track.times[i] == time) {
                    //console.log(track.ValueTypeName)
                    if (track.name == ".material.opacity") {
                        keyframe.opacity = track.values[i];
                    }
                    if (track.name == ".position") {
                        keyframe.position = new THREE.Vector3(track.values[i * 3], track.values[i * 3 + 1], track.values[i * 3 + 2])
                    }
                    if (track.name == ".visible") {
                        keyframe.visible = Boolean(track.values[i]);
                    }
                }
            }
        })
    if (push)
        keyframeTrack.keyframes.push(keyframe)
    return keyframe;
}

