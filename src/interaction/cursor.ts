export interface Cursor {
    measureIndex: number;
    tick: number;
}

export function activateMeasure(measureIndex: number): Cursor {
    return { measureIndex: measureIndex, tick: 0 };
}
