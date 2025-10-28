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
    <div id = "marker-buttons-container">
      <button id="thin-marker-button" class="active">thin marker</button>
      <button id="thick-marker-button">thick marker</button>
    </div>
    <div id = "sticker-button-container"></div>
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

// INTERFACES

interface DrawCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

interface Point {
  x: number;
  y: number;
}

let currentLineWidth = 2;

// TOOLS

type Tool = "marker-thin" | "marker-thick" | "sticker";
let currentTool: Tool = "marker-thin"; // default
let currentSticker: string = "❤️";
let isDrawing = false;

const displayList: DrawCommand[] = []; // everything to be drawn
const redoStack: DrawCommand[] = [];
let toolPreview: DrawCommand | null = null;

// COMMANDS

class MarkerLine implements DrawCommand {
  points: Point[] = [];
  fillStyle = "black";
  lineCap: CanvasLineCap = "round";
  strokeStyle = "black";
  linewidth: number = 2; //default line width

  constructor(x: number, y: number, lineWidth: number) {
    this.points.push({ x, y });
    this.linewidth = lineWidth;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;
    ctx.save();
    ctx.lineWidth = this.linewidth;
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

class StickerPreview implements DrawCommand {
  x: number;
  y: number;
  sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.sticker, this.x, this.y);
    ctx.restore();
  }
}

class StickerCommand implements DrawCommand {
  x: number;
  y: number;
  sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = 1;
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

// RENDER FUNCTION

function render() {
  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);

  displayList.forEach((cmd) => cmd.display(context));

  if (toolPreview && !isDrawing) {
    toolPreview.display(context);
  }
}

canvas.addEventListener("tool-moved", render);
canvas.addEventListener("drawing-changed", render);

// EVENT HANDLERS

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousedown", (event) => {
  if (currentTool == "sticker") {
    return;
  }

  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const lineWidth = currentTool === "marker-thick" ? 8 : 2;
  const lineCmd = new MarkerLine(x, y, lineWidth);
  displayList.push(lineCmd);
  redoStack.length = 0;

  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (!isDrawing) {
    if (currentTool === "sticker") {
      toolPreview = new StickerPreview(x, y, currentSticker);
    }
    canvas.dispatchEvent(new Event("tool-moved"));
    return;
  }

  const lastCmd = displayList[displayList.length - 1];
  if (lastCmd instanceof MarkerLine) {
    lastCmd.drag(x, y);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("click", (event) => {
  if (currentTool !== "sticker") {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const stickerCmd = new StickerCommand(x, y, currentSticker);
  displayList.push(stickerCmd);

  toolPreview = null;

  canvas.dispatchEvent(new Event("drawing-changed"));
  canvas.dispatchEvent(new Event("tool-moved"));
});


const sketchpad = document.getElementById(
  "sketchpad-container",
) as HTMLDivElement;

// FOR UPDATING CURSOR STYLE --> PROBABLY CAN BE REFRACTORED

canvas.addEventListener("tool-moved", () => {
  if (currentLineWidth === 2) {
    sketchpad.classList.add("thin-marker");
  } else {
    sketchpad.classList.remove("thin-marker");
  }
  if (currentLineWidth === 8) {
    sketchpad.classList.add("thick-marker");
  } else {
    sketchpad.classList.remove("thick-marker");
  }

  if (currentTool === "sticker") {
    sketchpad.classList.add("sticker-marker");
  } else {
    sketchpad.classList.remove("sticker-marker");
  }
});

// BUTTONS

const clearButton = document.getElementById(
  "clear-button",
) as HTMLButtonElement;

const undoButton = document.getElementById(
  "undo-button",
) as HTMLButtonElement;

const redoButton = document.getElementById(
  "redo-button",
) as HTMLButtonElement;

const thinMarkerButton = document.getElementById(
  "thin-marker-button",
) as HTMLButtonElement;

const thickMarkerButton = document.getElementById(
  "thick-marker-button",
) as HTMLButtonElement;

clearButton.addEventListener("click", () => {
  displayList.splice(0, displayList.length);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

undoButton.addEventListener("click", () => {
  if (displayList.length > 0) {
    const s = displayList.pop();
    if (s) {
      redoStack.push(s);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const r = redoStack.pop();
    if (r) {
      displayList.push(r);
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  }
});

thinMarkerButton.addEventListener("click", () => {
  currentTool = "marker-thin";
  currentLineWidth = 2;
  thinMarkerButton.classList.add("active");
  thickMarkerButton.classList.remove("active");
  canvas.dispatchEvent(new Event("tool-moved"));
});

thickMarkerButton.addEventListener("click", () => {
  currentTool = "marker-thick";
  currentLineWidth = 8;
  thickMarkerButton.classList.add("active");
  thinMarkerButton.classList.remove("active");
  canvas.dispatchEvent(new Event("tool-moved"));
});

// STICKER BUTTONS

const stickers = ["❤️", "🌸", "🐱"];
const stickerContainer = document.getElementById("sticker-button-container")!;

stickers.forEach((sticker) => {
  const btn = document.createElement("button");
  btn.innerText = sticker;
  btn.classList.add("sticker-button");
  btn.addEventListener("click", () => {
    currentSticker = sticker;
    currentTool = "sticker";
    thinMarkerButton.classList.remove("active");
    thickMarkerButton.classList.remove("active");
    canvas.dispatchEvent(new Event("tool-moved"));
  });
  stickerContainer.appendChild(btn);
});
