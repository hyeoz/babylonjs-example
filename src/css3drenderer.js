import { Camera, Matrix, Mesh, Scene, StandardMaterial } from "@babylonjs/core";

export function setupRenderer() {
  const prevContainer = document.getElementById("css-container");
  if (prevContainer) prevContainer.remove();
  let container = document.createElement("div");
  container.id = "css-container";
  container.style.position = "absolute";
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.zIndex = "-1"; // TODO zindex 를 높이면 화면이 보이는데 카메라 액션이 적용되지 않음..

  let canvasZone = document.getElementById("canvasZone");
  if (canvasZone) {
    canvasZone.insertBefore(container, canvasZone.firstChild);
  } else {
    return;
  }

  let renderer = new CSS3DRenderer(); // css3drenderer 는 three.js 라이브러리, 직접 작성하여 사용
  container.appendChild(renderer.domElement);
  renderer.setSize(canvasZone?.offsetWidth, canvasZone?.offsetHeight);

  window.addEventListener("resize", () => {
    renderer.setSize(canvasZone?.offsetWidth, canvasZone.offsetHeight);
  });
  return renderer;
}

export function createCSSobject(
  mesh,
  scene,
  videoID,
  renderer,
  youtubeFocused
) {
  let width = 480;
  let height = 300;
  scene.onBeforeRenderObservable.add(() => {
    renderer.render(scene, scene.activeCamera);
  });
  var div = document.createElement("div");
  div.style.width = width + "px";
  div.style.height = height + "px";
  div.style.backgroundColor = "#000";
  var CSSobject = new CSS3DObject(div, scene);
  CSSobject.position.copyFrom(mesh.getAbsolutePosition());
  CSSobject.rotation.y = -mesh.rotation.y;
  CSSobject.scaling.copyFrom(mesh.scaling);

  var iframe = document.createElement("iframe");
  iframe.id = "video-" + videoID;
  iframe.style.width = width + "px";
  iframe.style.height = height + "px";
  iframe.style.border = "0px";
  iframe.allow = "autoplay";
  iframe.src = "https://www.babylonjs.com";
  //   iframe.src = [
  //     "https://www.youtube.com/embed/",
  //     videoID,
  //     "?rel=0&enablejsapi=1&disablekb=1&autoplay=1&controls=0&fs=0&modestbranding=1",
  //   ].join("");
  div.appendChild(iframe);
  // Another new bit that toggles on/off pointer events to body
  div.addEventListener("mouseout", () => {
    youtubeFocused = false;
    console.log("CANVAS");
    document.getElementsByTagName("body")[0].style.pointerEvents = "auto";
  });

  console.log(div, "===> css object");

  return CSSobject;
}

class CSS3DObject extends Mesh {
  constructor(element, scene) {
    super();
    this.element = element;
    this.element.style.position = "absolute";
    this.element.style.pointerEvents = "auto";
  }
}

class CSS3DRenderer {
  constructor() {
    var matrix = new Matrix();

    this.cache = {
      camera: { fov: 0, style: "" },
      objects: new WeakMap(),
    };

    var domElement = document.createElement("div");
    domElement.style.overflow = "hidden";

    this.domElement = domElement;
    this.cameraElement = document.createElement("div");
    this.isIE =
      !!document["documentMode"] ||
      /Edge/.test(navigator.userAgent) ||
      /Edg/.test(navigator.userAgent);

    if (!this.isIE) {
      this.cameraElement.style.webkitTransformStyle = "preserve-3d";
      this.cameraElement.style.transformStyle = "preserve-3d";
    }
    this.cameraElement.style.pointerEvents = "none";

    domElement.appendChild(this.cameraElement);
  }

  getSize() {
    return {
      width: this.width,
      height: this.height,
    };
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.widthHalf = this.width / 2;
    this.heightHalf = this.height / 2;

    this.domElement.style.width = width + "px";
    this.domElement.style.height = height + "px";

    this.cameraElement.style.width = width + "px";
    this.cameraElement.style.height = height + "px";
  }

  epsilon(value) {
    return Math.abs(value) < 1e-10 ? 0 : value;
  }

  getCameraCSSMatrix(matrix) {
    var elements = matrix.m;

    return (
      "matrix3d(" +
      this.epsilon(elements[0]) +
      "," +
      this.epsilon(-elements[1]) +
      "," +
      this.epsilon(elements[2]) +
      "," +
      this.epsilon(elements[3]) +
      "," +
      this.epsilon(elements[4]) +
      "," +
      this.epsilon(-elements[5]) +
      "," +
      this.epsilon(elements[6]) +
      "," +
      this.epsilon(elements[7]) +
      "," +
      this.epsilon(elements[8]) +
      "," +
      this.epsilon(-elements[9]) +
      "," +
      this.epsilon(elements[10]) +
      "," +
      this.epsilon(elements[11]) +
      "," +
      this.epsilon(elements[12]) +
      "," +
      this.epsilon(-elements[13]) +
      "," +
      this.epsilon(elements[14]) +
      "," +
      this.epsilon(elements[15]) +
      ")"
    );
  }

  getObjectCSSMatrix(matrix, cameraCSSMatrix) {
    var elements = matrix.m;
    var matrix3d =
      "matrix3d(" +
      this.epsilon(elements[0]) +
      "," +
      this.epsilon(elements[1]) +
      "," +
      this.epsilon(elements[2]) +
      "," +
      this.epsilon(elements[3]) +
      "," +
      this.epsilon(-elements[4]) +
      "," +
      this.epsilon(-elements[5]) +
      "," +
      this.epsilon(-elements[6]) +
      "," +
      this.epsilon(-elements[7]) +
      "," +
      this.epsilon(elements[8]) +
      "," +
      this.epsilon(elements[9]) +
      "," +
      this.epsilon(elements[10]) +
      "," +
      this.epsilon(elements[11]) +
      "," +
      this.epsilon(elements[12]) +
      "," +
      this.epsilon(elements[13]) +
      "," +
      this.epsilon(elements[14]) +
      "," +
      this.epsilon(elements[15]) +
      ")";

    if (this.isIE) {
      console.log("isie");
      return (
        "translate(-50%,-50%)" +
        "translate(" +
        this.widthHalf +
        "px," +
        this.heightHalf +
        "px)" +
        cameraCSSMatrix +
        matrix3d
      );
    }
    return "translate(-50%,-50%)" + matrix3d;
  }

  renderObject(object, scene, camera, cameraCSSMatrix) {
    if (object instanceof CSS3DObject) {
      var style;
      var objectMatrixWorld = object.getWorldMatrix().clone();
      var camMatrix = camera.getWorldMatrix();
      var innerMatrix = objectMatrixWorld.m;

      // Set scaling
      const youtubeVideoWidth = 4.8;
      const youtubeVideoHeight = 3.6;

      innerMatrix[0] *= 0.01 / youtubeVideoWidth;
      innerMatrix[2] *= 0.01 / youtubeVideoWidth;
      innerMatrix[5] *= 0.01 / youtubeVideoHeight;

      // Set position from camera
      innerMatrix[12] = -camMatrix.m[12] + object.position.x;
      innerMatrix[13] = -camMatrix.m[13] + object.position.y;
      innerMatrix[14] = camMatrix.m[14] - object.position.z;
      innerMatrix[15] = camMatrix.m[15] * 0.00001;

      objectMatrixWorld = Matrix.FromArray(innerMatrix);
      objectMatrixWorld = objectMatrixWorld.scale(100);
      style = this.getObjectCSSMatrix(objectMatrixWorld, cameraCSSMatrix);
      var element = object.element;
      var cachedObject = this.cache.objects.get(object);

      if (cachedObject === undefined || cachedObject.style !== style) {
        element.style.webkitTransform = style;
        element.style.transform = style;

        var objectData = { style: style };

        this.cache.objects.set(object, objectData);
      }
      if (element.parentNode !== this.cameraElement) {
        this.cameraElement.appendChild(element);
      }
    } else if (object instanceof Scene) {
      for (var i = 0, l = object.meshes.length; i < l; i++) {
        this.renderObject(object.meshes[i], scene, camera, cameraCSSMatrix);
      }
    }
  }

  render(scene, camera) {
    var projectionMatrix = camera.getProjectionMatrix();
    var fov = projectionMatrix.m[5] * this.heightHalf;

    if (this.cache.camera.fov !== fov) {
      if (camera.mode == Camera.PERSPECTIVE_CAMERA) {
        this.domElement.style.webkitPerspective = fov + "px";
        this.domElement.style.perspective = fov + "px";
      } else {
        this.domElement.style.webkitPerspective = "";
        this.domElement.style.perspective = "";
      }
      this.cache.camera.fov = fov;
    }

    if (camera.parent === null) camera.computeWorldMatrix();

    var matrixWorld = camera.getWorldMatrix().clone();
    var rotation = matrixWorld.clone().getRotationMatrix().transpose();
    var innerMatrix = matrixWorld.m;

    innerMatrix[1] = rotation.m[1];
    innerMatrix[2] = -rotation.m[2];
    innerMatrix[4] = -rotation.m[4];
    innerMatrix[6] = -rotation.m[6];
    innerMatrix[8] = -rotation.m[8];
    innerMatrix[9] = -rotation.m[9];

    matrixWorld = Matrix.FromArray(innerMatrix);

    var cameraCSSMatrix =
      "translateZ(" + fov + "px)" + this.getCameraCSSMatrix(matrixWorld);

    var style =
      cameraCSSMatrix +
      "translate(" +
      this.widthHalf +
      "px," +
      this.heightHalf +
      "px)";

    if (this.cache.camera.style !== style && !this.isIE) {
      this.cameraElement.style.webkitTransform = style;
      this.cameraElement.style.transform = style;
      this.cache.camera.style = style;
    }

    this.renderObject(scene, scene, camera, cameraCSSMatrix);
  }
}
