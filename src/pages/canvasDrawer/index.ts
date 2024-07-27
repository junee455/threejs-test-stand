import "./index.scss";

import { Point2, Line } from "./core/primitives";

import { CanvasDrawer } from "./core/canvasDrawer";

import { Tool, LineTool, PointTool, ErazerTool } from "./core/tools";

window.addEventListener("DOMContentLoaded", () => {
  let drawing = false;

  let prevPoint: Point2 | undefined;
  let distancePassed = 0;

  const drawerElement = document.body;

  const mainCanvasEl = document.getElementById(
    "mainCanvas"
  ) as HTMLCanvasElement | null;

  if (!mainCanvasEl) {
    return;
  }

  let lineDrawer = new CanvasDrawer(mainCanvasEl);

  let currentTool: Tool | undefined;

  let previousListeners: Tool | undefined;

  let customCursorEl = document.getElementById("cursor");

  if (customCursorEl) {
    document.addEventListener("mouseleave", () => {
      customCursorEl.style.display = "none";
    });

    document.addEventListener("mouseenter", () => {
      customCursorEl.style.display = "block";
    });

    document.addEventListener("mousemove", (ev) => {
      customCursorEl.style.top = `${ev.clientY}px`;
      customCursorEl.style.left = `${ev.clientX}px`;
    });
  }

  function addTools() {
    const tools = [
      {
        label: "point",
        tool: new PointTool(lineDrawer),
      },
      {
        label: "line",
        tool: new LineTool(lineDrawer),
      },
      {
        label: "erazer",
        tool: new ErazerTool(lineDrawer),
      },
    ];

    const toolbarEl = document.getElementById("toolbar");

    function switchTool(tool: Tool) {
      if (previousListeners) {
        // remove all previous event listeners

        if (previousListeners.onMouseDown) {
          drawerElement.removeEventListener(
            "mousedown",
            previousListeners.onMouseDown
          );
        }

        if (previousListeners.onMouseUp) {
          drawerElement.removeEventListener(
            "mouseup",
            previousListeners.onMouseUp
          );
        }

        if (previousListeners.onMouseMove) {
          drawerElement.removeEventListener(
            "mousemove",
            previousListeners.onMouseMove
          );
        }
      }

      currentTool = tool;

      previousListeners = {};

      if (currentTool.onMouseDown) {
        previousListeners.onMouseDown =
          currentTool.onMouseDown.bind(currentTool);

        drawerElement.addEventListener(
          "mousedown",
          previousListeners.onMouseDown!
        );
      }

      if (currentTool.onMouseUp) {
        previousListeners.onMouseUp = currentTool.onMouseUp.bind(currentTool);

        drawerElement.addEventListener("mouseup", previousListeners.onMouseUp!);
      }

      if (currentTool.onMouseMove) {
        previousListeners.onMouseMove =
          currentTool.onMouseMove.bind(currentTool);

        drawerElement.addEventListener(
          "mousemove",
          previousListeners.onMouseMove!
        );
      }
    }

    if (!toolbarEl) {
      return;
    }

    tools.forEach((buttonSettings) => {
      const button = document.createElement("button");
      button.innerHTML = buttonSettings.label;
      button.addEventListener("click", () => {
        switchTool(buttonSettings.tool);

        Array.from(toolbarEl.children).forEach((toolButton) => {
          (toolButton as HTMLElement).style.backgroundColor = "white";
        });

        button.style.backgroundColor = "lightgreen";
      });

      toolbarEl.appendChild(button);
    });
  }

  addTools();
});
