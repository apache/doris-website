export interface SlackNudgeTriggerState {
    dismissed: boolean;
    opened: boolean;
    elapsedMs: number;
    ecosystemVisible: boolean;
}

export interface MascotPupilOffsetInput {
    eyeX: number;
    eyeY: number;
    mouseX: number;
    mouseY: number;
    eyeRadiusPx: number;
    pupilRadiusRatio: number;
    softDistancePx: number;
}

export interface MascotPupilOffset {
    x: number;
    y: number;
}

export function computeMascotPupilOffset(input: MascotPupilOffsetInput): MascotPupilOffset;

export function getSlackNudgeBenefits(): string[];

export function shouldOpenSlackNudge(state: SlackNudgeTriggerState): boolean;
