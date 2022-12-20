import React, { useEffect, useState } from "react";
import {
  AbstractMesh,
  ActionManager,
  AmmoJSPlugin,
  Animation,
  AnimationGroup,
  ArcRotateCamera,
  CannonJSPlugin,
  CreateBox,
  CreateCylinder,
  CreateGround,
  CreateSphere,
  Engine,
  ExecuteCodeAction,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  SceneLoader,
  StandardMaterial,
  Texture,
  Tools,
  Vector3,
  VertexBuffer,
} from "@babylonjs/core";
import "./App.css";
import "@babylonjs/loaders";
import "babylonjs-loaders";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import * as CANNON from "cannon";
import { Color3 } from "babylonjs";

function App() {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement; // NOTE 캔버스 엘리먼트 찾음
  const engine = new Engine(canvas, true); // NOTE BABYLON 3D engine 생성 -> babylon 은 engine 이 필요

  const createScene = function () {
    const scene = new Scene(engine); // NOTE 장면 생성. 엔진을 인수로 넘겨줌

    // NOTE 카메라 생성. arc rotate camera 는 항상 대상 위치를 회전 중심으로 하여 해당 대상을 중심으로 회전할 수 있는 카메라.
    // name, alpha, beta, radius, target position, scene 을 매개변수로 받음
    const camera = new ArcRotateCamera(
      "arc camera",
      -Math.PI / 2,
      Math.PI / 4,
      10,
      new Vector3(0, 20, -20),
      scene
    );
    scene.activeCamera = camera;
    scene.activeCamera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 10;
    camera.wheelDeltaPercentage = 0.01;

    // NOTE 조명 생성
    const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene); // 조명 생성. 반구형 조명으로 name, direction, scene 울 매개변수로 받음
    // light.intensity = 0.7;

    // NOTE ground 생성
    let ground = MeshBuilder.CreateGround(
      "ground",
      { width: 30, height: 30, subdivisions: 2 },
      scene
    );
    let groundMaterial = new StandardMaterial("Ground Material", scene);
    ground.material = groundMaterial;
    const groundTexture = new Texture(
      "https://assets.babylonjs.com/textures/grass.png",
      scene
    ); // babylonjs 에서 제공하는 texture
    groundMaterial.diffuseTexture = groundTexture;

    // NOTE object 생성
    // 건물의 몸체. 각각의 벽으로 둘러 만듦 -> 문 있는 면은 문을 제외하고 3부분으로 나누서 생성해줌
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

    // 자붕 생성
    const roof = CreateCylinder("roof", {
      // cylinder = 기둥
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
    );

    const hinge = MeshBuilder.CreateBox(
      "hinge",
      { width: 2, height: 4 },
      scene
    ); // 문이 열리기위한 힌지(문이 열리며 접히는 부분. 눈에 보이지 않음)
    hinge.isVisible = false;
    door.parent = hinge;
    hinge.position.y = 2;
    door.position.x = -1;

    // NOTE 액션 생성
    // 문 클릭시 열리고 닫힘
    door.actionManager = new ActionManager(scene);
    door.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickUpTrigger, async function () {
        if (hinge.rotation.y !== Math.PI / 2) {
          scene.stopAllAnimations();
          scene.beginAnimation(
            hinge,
            3 * frameRate,
            10 * frameRate,
            false,
            undefined,
            () => {
              // on animate end -> 문 열린채로 고정
              hinge.rotation.y = Math.PI / 2;
            }
          );
        } else {
          // scene.stopAllAnimations();
          scene.beginAnimation(
            hinge,
            10 * frameRate,
            15 * frameRate,
            false,
            undefined,
            () => {
              hinge.rotation.y = 0;
            }
          );
        }
      })
    );

    // NOTE 애니메이션 생성
    const frameRate = 20;

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
      value: new Vector3(0, 5, -20),
    });
    keyFrames.push({
      frame: 3 * frameRate,
      value: new Vector3(0, 2, -7),
    });
    keyFrames.push({
      frame: 5 * frameRate,
      value: new Vector3(0, 2, -7),
    });
    keyFrames.push({
      frame: 8 * frameRate,
      value: new Vector3(-2, 2, 4),
    });
    movein.setKeys(keyFrames);
    camera.animations.push(movein);

    // 카메라 회전 애니메이션
    const rotate = new Animation(
      "rotate",
      "rotation.y",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    const rotateKeyFrames = [];
    rotateKeyFrames.push({
      frame: 0,
      value: 0,
    });
    rotateKeyFrames.push({
      frame: 8 * frameRate,
      value: 0,
    });
    rotateKeyFrames.push({
      frame: 10 * frameRate,
      value: Math.PI,
    });
    rotate.setKeys(rotateKeyFrames);
    camera.animations.push(rotate);

    // 문 열리는 애니메이션
    // TODO 회전의 중심은 항상 같게 둬야하는지? 바꿀 수 없는지..
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
      value: Math.PI / 2,
    });
    sweepKeyFrames.push({
      frame: 10 * frameRate,
      value: Math.PI / 2,
    });
    sweepKeyFrames.push({
      frame: 15 * frameRate,
      value: 0,
    });
    sweep.setKeys(sweepKeyFrames);
    hinge.animations.push(sweep);

    const open = new Animation(
      "open",
      "rotation.y",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    open.setKeys([
      { frame: 0, value: 0 },
      { frame: 3 * frameRate, value: Math.PI / 2 },
    ]);
    const close = new Animation(
      "close",
      "rotation.y",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    close.setKeys([
      { frame: 0, value: Math.PI / 2 },
      { frame: 3 * frameRate, value: 0 },
    ]);

    // 렌더링 되면 애니메이션 바로 시작
    // scene.beginAnimation(camera, 0, 15 * frameRate, false);
    // scene.beginAnimation(hinge, 0, 15 * frameRate, false);

    // NOTE 캐릭터 렌더링

    // SceneLoader.Append("./", "rumba.glb", scene, function (scene) {
    //   console.log(",fesfmksmf", scene);
    // });

    // NOTE 물리엔진 적용 - cannon
    const gravityVector = new Vector3(0, -9.81, 0); // -y 방향으로 지구 중력 약 9.81 만큼 적용
    const physicsPlugin = new CannonJSPlugin(true, 10, CANNON);
    scene.enablePhysics(gravityVector, physicsPlugin);

    ground.physicsImpostor = new PhysicsImpostor(
      ground,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0.5, friction: 0.5 },
      scene
    );
    [wall1, wall2, wall3, wall4, wall5, wall6].forEach((w) => {
      w.physicsImpostor = new PhysicsImpostor(
        w,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.1 },
        scene
      );
    });

    const doorPhysicsRoot = new Mesh("", scene);
    doorPhysicsRoot.addChild(hinge);
    doorPhysicsRoot.setParent(null);
    doorPhysicsRoot.physicsImpostor = new PhysicsImpostor(
      door,
      PhysicsImpostor.MeshImpostor,
      { mass: 0, restitution: 0.1 },
      scene
    );

    SceneLoader.ImportMesh(
      "",
      "https://raw.githubusercontent.com/BabylonJS/Assets/master/meshes/",
      // "https://raw.githubusercontent.com/TrevorDev/gltfModels/master/",
      // "https://raw.githubusercontent.com/hyeoz/babylonjs-assets/main/",
      "shark.glb",
      // "weirdShape.glb",
      // "stickman2.glb",
      scene,
      (newMeshes) => {
        console.log(newMeshes);

        let character = newMeshes[0];

        //   scene.beginAnimation(skeletons[0], 0, 100, true, 1.0);

        // 캐릭터 크기, 위치 등 조절
        character.scaling.scaleInPlace(0.1);
        // character.rotation.y = Math.PI / 2;

        // const characters = character;
        const characters = character.getChildMeshes()[0];

        characters.setParent(null);
        character.dispose();

        // const characters = makePhysics(newMeshes, scene, 1);
        characters.position.y += 0.4;
        characters.position.z = -5;
        //   Lock camera on the character
        (scene.activeCamera as ArcRotateCamera).target =
          characters.absolutePosition;

        // NOTE 이벤트
        var inputMap: { [key: string]: boolean } = {};
        scene.actionManager = new ActionManager(scene);
        scene.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (event) => {
            inputMap[event.sourceEvent.key] =
              event.sourceEvent.type == "keydown";
          })
        );
        scene.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (event) => {
            inputMap[event.sourceEvent.key] =
              event.sourceEvent.type == "keydown"; // 이 부분을 keyup 으로 맞추면 키를 한 번만 눌러도 같은 액션이 계속 진행됨
          })
        );

        // 캐릭터 애니메이션
        var animating = true;

        const characterSpeed = 0.03;
        const characterSpeedBack = 0.01;
        const characterRotationSpeed = 0.1;

        // const walkAnimation = scene.getAnimationGroupByName("Walking");
        // const walkBackAnimation = scene.getAnimationGroupByName("WalkingBack");
        // const idleAnimation = scene.getAnimationGroupByName("Idle");
        // const sambaAnimation = scene.getAnimationGroupByName("Samba");
        const idleAnimation = scene.getAnimationGroupByName("Idle");
        const rumbaAnimation = scene.getAnimationGroupByName("Rumba");
        const swimmingAnimation = scene.getAnimationGroupByName("Swimming");

        // NOTE loop 로 이벤트에 대해 반복적으로 실행됨
        scene.onBeforeRenderObservable.add(() => {
          var keydown = false;
          // console.log(inputMap);

          // 각 키의 움직임에 대한 정의(위치, 회전)
          if ((inputMap["w"] || inputMap["ㅈ"]) && inputMap["Shift"]) {
            // shift 함께 누르는 경우 빠르게 이동
            characters.moveWithCollisions(
              characters.forward.scaleInPlace(characterSpeed * 2)
              // characters.up.scaleInPlace(characterSpeed * 2)
            );
            keydown = true;
          }
          // NOTE babylonjs 에서는 y 축이 수직, blender 에서는 z 축이 수직이기 때문에 비정상적으로 작동하는 경우 수정이 필요.
          if ((inputMap["w"] || inputMap["ㅈ"]) && !inputMap["Shift"]) {
            // 일반 직진
            characters.moveWithCollisions(
              characters.forward.scaleInPlace(characterSpeed)
              // characters.up.scaleInPlace(characterSpeed)
            );
            keydown = true;
          }
          if (inputMap["s"] || inputMap["ㄴ"]) {
            characters.moveWithCollisions(
              characters.forward.scaleInPlace(-characterSpeedBack)
              // characters.up.scaleInPlace(-characterSpeedBack)
            );
            keydown = true;
          }
          if (inputMap["a"] || inputMap["ㅁ"]) {
            characters.rotate(Vector3.Up(), -characterRotationSpeed);
            // characters.rotate(Vector3.Backward(), -characterRotationSpeed);
            keydown = true;
          }
          if (inputMap["d"] || inputMap["ㅇ"]) {
            characters.rotate(Vector3.Down(), -characterRotationSpeed);
            // characters.rotate(Vector3.Backward(), characterRotationSpeed);
            keydown = true;
          }
          if (inputMap["b"] || inputMap["ㅠ"]) {
            keydown = true;
          }
          if (inputMap["q"]) {
            characters.rotation.y = Math.PI;
            keydown = true;
          }

          // 애니메이션에 대한 정의
          if (keydown) {
            // 키 눌림 감지된 경우
            if (!animating) {
              // 애니메이션 실행되고 있는지 여부 확인
              animating = true;
              if (inputMap["w"]) {
                // 후진
                // walkBackAnimation?.start(
                //   true,
                //   1.0,
                //   walkBackAnimation?.from,
                //   walkBackAnimation?.to,
                //   false
                // );
                swimmingAnimation?.start(
                  true,
                  1.0,
                  swimmingAnimation.from,
                  swimmingAnimation.to,
                  false
                );
              } else if (inputMap["b"]) {
                // 삼바
                rumbaAnimation?.start(
                  true,
                  1.0,
                  rumbaAnimation.from,
                  rumbaAnimation.to,
                  false
                );
              } else {
                // 직진, 우회전, 좌회전 (같은 애니메이션 사용)
                // walkAnimation?.start(
                //   true,
                //   1.0,
                //   walkAnimation.from,
                //   walkAnimation.to,
                //   false
                // );
              }
            }
          } else {
            // 키 눌려있지 않은 경우ㅈㅁ
            if (animating) {
              // 애니메이션 실행되고 있는지 여부 확인
              // 키 눌린 경우 실행되어야 하는 애니메이션 멈춤
              rumbaAnimation?.stop();
              swimmingAnimation?.stop();
              // walkAnimation?.stop();
              // walkBackAnimation?.stop();

              // 기본 애니메이션 실행
              idleAnimation?.start(
                true,
                1.0,
                idleAnimation.from,
                idleAnimation.to,
                false
              );

              animating = false;
            }
          }
        });

        characters.physicsImpostor = new PhysicsImpostor(
          characters,
          PhysicsImpostor.BoxImpostor, // meshImpostor 는 sphereImpostor 만 collide 할 수 있음
          { mass: 1, restitution: 0.5 },
          scene
        );

        // NOTE Collide 로 상호작용
        // 콟백함수 넘기는 경우 화살표 함수로 넘기지 말고 별개의 함수로 전달! (unregister 하는 경우를 위해)

        scene.registerBeforeRender(() => {
          // console.log(door.intersectsMesh(characters));

          if (
            // hinge.rotation.y !== Math.PI / 2 &&
            door.intersectsMesh(characters)
          ) {
            // scene.stopAllAnimations();
            scene.beginAnimation(
              hinge,
              3 * frameRate,
              10 * frameRate,
              false,
              undefined,
              () => {
                // on animate end -> 문 열린채로 고정
                hinge.rotation.y = Math.PI / 2;
              }
            );
          }
        });
      }
    );

    // NOTE GUI 추가
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    const instructions = new TextBlock();
    instructions.text =
      "WASD 키로 이동할 수 있고, B 키로 춤을 출 수 있습니다.\n W와 Shift 를 함께 누르면 빠르게 이동이 가능해요. \n 마우스를 움직이면 시점을 변경할 수 있습니다.";
    instructions.color = "white";
    instructions.fontSize = 26;
    instructions.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    instructions.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    advancedTexture.addControl(instructions);

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
