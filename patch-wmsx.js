// Fix for https://github.com/ppeccin/WebMSX/issues/102
function createVolumeCurve() { volumeCurve[0] = 0; for (let v = 1; v < 16; v++) volumeCurve[v] = Math.pow(2, -(15-v)/2) * CHANNEL_MAX_VOLUME; }
