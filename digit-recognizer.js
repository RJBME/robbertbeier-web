// Tiny, self-contained handwritten-digit recognizer (0–9). No dependencies, no network.
//
// How it works: we render the digits 0–9 in several fonts (including iPad handwriting
// fonts like Bradley Hand / Marker Felt / Chalkboard) at a few slants, and turn each
// into a 28x28 "ink" vector — the same MNIST-style preprocessing we apply to what the
// child draws (crop to the ink, scale, center by center-of-mass). To recognize a drawing
// we find the closest prototypes and return the digits ranked best-first, so the UI can
// show a top guess plus a couple of alternatives.
//
// It is best-effort: the child confirms each digit, so an occasional misread is a quick
// re-tap, and typing is always available as the reliable fallback.

const DigitRecognizer = (function () {
    const N = 28, BOX = 20; // MNIST-style 28x28 grid, ink scaled to fit 20x20 then centered
    let prototypes = null;   // [{ d, v: Float32Array(784) }]

    // --- Preprocess an alpha map (Uint8 length w*h, 0..255 ink) into a 784 vector ---
    function vectorize(alpha, w, h) {
        // bounding box of the ink
        let minX = w, minY = h, maxX = -1, maxY = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            if (alpha[y * w + x] > 30) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
        }
        if (maxX < 0) return null; // nothing drawn
        const bw = maxX - minX + 1, bh = maxY - minY + 1;
        const scale = BOX / Math.max(bw, bh);
        const sw = Math.max(1, Math.round(bw * scale)), sh = Math.max(1, Math.round(bh * scale));

        // resample cropped ink into sw x sh (box-average), tracking center of mass
        const small = new Float32Array(sw * sh);
        let sumX = 0, sumY = 0, sum = 0;
        for (let sy = 0; sy < sh; sy++) for (let sx = 0; sx < sw; sx++) {
            const x0 = minX + Math.floor(sx / scale), x1 = minX + Math.floor((sx + 1) / scale);
            const y0 = minY + Math.floor(sy / scale), y1 = minY + Math.floor((sy + 1) / scale);
            let acc = 0, cnt = 0;
            for (let yy = y0; yy <= y1 && yy <= maxY; yy++) for (let xx = x0; xx <= x1 && xx <= maxX; xx++) { acc += alpha[yy * w + xx]; cnt++; }
            const val = cnt ? acc / cnt / 255 : 0;
            small[sy * sw + sx] = val;
            sumX += val * sx; sumY += val * sy; sum += val;
        }
        if (sum === 0) return null;
        const comX = sumX / sum, comY = sumY / sum;

        // place centered by center-of-mass into 28x28
        const out = new Float32Array(N * N);
        const offX = Math.round(N / 2 - comX), offY = Math.round(N / 2 - comY);
        for (let sy = 0; sy < sh; sy++) for (let sx = 0; sx < sw; sx++) {
            const dx = sx + offX, dy = sy + offY;
            if (dx >= 0 && dx < N && dy >= 0 && dy < N) out[dy * N + dx] = small[sy * sw + sx];
        }
        // light blur to tolerate stroke-width differences
        return blur(out);
    }

    function blur(v) {
        const o = new Float32Array(N * N);
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            let acc = 0, cnt = 0;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < N && ny >= 0 && ny < N) { acc += v[ny * N + nx]; cnt++; }
            }
            o[y * N + x] = acc / cnt;
        }
        return o;
    }

    // --- Build prototypes from rendered font glyphs ---
    function alphaFromCanvasCtx(ctx, w, h) {
        const img = ctx.getImageData(0, 0, w, h).data;
        const a = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) a[i] = img[i * 4 + 3];
        return a;
    }

    function buildPrototypes() {
        const fonts = ['"Bradley Hand"', '"Marker Felt"', '"Chalkboard SE"', '"Noteworthy"', '"Comic Sans MS"', 'Georgia', 'Arial'];
        const rots = [-14, 0, 14];
        const size = 160, pad = 20;
        const c = document.createElement('canvas'); c.width = size; c.height = size;
        const ctx = c.getContext('2d');
        const protos = [];
        for (let d = 0; d <= 9; d++) {
            for (const f of fonts) for (const r of rots) {
                ctx.clearRect(0, 0, size, size);
                ctx.save();
                ctx.translate(size / 2, size / 2);
                ctx.rotate(r * Math.PI / 180);
                ctx.fillStyle = '#000';
                ctx.font = `bold ${size - pad * 2}px ${f}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(d), 0, 4);
                ctx.restore();
                const v = vectorize(alphaFromCanvasCtx(ctx, size, size), size, size);
                if (v) protos.push({ d, v });
            }
        }
        return protos;
    }

    function dist(a, b) { let s = 0; for (let i = 0; i < a.length; i++) { const dd = a[i] - b[i]; s += dd * dd; } return s; }

    // Public: recognize from a canvas element -> ranked [{digit, score}] best-first.
    function recognize(canvas) {
        if (!prototypes) prototypes = buildPrototypes();
        const ctx = canvas.getContext('2d');
        const v = vectorize(alphaFromCanvasCtx(ctx, canvas.width, canvas.height), canvas.width, canvas.height);
        if (!v) return [];
        const best = {}; // digit -> min distance
        for (const p of prototypes) {
            const dd = dist(v, p.v);
            if (best[p.d] === undefined || dd < best[p.d]) best[p.d] = dd;
        }
        return Object.keys(best)
            .map(d => ({ digit: +d, score: best[d] }))
            .sort((a, b) => a.score - b.score);
    }

    return { recognize };
})();
