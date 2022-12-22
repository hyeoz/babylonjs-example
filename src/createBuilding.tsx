// NOTE object 생성

import {
  ActionManager,
  CreateCylinder,
  DynamicTexture,
  ExecuteCodeAction,
  MeshBuilder,
  Scene,
  Sound,
  StandardMaterial,
  Texture,
  Tools,
  Vector3,
} from "@babylonjs/core";

export default function createBuilding(scene: Scene) {
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

  const board = MeshBuilder.CreateBox(
    "board",
    { width: 2, height: 2, depth: 0.1 },
    scene
  );
  const boardLeg = MeshBuilder.CreateBox(
    "boardLeg",
    { width: 0.5, height: 2, depth: 0.1 },
    scene
  );
  board.position = new Vector3(2, 2, -2);
  boardLeg.position = new Vector3(2, 1, -2);

  const boardTexture = new DynamicTexture(
    "boardTexture",
    { width: 2, height: 2 },
    scene
  );
  var boardMaterial = new StandardMaterial("boardMaterial", scene);
  boardMaterial.diffuseTexture = boardTexture;
  board.material = boardMaterial;
  boardTexture.drawText(
    "WASD 키로 이동할 수 있습니다.\n W와 Shift 를 함께 누르면 빠르게 이동이 가능해요. \n 마우스를 움직이면 시점을 변경할 수 있습니다. \n 왼쪽 상단 스피커 모양을 클릭해 사운드를 들을 수 있습니다.",
    0,
    0,
    "bold 20px monospace",
    "black",
    "white"
  );

  // 애니메이션을 위한 문 만들기
  const door = MeshBuilder.CreateBox(
    "door",
    { width: 2, height: 4, depth: 0.1 },
    scene
  );

  const hinge = MeshBuilder.CreateBox("hinge", { width: 2, height: 4 }, scene); // 문이 열리기위한 힌지(문이 열리며 접히는 부분. 눈에 보이지 않음)
  hinge.isVisible = false;
  door.parent = hinge;
  hinge.position.y = 2;
  door.position.x = -1;

  // NOTE 액션 생성
  // 문 클릭시 열리고 닫힘
  const frameRate = 20;

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
          2,
          () => {
            // on animate end -> 문 열린채로 고정
            hinge.rotation.y = Math.PI / 2;
          }
        );
        const doorSound = new Sound("doorSound", "./door.wav", scene, null, {
          autoplay: true,
        });
        window.open("https://naver.com", "_blank");
      } else {
        // scene.stopAllAnimations();
        scene.beginAnimation(
          hinge,
          10 * frameRate,
          15 * frameRate,
          false,
          4,
          () => {
            hinge.rotation.y = 0;
          }
        );
      }
    })
  );

  return {
    scene,
    hinge,
    frameRate,
    wall1,
    wall2,
    wall3,
    wall4,
    wall5,
    wall6,
    door,
    // board,
  };
}
