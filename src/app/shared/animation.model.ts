import THREE = require("three");

export interface KeyframeModel {
    time: number;
    clip: THREE.AnimationClip;
    // DOMElement?: HTMLElement;
    value: any;
    action: KeyframeActionModel;
}
export interface KeyframeActionModel {
    keyframes: KeyframeModel[];
    type: string;
    track?: THREE.KeyframeTrack;
    // DOMElement?: HTMLElement;
    start: number;
    length: number;
    trackDOM: KeyframeTrackModel;
}
export interface KeyframeTrackModel {
    actions: KeyframeActionModel[];
    name: string;
    type: string;
    // DOMElement?: HTMLElement;
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
export function FindActionByType(keyframeTrack: KeyframeTrackModel, type: string): KeyframeActionModel {
    let act: any;
    keyframeTrack.actions.forEach(action => {
        if (action.type == type) {
            act = action;
        }
    })
    return act;
}
export function FindKeyframeByTime(action: KeyframeActionModel, time: number): KeyframeModel {
    let key: any;
    //console.log(action);
    action.keyframes.forEach(keyframe => {
        if (keyframe.time == time)
            key = keyframe;
    })
    return key;
}
export function CreateActions(keyframeTrack: KeyframeTrackModel, clip: THREE.AnimationClip) {
    clip.tracks.forEach(track => {
        let action: KeyframeActionModel;
        action = { keyframes: [], track: track, start: 0, length: 0, type: track.name, trackDOM: keyframeTrack };
        track.times.forEach(time => {
            action.keyframes.push(CreateKeyframe(time, action, clip));
        })
        action.start = action.track!.times[0];
        action.length = action.track!.times[action.track!.times.length - 1] - action.start;
        keyframeTrack.actions?.push(action);
    })
}

export function CreateKeyframe(time: number, action: KeyframeActionModel, clip: THREE.AnimationClip) {
    let push = false;
    let keyframe: KeyframeModel;
    let a = FindKeyframeByTime(action, time)
    if (a != undefined) {
        keyframe = a;
        push = false;
    }
    else {
        keyframe = { time: time, clip: clip, action: action, value: undefined }
        push = true;
    }
    if (clip.tracks.length != 0)
        clip.tracks.forEach(track => {
            if (track.name == action.type)
                for (let i = 0; i < track.times.length; i++) {
                    if (track.times[i] == time) {
                        //console.log(track.ValueTypeName)
                        if (track.name == ".material.opacity") {
                            keyframe.value = (track.values[i]);
                        }
                        if (track.name == ".position") {
                            keyframe.value = (new THREE.Vector3(track.values[i * 3], track.values[i * 3 + 1], track.values[i * 3 + 2]));
                        }
                        if (track.name == ".visible") {
                            keyframe.value = (Boolean(track.values[i]));
                        }
                    }
                }
        })
    // if (push)
    //     keyframeTrack.keyframes.push(keyframe)
    return keyframe;
}

