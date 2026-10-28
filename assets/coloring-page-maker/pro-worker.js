/* Pro converter worker for the photo-to-coloring-page maker.
   Runs the OpenCV pipeline off the main thread so the page never freezes
   while a photo is being converted.
   Protocol:
     in:  { type: 'init' }
          { type: 'job', id, data: ArrayBuffer (RGBA), w, h, sFrac, dFrac }
     out: { type: 'ready' } | { type: 'load-failed' }
          { type: 'result', id, ok, data: ArrayBuffer (RGBA), w, h } */
'use strict';

var cvPromise = null;
var busy = false;
var pending = null;

function loadCV() {
  if (cvPromise) { return cvPromise; }
  cvPromise = new Promise(function (resolve, reject) {
    try {
      importScripts('https://docs.opencv.org/4.8.0/opencv.js');
    } catch (e) { reject(e); return; }
    var cv = self.cv;
    if (!cv) { reject(new Error('cv missing')); return; }
    if (cv.Mat) { resolve(cv); return; }
    if (typeof cv.then === 'function') {
      cv.then(function (real) { resolve(real || self.cv); }, reject);
      return;
    }
    cv.onRuntimeInitialized = function () { resolve(self.cv); };
  });
  return cvPromise;
}

/* Identical pipeline to the original main-thread pro converter:
   bilateral denoise -> dodge blend with true Gaussian blur -> gamma ->
   Canny outlines dilated and darkened in -> tiny speck components erased. */
function runJob(cv, job) {
  var w = job.w, h = job.h, n = w * h;
  var imgData = new ImageData(new Uint8ClampedArray(job.data), w, h);
  var src = cv.matFromImageData(imgData);
  var gray = new cv.Mat(), sm = new cv.Mat(), inv = new cv.Mat(), bl = new cv.Mat();
  var edges = new cv.Mat(), out = new cv.Mat(), bw = new cv.Mat(),
      labels = new cv.Mat(), stats = new cv.Mat(), cent = new cv.Mat();
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.bilateralFilter(gray, sm, 5, 50, 50);
    cv.bitwise_not(sm, inv);
    var blurR = Math.max(3, Math.round(25 - job.dFrac * 14)) | 1;
    cv.GaussianBlur(inv, bl, new cv.Size(blurR, blurR), 0);
    var smd = sm.data, bld = bl.data;
    var gamma = 1.1 + job.sFrac * 1.7;
    var lut = new Uint8Array(n);
    for (var i = 0; i < n; i++) {
      var den = 255 - bld[i];
      var v = (bld[i] >= 255) ? 255 : Math.min(255, smd[i] * 255 / Math.max(1, den));
      v = 255 * Math.pow(v / 255, gamma);
      if (v > 242) { v = 255; }
      lut[i] = v;
    }
    out.create(h, w, cv.CV_8UC1);
    out.data.set(lut);
    var lo = Math.round(90 - job.dFrac * 55), hi = Math.round(210 - job.dFrac * 110);
    cv.Canny(sm, edges, lo, hi);
    var kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    cv.dilate(edges, edges, kernel);
    kernel.delete();
    var dark = Math.round(90 - job.sFrac * 60);
    var ed = edges.data, od = out.data;
    for (var j = 0; j < n; j++) { if (ed[j] > 0 && od[j] > dark) { od[j] = dark; } }
    cv.threshold(out, bw, 127, 255, cv.THRESH_BINARY_INV);
    cv.connectedComponentsWithStats(bw, labels, stats, cent, 8, cv.CV_32S);
    var minArea = Math.max(6, Math.floor(0.00004 * n));
    var lab = labels.data32S, sd = stats.data32S, cols = stats.cols;
    for (var p = 0; p < n; p++) {
      var li = lab[p];
      if (li > 0 && sd[li * cols + 4] < minArea) { od[p] = 255; }
    }
    var rgba = new Uint8ClampedArray(n * 4);
    for (var q = 0; q < n; q++) {
      rgba[q * 4] = od[q]; rgba[q * 4 + 1] = od[q]; rgba[q * 4 + 2] = od[q]; rgba[q * 4 + 3] = 255;
    }
    return { ok: true, buf: rgba.buffer };
  } catch (e) {
    return { ok: false };
  } finally {
    src.delete(); gray.delete(); sm.delete(); inv.delete(); bl.delete();
    edges.delete(); out.delete(); bw.delete(); labels.delete(); stats.delete(); cent.delete();
  }
}

function pump() {
  if (busy || !pending) { return; }
  var job = pending; pending = null; busy = true;
  loadCV().then(function (cv) {
    var r = runJob(cv, job);
    busy = false;
    if (r.ok) {
      self.postMessage({ type: 'result', id: job.id, ok: true, data: r.buf, w: job.w, h: job.h }, [r.buf]);
    } else {
      self.postMessage({ type: 'result', id: job.id, ok: false });
    }
    pump();
  }, function () {
    busy = false;
    self.postMessage({ type: 'result', id: job.id, ok: false });
    pump();
  });
}

self.onmessage = function (e) {
  var msg = e.data || {};
  if (msg.type === 'init') {
    loadCV().then(
      function () { self.postMessage({ type: 'ready' }); },
      function () { self.postMessage({ type: 'load-failed' }); }
    );
  } else if (msg.type === 'job') {
    pending = msg; /* newest job wins — older queued jobs are dropped */
    pump();
  }
};
