var Q=Object.defineProperty;var X=(i,e,o)=>e in i?Q(i,e,{enumerable:!0,configurable:!0,writable:!0,value:o}):i[e]=o;var x=(i,e,o)=>X(i,typeof e!="symbol"?e+"":e,o);import{G as m,f as Z,g as W,h as j,i as Y,P as k,S as F,C as E,d as J}from"./vendor-pixi-9br39sRK.js";import{P as v,g as c}from"./PixiApp-DK13L95K.js";import{u as b,U as z}from"./index-CJo_hj18.js";const I=class I{constructor(){x(this,"pixiApp");x(this,"freePool",new Set);x(this,"activePool",new Set);this.pixiApp=v.getInstance();const e=b.getState().particlesQuality;this.init(e==="LOW"?50:100)}static getInstance(){return I.instance||(I.instance=new I),I.instance}get pool(){return[...this.freePool,...this.activePool]}init(e=100){try{for(let o=0;o<e;o++){const t=new m;t.visible=!1,this.pixiApp.effectsLayer.addChild(t),this.freePool.add(t)}`${e}`}catch(o){console.error("❌ Particle pool initialization error:",o)}}acquire(){for(const t of this.freePool)t.destroyed&&this.freePool.delete(t);for(const t of this.activePool)t.destroyed&&this.activePool.delete(t);if(this.freePool.size>0){const t=this.freePool.values().next().value;return t?(this.freePool.delete(t),this.activePool.add(t),t.visible=!0,t):null}const o=b.getState().particlesQuality==="LOW"?50:200;if(this.freePool.size+this.activePool.size<o){const t=new m;return t.visible=!0,this.pixiApp.effectsLayer.addChild(t),this.activePool.add(t),t}if(this.activePool.size>0){const t=this.activePool.values().next().value;return t?(this.activePool.delete(t),t.visible=!0,t.clear(),this.activePool.add(t),t):null}return null}release(e){if(e.destroyed){this.activePool.delete(e),this.freePool.delete(e);return}this.activePool.delete(e),this.freePool.add(e),e.visible=!1,e.clear(),e.parent&&e.parent.removeChild(e)}getParticle(e=!1){return b.getState().particlesQuality==="LOW"&&(e===!0||e==="AMBIENT")?null:this.acquire()}releaseParticle(e){this.release(e)}destroy(){for(const e of this.freePool)e.destroyed||e.destroy();for(const e of this.activePool)e.destroyed||e.destroy();this.freePool.clear(),this.activePool.clear()}clear(){this.destroy(),I.instance=null}};x(I,"instance",null);let P=I;var U=`in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`,ee=`struct GlobalFilterUniforms {
  uInputSize:vec4<f32>,
  uInputPixel:vec4<f32>,
  uInputClamp:vec4<f32>,
  uOutputFrame:vec4<f32>,
  uGlobalFrame:vec4<f32>,
  uOutputTexture:vec4<f32>,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;

struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv : vec2<f32>
  };

fn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>
{
    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;

    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

fn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>
{
    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

fn globalTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>
{
  return  (aPosition.xy / gfu.uGlobalFrame.zw) + (gfu.uGlobalFrame.xy / gfu.uGlobalFrame.zw);  
}

fn getSize() -> vec2<f32>
{
  return gfu.uGlobalFrame.zw;
}
  
@vertex
fn mainVertex(
  @location(0) aPosition : vec2<f32>, 
) -> VSOutput {
  return VSOutput(
   filterVertexPosition(aPosition),
   filterTextureCoord(aPosition)
  );
}`,te=`precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec2 uStrength;
uniform vec3 uColor;
uniform float uKnockout;
uniform float uAlpha;

uniform vec4 uInputSize;
uniform vec4 uInputClamp;

const float PI = 3.14159265358979323846264;

// Hard-assignment of DIST and ANGLE_STEP_SIZE instead of using uDistance and uQuality to allow them to be use on GLSL loop conditions
const float DIST = __DIST__;
const float ANGLE_STEP_SIZE = min(__ANGLE_STEP_SIZE__, PI * 2.);
const float ANGLE_STEP_NUM = ceil(PI * 2. / ANGLE_STEP_SIZE);
const float MAX_TOTAL_ALPHA = ANGLE_STEP_NUM * DIST * (DIST + 1.) / 2.;

void main(void) {
    vec2 px = vec2(1.) / uInputSize.xy;

    float totalAlpha = 0.;

    vec2 direction;
    vec2 displaced;
    vec4 curColor;

    for (float angle = 0.; angle < PI * 2.; angle += ANGLE_STEP_SIZE) {
      direction = vec2(cos(angle), sin(angle)) * px;

      for (float curDistance = 0.; curDistance < DIST; curDistance++) {
          displaced = clamp(vTextureCoord + direction * (curDistance + 1.), uInputClamp.xy, uInputClamp.zw);
          curColor = texture(uTexture, displaced);
          totalAlpha += (DIST - curDistance) * curColor.a;
      }
    }
    
    curColor = texture(uTexture, vTextureCoord);

    vec4 glowColor = vec4(uColor, uAlpha);
    bool knockout = uKnockout > .5;
    float innerStrength = uStrength[0];
    float outerStrength = uStrength[1];

    float alphaRatio = totalAlpha / MAX_TOTAL_ALPHA;
    float innerGlowAlpha = (1. - alphaRatio) * innerStrength * curColor.a * uAlpha;
    float innerGlowStrength = min(1., innerGlowAlpha);
    
    vec4 innerColor = mix(curColor, glowColor, innerGlowStrength);
    float outerGlowAlpha = alphaRatio * outerStrength * (1. - curColor.a) * uAlpha;
    float outerGlowStrength = min(1. - innerColor.a, outerGlowAlpha);
    vec4 outerGlowColor = outerGlowStrength * glowColor.rgba;

    if (knockout) {
      float resultAlpha = outerGlowAlpha + innerGlowAlpha;
      finalColor = vec4(glowColor.rgb * resultAlpha, resultAlpha);
    }
    else {
      finalColor = innerColor + outerGlowColor;
    }
}
`,oe=`struct GlowUniforms {
  uDistance: f32,
  uStrength: vec2<f32>,
  uColor: vec3<f32>,
  uAlpha: f32,
  uQuality: f32,
  uKnockout: f32,
};

struct GlobalFilterUniforms {
  uInputSize:vec4<f32>,
  uInputPixel:vec4<f32>,
  uInputClamp:vec4<f32>,
  uOutputFrame:vec4<f32>,
  uGlobalFrame:vec4<f32>,
  uOutputTexture:vec4<f32>,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;

@group(0) @binding(1) var uTexture: texture_2d<f32>; 
@group(0) @binding(2) var uSampler: sampler;
@group(1) @binding(0) var<uniform> glowUniforms : GlowUniforms;

@fragment
fn mainFragment(
  @builtin(position) position: vec4<f32>,
  @location(0) uv : vec2<f32>
) -> @location(0) vec4<f32> {
  let quality = glowUniforms.uQuality;
  let distance = glowUniforms.uDistance;

  let dist: f32 = glowUniforms.uDistance;
  let angleStepSize: f32 = min(1. / quality / distance, PI * 2.0);
  let angleStepNum: f32 = ceil(PI * 2.0 / angleStepSize);

  let px: vec2<f32> = vec2<f32>(1.0 / gfu.uInputSize.xy);

  var totalAlpha: f32 = 0.0;

  var direction: vec2<f32>;
  var displaced: vec2<f32>;
  var curColor: vec4<f32>;

  for (var angle = 0.0; angle < PI * 2.0; angle += angleStepSize) {
    direction = vec2<f32>(cos(angle), sin(angle)) * px;
    for (var curDistance = 0.0; curDistance < dist; curDistance+=1) {
      displaced = vec2<f32>(clamp(uv + direction * (curDistance + 1.0), gfu.uInputClamp.xy, gfu.uInputClamp.zw));
      curColor = textureSample(uTexture, uSampler, displaced);
      totalAlpha += (dist - curDistance) * curColor.a;
    }
  }
    
  curColor = textureSample(uTexture, uSampler, uv);

  let glowColorRGB = glowUniforms.uColor;
  let glowAlpha = glowUniforms.uAlpha;
  let glowColor = vec4<f32>(glowColorRGB, glowAlpha);
  let knockout: bool = glowUniforms.uKnockout > 0.5;
  let innerStrength = glowUniforms.uStrength[0];
  let outerStrength = glowUniforms.uStrength[1];

  let alphaRatio: f32 = (totalAlpha / (angleStepNum * dist * (dist + 1.0) / 2.0));
  let innerGlowAlpha: f32 = (1.0 - alphaRatio) * innerStrength * curColor.a * glowAlpha;
  let innerGlowStrength: f32 = min(1.0, innerGlowAlpha);
  
  let innerColor: vec4<f32> = mix(curColor, glowColor, innerGlowStrength);
  let outerGlowAlpha: f32 = alphaRatio * outerStrength * (1. - curColor.a) * glowAlpha;
  let outerGlowStrength: f32 = min(1.0 - innerColor.a, outerGlowAlpha);
  let outerGlowColor: vec4<f32> = outerGlowStrength * glowColor.rgba;
  
  if (knockout) {
    let resultAlpha: f32 = outerGlowAlpha + innerGlowAlpha;
    return vec4<f32>(glowColor.rgb * resultAlpha, resultAlpha);
  }
  else {
    return innerColor + outerGlowColor;
  }
}

const PI: f32 = 3.14159265358979323846264;`,ne=Object.defineProperty,re=(i,e,o)=>e in i?ne(i,e,{enumerable:!0,configurable:!0,writable:!0,value:o}):i[e]=o,O=(i,e,o)=>(re(i,typeof e!="symbol"?e+"":e,o),o);const D=class N extends Z{constructor(e){e={...N.DEFAULT_OPTIONS,...e};const o=e.distance??10,t=e.quality??.1,n=W.from({vertex:{source:ee,entryPoint:"mainVertex"},fragment:{source:oe,entryPoint:"mainFragment"}}),r=j.from({vertex:U,fragment:te.replace(/__ANGLE_STEP_SIZE__/gi,`${(1/t/o).toFixed(7)}`).replace(/__DIST__/gi,`${o.toFixed(0)}.0`),name:"glow-filter"});super({gpuProgram:n,glProgram:r,resources:{glowUniforms:{uDistance:{value:o,type:"f32"},uStrength:{value:[e.innerStrength,e.outerStrength],type:"vec2<f32>"},uColor:{value:new Float32Array(3),type:"vec3<f32>"},uAlpha:{value:e.alpha,type:"f32"},uQuality:{value:t,type:"f32"},uKnockout:{value:(e==null?void 0:e.knockout)??!1?1:0,type:"f32"}}},padding:o}),O(this,"uniforms"),O(this,"_color"),this.uniforms=this.resources.glowUniforms.uniforms,this._color=new Y,this.color=e.color??16777215}get distance(){return this.uniforms.uDistance}set distance(e){this.uniforms.uDistance=this.padding=e}get innerStrength(){return this.uniforms.uStrength[0]}set innerStrength(e){this.uniforms.uStrength[0]=e}get outerStrength(){return this.uniforms.uStrength[1]}set outerStrength(e){this.uniforms.uStrength[1]=e}get color(){return this._color.value}set color(e){this._color.setValue(e);const[o,t,n]=this._color.toArray();this.uniforms.uColor[0]=o,this.uniforms.uColor[1]=t,this.uniforms.uColor[2]=n}get alpha(){return this.uniforms.uAlpha}set alpha(e){this.uniforms.uAlpha=e}get quality(){return this.uniforms.uQuality}set quality(e){this.uniforms.uQuality=e}get knockout(){return this.uniforms.uKnockout===1}set knockout(e){this.uniforms.uKnockout=e?1:0}};O(D,"DEFAULT_OPTIONS",{distance:10,outerStrength:4,innerStrength:0,color:16777215,alpha:1,quality:.1,knockout:!1});let ie=D;function se(i,e){try{const o=v.getInstance(),t=new m,n=8+Math.floor(Math.random()*5),r=[];r.push(new k(i,0));for(let l=1;l<n;l++){const a=l/n,f=e*a,p=i+(Math.random()-.5)*60;r.push(new k(p,f))}r.push(new k(i,e)),t.beginPath(),t.moveTo(r[0].x,r[0].y);for(let l=1;l<r.length;l++)t.lineTo(r[l].x,r[l].y);if(t.stroke({color:13430527,width:3}),b.getState().glowEnabled)try{const l=new ie({distance:15,outerStrength:3,color:13430527});t.filters=[l]}catch(l){console.warn("GlowFilter failed, playing lightning without glow:",l)}o.effectsLayer.addChild(t);const s=new m;s.beginPath(),s.rect(0,0,1920,1080),s.fill({color:16777215,alpha:.4}),o.effectsLayer.addChild(s),c.to(s,{alpha:0,duration:.08,ease:"power2.out",onComplete:()=>{s&&!s.destroyed&&(c.killTweensOf(s),s.destroy())}}),c.to(t,{alpha:0,duration:.15,ease:"power2.inOut",onComplete:()=>{t&&!t.destroyed&&(c.killTweensOf(t),t.destroy())}}),S.getInstance().screenShake(8,.9,300)}catch(o){console.error("❌ spawnLightningStrike error:",o)}}function le(i,e,o,t,n){try{const r=v.getInstance(),s=new m;s.beginPath(),s.circle(0,0,16),s.fill({color:16733440}),s.position.set(i,e),r.effectsLayer.addChild(s),c.to(s,{x:o,y:t,duration:.45,ease:"power1.out",onUpdate:()=>{if(s.destroyed)return;const l=P.getInstance().acquire();if(!l)return;const a=4+Math.random()*4;l.beginPath(),l.circle(0,0,a),l.fill({color:16729088}),l.position.set(s.x+(Math.random()-.5)*8,s.y+(Math.random()-.5)*8),r.effectsLayer.addChild(l),c.to(l,{alpha:0,duration:.3,ease:"power2.out",onComplete:()=>{l&&!l.destroyed&&(c.killTweensOf(l),P.getInstance().release(l))}})},onComplete:()=>{s&&!s.destroyed&&(c.killTweensOf(s),s.destroy()),V(o,t),n&&!n.destroyed&&typeof n.applyBurnStatus=="function"&&n.applyBurnStatus(2e3)}})}catch(r){console.error("❌ spawnFireballProjectile error:",r)}}function V(i,e){try{const o=v.getInstance();S.getInstance().screenShake(4,.95,200);for(let t=0;t<12;t++){const n=P.getInstance().acquire();if(!n)continue;const r=6+Math.random()*6;n.beginPath(),n.circle(0,0,r),n.fill({color:16733440}),n.position.set(i,e),o.effectsLayer.addChild(n);const s=t*Math.PI*2/12+(Math.random()-.5)*.2,l=50+Math.random()*60;c.to(n,{x:i+Math.cos(s)*l,y:e+Math.sin(s)*l,alpha:0,duration:.35,ease:"power2.out",onComplete:()=>{n&&!n.destroyed&&(c.killTweensOf(n),P.getInstance().release(n))}})}}catch(o){console.error("❌ spawnExplosion error:",o)}}function ae(i,e,o,t,n,r,s){var l,a;try{if(!t||t.destroyed)return;const f=S.getInstance();if(o==="DODGE"){if(B(t),!t.isLunging){c.killTweensOf(t,{x:!0});const u=n?1:-1;c.to(t,{x:t.x+25*u,duration:.1,yoyo:!0,repeat:1,ease:"sine.inOut",onComplete:()=>{t.destroyed||(t.x=t.defaultX??t.x)}})}return}if(o==="BLOCK"){q(t,r);const u=((l=t.config)==null?void 0:l.color)??54527;$(t.x,t.y,u,!n),f.knockback(t,n,"HIT");return}let p=16737894;o==="CRIT"&&(i==="TANK"?p=16766720:i==="ASSASSIN"?p=12386559:p=65535);const h=t.bodySprite||t;h&&f.colorFlash(h,p,o==="CRIT"?.25:.15);const d=o==="CRIT"?"CRIT":"HIT";if(f.knockback(t,n,d),o==="CRIT"){const u=i==="TANK"?14:i==="ASSASSIN"?8:10;if(f.screenShake(u,.93,300),i==="WARRIOR"){const A=r&&((a=r.config)!=null&&a.color)?r.config.color:13935475;R(t.x,t.y,A)}}else{const u=i==="TANK"?6:3;f.screenShake(u,.95,150)}if(o==="CRIT"){const u=i==="TANK"?80:i==="ASSASSIN"?50:65;f.freezeFrame(u,.05)}let y=16746632;i==="TANK"?y=16759552:i==="ASSASSIN"?y=14315734:y=8454107,t.isBurningStatus?y=16733440:t.isFrozenStatus?y=8965375:t.isPoisonedStatus&&(y=4521796);let g=t.x,w=t.y-80;if(typeof t.getVisualCenter=="function"){const u=t.getVisualCenter();u&&(g=u.x,w=u.y)}o==="HIT"||o==="CRIT"?(K(s||0,g,w,y),o==="CRIT"?L(t.x,t.y):_(t.x,t.y,.7)):f.particleBurst(g,w,6,y,130)}catch(f){console.error("❌ applyHitResolution error:",f)}}function ce(i,e=1.5){try{const o=S.getInstance();z.getInstance().playCrit(),o.screenShake(8,.95,400);const t=i.bodySprite||i;t instanceof F&&o.colorFlash(t,16776960,.3);let n=i.x,r=i.y-100;if(typeof i.getVisualCenter=="function"){const s=i.getVisualCenter();s&&(n=s.x,r=s.y)}else if(i.parent){const s=i.toGlobal(new k(0,0));n=s.x,r=s.y}o.particleBurst(n,r,20,16768256,250*e),o.slowMotion(.4,.3)}catch(o){console.error("❌ Critical hit error:",o)}}function fe(i){try{const e=S.getInstance();z.getInstance().playHit(),e.screenShake(5,.95,200);const o=i.bodySprite||i;o instanceof F&&e.colorFlash(o,16737894,.15);let t=i.x,n=i.y-100;if(typeof i.getVisualCenter=="function"){const r=i.getVisualCenter();r&&(t=r.x,n=r.y)}else if(i.parent){const r=i.toGlobal(new k(0,0));t=r.x,n=r.y}e.particleBurst(t,n,8,16746632,150)}catch(e){console.error("❌ Normal hit error:",e)}}function B(i){try{let e=i.x,o=i.y-100;if(typeof i.getVisualCenter=="function"){const t=i.getVisualCenter();t&&(e=t.x,o=t.y)}S.getInstance().particleBurst(e,o,6,11193599,120)}catch(e){console.error("❌ Dodge effect error:",e)}}function q(i,e){try{let o=i.x,t=i.y-100;if(e&&typeof e.getSocketGlobalPosition=="function"&&typeof i.getSocketGlobalPosition=="function"){const n=e.getSocketGlobalPosition("rightHand"),r=i.getSocketGlobalPosition("leftHand");o=(n.x+r.x)/2,t=(n.y+r.y)/2}else if(typeof i.getVisualCenter=="function"){const n=i.getVisualCenter();n&&(o=n.x,t=n.y)}H(o,t)}catch(o){console.error("❌ Block effect error:",o)}}function ue(i){var e;try{const o=S.getInstance();o.screenShake(12,.9,450);let t=i.x,n=i.y-100;if(typeof i.getVisualCenter=="function"){const l=i.getVisualCenter();l&&(t=l.x,n=l.y)}else if(i.parent){const l=i.toGlobal(new k(0,0));t=l.x,n=l.y}const r=((e=i.config)==null?void 0:e.color)??16711680;o.particleBurst(t,n,25,r,250),o.particleBurst(t,n,15,16777215,350),L(i.x,i.y);const s=i.bodySprite||i;s&&o.colorFlash(s,16777215,.4),o.fadeOut(i,1.2)}catch(o){console.error("❌ Death effect error:",o)}}function pe(i,e,o,t,n=!1){try{const r=v.getInstance(),s=S.getInstance(),l=new E;r.effectsLayer.addChild(l);const a=new m;let f=65535,p=16777215,h=65535,d=10,y=160;t==="TANK"?(f=16753920,p=16770229,h=16759552,d=18,y=240,a.arc(0,0,130,-Math.PI/3,Math.PI/3).stroke({color:f,width:32,cap:"round"}).stroke({color:p,width:10,cap:"round"})):t==="ASSASSIN"?(f=12386559,p=16754431,h=14315734,d=12,y=180,n?a.moveTo(-60,-60).lineTo(60,60).moveTo(60,-60).lineTo(-60,60).stroke({color:f,width:14,cap:"round"}).stroke({color:p,width:4,cap:"round"}):a.arc(0,0,110,-Math.PI/4,Math.PI/4).stroke({color:f,width:16,cap:"round"}).stroke({color:p,width:4,cap:"round"})):(f=49151,p=16777215,h=58879,d=14,y=200,n?a.moveTo(-65,-45).lineTo(65,45).moveTo(65,-45).lineTo(-65,45).stroke({color:f,width:18,cap:"round"}).stroke({color:p,width:5,cap:"round"}):a.arc(0,0,120,-Math.PI/4,Math.PI/4).stroke({color:f,width:22,cap:"round"}).stroke({color:p,width:6,cap:"round"})),a.scale.x=o?1:-1,a.rotation=o?-.3:.3,l.addChild(a),l.position.set(i-(o?30:-30),e-90),l.alpha=.95,l.scale.set(o?.65:-.65),c.to(l.scale,{x:o?2.2:-2.2,y:2.2,duration:.32,ease:"power2.out"}),c.to(l,{alpha:0,rotation:o?.7:-.7,duration:.32,ease:"power1.out",onComplete:()=>{c.killTweensOf(l),c.killTweensOf(l.scale),l.destroy({children:!0})}}),s.particleBurst(i,e,d,h,y),_(i,e,n?1.4:.95)}catch(r){console.error("❌ Slash effect error:",r)}}function he(i,e=320,o=16777215){var t,n,r,s,l,a,f,p,h,d,y;try{if(!i||!i.bodySprite||!i.bodySprite.texture)return;const g=v.getInstance(),w=S.getInstance();for(w.activeTrails=w.activeTrails.filter(C=>!C.destroyed);w.activeTrails.length>=3;){const C=w.activeTrails.shift();C&&C.destroy()}const u=new F(i.bodySprite.texture);u.anchor.set(((r=(n=(t=i.config)==null?void 0:t.anchors)==null?void 0:n.feet)==null?void 0:r.x)??.5,((a=(l=(s=i.config)==null?void 0:s.anchors)==null?void 0:l.feet)==null?void 0:a.y)??.95);const G=i.x<960?-1:1,M=(i.trailCount||0)*15*G;i.trailCount=((i.trailCount||0)+1)%4,u.x=i.x-M,u.y=i.y,u.scale.set(i.scale.x*(((p=(f=i.bodyContainer)==null?void 0:f.scale)==null?void 0:p.x)??1),i.scale.y*(((d=(h=i.bodyContainer)==null?void 0:h.scale)==null?void 0:d.y)??1)),u.rotation=i.rotation+(((y=i.bodyContainer)==null?void 0:y.rotation)??0),u.alpha=.6,u.tint=o,g.effectsLayer.addChild(u),w.activeTrails.push(u),c.to(u,{alpha:0,duration:e/1e3,ease:"power2.out",onComplete:()=>{c.killTweensOf(u),u.destroy(),w.activeTrails=w.activeTrails.filter(C=>C!==u)}})}catch(g){console.error("❌ Ghost trail spawn error:",g)}}function _(i,e,o=1){try{const t=v.getInstance(),n=new E;n.position.set(i,e),t.effectsLayer.addChild(n);const r=Math.round((5+Math.floor(Math.random()*4))*o);for(let s=0;s<r;s++){const l=new m,a=(10+Math.random()*15)*o;l.beginPath(),l.circle(0,0,a),l.fill({color:14540253,alpha:.28}),l.blendMode="add",l.x=(Math.random()-.5)*40*o,l.y=(Math.random()-.5)*20*o-10,n.addChild(l);const f=l.x+(Math.random()-.5)*80*o,p=l.y-(40+Math.random()*50)*o,h=1.8+Math.random()*1;c.to(l,{x:f,y:p,alpha:0,duration:.5+Math.random()*.4,ease:"power2.out",onUpdate:()=>{l.destroyed||l.scale.set(1+(h-1)*(1-l.alpha))},onComplete:()=>{l&&!l.destroyed&&(c.killTweensOf(l),l.destroy())}})}setTimeout(()=>{n&&!n.destroyed&&(n.children.forEach(s=>{c.killTweensOf(s)}),n.destroy({children:!0}))},1e3)}catch(t){console.error("Error spawning dust puff:",t)}}function H(i,e){try{const o=v.getInstance(),t=8+Math.floor(Math.random()*5);for(let n=0;n<t;n++){const r=new m,s=10+Math.random()*15,l=Math.random()*Math.PI*2;r.beginPath(),r.moveTo(0,0),r.lineTo(Math.cos(l)*s,Math.sin(l)*s),r.stroke({color:16772744,width:2}),r.position.set(i,e),o.effectsLayer.addChild(r);const a=Math.cos(l)*(20+Math.random()*30),f=Math.sin(l)*(20+Math.random()*30);c.to(r,{x:i+a,y:e+f,alpha:0,duration:.2+Math.random()*.05,ease:"power2.out",onUpdate:()=>{r.destroyed||r.scale.set(r.alpha)},onComplete:()=>{r&&!r.destroyed&&(c.killTweensOf(r),r.destroy())}})}}catch(o){console.error("❌ spawnBlockSparks error:",o)}}function L(i,e){try{const o=v.getInstance(),t=new E;t.position.set(i,e),o.effectsLayer.addChild(t);const n=10+Math.floor(Math.random()*6);for(let r=0;r<n;r++){const s=new m,l=15+Math.random()*15;s.beginPath(),s.circle(0,0,l),s.fill({color:10066329,alpha:.6}),s.x=(Math.random()-.5)*50,s.y=(Math.random()-.5)*50-40,t.addChild(s);const a=Math.random()*Math.PI*2,f=40+Math.random()*50;c.to(s,{x:s.x+Math.cos(a)*f,y:s.y+Math.sin(a)*f,alpha:0,duration:.4,ease:"power1.out",onUpdate:()=>{s.destroyed||s.scale.set(.5+1.5*(1-s.alpha))},onComplete:()=>{s&&!s.destroyed&&(c.killTweensOf(s),s.destroy())}})}setTimeout(()=>{t&&!t.destroyed&&(t.children.forEach(r=>{c.killTweensOf(r)}),t.destroy({children:!0}))},500)}catch(o){console.error("❌ spawnSmokePuff error:",o)}}function K(i,e,o,t=16733491){try{const n=v.getInstance(),r=S.getInstance();let s=4,l=30,a=0,f=0,p=!1;if(i>50?(s=18,l=100,a=7,f=250,p=!0):i>20&&(s=10,l=60,a=3,f=150),a>0&&r.screenShake(a,.95,f),p){const h=new m;h.beginPath(),h.rect(0,0,1920,1080),h.fill({color:16777215,alpha:.35}),n.effectsLayer.addChild(h),c.to(h,{alpha:0,duration:.05,onComplete:()=>{h&&!h.destroyed&&(c.killTweensOf(h),h.destroy())}})}for(let h=0;h<s;h++){const d=new m,y=3+Math.random()*4;if(d.beginPath(),Math.random()<.5)d.circle(0,0,y);else{let u=Math.PI/2*3;const A=Math.PI/5;d.moveTo(0,-y);for(let G=0;G<5;G++){let M=Math.cos(u)*y,C=Math.sin(u)*y;d.lineTo(M,C),u+=A,M=Math.cos(u)*(y*.4),C=Math.sin(u)*(y*.4),d.lineTo(M,C),u+=A}d.closePath()}d.fill({color:t}),d.position.set(e,o),n.effectsLayer.addChild(d);const g=Math.random()*Math.PI*2,w=Math.random()*l;c.to(d,{x:e+Math.cos(g)*w,y:o+Math.sin(g)*w,alpha:0,duration:.3+Math.random()*.2,ease:"power2.out",onComplete:()=>{d&&!d.destroyed&&(c.killTweensOf(d),d.destroy())}})}}catch(n){console.error("❌ spawnImpactParticles error:",n)}}function R(i,e,o=13935475){try{const t=v.getInstance(),n=new E;n.position.set(i,e),t.effectsLayer.addChild(n);const r=new m;r.beginPath(),r.stroke({color:o,width:4}),[[{x:0,y:0},{x:-30,y:15},{x:-70,y:10},{x:-110,y:25}],[{x:0,y:0},{x:40,y:-10},{x:80,y:-5},{x:120,y:-20}],[{x:0,y:0},{x:-10,y:35},{x:15,y:70},{x:5,y:100}]].forEach(l=>{r.moveTo(l[0].x,l[0].y);for(let a=1;a<l.length;a++)r.lineTo(l[a].x,l[a].y)}),n.addChild(r),c.to(n,{alpha:0,duration:.6,ease:"power1.in",onComplete:()=>{n&&!n.destroyed&&(c.killTweensOf(n),n.destroy({children:!0}))}})}catch(t){console.error("❌ spawnEarthquakeFissures error:",t)}}function $(i,e,o=54527,t=!0){try{const n=v.getInstance(),r=new E;r.position.set(i,e-80),n.effectsLayer.addChild(r);const s=new m;s.beginPath();const l=t?Math.PI*.6:-Math.PI*.4,a=t?Math.PI*1.4:Math.PI*.4;s.arc(0,0,75,l,a),s.stroke({color:o,width:8,alpha:.8}),s.fill({color:o,alpha:.15}),r.addChild(s);const f=t?-1:1;r.x+=15*f,c.to(r,{x:i,duration:.1,ease:"bounce.out"}),c.to(r,{alpha:0,duration:.4,delay:.15,ease:"power2.in",onComplete:()=>{r&&!r.destroyed&&(c.killTweensOf(r),r.destroy({children:!0}))}})}catch(n){console.error("❌ spawnBastionShield error:",n)}}const T=class T{constructor(){x(this,"pixiApp");x(this,"activeEffects",new Map);x(this,"timeScale",1);x(this,"activeTrails",[]);x(this,"effectCounter",0);x(this,"particlePool");this.pixiApp=v.getInstance(),this.particlePool=P.getInstance()}static getInstance(){return T.instance||(T.instance=new T),T.instance}screenShake(e=5,o=.95,t=500){try{const n=`shake_${this.effectCounter++}`;if(this.activeEffects.has("shake")){const s=this.activeEffects.get("shake");s&&s.kill()}this.pixiApp.screenShake(e,o);const r=c.timeline({onComplete:()=>this.activeEffects.delete(n)});r.to({},{duration:t/1e3,onUpdate:()=>{}}),this.activeEffects.set(n,r)}catch(n){console.error("❌ Screen shake error:",n)}}colorFlash(e,o=16777215,t=.2){try{const n=`flash_${this.effectCounter++}`,r=new J,s=Array.isArray(e.filters)?[...e.filters]:[];e.filters=[...s,r];const l=c.timeline({onComplete:()=>{Array.isArray(e.filters)&&(e.filters=e.filters.filter(a=>a!==r)),this.activeEffects.delete(n)}});l.to(r,{brightness:2,duration:t*.3,ease:"power2.out"}),l.to(r,{brightness:1,duration:t*.7,ease:"power2.in"},`-=${t*.3}`),this.activeEffects.set(n,l)}catch(n){console.error("❌ Color flash error:",n)}}particleBurst(e,o,t=10,n=16776960,r=200){try{let s=t;b.getState().isPowerSaving&&(s=Math.min(t,4));const a=P.getInstance();for(let f=0;f<s;f++){const p=a.getParticle(f>=3);if(!p)continue;const h=Math.PI*2*f/t+(Math.random()-.5)*.5,d=Math.cos(h)*r,y=Math.sin(h)*r;p.clear(),p.rect(-2,-2,4,4).fill(n),p.position.set(e,o),p.alpha=1,c.to(p,{x:e+d,y:o+y,alpha:0,duration:.8+Math.random()*.4,ease:"power2.out",onComplete:()=>a.releaseParticle(p)})}}catch(s){console.error("❌ Particle burst error:",s)}}slowMotion(e=.3,o=.5){try{const t=`slowmo_${this.effectCounter++}`,n=this.pixiApp.getApp();if(!n)return;const r=n.ticker.speed,s=c.timeline({onComplete:()=>{n.ticker.speed=r,this.activeEffects.delete(t)}});s.to(n.ticker,{speed:e,duration:.1,ease:"power2.out"}),s.to(n.ticker,{speed:r,duration:.1,ease:"power2.in",delay:o}),this.activeEffects.set(t,s)}catch(t){console.error("❌ Slow motion error:",t)}}freezeFrame(e=60,o=.05){try{const t=this.pixiApp.getApp();if(!t)return;const n=`freeze_${this.effectCounter++}`,r=t.ticker.speed;t.ticker.speed=o;const s=c.delayedCall(e/1e3,()=>{t&&t.ticker&&(t.ticker.speed=r),this.activeEffects.delete(n)});this.activeEffects.set(n,s)}catch(t){console.error("❌ Freeze frame error:",t)}}knockback(e,o,t="HIT"){try{if(!e||e.destroyed)return;const r={HIT:12,CRIT:28,HEAVY:40,ULTIMATE:60}[t]||12,s=o?-1:1;e.defaultX===void 0&&(e.defaultX=e.x),e.isLunging||c.killTweensOf(e,{x:!0}),c.to(e,{x:e.defaultX+r*s,duration:.08,yoyo:!0,repeat:1,ease:"power2.out",onComplete:()=>{e.destroyed||(e.x=e.defaultX??e.x)}})}catch(n){console.error("❌ Knockback error:",n)}}fadeIn(e,o=.5,t){try{const n=`fadein_${this.effectCounter++}`;e.alpha=0;const r=c.to(e,{alpha:1,duration:o,ease:"power2.out",onComplete:()=>{this.activeEffects.delete(n),t==null||t()}});this.activeEffects.set(n,r)}catch(n){console.error("❌ Fade in error:",n)}}fadeOut(e,o=.5,t){try{const n=`fadeout_${this.effectCounter++}`,r=c.to(e,{alpha:0,duration:o,ease:"power2.in",onComplete:()=>{this.activeEffects.delete(n),t==null||t()}});this.activeEffects.set(n,r)}catch(n){console.error("❌ Fade out error:",n)}}lerp(e,o,t,n,r,s=.5,l="power2.inOut"){try{const a=`lerp_${this.effectCounter++}`;e.position.set(o,t);const f=c.to(e,{x:n,y:r,duration:s,ease:l,onComplete:()=>this.activeEffects.delete(a)});this.activeEffects.set(a,f)}catch(a){console.error("❌ Lerp error:",a)}}applyHitResolution(e,o,t,n,r,s,l){ae(e,o,t,n,r,s,l)}criticalHit(e,o=1.5){ce(e,o)}normalHit(e){fe(e)}dodgeEffect(e){B(e)}blockEffect(e,o){q(e,o)}deathEffect(e){ue(e)}slashEffect(e,o,t,n,r=!1){pe(e,o,t,n,r)}spawnGhostTrail(e,o=320,t=16777215){he(e,o,t)}spawnDustPuff(e,o,t=1){_(e,o,t)}spawnBlockSparks(e,o){H(e,o)}spawnSmokePuff(e,o){L(e,o)}spawnImpactParticles(e,o,t,n=16733491){K(e,o,t,n)}spawnEarthquakeFissures(e,o,t=13935475){R(e,o,t)}spawnBastionShield(e,o,t=54527,n=!0){$(e,o,t,n)}spawnLightningStrike(e,o){se(e,o)}spawnFireballProjectile(e,o,t,n,r){le(e,o,t,n,r)}spawnExplosion(e,o){V(e,o)}getActiveEffects(){return Array.from(this.activeEffects.keys())}stopAllEffects(){try{const e=this.pixiApp.getApp();e&&e.ticker&&(e.ticker.speed=1);for(const[,o]of this.activeEffects)o&&o.kill();this.activeEffects.clear(),this.activeTrails.forEach(o=>{o&&(c.killTweensOf(o),o.destroyed||o.destroy())}),this.activeTrails=[]}catch(e){console.error("❌ Stop all effects error:",e)}}stopEffect(e){try{const o=this.activeEffects.get(e);o&&(o.kill(),this.activeEffects.delete(e))}catch(o){console.error("❌ Stop effect error:",o)}}setTimeScale(e){try{this.timeScale=Math.max(.1,Math.min(e,2))}catch(o){console.error("❌ Set time scale error:",o)}}getActiveParticleCount(){return P.getInstance().pool.filter(e=>e.visible).length}destroy(){try{this.stopAllEffects(),this.particlePool.clear()}catch(e){console.error("❌ Destroy error:",e)}}};x(T,"instance",null);let S=T;export{S as E};
