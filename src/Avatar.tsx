import "@babylonjs/loaders";
import {
  AbstractMesh,
  ArcRotateCamera,
  Color3,
  Engine,
  Scene,
  SceneLoader,
} from "@babylonjs/core";
import { useEffect } from "react";

export default function Avatar() {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement; // NOTE 캔버스 엘리먼트 찾음
  const engine = new Engine(canvas, true); // NOTE BABYLON 3D engine 생성 -> babylon 은 engine 이 필요
  const scene = new Scene(engine);

  const createScene = async () => {
    // NOTE 캐릭터 생성
    const primaryColor = "#1B1869";
    const secondaryColor = "#87CEEB";

    // const buildSceneObject = async (
    //   scene: Scene,
    //   primaryColor: string,
    //   secondaryColor: string
    // ) => {
    scene.createDefaultCameraOrLight(true, true, true);
    (scene.activeCamera as ArcRotateCamera).radius = 6.5;
    (scene.activeCamera as ArcRotateCamera).alpha = 1.697;
    (scene.activeCamera as ArcRotateCamera).beta = 1.277;

    scene.createDefaultEnvironment({
      skyboxColor: Color3.FromHexString(primaryColor),
      groundColor: Color3.FromHexString(secondaryColor),
    });
    scene.createDefaultXRExperienceAsync();

    //   const dudeResult = await SceneLoader.ImportMeshAsync(
    //     "Dude",
    //     "https://models.babylonjs.com/",
    //     "Dude/dude.babylon",
    //     scene
    //   );

    //   return dudeResult;
    // };

    // const dude = await buildSceneObject(scene, primaryColor, secondaryColor);
    // scene.useRightHandedSystem = true;
    SceneLoader.ImportMesh(
      "",
      "https://raw.githubusercontent.com/BabylonJS/Assets/master/meshes/",
      "HVGirl.glb",
      scene,
      function (newMeshes) {
        var hero = newMeshes[0];

        console.log("SUCCESS on load character", newMeshes);
        //   scene.beginAnimation(skeletons[0], 0, 100, true, 1.0);

        //   Scale the model down
        hero.scaling.scaleInPlace(0.05);

        //   Lock camera on the character
        (scene.activeCamera as ArcRotateCamera).target = hero.absolutePosition;
      }
    );
    return scene;
  };

  useEffect(() => {
    // react 로 작성시 scene 생성은 useffect 로 관리.
    const scene = createScene(); // createScene 함수 실행

    // 렌더링
    engine.runRenderLoop(async function () {
      (await scene).render();
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

  return <div id="avatar"></div>;
}
