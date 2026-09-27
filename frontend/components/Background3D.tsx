'use client';

import { useEffect, useRef } from 'react';

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

// Liquid silk: domain-warped fbm folds lit by a soft key light that follows the pointer.
const FRAG = `#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uScroll;uniform float uGain;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
float silk(vec2 p,float t){
  vec2 q=vec2(fbm(p+vec2(0.,t*.6)),fbm(p+vec2(5.2,1.3)-t*.4));
  vec2 r=vec2(fbm(p+2.2*q+vec2(1.7,9.2)+t*.25),fbm(p+2.2*q+vec2(8.3,2.8)-t*.2));
  return sin((p.x*1.1+p.y*.35)*2.2+r.x*5.5+r.y*2.5-t*.9);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  float t=uTime*.07+uScroll*.35;
  vec2 sp=p*1.35+vec2(0.,uScroll*.25);
  float s=silk(sp,t);
  float k=uRes.y*.0045;
  vec3 nor=normalize(vec3(-dFdx(s)*k,-dFdy(s)*k,1.));
  vec3 L=normalize(vec3(uMouse.x*.9-.35,.55-uMouse.y*.6,.9));
  float dif=max(dot(nor,L),0.);
  float spec=pow(max(dot(reflect(-L,nor),vec3(0,0,1)),0.),42.);
  float fold=.5+.5*s;
  vec3 base=mix(vec3(.004,.005,.007),vec3(.07,.075,.09),fold*fold*fold);
  vec3 col=base*(.22+pow(dif,1.6)*1.25)+vec3(.86,.9,1.)*spec*.75;
  // sheen band drifting across
  col+=vec3(.55,.6,.7)*.05*smoothstep(.2,0.,abs(p.x*.6+p.y-sin(t*.8)*.6));
  float vig=smoothstep(1.25,.25,length((uv-.5)*vec2(1.25,1.)));
  col*=vig*uGain;
  gl_FragColor=vec4(col,1.);
}`;

/**
 * Ambient backdrop for the marketing pages: a WebGL "liquid silk" surface rendered at
 * reduced resolution behind all content, lit by a light that follows the pointer and
 * drifting with scroll. Pauses when hidden, draws one still frame for reduced-motion
 * users and falls back to the CSS gradient when WebGL is unavailable. With `afterHero`
 * it fades in once the hero (which has its own artwork) scrolls away.
 */
export default function Background3D({ afterHero, dim }: { afterHero?: boolean; dim?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
    if (!canvas || !gl || !gl.getExtension('OES_standard_derivatives')) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.matchMedia('(max-width: 760px)').matches;
    const scaleDown = small ? 0.4 : 0.5;

    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'uRes'), uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse'), uScroll = gl.getUniformLocation(prog, 'uScroll');
    const uGain = gl.getUniformLocation(prog, 'uGain');
    canvas.classList.add('ready');

    let w = 0, h = 0, frame = 0, last = 0;
    let mx = 0.5, my = 0.35, tx = mx, ty = my, scroll = window.scrollY;
    const t0 = performance.now();

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * scaleDown));
      canvas.height = Math.max(1, Math.round(h * scaleDown));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = (now: number) => {
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      const fade = afterHero ? Math.min(1, Math.max(0, (scroll - h * 0.35) / (h * 0.6))) : 1;
      canvas.style.opacity = String(fade);
      if (fade <= 0.001) return;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uScroll, scroll / Math.max(h, 1));
      gl.uniform1f(uGain, dim ? 0.6 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (document.hidden) return;
      if (now - last < (small ? 40 : 22)) return; // ~25fps phones, ~45fps desktop — the motion is slow
      last = now;
      draw(now);
    };

    const onPointer = (e: PointerEvent) => { tx = e.clientX / w; ty = e.clientY / h; };
    const onScroll = () => { scroll = window.scrollY; if (reduced) draw(performance.now()); };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    if (reduced) draw(t0 + 20000);
    else {
      window.addEventListener('pointermove', onPointer, { passive: true });
      frame = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [afterHero, dim]);

  return (
    <>
      <canvas ref={ref} className="lp-bg3d" aria-hidden="true" />
      <div className="lp-grain" aria-hidden="true" />
    </>
  );
}
