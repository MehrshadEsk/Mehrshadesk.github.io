/* Perspective software renderer for browsers without WebGL.
 * Uses the same Three.js world geometry, camera, topology and animation state.
 * Spheres use shaded sprites; other surfaces use lit, depth-sorted triangles.
 * This is a compatibility path, not a separate flat illustration.
 */
import * as T from './assets/vendor/three/three.module.min.js';
const unit=new T.Vector3(),temp=new T.Vector3(),light=new T.Vector3(-.45,.8,.6).normalize();
const world=new T.Matrix4(),instance=new T.Matrix4(),normalMatrix=new T.Matrix3(),normal=new T.Vector3();
const colors=new Map(),sprites=new Map();
const v3local=(x,y,z,matrix)=>new T.Vector3(x,y,z).applyMatrix4(matrix);
function shade(color,strength){
  const key=color.getHex()+':'+Math.round(strength*24);
  if(!colors.has(key))colors.set(key,color.clone().multiplyScalar(strength).getStyle());
  const result=colors.get(key);if(colors.size>1400)colors.clear();return result;
}
function sprite(color){
  const key=color.getHex();if(sprites.has(key))return sprites.get(key);
  const canvas=document.createElement('canvas');canvas.width=48;canvas.height=48;const g=canvas.getContext('2d');
  const gradient=g.createRadialGradient(16,13,0,24,24,24);
  gradient.addColorStop(0,color.clone().lerp(new T.Color(0xffffff),.82).getStyle());
  gradient.addColorStop(.22,color.clone().lerp(new T.Color(0xffffff),.4).getStyle());
  gradient.addColorStop(.62,color.getStyle());gradient.addColorStop(1,color.clone().multiplyScalar(.3).getStyle());
  g.beginPath();g.arc(24,24,23,0,Math.PI*2);g.fillStyle=gradient;g.fill();
  sprites.set(key,canvas);if(sprites.size>260)sprites.delete(sprites.keys().next().value);return canvas;
}
export class ResearchSoftwareRenderer{
  constructor({compact=false}={}){
    this.domElement=document.createElement('canvas');this.g=this.domElement.getContext('2d',{alpha:true});
    if(!this.g)throw new Error('Canvas rendering is unavailable.');
    this.width=1;this.height=1;this.dpr=1;this.compact=compact;this.isSoftwareRenderer=true;this.shadowMap={};this.frames=0;
  }
  setPixelRatio(value){this.dpr=Math.min(value,1.35);}
  setClearColor(){}
  setSize(width,height){
    this.width=width;this.height=height;this.domElement.width=Math.round(width*this.dpr);this.domElement.height=Math.round(height*this.dpr);
  }
  dispose(){sprites.clear();colors.clear();}
  render(scene,camera){
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const g=this.g,width=this.width,height=this.height,dpr=this.dpr;
    const focal=height/(2*Math.tan(camera.fov*Math.PI/360));
    const items=[],view=camera.matrixWorldInverse,pv=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,view);
    const project=p=>{
      const q=p.clone().applyMatrix4(pv),z=-p.clone().applyMatrix4(view).z;
      return {x:(q.x*.5+.5)*width,y:(-.5*q.y+.5)*height,depth:z,visible:z>.1};
    };
    const addMesh=(object,matrix,instanceColor)=>{
      const geometry=object.geometry,mat=object.material;if(!geometry||!mat||mat.visible===false)return;
      const opacity=mat.opacity===undefined?1:mat.opacity;
      const color=mat.color?mat.color.clone():new T.Color(0x7e99a7);if(instanceColor)color.multiply(instanceColor);
      const center=unit.set(0,0,0).applyMatrix4(matrix).clone(),cp=project(center);
      if(!cp.visible)return;
      if(geometry.userData.softGround){
        const radius=geometry.parameters.radius;
        const px=project(v3local(radius,0,0,matrix)),py=project(v3local(0,radius,0,matrix));
        items.push({type:'ground',...cp,ax:px.x-cp.x,ay:px.y-cp.y,bx:py.x-cp.x,by:py.y-cp.y,color,opacity,depth:Number.MAX_VALUE});return;
      }
      if(geometry.type==='SphereGeometry'){
        const scale=matrix.getMaxScaleOnAxis(),r=geometry.parameters.radius*scale*focal/cp.depth;
        if(r<.19)return;
        items.push({type:'sphere',...cp,r,color,opacity});return;
      }
      const positions=geometry.attributes.position,index=geometry.index,normals=geometry.attributes.normal;
      const vertices=new Array(positions.count),worldVertices=new Array(positions.count);
      normalMatrix.getNormalMatrix(matrix);
      for(let i=0;i<positions.count;i++){
        const p=new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(matrix);
        worldVertices[i]=p;vertices[i]=project(p);
      }
      const total=index?index.count:positions.count;
      for(let offset=0;offset<total;offset+=3){
        const ia=index?index.getX(offset):offset,ib=index?index.getX(offset+1):offset+1,ic=index?index.getX(offset+2):offset+2;
        const a=vertices[ia],b=vertices[ib],c=vertices[ic];if(!a.visible||!b.visible||!c.visible)continue;
        const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
        if(mat.side!==T.DoubleSide&&area>=0)continue;
        if(Math.abs(area)<.035)continue;
        if(normals)normal.fromBufferAttribute(normals,ia).applyMatrix3(normalMatrix).normalize();
        else normal.copy(worldVertices[ib]).sub(worldVertices[ia]).cross(temp.copy(worldVertices[ic]).sub(worldVertices[ia])).normalize();
        const intensity=mat.isMeshBasicMaterial?1:.56+.67*Math.max(0,normal.dot(light))+.11*Math.abs(normal.z);
        items.push({type:'triangle',a,b,c,depth:(a.depth+b.depth+c.depth)/3,fill:shade(color,intensity),opacity});
      }
    };
    scene.traverseVisible(object=>{
      if(object.isMesh){
        if(object.isInstancedMesh){
          for(let i=0;i<object.count;i++){
            object.getMatrixAt(i,instance);world.multiplyMatrices(object.matrixWorld,instance);
            const color=object.instanceColor?new T.Color():null;if(color)object.getColorAt(i,color);
            addMesh(object,world,color);
          }
        }else addMesh(object,object.matrixWorld,null);
      }else if(object.isLine){
        const attr=object.geometry.attributes.position,mat=object.material;if(!attr||!mat)return;
        const points=[];
        for(let i=0;i<attr.count;i++)points.push(project(new T.Vector3().fromBufferAttribute(attr,i).applyMatrix4(object.matrixWorld)));
        let depth=0;points.forEach(p=>depth+=p.depth);depth/=Math.max(1,points.length);
        items.push({type:'line',points,segments:object.isLineSegments,depth,color:mat.color.getStyle(),opacity:mat.opacity,width:this.compact?.65:.8});
      }
    });
    items.sort((a,b)=>b.depth-a.depth);
    g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,width,height);
    for(const item of items){
      g.globalAlpha=item.opacity;
      if(item.type==='ground'){
        g.save();g.transform(item.ax,item.ay,item.bx,item.by,item.x,item.y);
        const gradient=g.createRadialGradient(0,0,0,0,0,1),color=item.color.getStyle();
        gradient.addColorStop(0,color);gradient.addColorStop(.3,color);gradient.addColorStop(1,color.replace('rgb(','rgba(').replace(')',',0)'));
        g.fillStyle=gradient;g.beginPath();g.arc(0,0,1,0,Math.PI*2);g.fill();g.restore();
      }else if(item.type==='sphere'){
        g.drawImage(sprite(item.color),item.x-item.r,item.y-item.r,item.r*2,item.r*2);
      }else if(item.type==='triangle'){
        g.beginPath();g.moveTo(item.a.x,item.a.y);g.lineTo(item.b.x,item.b.y);g.lineTo(item.c.x,item.c.y);g.closePath();g.fillStyle=item.fill;g.fill();
      }else{
        g.beginPath();
        item.points.forEach((p,i)=>{
          if(!p.visible)return;
          if(i===0||item.segments&&i%2===0||i>0&&!item.points[i-1].visible)g.moveTo(p.x,p.y);else g.lineTo(p.x,p.y);
        });g.strokeStyle=item.color;g.lineWidth=item.width;g.stroke();
      }
    }
    g.globalAlpha=1;this.frames++;
  }
}
