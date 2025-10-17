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
canvas.width = 256;
canvas.height = 256;
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

const strokes: Array<Array<{ x: number; y: number }>> = [];

canvas.addEventListener("mousedown", (event) => {
  cursor.active = true;
  cursor.x = event.offsetX;
  cursor.y = event.offsetY;

  strokes.push([{ x: cursor.x, y: cursor.y }]);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (event) => {
  if (!cursor.active) return;

  const current = strokes[strokes.length - 1];
  if (current) {
    current.push({ x: event.offsetX, y: event.offsetY });
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const onPointerUp = () => {
  cursor.active = false;
};

canvas.addEventListener("mouseup", onPointerUp);
canvas.addEventListener("mouseleave", onPointerUp);

canvas.addEventListener("drawing-changed", () => {
  console.log("Drawing changed");
  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.lineWidth = 2;
  context.lineCap = "round";
  context.strokeStyle = "black";

  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    context.beginPath();
    context.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      context.lineTo(stroke[i].x, stroke[i].y);
    }
    context.stroke();
  }
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
