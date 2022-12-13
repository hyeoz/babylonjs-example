import React, { useEffect } from "react";
import {
  Animation,
  ArcRotateCamera,
  CreateCylinder,
  CreateGround,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  Tools,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import "./App.css";

function App() {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement; // 캔버스 엘리먼트 찾음
  const engine = new Engine(canvas, true); // BABYLON 3D engine 생성

  const createScene = function () {
    const scene = new Scene(engine); // 장면 생성. 엔진을 인수로 넘겨줌

    // 카메라 생성. arc rotate camera 는 항상 대상 위치를 회전 중심으로 하여 해당 대상을 중심으로 회전할 수 있는 카메라.
    // name, alpha, beta, radius, target position, scene 을 매개변수로 받음
    const camera = new UniversalCamera(
      "universal camera",
      new Vector3(0, 3, -30),
      scene
    );
    camera.attachControl(canvas, true);

    const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene); // 조명 생성. 반구형 조명으로 name, direction, scene 울 매개변수로 받음
    // light.intensity = 0.7;

    // animation
    const frameRate = 20;

    // built-in ground 생성
    let ground = CreateGround("ground", { width: 30, height: 30 }, scene);
    let groundMaterial = new StandardMaterial("Ground Material", scene);
    ground.material = groundMaterial;
    const groundTexture = new Texture(
      "https://assets.babylonjs.com/textures/grass.png",
      scene
    ); // babylonjs 에서 제공하는 texture
    groundMaterial.diffuseTexture = groundTexture;

    // object 생성
    const wall1 = MeshBuilder.CreateBox("wall", {
      width: 4,
      height: 6,
      depth: 0.1,
    });
    wall1.position.x = -4;
    wall1.position.y = 3;
    wall1.position.z = 0;
    const wall2 = MeshBuilder.CreateBox("wall", {
      width: 2,
      height: 2,
      depth: 0.1,
    });
    wall2.position.x = -1;
    wall2.position.y = 5;
    const wall3 = MeshBuilder.CreateBox("wall", {
      width: 4,
      height: 6,
      depth: 0.1,
    });
    wall3.position.x = 2;
    wall3.position.y = 3;
    const wall4 = MeshBuilder.CreateBox("wall", {
      width: 10,
      height: 6,
      depth: 0.1,
    });
    wall4.position.x = -1;
    wall4.position.y = 3;
    wall4.position.z = 7;
    const wall5 = MeshBuilder.CreateBox("wall", {
      width: 7,
      height: 6,
      depth: 0.1,
    });
    wall5.rotation.y = Math.PI / 2;
    wall5.position.x = 4;
    wall5.position.y = 3;
    wall5.position.z = 3.5;
    const wall6 = MeshBuilder.CreateBox("wall", {
      width: 7,
      height: 6,
      depth: 0.1,
    });
    wall6.rotation.y = Math.PI / 2;
    wall6.position.x = -6;
    wall6.position.y = 3;
    wall6.position.z = 3.5;

    const roof = CreateCylinder("roof", {
      // 원기둥 생성
      diameter: 1.5, // 직경
      height: 1.5, // 높이
      tessellation: 3, // tessellation: 타일이라고 하는 도형들로 겹치지 않으면서 빈틈없게 공간을 채우는 것. 해당 메서드에서는 기둥의 밑면의 각을 의미함(원기둥인 경우 0, 삼각기둥인 경우 3)
    });

    const roofMaterial = new StandardMaterial("Roof Material");
    const roofTexture = new Texture(
      "https://assets.babylonjs.com/environments/roof.jpg"
    );
    roofMaterial.diffuseTexture = roofTexture;

    roof.material = roofMaterial;
    roof.scaling.x = 4;
    roof.scaling.y = 8;
    roof.scaling.z = 6;
    roof.position.x = -1;
    roof.position.y = 7.5;
    roof.position.z = 3.5;
    roof.rotation.z = Tools.ToRadians(90);

    // 애니메이션을 위한 문 만들기
    const door = MeshBuilder.CreateBox(
      "door",
      { width: 2, height: 4, depth: 0.1 },
      scene
    ); // 문 -> 열리는 애니메이션 필요
    const hinge = MeshBuilder.CreateBox("hinge", {}, scene); // 문이 열린 뒤 비어있는 문틀
    hinge.isVisible = false;
    door.parent = hinge;
    hinge.position.y = 2;
    door.position.x = -1;

    const wallMaterial = new StandardMaterial("Wall Material");
    const wallTexture = new Texture(
      "https://www.babylonjs-playground.com/textures/albedo.png"
    );
    wallMaterial.diffuseTexture = wallTexture;
    wall1.material = wallMaterial;
    wall2.material = wallMaterial;
    wall3.material = wallMaterial;
    wall4.material = wallMaterial;
    wall5.material = wallMaterial;
    wall6.material = wallMaterial;

    // 카메라 이동 애니메이션
    const movein = new Animation(
      "movein",
      "position",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    const keyFrames = [];
    keyFrames.push({
      frame: 0,
      value: new Vector3(0, 5, -30),
    });
    keyFrames.push({
      frame: 3 * frameRate,
      value: new Vector3(0, 2, -10),
    });
    keyFrames.push({
      frame: 5 * frameRate,
      value: new Vector3(0, 2, -10),
    });
    keyFrames.push({
      frame: 8 * frameRate,
      value: new Vector3(-2, 2, 3),
    });
    movein.setKeys(keyFrames);

    // 문 열리는 애니메이션
    const sweep = new Animation(
      "sweep",
      "rotation.y",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    const sweepKeyFrames = [];
    sweepKeyFrames.push({
      frame: 0,
      value: 0,
    });
    sweepKeyFrames.push({
      frame: 3 * frameRate,
      value: 0,
    });
    sweepKeyFrames.push({
      frame: 5 * frameRate,
      value: Math.PI / 3,
    });
    sweepKeyFrames.push({
      frame: 13 * frameRate,
      value: Math.PI / 3,
    });
    sweepKeyFrames.push({
      frame: 15 * frameRate,
      value: 0,
    });
    sweep.setKeys(sweepKeyFrames);

    scene.beginDirectAnimation(camera, [movein], 0, 8 * frameRate, false);
    scene.beginDirectAnimation(hinge, [sweep], 0, 15 * frameRate, false);

    return scene;
  };

  useEffect(() => {
    // react 로 작성시 scene 생성은 useffect 로 관리.
    const scene = createScene(); // createScene 함수 실행

    // 렌더링
    engine.runRenderLoop(function () {
      scene.render();
    });

    // 브라우저나 캔버스의 리사이즈 이벤트를 적용함
    window.addEventListener("resize", function () {
      engine.resize();
    });

    return () => {
      window.removeEventListener("resize", function () {
        engine.resize();
      });
    };
  }, []);

  return <div className="App"></div>;
}

export default App;
