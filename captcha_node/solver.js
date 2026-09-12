const { JSDOM, VirtualConsole } = require('jsdom');
const SCENE = process.argv[2] || '11xygtvd';
const REGION = process.argv[3] || 'sgp';
const PREFIX = process.argv[4] || 'no8xfe';

const vc = new VirtualConsole();  // 静默 jsdom 噪声
const html = `<!DOCTYPE html><html><head></head><body>
<div id="cap"></div><button id="btn"></button>
<script src="https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js"></script>
</body></html>`;

const dom = new JSDOM(html, {
  url: 'https://zcode.z.ai/',
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    // ⚠️ 2026-09-12 修复：jsdom 默认 UA 带 "jsdom/24.1.0" 等破绽，阿里云风控直接判 F001。
    // 补真实浏览器指纹后 startTracelessVerification 才能拿到 verifyParam。
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
    Object.defineProperty(window.navigator, 'userAgent', { get: () => UA });
    Object.defineProperty(window.navigator, 'appVersion', { get: () => UA.replace('Mozilla/', '') });
    Object.defineProperty(window.navigator, 'platform', { get: () => 'Win32' });
    Object.defineProperty(window.navigator, 'vendor', { get: () => 'Google Inc.' });
    Object.defineProperty(window.navigator, 'webdriver', { get: () => false });
    Object.defineProperty(window.navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] });
    Object.defineProperty(window.navigator, 'language', { get: () => 'zh-CN' });
    Object.defineProperty(window.navigator, 'hardwareConcurrency', { get: () => 8 });
    Object.defineProperty(window.navigator, 'deviceMemory', { get: () => 8 });
    Object.defineProperty(window.navigator, 'maxTouchPoints', { get: () => 0 });
    window.navigator.plugins = [1, 2, 3, 4, 5];
    window.navigator.mimeTypes = [1, 2];
    window.chrome = { runtime: {}, app: { isInstalled: false }, csi: () => {}, loadTimes: () => {} };
    Object.defineProperty(window.screen, 'width', { get: () => 1920 });
    Object.defineProperty(window.screen, 'height', { get: () => 1080 });
    Object.defineProperty(window.screen, 'availWidth', { get: () => 1920 });
    Object.defineProperty(window.screen, 'availHeight', { get: () => 1040 });
    Object.defineProperty(window.screen, 'colorDepth', { get: () => 24 });
    Object.defineProperty(window, 'devicePixelRatio', { get: () => 1 });
    window.requestIdleCallback = window.requestIdleCallback || ((cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1));

    window.matchMedia = () => ({ matches:false, media:'', onchange:null, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){return false;} });
    // canvas / webgl 指纹桩：返回稳定值即可
    const proto = window.HTMLCanvasElement.prototype;
    proto.getContext = function (type) {
      if (/webgl/i.test(type)) return { canvas:this, getParameter:(p)=>({0x1F00:'Google Inc. (Intel)',0x1F01:'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)'}[p]||'Intel'), getExtension:()=>null, getSupportedExtensions:()=>['WEBGL_debug_renderer_info'], getContextAttributes:()=>({}), getShaderPrecisionFormat:()=>({precision:23,rangeMin:127,rangeMax:127}) };
      return { canvas:this, fillRect(){}, clearRect(){}, getImageData:(x,y,w=1,h=1)=>({data:new Uint8ClampedArray(w*h*4)}), putImageData(){}, createImageData:(w=1,h=1)=>({data:new Uint8ClampedArray(w*h*4)}), setTransform(){}, transform(){}, drawImage(){}, save(){}, restore(){}, beginPath(){}, moveTo(){}, lineTo(){}, bezierCurveTo(){}, quadraticCurveTo(){}, closePath(){}, clip(){}, stroke(){}, fill(){}, arc(){}, rect(){}, ellipse(){}, translate(){}, scale(){}, rotate(){}, fillText(){}, strokeText(){}, measureText:(t)=>({width:(''+t).length*8}), createLinearGradient:()=>({addColorStop(){}}), createRadialGradient:()=>({addColorStop(){}}), createPattern:()=>({}), isPointInPath:()=>false, font:'10px sans-serif', textBaseline:'alphabetic', textAlign:'start', fillStyle:'#000', strokeStyle:'#000', globalAlpha:1, lineWidth:1, shadowBlur:0, shadowColor:'' };
    };
    proto.toDataURL = () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    proto.toBlob = (cb) => cb && cb(null);
    // Worker 桩
    window.Worker = class { constructor(){} postMessage(){} terminate(){} addEventListener(){} removeEventListener(){} onmessage=null; onerror=null; };
    window.OffscreenCanvas = window.OffscreenCanvas || class { constructor(w,h){this.width=w;this.height=h;} getContext(){return proto.getContext.call(this);} };
  },
});
const { window } = dom;

function waitFor(cond, t = 12000) {
  return new Promise((res, rej) => {
    const s = Date.now();
    const i = setInterval(() => { let ok=false; try{ok=cond();}catch{} if(ok){clearInterval(i);res();} else if(Date.now()-s>t){clearInterval(i);rej(new Error('timeout'));} }, 80);
  });
}

(async () => {
  await waitFor(() => typeof window.initAliyunCaptcha === 'function');
  window.initAliyunCaptcha({
    SceneId: SCENE, mode: 'popup', region: REGION, prefix: PREFIX,
    element: '#cap', button: '#btn', captchaLogoImg: '', showErrorTip: false,
    getInstance: (inst) => { try { (inst.startTracelessVerification || inst.show).call(inst); } catch (e) { console.error('start', e.message); } },
    success: (param) => { console.log('VERIFY_PARAM=' + param); process.exit(0); },
    fail: () => process.exit(4),
    onError: () => process.exit(5),
  });
  setTimeout(() => process.exit(2), 25000);
})().catch(() => process.exit(3));
