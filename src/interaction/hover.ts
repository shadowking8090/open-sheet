export function measureUnderCursor(container: HTMLElement, event: MouseEvent): Element | null {
    const measures = container.querySelectorAll('g.measure');

    for (const measure of measures) {
        const box = measure.getBoundingClientRect();
        const isInsideX = event.clientX >= box.left && event.clientX <= box.right;
        const isInsideY = event.clientY >= box.top && event.clientY <= box.bottom;

        if (isInsideX && isInsideY) {
            return measure
        }
    }
    return null;
}
