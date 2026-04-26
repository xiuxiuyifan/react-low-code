// ==================== 组件类型枚举 ====================
export const ComponentType = {
  TEXT: 1,
  IMAGE: 2,
  BUTTON: 3,
} as const;

export type ComponentTypeValue = typeof ComponentType[keyof typeof ComponentType];

// ==================== 样式类型 ====================
export interface ComponentStyle {
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  position?: "absolute" | "relative" | "fixed" | "static";
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: string;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  border?: string;
  opacity?: number;
  overflow?: string;
}

// ==================== 基础组件 ====================
export interface BaseComponent {
  key: number;
  type: ComponentTypeValue;
  name: string;
  style: ComponentStyle;
}

// ==================== 文本组件 ====================
export interface TextComponent extends BaseComponent {
  type: typeof ComponentType.TEXT;
  props: {
    value: string;
    tag: "h1" | "h2" | "h3" | "p" | "span";
  };
}

// ==================== 图片组件 ====================
export interface ImageComponent extends BaseComponent {
  type: typeof ComponentType.IMAGE;
  props: {
    src: string;
    alt: string;
    fit: "cover" | "contain" | "fill";
  };
}

// ==================== 按钮组件 ====================
export interface ButtonComponent extends BaseComponent {
  type: typeof ComponentType.BUTTON;
  props: {
    text: string;
    btnType: "default" | "primary" | "dashed" | "text";
    htmlType?: "button" | "submit" | "reset";
  };
}

// ==================== 组件联合类型 ====================
export type AnyComponent = TextComponent | ImageComponent | ButtonComponent;

// ==================== 参考线 ====================
export interface GuideLine {
  key: number;
  direction: 'h' | 'v'; // h=horizontal(横向/Y轴), v=vertical(竖向/X轴)
  position: number;     // h: y坐标, v: x坐标
}

// ==================== 画布 ====================
export interface ICanvas {
  title: string;
  style: {
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImage?: string;
    backgroundPosition?: string;
    backgroundSize?: string;
    backgroundRepeat?: string;
  };
  cmps: AnyComponent[];
  guideLines: GuideLine[];
}

// ==================== Store 类型 ====================
export interface EditStoreState {
  canvas: ICanvas;
  selectedComponentKeys: number[]; // 当前选中的组件 key 列表（支持多选）
  zoom: number;  // 缩放比例，默认 100
  showCanvasSizeEditor: boolean;  // 是否显示画布尺寸编辑器
  history: {
    past: ICanvas[];
    future: ICanvas[];
  };
}

export type EditStoreAction = {
  addCmp: (cmp: Omit<AnyComponent, "key">) => void;
  deleteCmp: (key: number) => void;
  deleteSelectedCmps: () => void; // 删除所有选中的组件
  updateCmp: (key: number, data: Partial<AnyComponent>) => void;
  updateCmpProps: (key: number, props: Record<string, any>) => void;
  updateCmpStyle: (key: number, style: Partial<ComponentStyle>) => void;
  batchUpdateCmpStyle: (updates: { key: number; style: Partial<ComponentStyle> }[]) => void; // 批量更新样式
  selectCmp: (key: number, multi?: boolean) => void; // multi=true 时切换选中状态
  clearSelection: () => void; // 清空选中
  setZoom: (zoom: number) => void;  // 设置缩放比例
  updateCanvasStyle: (style: Partial<ICanvas["style"]>) => void;  // 更新画布尺寸
  setShowCanvasSizeEditor: (show: boolean) => void;  // 显示/隐藏画布尺寸编辑器
  moveCmpToTop: (key: number) => void;  // 将组件移到最顶层
  moveCmpToBottom: (key: number) => void;  // 将组件移到最底层
  moveCmpUp: (key: number) => void;  // 上移一层（数组索引 +1）
  moveCmpDown: (key: number) => void;  // 下移一层（数组索引 -1）
  alignCmp: (key: number, align: "centerX" | "centerY" | "top" | "bottom" | "left" | "right") => void; // 对齐画布
  addGuideLine: (direction: 'h' | 'v') => void; // 添加参考线（默认居中）
  updateGuideLine: (key: number, position: number) => void; // 更新参考线位置
  deleteGuideLine: (key: number) => void; // 删除单条参考线
  clearGuideLines: () => void; // 清除所有参考线
  recordHistory: () => void; // 记录当前画布快照到历史栈
  undo: () => void; // 撤销
  redo: () => void; // 重做
};

export interface IEditStore extends EditStoreState, EditStoreAction {}
