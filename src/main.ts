import "./style.css";

document.body.innerHTML = `
  <div id = "main">
    <div id = "sketchpad-container">
      <p id = "header"> Sticker Sketchpad </p>
      <canvas id="cvs"></canvas>
    </div>
    <div id = "buttons-container">
      <button id="clear-button">clear</button>
      <button id="undo-button">undo</button>
      <button id="redo-button">redo</button>
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

interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
}

interface Point {
  x: number;
  y: number;
}

class MarkerLine implements Drawable {
  points: Point[] = [];
  fillStyle = "black";
  lineWidth = 2;
  lineCap: CanvasLineCap = "round";
  strokeStyle = "black";

  constructor(x: number, y: number) {
    this.points.push({ x, y });
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;
    ctx.save();
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = this.lineCap;
    ctx.strokeStyle = this.strokeStyle;

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

const strokes: MarkerLine[] = [];
const redos: MarkerLine[] = [];

canvas.addEventListener("mousedown", (event) => {
  cursor.active = true;
  cursor.x = event.offsetX;
  cursor.y = event.offsetY;

  strokes.push(new MarkerLine(cursor.x, cursor.y));
  redos.splice(0, redos.length);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (event) => {
  if (!cursor.active) return;

  const current = strokes[strokes.length - 1];
  if (current) {
    current.drag(event.offsetX, event.offsetY);
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
  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (const s of strokes) {
    s.display(context);
  }
});

const clearButton = document.getElementById(
  "clear-button",
) as HTMLButtonElement;

const undoButton = document.getElementById(
  "undo-button",
) as HTMLButtonElement;

const redoButton = document.getElementById(
  "redo-button",
) as HTMLButtonElement;

clearButton.addEventListener("click", () => {
  strokes.splice(0, strokes.length);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

undoButton.addEventListener("click", () => {
  if (strokes.length > 0) {
    const s = strokes.pop();
    if (s) {
      redos.push(s);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  }
});

redoButton.addEventListener("click", () => {
  if (redos.length > 0) {
    const r = redos.pop();
    if (r) {
      strokes.push(r);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  }
});
