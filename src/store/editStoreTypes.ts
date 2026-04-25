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
}

// ==================== Store 类型 ====================
export interface EditStoreState {
  canvas: ICanvas;
  selectedComponentKey: number | null;
}

export type EditStoreAction = {
  addCmp: (cmp: Omit<AnyComponent, "key">) => void;
  deleteCmp: (key: number) => void;
  updateCmp: (key: number, data: Partial<AnyComponent>) => void;
  updateCmpProps: (key: number, props: Record<string, any>) => void;
  updateCmpStyle: (key: number, style: Partial<ComponentStyle>) => void;
  selectCmp: (key: number | null) => void;
};

export interface IEditStore extends EditStoreState, EditStoreAction {}
