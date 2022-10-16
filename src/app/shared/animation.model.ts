import THREE = require("three");

export interface KeyframeModel {
    time: number;
    clip: THREE.AnimationClip;
    position?: THREE.Vector3;
    rotation?: THREE.Euler;
    opacity?: number;
    visible?: boolean;
    material?: THREE.Material;
}
export interface KeyframeTrackModel {
    keyframes: KeyframeModel[];
    name: string;
}
export interface TimelineModel {
    tracks: KeyframeTrackModel[];
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
    //console.log(keyframeTrack, time, a)
    if (a != undefined) {
        keyframe = a;
        push = false;
    }
    else {
        keyframe = { time: time, clip: clip }
        push = true;
    }
    clip.tracks.forEach(track => {
        for (let i = 0; i < track.times.length; i++) {
            if (track.times[i] == time) {
                //console.log(track.ValueTypeName)
                if (track.ValueTypeName == "number") {
                    if (track.name == ".material.opacity") {
                        keyframe.opacity = track.values[i];
                    }
                }
                if (track.ValueTypeName == "vector") {
                    if (track.name == ".position") {
                        keyframe.position = new THREE.Vector3(track.values[i * 3], track.values[i * 3 + 1], track.values[i * 3 + 2])
                    }
                }
                if (track.ValueTypeName == "bool") {
                    if (track.name == ".visible") {
                        keyframe.visible = Boolean(track.values[i]);
                    }
                }
            }
        }
    })
    if (push)
        keyframeTrack.keyframes.push(keyframe)
    return keyframe;
}
