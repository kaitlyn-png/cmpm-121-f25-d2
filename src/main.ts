import "./style.css";

document.body.innerHTML = `
  <div id = "main">
    <p id = "header"> Sticker Sketchpad </p>
    <canvas id="cvs"></canvas>
  </div>
`;

const canvas = document.getElementById("cvs") as HTMLCanvasElement;
canvas.id = "cvs";
const context = canvas.getContext("2d");

if (context) {
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
}
