import { useEffect } from "react";
import {
  ActionManager,
  Animation,
  ArcRotateCamera,
  CannonJSPlugin,
  CreateCylinder,
  CubeTexture,
  Engine,
  ExecuteCodeAction,
  FreeCamera,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  SceneLoader,
  Sound,
  StandardMaterial,
  Texture,
  Tools,
  Vector3,
} from "@babylonjs/core";
import "./App.css";
import "@babylonjs/loaders";
import "babylonjs-loaders";
import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import * as CANNON from "cannon";
import createBuilding from "./createBuilding";
import {
  createCSSobject,
  createCSSobjectYoutube,
  setupRenderer,
} from "./css3drenderer";

var youtubeFocused = false;

function App() {
  document.cookie = "safeCookie1=foo; SameSite=Lax";
  document.cookie = "safeCookie2=foo";
  document.cookie = "crossCookie=bar; SameSite=None; Secure";

  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement; // NOTE 캔버스 엘리먼트 찾음

  const createScene = function (scene: Scene, engine: Engine) {
    // NOTE 카메라 생성. arc rotate camera 는 항상 대상 위치를 회전 중심으로 하여 해당 대상을 중심으로 회전할 수 있는 카메라.
    // name, alpha, beta, radius, target position, scene 을 매개변수로 받음
    const camera = new ArcRotateCamera(
      "arc camera",
      -Math.PI / 2,
      Math.PI / 4,
      20,
      new Vector3(-10, 20, -20),
      scene
    );
    // const camera = new FreeCamera("camera", new Vector3(-20, 20, -20), scene);
    // camera.rotation = new Vector3(0, -4, 0);
    scene.activeCamera = camera;
    scene.activeCamera.attachControl(canvas, true);
    // camera.lowerRadiusLimit = 2;
    // camera.upperRadiusLimit = 10;
    // camera.wheelDeltaPercentage = 0.01;

    var hdrTexture = new CubeTexture(
      "https://raw.githubusercontent.com/BabylonJS/Assets/master/environments/environmentSpecular.dds",
      scene
    );
    scene.createDefaultSkybox(hdrTexture, true, 10000);

    // NOTE 조명 생성
    const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene); // 조명 생성. 반구형 조명으로 name, direction, scene 울 매개변수로 받음
    // light.intensity = 0.7;

    // NOTE ground 생성
    let ground = MeshBuilder.CreateGround(
      "ground",
      { width: 30, height: 30, subdivisions: 2 },
      scene
    );
    ground.isVisible = false;
    // let groundMaterial = new StandardMaterial("Ground Material", scene);
    // ground.material = groundMaterial;
    // const groundTexture = new Texture(
    //   "https://assets.babylonjs.com/textures/grass.png",
    //   scene
    // ); // babylonjs 에서 제공하는 texture
    // groundMaterial.diffuseTexture = groundTexture;

    // TODO 모달에 iframe 생성
    const modal = document.getElementById("modal");
    console.log(modal);

    // NOTE 사운드 실행
    new Sound(
      "sound",
      // "https://raw.githubusercontent.com/BabylonJS/Assets/master/sound/pirateFun.mp3",
      "./birds.wav",
      scene,
      null,
      { autoplay: true, loop: true }
      //  null, {
      //   autoplay: true,
      // spatialSound: true,
      // distanceModel:  // 특정 모델과 가까워지면 출력됨
      // }
    );

    // TODO iframe 적용
    const mat = new StandardMaterial("mat", scene);
    mat.alpha = 0.0;
    mat.needAlphaBlending = () => false;
    mat.backFaceCulling = true;

    // The CSS object will follow this mesh
    const plane = MeshBuilder.CreatePlane(
      "css_plane",
      { width: 1, height: 1 },
      scene
    );
    plane.rotationQuaternion = null;
    plane.scaling.x = 20;
    plane.scaling.y = 8;
    plane.position.y = 1;
    plane.checkCollisions = true;
    plane.material = mat;
    plane.position = new Vector3(-15, 5, -6);
    plane.rotation.y = -Math.PI / 2;

    // css object 렌더링
    // let existingRenderer = document.getElementById("css-container");
    // if (existingRenderer) existingRenderer.remove();
    let renderer = setupRenderer();
    createCSSobject(plane, scene, "babylonjs", renderer, youtubeFocused);

    // youtube
    // const plane2 = MeshBuilder.CreatePlane(
    //   "css_plane2",
    //   { width: 1, height: 1 },
    //   scene
    // );
    // plane2.rotationQuaternion = null;
    // plane2.scaling.x = 5;
    // plane2.scaling.y = 3;
    // plane2.position.y = 1;
    // plane2.checkCollisions = true;
    // plane2.material = mat;
    // plane2.position = new Vector3(4, 5, -6);
    // // plane2.rotation.y = -Math.PI / 2;

    // // let existingRenderer2 = document.getElementById("css-container");
    // // if (existingRenderer2) existingRenderer2.remove();
    // let renderer2 = setupRenderer();
    // createCSSobjectYoutube(
    //   plane2,
    //   scene,
    //   "hEqJLnEWVKk",
    //   renderer2,
    //   youtubeFocused
    // );

    scene.collisionsEnabled = true;
    ground.checkCollisions = true;
    camera.checkCollisions = true;

    // NOTE 물리엔진 적용 - cannon
    const gravityVector = new Vector3(0, -9.81, 0); // -y 방향으로 지구 중력 약 9.81 만큼 적용
    const physicsPlugin = new CannonJSPlugin(true, 10, CANNON);
    scene.enablePhysics(gravityVector, physicsPlugin);

    // NOTE 블렌더에서 ground 가져오기
    SceneLoader.ImportMesh(
      "",
      "https://raw.githubusercontent.com/hyeoz/babylonjs-assets/main/",
      "customground.glb",
      scene,
      (meshes) => {
        const mesh = meshes[0];
        mesh.scaling = new Vector3(15, 15, 15);
        mesh.checkCollisions = true;

        mesh.getChildMeshes().forEach((m) => {
          if (m.name.indexOf("tree") === -1 || m.name.indexOf("rock") === -1) {
            // const _m = m.getChildMeshes()[0];
            m?.setParent(null);
            m.physicsImpostor = new PhysicsImpostor(
              m,
              PhysicsImpostor.BoxImpostor,
              { mass: 0, restitution: 0.5, friction: 0.5 },
              scene
            );
          }
        });
        // console.log(mesh.position);
      }
    );

    // 분리
    const { frameRate, hinge, wall1, wall2, wall3, wall4, wall5, wall6, door } =
      createBuilding(scene, engine);

    // NOTE 애니메이션 생성
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
    // 회전의 중심은 항상 같게 둬야하는지? 바꿀 수 없는지..
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
      doorPhysicsRoot,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0.1 },
      scene
    );

    // 문 열림 여부
    let doorStatus = false;

    // NOTE 캐릭터 렌더링
    SceneLoader.ImportMesh(
      "",
      // "https://raw.githubusercontent.com/BabylonJS/Assets/master/meshes/",
      "./", // 상대경로 기준은 public 폴더로 인식됨
      // "https://raw.gㅇㅈithubusercontent.com/TrevorDev/gltfModels/master/",
      // "https://raw.githubusercontent.com/hyeoz/babylonjs-assets/main/",
      "shark.glb",
      // "weirdShape.glb",
      // "MergedMouse.glb",
      scene,
      (newMeshes) => {
        // console.log(newMeshes);
        let character = newMeshes[0];

        // 캐릭터 크기, 위치 등 조절
        character.scaling.scaleInPlace(0.1);
        // character.rotation.y = Math.PI / 2;

        const characters = character.getChildMeshes()[0];

        characters.setParent(null);
        character.dispose();

        characters.position.y = 1;
        characters.position.z = 0;
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
            characters.rotate(Vector3.Up(), characterRotationSpeed);
            // characters.rotate(Vector3.Backward(), -characterRotationSpeed);
            keydown = true;
          }
          if (inputMap["d"] || inputMap["ㅇ"]) {
            characters.rotate(Vector3.Down(), characterRotationSpeed);
            // characters.rotate(Vector3.Backward(), characterRotationSpeed);
            keydown = true;
          }
          if (inputMap["b"] || inputMap["ㅠ"]) {
            keydown = true;
          }
          if (inputMap["q"] || inputMap["ㅂ"]) {
            characters.moveWithCollisions(
              characters.up.scaleInPlace(characterSpeed)
              // characters.forward.scaleInPlace(characterSpeed)
            );
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
              } else if (inputMap["b"] || inputMap["ㅠ"]) {
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
            // 키 눌려있지 않은 경우
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
        // soundEffect.setPosition(characters.position);
        // soundEffect.attachToMesh(characters);

        characters.physicsImpostor = new PhysicsImpostor(
          characters,
          PhysicsImpostor.BoxImpostor, // meshImpostor 는 sphereImpostor 만 collide 할 수 있음
          { mass: 2, restitution: 0.1 },
          scene
        );

        characters.position.z = -5;

        // NOTE Collide 로 상호작용 or intersectMesh 로 상호작용
        scene.registerBeforeRender(() => {
          // console.log(door.intersectsMesh(characters));
          doorStatus = door.intersectsMesh(characters);
        });
      }
    );

    // NOTE GUI 추가
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    const instructions = new TextBlock();
    instructions.text =
      "WASD 키로 이동할 수 있습니다.\n W와 Shift 를 함께 누르면 빠르게 이동이 가능해요. \n 마우스를 움직이면 시점을 변경할 수 있습니다. \n 왼쪽 상단 스피커 모양을 클릭해 사운드를 들을 수 있습니다.";
    instructions.color = "black";
    instructions.fontSize = 26;
    instructions.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    instructions.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    advancedTexture.addControl(instructions);

    scene.registerBeforeRender(() => {
      if (doorStatus) {
        // scene.stopAllAnimations();
        scene.beginAnimation(
          door,
          3 * frameRate,
          10 * frameRate,
          false,
          undefined,
          () => {
            // on animate end -> 문 열린채로 고정
            hinge.rotation.y = Math.PI / 2;
            doorOpenSound(scene);
          }
        );
      }
    });

    return scene;
  };

  const doorOpenSound = (scene: Scene) => {
    const doorSound = new Sound("doorSound", "./door.wav", scene, null, {
      autoplay: true,
      spatialSound: true,
    });
  };

  // NOTE iframe / canvas pointer event
  var listener = function (evt: any, scene: Scene, youtubeFocused: boolean) {
    let pick = scene.pick(Math.round(evt.offsetX), Math.round(evt.offsetY));
    if (!pick.pickedMesh) return;
    if (pick.pickedMesh.name === "css_plane") {
      if (!youtubeFocused) {
        youtubeFocused = true;
        // console.log("YOUTUBE");
      }
    }

    // div 에 호버되면 canvas pointer event 를 죽여서 클릭이 되도록
    if (youtubeFocused) {
      document.getElementsByTagName("body")[0].style.pointerEvents = "none";
    } else {
      document.getElementsByTagName("body")[0].style.pointerEvents = "auto";
    }
  };

  // modal?.style.display = 'none';

  // react 로 작성시 scene 생성은 useffect 로 관리.
  useEffect(() => {
    const engine = new Engine(canvas, true); // NOTE BABYLON 3D engine 생성 -> babylon 은 engine 이 필요
    const scene = new Scene(engine); // NOTE 장면 생성. 엔진을 인수로 넘겨줌

    if (scene.isReady()) {
      createScene(scene, engine); // createScene 함수 실행
    } else {
      scene.onReadyObservable.addOnce((scene) => {
        console.log("not ready");
      });
    }
    engine.runRenderLoop(function () {
      scene.render();
    });

    // 브라우저나 캔버스의 리사이즈 이벤트를 적용함
    window.addEventListener("resize", function () {
      engine.resize();
    });
    // ifram 영역과 캔버스 영역 구분
    window.addEventListener("pointermove", (event) =>
      listener(event, scene, youtubeFocused)
    );
    window.addEventListener("pointerdown", (event) =>
      listener(event, scene, youtubeFocused)
    );
    window.addEventListener("pointerup", (event) =>
      listener(event, scene, youtubeFocused)
    );

    return () => {
      window.removeEventListener("resize", function () {
        engine.resize();
      });

      window.removeEventListener("pointermove", (event) =>
        listener(event, scene, youtubeFocused)
      );
      window.removeEventListener("pointerdown", (event) =>
        listener(event, scene, youtubeFocused)
      );
      window.removeEventListener("pointerup", (event) =>
        listener(event, scene, youtubeFocused)
      );
    };
  }, []);

  return <div className="App"></div>;
}

export default App;
