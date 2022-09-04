import { AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';

import * as THREE from "three";
import * as gsap from "gsap";
import { MouseModel } from '../shared/models/planet.model';
import gsapCore from 'gsap/gsap-core';
import { Float32BufferAttribute, TorusKnotGeometry } from 'three';



@Component({
  selector: 'app-earth',
  templateUrl: './earth.component.html',
  styleUrls: ['./earth.component.scss']
})


  export class EarthComponent implements OnInit, AfterViewInit {
    // @ViewChild('popup', {static:false}) popup!: ElementRef;
    popupTitle:string = 'Hello'
    popupContent:string = 'Billy'
    group = new THREE.Group();

    raycaster = new THREE.Raycaster();

    // MouseModel, @HostListener & Group used to create mouse movement world shift rotation
    mouse: MouseModel = {
      x: 0.32,
      y: 2.8,
      down: false,
      xPrev: undefined,
      yPrev: undefined,
    }


    groupOffset = {
      y: 0,
      x: 0,
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(e:any) {
      // console.log(e);
      this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
      this.mouse.y = (e.clientY / innerHeight) * 2 - 1;
      // console.log(this.mouse);


      // gsapCore.set(this.popup, {
      //   x: e.clientX,
      //   y: e.clientY
      // })

      if (this.scene !== undefined) {
        // update the picking ray with the camera and pointer position
        this.raycaster.setFromCamera( this.mouse, this.camera );

        // calculate objects intersecting the picking ray
        const intersects: any = this.raycaster.intersectObjects( this.group.children.filter(
          (mesh:any) => {
            return mesh.geometry.type === 'BoxGeometry'
          }
        ))
        // console.log(this.raycaster);
        // console.log(this.group.children);
        // console.log(`x:${this.mouse.x}`);
        // console.log(`y:${this.mouse.y}`);


        // console.log(intersects);

        this.group.children.forEach((mesh:any) => {
          mesh.material.opacity = 0.4
        })

        for ( let i = 0; i < intersects.length; i ++ ) {
            // console.log('HIT');
          intersects[i].object.material.opacity = 1


          // intersects[ i ].object.material.color.set( 0xff0000 );

        }
        // console.log(this.scene.children);
        // console.log(this.group.children);


        this.renderer.render( this.scene, this.camera );
      }

      if (this.mouse.down) {
        // preventDefault stops normal behavior on component while mouse down
        // ie highlighting text in another component if you are moving widely w mouse
        e.preventDefault()
        // console.log('turn the earth');
        const deltaX = e.clientX - this.mouse.xPrev
        const deltaY = e.clientY - this.mouse.yPrev

        this.groupOffset.x += deltaY * 0.005
        this.groupOffset.y  += deltaX * 0.005
        // console.log(deltaX);
        // Planet rotation with no ease delay
        // this.group.rotation.y += deltaX * .005
        // this.group.rotation.x += deltaY * .005
        // console.log(this.groupOffset.x);


        gsapCore.to(this.group.rotation, {
          // y: deltaX * 0.005,
          // x: deltaY * 0.005,
          y: this.groupOffset.y,
          x: this.groupOffset.x,

          duration: 1
        })
        this.mouse.xPrev = e.clientX
        this.mouse.yPrev = e.clientY

      }


    }

    @HostListener('document:mousedown', ['$event'])
    onMouseDown(e: any) {
      this.mouse.down = true

      this.mouse.xPrev = e.clientX;
      this.mouse.yPrev = e.clientY;




    }

    @HostListener('document:mouseup', ['$event'])
    onMouseUp(e: any) {
      // console.log('mouseup');

      this.mouse.down = false
    }

    @HostListener('window:resize', ['$event'])
    onWindowResize(e: any) {
      console.log('window resized');
      // console.log(e);


      //*Camera Update Field of View/Keep aspect on Resize
      let aspectRatio = this.getAspectRatio();
      this.camera = new THREE.PerspectiveCamera(
        this.fieldOfView,
        aspectRatio,
        this.nearClippingPlane,
        this.farClippingPlane
      )
      this.camera.position.z = this.cameraZ;

      this.renderer.setSize(innerWidth, innerHeight);

    }



    // Background Stars
    starGeometry = new THREE.BufferGeometry()
    starMaterial = new THREE.PointsMaterial({
      color: 0xDDDDFF
    })
    stars = new THREE.Points(this.starGeometry,this.starMaterial)
    starVertices: number[] = []

    earthVertexShader:string = `
      varying vec2 vertexUV;
      varying vec3 vertexNormal;

      void main() {
        vertexUV = uv;
        vertexNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `
    earthFragmentShader:string = `
      uniform sampler2D globeTexture;

      varying vec2 vertexUV;
      varying vec3 vertexNormal;

      void main() {
        float intensity = 1.05 - dot(
          vertexNormal, vec3(0.0, 0.0, 1.0));
        vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 1.5);

        gl_FragColor = vec4(atmosphere + texture2D(globeTexture, vertexUV).xyz, 1.0);
      }
    `
    earthAtmosVertexShader:string = `
        varying vec3 vertexNormal;

        void main() {
          vertexNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 0.9);
        }
    `


    earthAtmosFragmentShader:string = `
        varying vec3 vertexNormal;

        void main() {
          float intensity = pow(0.6 - dot(vertexNormal, vec3(0, 0, 1.0)),2.0);

          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
    `

    @ViewChild('canvas')
    private canvasRef: ElementRef;





    //* Cube Properties
    @Input() public rotationSpeedX: number = 0.01
    @Input() public rotationSpeedY: number = 0.01;
    @Input() public size: number = 200;
    @Input() public texture: string = "/assets/texture.jpg";

    //* Camera/Stage Properties
    @Input() public cameraZ: number = 15;
    @Input() public fieldOfView: number = 75;
    @Input('nearClipping') public nearClippingPlane: number = 0.1;
    @Input('farClipping') public farClippingPlane: number = 1000;




    // Helper Properties (Private Properties);
    private camera!: THREE.PerspectiveCamera;
    private get canvas(): HTMLCanvasElement {
      return this.canvasRef.nativeElement;
    }
    private loader = new THREE.TextureLoader();
    private geometry = new THREE.BoxGeometry(1, 1, 1);
    private material = new THREE.MeshBasicMaterial({ map: this.loader.load(this.texture) });
    // private cube: THREE.Mesh = new THREE.Mesh(this.geometry, this.material);
    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;


    // Earth Helpers
    earthGeometry = new THREE.Mesh(new THREE.SphereGeometry(5,50,50),
    // new THREE.MeshBasicMaterial({
    //   // color: 0xff0000
    //   map: new THREE.TextureLoader().load('../../assets/textures/earthTexture.jpg')})
    new THREE.ShaderMaterial({
      vertexShader:this.earthVertexShader,
      fragmentShader: this.earthFragmentShader,
      uniforms: {
        globeTexture: {
          value: new THREE.TextureLoader().load('../../assets/textures/earthTexture.jpg')
        }
    }}))
    // Earth Atmosphere
    earthAtmosGeometry = new THREE.Mesh(
      new THREE.SphereGeometry(5,50,50),
    new THREE.ShaderMaterial({
      vertexShader:this.earthAtmosVertexShader,
      fragmentShader: this.earthAtmosFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
      }))




    createBox(lat:number, lng:number) {
    // Earth Points
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.8),
    // new THREE.MeshBasicMaterial({
    //   // color: 0xff0000
    //   map: new THREE.TextureLoader().load('../../assets/textures/earthTexture.jpg')})
    new THREE.MeshBasicMaterial({
      color: '#3BF7FF',
      opacity: 0.4,
      transparent: true
    }))

    // Format for Lat/Lng Coords
    // x = radius * Math.cos(latitude) * Math.sin(longitude)
    // y = radius * Math.sin(latitude)
    // z = radius * Math.cos(latitude) * Math.cos(longitude)

    // 23.6345° N, 102.5528° W =  mexico
    //  N & E are + , S & W are -
    let latitude = ( lat / 180) * Math.PI
    let longitude = ( lng / 180) * Math.PI
    let radius = 5
    let x = radius * Math.cos(latitude) * Math.sin(longitude)
    let y = radius * Math.sin(latitude)
    let z = radius * Math.cos(latitude) * Math.cos(longitude)

    box.position.x = x;
    box.position.y = y;
    box.position.z = z;
    box.lookAt(0,0,0)
    box.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0,0,-0.4))
    this.scene.add(box)
    this.group.add(box)

    gsapCore.to(box.scale, {
      z:1.4,
      duration: 2,
      yoyo:true,
      repeat: -1,
      ease: 'linear',
      delay: Math.random()
    })
    // box.scale.z= 4;
    }


    animateBox() {

    }
    /**
     * Create the scene
     *
     * @private
     * @memberof CubeComponent
     */
    private createScene(): void {
      //* Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000)
      // this.scene.add(this.cube);
      this.scene.add(this.earthGeometry)
      this.scene.add(this.earthAtmosGeometry);
      this.earthAtmosGeometry.scale.set(1.1, 1.1, 1.1)
      this.scene.add(this.stars)

      //*Camera
      let aspectRatio = this.getAspectRatio();
      this.camera = new THREE.PerspectiveCamera(
        this.fieldOfView,
        aspectRatio,
        this.nearClippingPlane,
        this.farClippingPlane
      )
      this.camera.position.z = this.cameraZ;




      // Rotate Earth to assist in correcting texture to lat/lng boxs
      this.earthGeometry.rotation.y = -Math.PI / 2

      this.group.add(this.earthGeometry)
      // Mexico
      this.createBox(23.6345, -102.5528)
      // Brazil
      this.createBox(-14.2350, -51.9253)
      // India
      this.createBox(20.5937, 78.9629)
      // China
      this.createBox(35.8617, 104.1954)
      // US
      this.createBox(37.0902, -95.7129)
      this.scene.add(this.group)


    }

    private getAspectRatio() {
      return this.canvas.clientWidth / this.canvas.clientHeight;
    }





    /**
   * Start the rendering loop
   *
   * @private
   * @memberof CubeComponent
   */
    private startRenderingLoop() {


      //* Renderer
      // Use canvas element in template
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
      this.renderer.setPixelRatio(devicePixelRatio);
      this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);


      let component: EarthComponent = this;
      (function render() {
        requestAnimationFrame(render);
        component.animateEarth();
        component.renderer.render(component.scene, component.camera);
      }());
    }






    /**
     *Animate Earth
     *
     * @private
     * @memberof CubeComponent
     */
     animateEarth() {
      // this.cube.rotation.x += this.rotationSpeedX;
      // this.cube.rotation.y += this.rotationSpeedY;
        // this.group.rotation.y += 0.002;
        // non-gsap mouse interaction - instantaneous
        // this.group.rotation.y = this.mouse.x * 0.5;
        // gsap mouse interaction - slight delay


        // MOUSE ROTATION - ADD BACK
        // gsapCore.to(this.group.rotation, {
        //   x: -this.mouse.y * -0.2,
        //   y:this.mouse.x *5,
        //   duration: 2
        // })













    }

    constructor() { }

    ngOnInit(): void {
      // console.log(this.scene.children);
      // console.log(this.group.children);






      for (let i = 0; i < 10000; i++) {
        const x:number = (Math.random() - 0.5) * 2000
        const y:number = (Math.random() - 0.5) * 2000
        const z:number = -Math.random() * 5000
        this.starVertices.push(x,y,z)
      }
      this.starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(this.starVertices, 3))
    }

    ngAfterViewInit() {
      this.createScene();
      this.startRenderingLoop();
      // this.popup.nativeElement.class = "hide-popup"
    }
  }










