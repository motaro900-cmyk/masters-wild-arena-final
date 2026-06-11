let timeOffset = 0;

export const TimeService = {
    setOffset(offset: number) {
        timeOffset = offset;
        console.log(`[TimeService] Calibrated with offset: ${offset}ms`);
    },
    getOffset(): number {
        return timeOffset;
    },
    now(): number {
        return Date.now() + timeOffset;
    }
};
