import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { EditStoreState, EditStoreAction, ICanvas, AnyComponent } from "./editStoreTypes";
import { getOnlyKey } from "@/utils";

const MAX_HISTORY = 50;

const useEditStore = create(
  immer<EditStoreState & EditStoreAction>((set) => ({
    canvas: getDefaultCanvas(),
    selectedComponentKeys: [],
    zoom: 100,
    showCanvasSizeEditor: false,
    history: { past: [], future: [] },

    recordHistory: () => {
      set((draft) => {
        draft.history.past.push(JSON.parse(JSON.stringify(draft.canvas)) as ICanvas);
        if (draft.history.past.length > MAX_HISTORY) draft.history.past.shift();
        draft.history.future = [];
      });
    },

    undo: () => {
      set((draft) => {
        const previous = draft.history.past.pop();
        if (previous) {
          draft.history.future.push(JSON.parse(JSON.stringify(draft.canvas)) as ICanvas);
          draft.canvas = previous;
          draft.selectedComponentKeys = [];
        }
      });
    },

    redo: () => {
      set((draft) => {
        const next = draft.history.future.pop();
        if (next) {
          draft.history.past.push(JSON.parse(JSON.stringify(draft.canvas)) as ICanvas);
          draft.canvas = next;
          draft.selectedComponentKeys = [];
        }
      });
    },

    addCmp: (cmp) => {
      set((draft) => {
        draft.history.past.push(JSON.parse(JSON.stringify(draft.canvas)) as ICanvas);
        if (draft.history.past.length > MAX_HISTORY) draft.history.past.shift();
        draft.history.future = [];
        draft.canvas.cmps.push({ ...cmp, key: getOnlyKey() } as AnyComponent);
      });
    },

    deleteCmp: (key) => {
      set((draft) => {
        draft.history.past.push(JSON.parse(JSON.stringify(draft.canvas)) as ICanvas);
        if (draft.history.past.length > MAX_HISTORY) draft.history.past.shift();
        draft.history.future = [];
        draft.canvas.cmps = draft.canvas.cmps.filter((c) => c.key !== key);
        draft.selectedComponentKeys = draft.selectedComponentKeys.filter((k) => k !== key);
      });
    },

    deleteSelectedCmps: () => {
      set((draft) => {
        if (draft.selectedComponentKeys.length === 0) return;
        draft.history.past.push(JSON.parse(JSON.stringify(draft.canvas)) as ICanvas);
        if (draft.history.past.length > MAX_HISTORY) draft.history.past.shift();
        draft.history.future = [];
        draft.canvas.cmps = draft.canvas.cmps.filter((c) => !draft.selectedComponentKeys.includes(c.key));
        draft.selectedComponentKeys = [];
      });
    },

    updateCmp: (key, data) => {
      set((draft) => {
        const cmp = draft.canvas.cmps.find((c) => c.key === key);
        if (cmp) {
          Object.assign(cmp, data);
        }
      });
    },

    updateCmpProps: (key, props) => {
      set((draft) => {
        const cmp = draft.canvas.cmps.find((c) => c.key === key);
        if (cmp) {
          (cmp as any).props = { ...(cmp as any).props, ...props };
        }
      });
    },

    updateCmpStyle: (key, style) => {
      set((draft) => {
        const cmp = draft.canvas.cmps.find((c) => c.key === key);
        if (cmp) {
          cmp.style = { ...cmp.style, ...style };
        }
      });
    },

    batchUpdateCmpStyle: (updates) => {
      set((draft) => {
        updates.forEach(({ key, style }) => {
          const cmp = draft.canvas.cmps.find((c) => c.key === key);
          if (cmp) {
            cmp.style = { ...cmp.style, ...style };
          }
        });
      });
    },

    selectCmp: (key, multi = false) => {
      set((draft) => {
        if (multi) {
          const idx = draft.selectedComponentKeys.indexOf(key);
          if (idx > -1) {
            draft.selectedComponentKeys.splice(idx, 1);
          } else {
            draft.selectedComponentKeys.push(key);
          }
        } else {
          draft.selectedComponentKeys = [key];
        }
      });
    },

    clearSelection: () => {
      set((draft) => {
        draft.selectedComponentKeys = [];
      });
    },

    setZoom: (zoom) => {
      set((draft) => {
        draft.zoom = Math.max(25, Math.min(200, zoom));  // 限制范围 25%-200%
      });
    },

    updateCanvasStyle: (style) => {
      set((draft) => {
        draft.canvas.style = { ...draft.canvas.style, ...style };
      });
    },

    setShowCanvasSizeEditor: (show) => {
      set((draft) => {
        draft.showCanvasSizeEditor = show;
      });
    },

    moveCmpToTop: (key) => {
      set((draft) => {
        const idx = draft.canvas.cmps.findIndex((c) => c.key === key);
        if (idx > -1 && idx < draft.canvas.cmps.length - 1) {
          const [cmp] = draft.canvas.cmps.splice(idx, 1);
          draft.canvas.cmps.push(cmp);
        }
      });
    },

    moveCmpToBottom: (key) => {
      set((draft) => {
        const idx = draft.canvas.cmps.findIndex((c) => c.key === key);
        if (idx > 0) {
          const [cmp] = draft.canvas.cmps.splice(idx, 1);
          draft.canvas.cmps.unshift(cmp);
        }
      });
    },

    moveCmpUp: (key) => {
      set((draft) => {
        const idx = draft.canvas.cmps.findIndex((c) => c.key === key);
        if (idx > -1 && idx < draft.canvas.cmps.length - 1) {
          const temp = draft.canvas.cmps[idx];
          draft.canvas.cmps[idx] = draft.canvas.cmps[idx + 1];
          draft.canvas.cmps[idx + 1] = temp;
        }
      });
    },

    moveCmpDown: (key) => {
      set((draft) => {
        const idx = draft.canvas.cmps.findIndex((c) => c.key === key);
        if (idx > 0) {
          const temp = draft.canvas.cmps[idx];
          draft.canvas.cmps[idx] = draft.canvas.cmps[idx - 1];
          draft.canvas.cmps[idx - 1] = temp;
        }
      });
    },

    alignCmp: (key, align) => {
      set((draft) => {
        const cmp = draft.canvas.cmps.find((c) => c.key === key);
        if (!cmp) return;
        const cw = draft.canvas.style.width;
        const ch = draft.canvas.style.height;
        const w = cmp.style.width || 0;
        const h = cmp.style.height || 0;
        switch (align) {
          case "centerX":
            cmp.style.left = (cw - w) / 2;
            break;
          case "centerY":
            cmp.style.top = (ch - h) / 2;
            break;
          case "top":
            cmp.style.top = 0;
            break;
          case "bottom":
            cmp.style.top = ch - h;
            break;
          case "left":
            cmp.style.left = 0;
            break;
          case "right":
            cmp.style.left = cw - w;
            break;
        }
      });
    },
  }))
);

export default useEditStore;

function getDefaultCanvas(): ICanvas {
  return {
    title: "未命名",
    style: {
      width: 375,
      height: 667,
      backgroundColor: "#ffffff",
      backgroundImage: "",
      backgroundPosition: "center",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
    },
    cmps: [],
  };
}
