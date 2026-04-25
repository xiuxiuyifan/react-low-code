import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { EditStoreState, EditStoreAction, ICanvas, AnyComponent } from "./editStoreTypes";
import { getOnlyKey } from "@/utils";

const useEditStore = create(
  immer<EditStoreState & EditStoreAction>((set) => ({
    canvas: getDefaultCanvas(),
    selectedComponentKey: null,

    addCmp: (cmp) => {
      set((draft) => {
        draft.canvas.cmps.push({ ...cmp, key: getOnlyKey() } as AnyComponent);
      });
    },

    deleteCmp: (key) => {
      set((draft) => {
        draft.canvas.cmps = draft.canvas.cmps.filter((c) => c.key !== key);
        if (draft.selectedComponentKey === key) {
          draft.selectedComponentKey = null;
        }
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

    selectCmp: (key) => {
      set((draft) => {
        draft.selectedComponentKey = key;
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
