const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
let angle = -.45, zoom = 1, blocks = [], current = 'zarate', dragging = false, lastX = 0;
const places = {zarate:{name:'Zárate, Argentina',coords:'34°05′ S · 59°02′ O',seed:17},paris:{name:'París, Francia',coords:'48°51′ N · 02°21′ E',seed:42},barcelona:{name:'Barcelona, España',coords:'41°23′ N · 02°10′ E',seed:83}};
function random(seed){let n=seed;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296}}
function generate(){blocks=[];const rand=random(places[current].seed);const size=24;
 for(let x=0;x<size;x++)for(let z=0;z<size;z++){
 const water=current==='zarate'&&x>18;
 const road=x%7===3||z%7===3;
 blocks.push({x,z,h:.55,color:water?'#547a7c':road?'#62685e':'#7e8a58',kind:'ground'});
 if(water||road)continue;
 if(x%7>=4&&x%7<=6&&z%7>=4&&z%7<=6){
 const district=Math.floor(x/7)*5+Math.floor(z/7);const h=2.1+((district*7+places[current].seed)%4)*.7;
 const colors=current==='paris'?['#c5bea4','#a9ac99','#c8bda0']:current==='barcelona'?['#c39777','#c3ad88','#d0b995']:['#acb69a','#c6b9a1','#a1aa8c'];
 blocks.push({x,z,h,color:colors[district%3],kind:'building'});
 if(z%7===4)blocks.push({x,z,h:h+.5,color:current==='paris'?'#707c7b':'#a77e5e',kind:'roof'});
 }else if(rand()>.75){blocks.push({x,z,h:1.4,color:'#77674d',kind:'trunk'});blocks.push({x,z,h:2.6+rand()*.6,color:['#627843','#7f9253','#899954'][Math.floor(rand()*3)],kind:'tree'})}
 }
 draw();
}
function shade(hex,factor){const n=parseInt(hex.slice(1),16);return `rgb(${Math.round((n>>16)*factor)},${Math.round(((n>>8)&255)*factor)},${Math.round((n&255)*factor)})`}
function draw(){const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const scale=Math.min(w/43,h/34)*zoom;const cos=Math.cos(angle),sin=Math.sin(angle);const project=(x,z,y)=>{const a=(x-12)*cos-(z-12)*sin,b=(x-12)*sin+(z-12)*cos;return[w/2+a*scale,h*.48+b*scale*.48-y*scale]};
 const poly=(points,fill)=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill()};
 ctx.save();ctx.shadowColor='#00000050';ctx.shadowBlur=30;poly([project(-.3,-.3,-1.7),project(24.3,-.3,-1.7),project(24.3,24.3,-1.7),project(-.3,24.3,-1.7)],'#10180d');ctx.restore();
 const sorted=[...blocks].sort((a,b)=>((a.x+a.z*0)*sin+a.z*cos)-((b.x+b.z*0)*sin+b.z*cos)||a.h-b.h);
 for(const block of sorted){let{x,z,h:y,color,kind}=block;let bottom=kind==='ground'?-1.5:kind==='roof'?y-.5:kind==='tree'?y-1.2:.55;let inset=kind==='trunk'?.36:kind==='tree'?-.12:kind==='ground'?0:.025;
 const p=[project(x+inset,z+inset,y),project(x+1-inset,z+inset,y),project(x+1-inset,z+1-inset,y),project(x+inset,z+1-inset,y)];const q=[project(x+inset,z+inset,bottom),project(x+1-inset,z+inset,bottom),project(x+1-inset,z+1-inset,bottom),project(x+inset,z+1-inset,bottom)];
 if(sin<0)poly([p[3],p[0],q[0],q[3]],shade(color,.66));else poly([p[1],p[2],q[2],q[1]],shade(color,.66));
 if(cos>0)poly([p[2],p[3],q[3],q[2]],shade(color,.8));else poly([p[0],p[1],q[1],q[0]],shade(color,.8));
 poly(p,color);
 if(kind==='building'&&cos>0){for(let level=1.15;level<y-.4;level+=.9){poly([project(x+.28,z+1,level+.35),project(x+.65,z+1,level+.35),project(x+.65,z+1,level),project(x+.28,z+1,level)],'#566560')}}
 }
}
document.querySelectorAll('.destination').forEach(button=>button.addEventListener('click',()=>{current=button.dataset.place;document.querySelectorAll('.destination').forEach(b=>b.classList.toggle('active',b===button));document.querySelector('#place-name').textContent=places[current].name;document.querySelector('#coords').textContent=places[current].coords;generate()}));
document.querySelector('#rotate').addEventListener('click',()=>{angle+=Math.PI/2;draw()});
document.querySelector('#zoom-in').addEventListener('click',()=>{zoom=Math.min(1.5,zoom+.1);draw()});
document.querySelector('#zoom-out').addEventListener('click',()=>{zoom=Math.max(.65,zoom-.1);draw()});
canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(dragging){angle+=(e.clientX-lastX)*.008;lastX=e.clientX;draw()}});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
new ResizeObserver(draw).observe(canvas);
document.querySelector('#copy').addEventListener('click',async()=>{const button=document.querySelector('#copy');const command=document.querySelector('#command').textContent;try{await navigator.clipboard.writeText(command);button.textContent='Copiado ✓'}catch{const input=document.createElement('textarea');input.value=command;document.body.append(input);input.select();const copied=document.execCommand('copy');input.remove();button.textContent=copied?'Copiado ✓':'Seleccioná el comando para copiar'}setTimeout(()=>button.textContent='Copiar comando ⧉',2500)});
generate();
