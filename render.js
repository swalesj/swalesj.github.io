/**
 * Created by Hans Dulimarta.
 */
let modelMat = mat4.create();
let canvas, paramGroup;
var currSelection = 0;
var currRotationAxis = "rotx";
let posAttr, colAttr, modelUnif;
let gl;
let obj;

function main() {
  canvas = document.getElementById("gl-canvas");

  /* setup event listener for drop-down menu */
  let menu = document.getElementById("menu");
  menu.addEventListener("change", menuSelected);

  /* setup click listener for th "insert" button */
  let button = document.getElementById("insert");
  button.addEventListener("click", createObject);

  /* setup click listener for the radio buttons (axis of rotation) */
  let radioGroup = document.getElementsByName("rotateGroup");
  for (let r of radioGroup) {
    r.addEventListener('click', rbClicked);
  }

  paramGroup = document.getElementsByClassName("param-group");
  paramGroup[0].hidden = false;

  /* setup window resize listener */
  window.addEventListener('resize', resizeWindow);

  gl = WebGLUtils.create3DContext(canvas, null);
  ShaderUtils.loadFromFile(gl, "vshader.glsl", "fshader.glsl")
  .then (prog => {

    /* put all one-time initialization logic here */
    gl.useProgram (prog);
    gl.clearColor (0, 0, 0, 1);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    /* the vertex shader defines TWO attribute vars and ONE uniform var */
    posAttr = gl.getAttribLocation (prog, "vertexPos");
    colAttr = gl.getAttribLocation (prog, "vertexCol");
    modelUnif = gl.getUniformLocation (prog, "modelCF");
    gl.enableVertexAttribArray (posAttr);
    gl.enableVertexAttribArray (colAttr);
    gl.enable (gl.DEPTH_TEST);

    /* calculate viewport */
    resizeWindow();

    /* initiate the render loop */
    render();
  });
}

function drawScene() {
  gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

  /* in the following three cases we rotate the coordinate frame by 1 degree */
  switch (currRotationAxis) {
    case "rotx":
      mat4.rotateX(modelMat, modelMat, Math.PI / 180);
      mat4.rotateZ(modelMat, modelMat, Math.PI / 180);
      mat4.rotateY(modelMat, modelMat, Math.PI / 180);
      break;
    case "roty":
      mat4.rotateY(modelMat, modelMat, Math.PI / 180);
      break;
    case "rotz":
      mat4.rotateZ(modelMat, modelMat, Math.PI / 180);
  }

  if (obj) {
    obj.draw(posAttr, colAttr, modelUnif, modelMat);
  }
}

function render() {
  drawScene();
  requestAnimationFrame(render);
}

function createObject() {
  obj = null;
  mat4.identity(modelMat);
  switch (currSelection) {
    case 0:
      let coneheight = document.getElementById("cone-height").valueAsNumber;
      let coneradius = document.getElementById("cone-radius").valueAsNumber;
      let subDiv = document.getElementById("cone-subdiv").valueAsNumber;
      let vertSubDiv = document.getElementById("cone-vertsubdiv").valueAsNumber;
      console.log ("Cylinder radius: " + coneradius + " height: " + coneheight + " sub division: " + subDiv + " vertical sub division: " + vertSubDiv);
      obj = new Cone(gl, coneradius, coneheight, subDiv, vertSubDiv);
      break;
    case 1:
      let cylinderheight = document.getElementById("cylinder-height").valueAsNumber;
      let topRadius = document.getElementById("cylinder-topradius").valueAsNumber;
      let bottomRadius = document.getElementById("cylinder-bottomradius").valueAsNumber;
      let radSubDiv = document.getElementById("cylinder-subdiv").valueAsNumber;
      let cylindervertSubDiv = document.getElementById("cylinder-vertsubdiv").valueAsNumber;
      obj = new Cylinder(gl, cylinderheight, topRadius, bottomRadius, radSubDiv, cylindervertSubDiv);
      break;
    case 2:
      let width = document.getElementById("cube-width").valueAsNumber;
      let height = document.getElementById("cube-height").valueAsNumber;
      let depth = document.getElementById("cube-depth").valueAsNumber;
      console.log ("Cube width: " + width + " height: " + height + " depth: " + depth);
      obj = new Cube(gl, width, height, depth);
      break;
    case 3:
      let sphereRadius = document.getElementById("sphere-radius").valueAsNumber;
      let sphereSubDiv = document.getElementById("sphere-subdiv").valueAsNumber;
      let sphereVertStacks = document.getElementById("sphere-vertstacks").valueAsNumber;
      console.log ("Sphere radius: " + sphereRadius + " sub divisions: " + sphereSubDiv);
      obj = new Sphere(gl, sphereRadius, sphereSubDiv, sphereVertStacks);
      break;
    case 4:
      break;
    case 5:
      let torusIn = document.getElementById("torus-inradius").valueAsNumber;
      let torusOut = document.getElementById("torus-outradius").valueAsNumber;
      let torusSubDiv = document.getElementById("torus-subdiv").valueAsNumber;
      let torusSubSubDiv = document.getElementById("torus-subsubdiv").valueAsNumber;
      console.log ("Torus outer radius: " + torusOut + " inner radius: " + torusIn + " sub divisions: " + torusSubDiv + " sub division sub divisions: " + torusSubSubDiv);
      obj = new Torus(gl, torusOut, torusIn, torusSubDiv, torusSubSubDiv);
      break;
    case 6:
      let ringIn = document.getElementById("ring-inradius").valueAsNumber;
      let ringOut = document.getElementById("ring-outradius").valueAsNumber;
      let ringHeight = document.getElementById("ring-height").valueAsNumber;
      let ringStacks = document.getElementById("ring-stacks").valueAsNumber;
      console.log ("Ring inner radius: " + ringIn + " outer radius: " + ringOut + " height: " + ringHeight + " vertical stacks: " + ringStacks);
      obj = new Ring(gl, ringIn, ringOut, ringHeight, ringStacks);
      break;
  }
}

function resizeWindow() {
  let w = 0.98 * window.innerWidth;
  let h = 0.6 * window.innerHeight;
  let size = Math.min(0.98 * window.innerWidth, 0.65 * window.innerHeight);
  /* keep a square viewport */
  canvas.width = size;
  canvas.height = size;
  gl.viewport(0, 0, size, size);
}

function menuSelected(ev) {
  let sel = ev.currentTarget.selectedIndex;
  paramGroup[currSelection].hidden = true;
  paramGroup[sel].hidden = false;
  currSelection = sel;
  console.log("New selection is ", currSelection);
}

function rbClicked(ev) {
  currRotationAxis = ev.currentTarget.value;
  console.log(ev);
}