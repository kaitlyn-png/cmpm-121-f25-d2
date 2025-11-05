import "./style.css";

// IMAGE IMPORTS

const trashImg = new URL("./trash.png", import.meta.url).href;
const undoImg = new URL("./undo.png", import.meta.url).href;
const redoImg = new URL("./redo.png", import.meta.url).href;
const thinImg = new URL("./thin.png", import.meta.url).href;
const thickImg = new URL("./thick.png", import.meta.url).href;
const addImg = new URL("./add.png", import.meta.url).href;

// HTML SETUP

document.body.innerHTML = `
  <div id = "main">
    <div id = "sketchpad-container">
      <p id = "header"> Sticker Sketchpad </p>
      <canvas id="cvs"></canvas>
    </div>
    <div id = "buttons-container">
      <button id="clear-button"><img src="${trashImg}"></button>
      <button id="undo-button"><img src="${undoImg}"></button>
      <button id="redo-button"><img src="${redoImg}"></button>
      <button id="thin-marker-button" class="active"><img src="${thinImg}"></button>
      <button id="thick-marker-button"><img src="${thickImg}"></button>
      <button id="add-sticker-button"><img src="${addImg}"></button>
    </div>
    <div id = "sticker-button-container">
    </div>
    <div id = "export-button-container">
      <button id="export-button"> export </button>
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
let currentColor: string = "black"; //default
let isDrawing = false;

const displayList: DrawCommand[] = [];
const redoStack: DrawCommand[] = [];
let toolPreview: DrawCommand | null = null;
let previewRotation: number | null = null;

// COMMANDS

class MarkerLine implements DrawCommand {
  points: Point[] = [];
  fillStyle = "black";
  lineCap: CanvasLineCap = "round";
  strokeStyle = currentColor;
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
  readonly x: number;
  readonly y: number;
  readonly sticker: string;
  readonly rotation: number;

  constructor(x: number, y: number, sticker: string, rotation: number) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
    this.rotation = rotation;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "black";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.sticker, 0, 0);

    ctx.restore();
  }
}

class StickerCommand implements DrawCommand {
  x: number;
  y: number;
  sticker: string;
  rotation: number;

  constructor(x: number, y: number, sticker: string, rotation: number) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
    this.rotation = rotation;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.globalAlpha = 1;
    ctx.fillStyle = "black";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.sticker, 0, 0);

    ctx.restore();
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
      if (previewRotation === null) {
        previewRotation = (Math.random() * 0.25 - 0.125) * Math.PI;
      }
      toolPreview = new StickerPreview(x, y, currentSticker, previewRotation);
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

  const stickerCmd = new StickerCommand(
    x,
    y,
    currentSticker,
    previewRotation ?? 0,
  );
  displayList.push(stickerCmd);

  previewRotation = null;
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

const colorList = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "black",
];

thinMarkerButton.addEventListener("click", () => {
  currentTool = "marker-thin";
  currentLineWidth = 2;

  const stickerCurrent = document.querySelectorAll(".sticker-button");
  stickerCurrent.forEach((button) => button.classList.remove("active"));

  thinMarkerButton.removeAttribute("class");
  thickMarkerButton.removeAttribute("class");

  currentColor = colorList[Math.floor(Math.random() * 7) + 1];
  thinMarkerButton.classList.add(currentColor);

  canvas.dispatchEvent(new Event("tool-moved"));
});

thickMarkerButton.addEventListener("click", () => {
  currentTool = "marker-thick";
  currentLineWidth = 8;

  const stickerCurrent = document.querySelectorAll(".sticker-button");
  stickerCurrent.forEach((button) => button.classList.remove("active"));

  thinMarkerButton.removeAttribute("class");
  thickMarkerButton.removeAttribute("class");

  currentColor = colorList[Math.floor(Math.random() * 7) + 1];
  thickMarkerButton.classList.add(currentColor);

  canvas.dispatchEvent(new Event("tool-moved"));
});

// STICKER BUTTONS

const stickers = ["❤️", "🌸", "🐱"];
const stickerContainer = document.getElementById("sticker-button-container")!;
updateStickers();

// ADDING STICKERS

const addStickerButton = document.getElementById(
  "add-sticker-button",
) as HTMLButtonElement;

addStickerButton.addEventListener("click", () => {
  const addSticker = prompt("What Sticker Do You Want To Add?");

  if (addSticker === null || !addSticker && !(addSticker.trim() !== "")) {
    return;
  } else {
    stickers.push(addSticker);
    updateStickers();
  }
});

// UPDATE STICKERS FUNCTION

function updateStickers() {
  stickers.forEach(() => {
    const removeButton = document.querySelector(".sticker-button");
    removeButton?.remove();
  });
  stickers.forEach((sticker) => {
    const btn = document.createElement("button");
    btn.innerText = sticker;
    btn.classList.add("sticker-button");
    btn.addEventListener("click", () => {
      currentSticker = sticker;
      currentTool = "sticker";
      previewRotation = null;
      const stickerCurrent = document.querySelectorAll(".sticker-button");
      stickerCurrent.forEach((button) => button.classList.remove("active"));
      btn.classList.add("active");
      thinMarkerButton.removeAttribute("class");
      thickMarkerButton.removeAttribute("class");
      canvas.dispatchEvent(new Event("tool-moved"));
    });
    stickerContainer.appendChild(btn);
  });
}

// EXPORT

const exportButton = document.getElementById(
  "export-button",
) as HTMLButtonElement;

exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportContext = exportCanvas.getContext("2d");
  if (!exportContext) {
    return;
  }
  exportContext?.scale(4, 4);
  exportContext.fillStyle = "white";
  exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  displayList.forEach((command) => {
    command.display(exportContext);
  });

  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
});
