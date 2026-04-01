import { useEffect, useRef } from 'react';

function WalkingScene({ width = 340, height = 170 }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const tRef      = useRef(0);
  const ladyXRef  = useRef(width * 0.58);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = width;
    canvas.height = height;

    const O  = '#E85D04';
    const O3 = 'rgba(232,93,4,0.22)';
    const O4 = 'rgba(232,93,4,0.09)';

    const stroke = (fn, color=O, lw=1.8) => {
      ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=lw;
      ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.beginPath(); fn(); ctx.stroke(); ctx.restore();
    };
    const fillShape = (fn, color) => {
      ctx.save(); ctx.fillStyle=color;
      ctx.beginPath(); fn(); ctx.fill(); ctx.restore();
    };

    // ── ATMOSPHERE ────────────────────────────────────────────────
    const drawAtmosphere = () => {
      // Moon (crescent)
      fillShape(()=>{ ctx.arc(width-28, 20, 11, 0, Math.PI*2); }, O4);
      stroke(()=>{ ctx.arc(width-28, 20, 11, 0, Math.PI*2); }, O3, 1);
      fillShape(()=>{ ctx.arc(width-23, 16, 9, 0, Math.PI*2); }, '#0D0D0D');
      // Stars
      [[18,10],[55,7],[110,14],[175,5],[230,12],[275,8],[305,16]].forEach(([x,y])=>{
        fillShape(()=>{ ctx.arc(x,y,1.1,0,Math.PI*2); }, O3);
      });
    };

    // ── BUILDINGS ─────────────────────────────────────────────────
    const drawBuildings = () => {
      const gY = height - 28;

      // Bldg A — tall far left
      fillShape(()=>{ ctx.rect(5, 28, 42, gY-28); }, O4);
      stroke(()=>{ ctx.rect(5, 28, 42, gY-28); }, O3, 1);
      [[10,36],[28,36],[10,50],[28,50],[10,64],[28,64],[10,78],[28,78],[10,92],[28,92]].forEach(([x,y],i)=>{
        const lit = i===2||i===7;
        fillShape(()=>{ ctx.rect(x,y,9,9); }, lit?'rgba(232,93,4,0.38)':O4);
        stroke(()=>{ ctx.rect(x,y,9,9); }, O3, 0.7);
      });
      // Rooftop antenna
      stroke(()=>{ ctx.moveTo(24,28); ctx.lineTo(24,18); }, O3, 1);
      stroke(()=>{ ctx.moveTo(20,20); ctx.lineTo(28,20); }, O3, 0.8);

      // Bldg B — medium left
      fillShape(()=>{ ctx.rect(52, 55, 30, gY-55); }, O4);
      stroke(()=>{ ctx.rect(52, 55, 30, gY-55); }, O3, 1);
      [[56,62],[70,62],[56,76],[70,76],[56,90],[70,90]].forEach(([x,y],i)=>{
        const lit = i===1||i===4;
        fillShape(()=>{ ctx.rect(x,y,7,8); }, lit?'rgba(232,93,4,0.38)':O4);
        stroke(()=>{ ctx.rect(x,y,7,8); }, O3, 0.7);
      });

      // Bldg C — tall right
      fillShape(()=>{ ctx.rect(width-52, 18, 48, gY-18); }, O4);
      stroke(()=>{ ctx.rect(width-52, 18, 48, gY-18); }, O3, 1);
      [[width-48,26],[width-28,26],[width-48,42],[width-28,42],
       [width-48,58],[width-28,58],[width-48,74],[width-28,74],
       [width-48,90],[width-28,90]].forEach(([x,y],i)=>{
        const lit = i===0||i===5||i===8;
        fillShape(()=>{ ctx.rect(x,y,9,9); }, lit?'rgba(232,93,4,0.42)':O4);
        stroke(()=>{ ctx.rect(x,y,9,9); }, O3, 0.7);
      });

      // Bldg D — short right-mid
      fillShape(()=>{ ctx.rect(width-108, 68, 32, gY-68); }, O4);
      stroke(()=>{ ctx.rect(width-108, 68, 32, gY-68); }, O3, 1);
      [[width-104,76],[width-88,76],[width-104,90],[width-88,90]].forEach(([x,y],i)=>{
        fillShape(()=>{ ctx.rect(x,y,7,7); }, i===1?'rgba(232,93,4,0.38)':O4);
        stroke(()=>{ ctx.rect(x,y,7,7); }, O3, 0.7);
      });
    };

    // ── TREES ─────────────────────────────────────────────────────
    const drawTree = (x, trunkH=30, r=18) => {
      const gY = height - 28;
      stroke(()=>{ ctx.moveTo(x, gY); ctx.lineTo(x, gY-trunkH); }, O3, 2.5);
      const cy = gY - trunkH - r*0.55;
      fillShape(()=>{ ctx.arc(x, cy, r, 0, Math.PI*2); }, O4);
      stroke(()=>{ ctx.arc(x, cy, r, 0, Math.PI*2); }, O3, 1.2);
      // Inner canopy ring
      stroke(()=>{ ctx.arc(x, cy, r*0.55, 0, Math.PI*2); }, O3, 0.7);
    };

    // ── GROUND + STREETLAMP ───────────────────────────────────────
    const drawGround = () => {
      const y = height - 28;
      stroke(()=>{ ctx.moveTo(0,y); ctx.lineTo(width,y); }, O, 1.5);
      // Pavement tiles
      for(let x=0; x<=width; x+=26){
        stroke(()=>{ ctx.moveTo(x,y); ctx.lineTo(x,y+8); }, O3, 0.8);
      }
      stroke(()=>{ ctx.moveTo(0,y+8); ctx.lineTo(width,y+8); }, O3, 0.8);
      // Streetlamp
      const lx = 100;
      stroke(()=>{
        ctx.moveTo(lx, y);
        ctx.lineTo(lx, y-50);
        ctx.moveTo(lx, y-50);
        ctx.quadraticCurveTo(lx, y-63, lx+14, y-63);
      }, O3, 1.8);
      fillShape(()=>{ ctx.arc(lx+17, y-63, 4, 0, Math.PI*2); }, 'rgba(232,93,4,0.35)');
      stroke(()=>{ ctx.arc(lx+17, y-63, 4, 0, Math.PI*2); }, O3, 1);
      // Glow halo
      const grad = ctx.createRadialGradient(lx+17,y-63,2,lx+17,y-63,18);
      grad.addColorStop(0,'rgba(232,93,4,0.12)');
      grad.addColorStop(1,'rgba(232,93,4,0)');
      fillShape(()=>{ ctx.arc(lx+17,y-63,18,0,Math.PI*2); }, grad);
    };

    // ── CUTE LADY ─────────────────────────────────────────────────
    const drawLady = (cx, t) => {
      const gY = height - 28;

      const legSwing = Math.sin(t * Math.PI * 2) * 0.40;
      const armSwing = Math.sin(t * Math.PI * 2 + Math.PI) * 0.28;
      const hairSway = Math.sin(t * Math.PI * 2) * 0.05;
      const bob      = Math.abs(Math.sin(t * Math.PI * 2)) * 1.8;

      // proportions (all from groundY up)
      const shoeY  = gY;
      const shinH  = 17, thighH = 18, hipH = 8;
      const torsoH = 21, neckH  = 5,  headR = 9;
      const uArmH  = 14, lArmH  = 10;

      const hipY    = shoeY - shinH - thighH - bob;
      const waistY  = hipY - hipH;
      const shouldY = waistY - torsoH;
      const neckY   = shouldY - neckH;
      const headCY  = neckY - headR;

      // ── Head ──
      stroke(()=>{ ctx.ellipse(cx, headCY, headR*0.82, headR, 0, 0, Math.PI*2); }, O, 1.7);

      // ── Long flowing hair ──
      // Main back hair sweep
      stroke(()=>{
        ctx.moveTo(cx - headR*0.4, headCY - headR*0.8);
        ctx.bezierCurveTo(
          cx - headR*2.0 + hairSway*30, headCY + headR*0.6,
          cx - headR*1.8 + hairSway*20, shouldY + 8,
          cx - headR*1.3 + hairSway*15, shouldY + 24
        );
      }, O, 2.6);
      stroke(()=>{
        ctx.moveTo(cx - headR*0.1, headCY - headR*0.95);
        ctx.bezierCurveTo(
          cx - headR*1.5 + hairSway*20, headCY + headR*0.4,
          cx - headR*1.4 + hairSway*15, shouldY + 5,
          cx - headR*1.0 + hairSway*10, shouldY + 20
        );
      }, O, 1.6);
      // Side strand over shoulder
      stroke(()=>{
        ctx.moveTo(cx + headR*0.5, headCY - headR*0.6);
        ctx.bezierCurveTo(
          cx + headR*1.2, headCY + headR,
          cx + headR*1.0, shouldY + 2,
          cx + headR*0.6, shouldY + 12
        );
      }, O, 1.3);
      // Top hair arc
      stroke(()=>{
        ctx.moveTo(cx - headR*0.65, headCY - headR*0.92);
        ctx.quadraticCurveTo(cx + headR*0.1, headCY - headR*1.22, cx + headR*0.65, headCY - headR*0.88);
      }, O, 1.8);
      // Hair highlight
      stroke(()=>{
        ctx.moveTo(cx - headR*0.3, headCY - headR*1.1);
        ctx.quadraticCurveTo(cx + headR*0.2, headCY - headR*1.18, cx + headR*0.5, headCY - headR*0.9);
      }, O3, 1);

      // ── Face ──
      // Eye (right side visible)
      fillShape(()=>{ ctx.ellipse(cx+headR*0.28, headCY-headR*0.08, 2.2, 1.5, 0, 0, Math.PI*2); }, O);
      // Eyelash
      stroke(()=>{
        ctx.moveTo(cx+headR*0.15, headCY-headR*0.2);
        ctx.lineTo(cx+headR*0.38, headCY-headR*0.25);
      }, O, 0.9);
      // Nose
      stroke(()=>{
        ctx.moveTo(cx+headR*0.42, headCY+headR*0.12);
        ctx.quadraticCurveTo(cx+headR*0.55, headCY+headR*0.25, cx+headR*0.38, headCY+headR*0.3);
      }, O, 0.9);
      // Smile
      stroke(()=>{ ctx.arc(cx+headR*0.18, headCY+headR*0.36, headR*0.22, 0.1, Math.PI*0.9); }, O, 1.1);
      // Ear
      stroke(()=>{ ctx.arc(cx-headR*0.82, headCY+headR*0.05, headR*0.2, Math.PI*0.4, Math.PI*1.6); }, O, 1);

      // ── Neck ──
      stroke(()=>{
        ctx.moveTo(cx-2, neckY); ctx.lineTo(cx-2, neckY+neckH);
        ctx.moveTo(cx+2, neckY); ctx.lineTo(cx+2, neckY+neckH);
      }, O, 1.2);

      // ── Top / shirt ──
      stroke(()=>{
        ctx.moveTo(cx-2, shouldY);
        ctx.lineTo(cx-8, shouldY+4);
        ctx.lineTo(cx-8, waistY);
        ctx.lineTo(cx+8, waistY);
        ctx.lineTo(cx+8, shouldY+4);
        ctx.lineTo(cx+2, shouldY);
      }, O, 1.6);
      // Neckline
      stroke(()=>{
        ctx.moveTo(cx-3, shouldY);
        ctx.lineTo(cx, shouldY+6);
        ctx.lineTo(cx+3, shouldY);
      }, O, 1);
      // Shirt detail
      stroke(()=>{ ctx.moveTo(cx, shouldY+6); ctx.lineTo(cx, waistY); }, O3, 0.9);

      // ── Skirt / dress ──
      const skirtFlare = 13 + legSwing*5;
      stroke(()=>{
        ctx.moveTo(cx-8, waistY);
        ctx.bezierCurveTo(cx-10, waistY+4, cx-skirtFlare, hipY-2, cx-skirtFlare+2, hipY+4);
        ctx.lineTo(cx+skirtFlare-2, hipY+4);
        ctx.bezierCurveTo(cx+skirtFlare, hipY-2, cx+10, waistY+4, cx+8, waistY);
      }, O, 1.6);
      fillShape(()=>{
        ctx.moveTo(cx-8,waistY);
        ctx.bezierCurveTo(cx-10,waistY+4,cx-skirtFlare,hipY-2,cx-skirtFlare+2,hipY+4);
        ctx.lineTo(cx+skirtFlare-2,hipY+4);
        ctx.bezierCurveTo(cx+skirtFlare,hipY-2,cx+10,waistY+4,cx+8,waistY);
        ctx.closePath();
      }, O4);

      // ── Arms ──
      const lElX = cx-8 + Math.sin(armSwing)*uArmH;
      const lElY = shouldY+4 + Math.cos(armSwing)*uArmH;
      stroke(()=>{ ctx.moveTo(cx-8,shouldY+4); ctx.lineTo(lElX,lElY); }, O, 1.6);
      stroke(()=>{
        ctx.moveTo(lElX,lElY);
        ctx.lineTo(lElX+Math.sin(armSwing*0.4)*lArmH, lElY+Math.cos(armSwing*0.2)*lArmH);
      }, O, 1.3);

      const rElX = cx+8 + Math.sin(-armSwing)*uArmH;
      const rElY = shouldY+4 + Math.cos(-armSwing)*uArmH;
      stroke(()=>{ ctx.moveTo(cx+8,shouldY+4); ctx.lineTo(rElX,rElY); }, O, 1.6);
      const rHandX = rElX+Math.sin(-armSwing*0.4)*lArmH;
      const rHandY = rElY+Math.cos(-armSwing*0.2)*lArmH;
      stroke(()=>{ ctx.moveTo(rElX,rElY); ctx.lineTo(rHandX,rHandY); }, O, 1.3);

      // Handbag on right arm
      stroke(()=>{
        ctx.roundRect(rHandX-2, rHandY, 11, 9, 2);
      }, O, 1.2);
      stroke(()=>{
        ctx.moveTo(rHandX, rHandY);
        ctx.quadraticCurveTo(rHandX+4, rHandY-5, rHandX+9, rHandY);
      }, O, 1);

      // ── Legs ──
      // Left leg
      const lKnX = cx-5 + Math.sin(-legSwing)*thighH;
      const lKnY = hipY+4 + Math.cos(legSwing)*thighH;
      stroke(()=>{ ctx.moveTo(cx-5,hipY+4); ctx.lineTo(lKnX,lKnY); }, O, 1.9);
      const lFtX = lKnX + Math.sin(-legSwing*0.35)*shinH;
      const lFtY = lKnY + Math.cos(legSwing*0.15)*shinH;
      stroke(()=>{ ctx.moveTo(lKnX,lKnY); ctx.lineTo(lFtX,lFtY); }, O, 1.7);
      // Shoe left
      stroke(()=>{
        ctx.moveTo(lFtX-2,lFtY+1);
        ctx.bezierCurveTo(lFtX-2,lFtY+4, lFtX+7,lFtY+5, lFtX+9,lFtY+2);
      }, O, 2);

      // Right leg
      const rKnX = cx+5 + Math.sin(legSwing)*thighH;
      const rKnY = hipY+4 + Math.cos(legSwing)*thighH;
      stroke(()=>{ ctx.moveTo(cx+5,hipY+4); ctx.lineTo(rKnX,rKnY); }, O, 1.9);
      const rFtX = rKnX + Math.sin(legSwing*0.35)*shinH;
      const rFtY = rKnY + Math.cos(legSwing*0.15)*shinH;
      stroke(()=>{ ctx.moveTo(rKnX,rKnY); ctx.lineTo(rFtX,rFtY); }, O, 1.7);
      // Shoe right
      stroke(()=>{
        ctx.moveTo(rFtX-2,rFtY+1);
        ctx.bezierCurveTo(rFtX-2,rFtY+4, rFtX+7,rFtY+5, rFtX+9,rFtY+2);
      }, O, 2);
    };

    // ── ANIMATE ───────────────────────────────────────────────────
    const SPEED = 0.38;
    const CYCLE = 0.017;

    const animate = () => {
      tRef.current     += CYCLE;
      ladyXRef.current -= SPEED;
      if (ladyXRef.current < -35) ladyXRef.current = width + 35;

      ctx.clearRect(0, 0, width, height);
      drawAtmosphere();
      drawBuildings();
      drawTree(88, 32, 20);
      drawTree(width-118, 28, 17);
      drawGround();
      drawLady(ladyXRef.current, tRef.current);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return <canvas ref={canvasRef} style={{ display:'block', borderRadius:12 }} />;
}

function ProgressBar() {
  return (
    <div style={{ width:200, height:3, background:'rgba(232,93,4,0.15)', borderRadius:2, overflow:'hidden' }}>
      <div style={{ height:'100%', background:'#E85D04', borderRadius:2, animation:'fillBar 2.8s ease-in-out forwards' }} />
      <style>{`@keyframes fillBar{0%{width:0}60%{width:72%}85%{width:88%}100%{width:100%}}`}</style>
    </div>
  );
}

export default function LoadingScreen({ message = 'Loading...', inline = false }) {
  if (inline) {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
        <span style={{ width:16, height:16, border:'2.5px solid rgba(232,93,4,0.3)', borderTop:'2.5px solid #E85D04', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        {message}
      </span>
    );
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(13,13,13,0.93)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <div style={{ animation:'fadeIn 0.5s ease both', background:'rgba(232,93,4,0.04)', border:'1px solid rgba(232,93,4,0.12)', borderRadius:16, overflow:'hidden', marginBottom:20 }}>
        <WalkingScene width={340} height={170} />
      </div>
      <p style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:26, fontWeight:700, color:'#F5F5F5', letterSpacing:'-0.5px', margin:'0 0 4px', animation:'fadeUp 0.5s ease 0.2s both' }}>
        Safe<span style={{color:'#E85D04'}}>Walk</span>
      </p>
      <p style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:13, color:'#A0A0A0', margin:'0 0 16px', animation:'fadeUp 0.5s ease 0.35s both' }}>
        {message}
      </p>
      <div style={{animation:'fadeUp 0.5s ease 0.5s both'}}>
        <ProgressBar />
      </div>
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
