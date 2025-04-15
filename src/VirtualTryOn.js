import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as THREE from 'three';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import './virtualTryOn.css';
import { useParams } from 'react-router-dom';



const VirtualTryOn = () => {


  // import '@tensorflow/tfjs-converter';     => des packages for model loading and WebGL backend.
  // import '@tensorflow/tfjs-backend-webgl';  ==||

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [glassesMesh, setGlassesMesh] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageProduit,setImageProduit]=useState();


  useEffect(() => {
    setImageProduit(`${process.env.PUBLIC_URL}/image/glasses.png`);
  }, []);

console.log(imageProduit);

console.log(webcamRef);

useEffect(() => {
    const loadResources = async () => {
      try {
        if (imageProduit) {
          // Api de TensorFlow pour Access Camera de user
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (webcamRef.current) {
            webcamRef.current.srcObject = stream;
          }
  
          // TensorFlow Model
          //a JavaScript API for rendering graphics in web browsers
          await tf.setBackend('webgl');

      
          const loadedModel = await faceLandmarksDetection.load(

          faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
           
            { shouldLoadIrisModel: true, maxFaces: 1 }
          );
          setModel(loadedModel);
  
          // Three.js Setup
          const width = canvasRef.current.clientWidth;
          const height = canvasRef.current.clientHeight;

          console.log("width",width,"height", height);
          const scene = new THREE.Scene();
          //placement de model esque bigger smaller 
          //a9al 7aja 0.1 b3id 3al camera bech l'object yodhher
          const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
          camera.position.z = 5;
          //alpha = transparence
          const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
          renderer.setSize(width, height);

          //for real time
          renderer.setAnimationLoop(() => renderer.render(scene, camera));
  


          // Glasses Mesh
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(imageProduit, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            const geometry = new THREE.PlaneGeometry(2, 1);
            const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
            const glasses = new THREE.Mesh(geometry, material);
            scene.add(glasses);
            setGlassesMesh(glasses);
          });
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setIsLoading(false);
      }
    };
  
    loadResources();
  }, [imageProduit]);

  

//détecte et positionne des lunettes virtuelles sur un visage détecté 

  useEffect(() => {
    const detectAndPositionGlasses = async () => {
      if (!webcamRef.current || !model || !glassesMesh) return;
      const video = webcamRef.current.video;

      //!==4 signifie que la vidéo est complètement chargée
      if (video.readyState !== 4) return;

      // Utilise le modèle TensorFlow pour estimer les points de repère du visage à partir de la vidéo
      const faceEstimates = await model.estimateFaces({input: video});
  
      // au moin un visage detecter
      if (faceEstimates.length > 0) {
        setIsLoading(false);
        // Face mesh keypoints
        const keypoints = faceEstimates[0].scaledMesh;
        console.log(keypoints);
        const leftEye = keypoints[130];
        const rightEye = keypoints[359];
        const eyeCenter = keypoints[168];

        // hedhi bech nkalklou biha 7ajm elunette par rapport lel wejh b3id wala 9rib
        const eyeDistance = Math.sqrt(Math.pow(rightEye[0] - leftEye[0], 2) + Math.pow(rightEye[1] - leftEye[1], 2));
        const scaleMultiplier = eyeDistance / 140;

        // Glasses scaling and offset values
        
        const scaleX = -0.01;
        const scaleY = -0.01;
        const offsetX = 0.00;
        //decalage en bas 
        const offsetY = -0.01;

        // Glasses positioning
        //x => centre de yeux
        glassesMesh.position.x = (eyeCenter[0] - video.videoWidth / 2) * scaleX + offsetX;
        glassesMesh.position.y = (eyeCenter[1] - video.videoHeight / 2) * scaleY + offsetY;
        glassesMesh.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
        glassesMesh.position.z = 1;

        // Rotate glasses to align with eyes - rotation depth
        const eyeLine = new THREE.Vector2(rightEye[0] - leftEye[0], rightEye[1] - leftEye[1]);
        const rotationZ = Math.atan2(eyeLine.y, eyeLine.x);
        glassesMesh.rotation.z = rotationZ;
      }
    };

    // Run detection and positioning every 120ms
    const intervalId = setInterval(() => {
      detectAndPositionGlasses();
    }, 120);

    return () => clearInterval(intervalId);
  }, [model, glassesMesh]);

  return (
    <>
    <div className='containerTryRealiter'>
    <div className='VirtualTitle'>
      <h1>face Landmarks Detection</h1>
    </div>
    <div className='contentRealiter'>
        {isLoading && (
          <div className='contentLoadingReality'>
            <h3>Loading...</h3>
          </div>
        )}
      <Webcam ref={webcamRef} autoPlay playsInline style={{ width: '800px', height: '800px',borderRadius:'0%' }} mirrored={true} />
      <canvas ref={canvasRef} style={{ width: '800px', height: '800px', position: 'absolute', top: 0, left: 0 }} />

    </div>
    </div>
    </>
  );
};

export default VirtualTryOn;