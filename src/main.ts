import "./style.css";

document.body.innerHTML = `
  <div id = "main">
    <div id = "sketchpad-container">
      <p id = "header"> Sticker Sketchpad </p>
      <canvas id="cvs"></canvas>
    </div>
    <div id = "buttons-container">
      <button id="clear-button">clear</button>
    </div>
  </div>
`;

const canvas = document.getElementById("cvs") as HTMLCanvasElement;
canvas.id = "cvs";
const context = canvas.getContext("2d");

if (context) {
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
}

const cursor = {
  active: false,
  x: 0,
  y: 0,
};

canvas.addEventListener("mousedown", (event) => {
  cursor.active = true;
  cursor.x = event.offsetX;
  cursor.y = event.offsetY;
});

canvas.addEventListener("mousemove", (event) => {
  if (cursor.active && context) {
    context.beginPath();
    context.moveTo(cursor.x, cursor.y);
    context.lineTo(event.offsetX, event.offsetY);
    context.stroke();
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;
    context.lineWidth = 2;
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});

const clearButton = document.getElementById(
  "clear-button",
) as HTMLButtonElement;

clearButton.addEventListener("click", () => {
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
});
