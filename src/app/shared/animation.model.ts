import THREE = require("three");

export interface KeyframeModel {
    time: number;
    clip: THREE.AnimationClip;
    value: any[];
    action: KeyframeActionModel;
    active: boolean;
}
export interface KeyframeActionModel {
    keyframes: KeyframeModel[];
    type: string;
    track?: THREE.KeyframeTrack;
    start: number;
    length: number;
    trackDOM: KeyframeTrackModel;
    active: boolean;
}
export interface KeyframeTrackModel {
    id: number;
    object: THREE.Object3D;
    actions: KeyframeActionModel[];
    name: string;
    type: string;
    level: number;
    children: number[];
}
export interface TimelineModel {
    tracks: KeyframeTrackModel[];
    duration: number;
    scale: number;
    array?: Array<any>;
}
export function GetArrayTimeLine(timeline: TimelineModel) {
    timeline.array = Array(timeline.tracks.length).fill(0).map((v, i) => {
        return {
            name: timeline.tracks[i].name,
            type: timeline.tracks[i].type,
            level: timeline.tracks[i].level,
            actions: timeline.tracks[i].actions,
            id: timeline.tracks[i].id,
            children: timeline.tracks[i].children,
            expand: true,
            show: true
        }
    })
}
export function FindTrackById(timeline: TimelineModel, id: number) {
    return timeline.array?.findIndex(track => track.id == id);
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

