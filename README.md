# 低代码可视化编辑器 (React Low-Code Visual Editor)

一个类似易企秀、稿定设计的在线可视化编辑器，支持通过拖拽和点击方式添加文本、图片、按钮组件，并实时编辑属性。

## 项目简介

本项目采用 **React + TypeScript + Zustand** 技术栈，实现了一个轻量级的可视化页面编辑器核心功能。

### 主要特性

- **拖拽添加组件**：从左侧面板拖拽组件到画布
- **点击添加组件**：点击组件直接添加到画布
- **属性实时编辑**：选中组件后可在右侧面板编辑属性和样式
- **组件类型**：支持文本、图片、按钮三种基础组件

## 技术栈

| 技术 | 用途 |
|------|------|
| React 19 | UI 框架 |
| TypeScript | 类型安全 |
| Zustand | 状态管理 |
| Ant Design | UI 组件库 |
| SCSS | 样式处理 |
| Vite | 构建工具 |

## 项目结构

```
src/
├── components/
│   └── LeftSide/           # 左侧组件选择面板
│       ├── TextSide/       # 文本组件选项
│       ├── ImgSide/        # 图片组件选项
│       └── ButtonSide/     # 按钮组件选项
├── pages/
│   ├── Layout/             # 编辑器布局
│   │   ├── left/           # 左侧导航（文本/图片/按钮分类切换）
│   │   ├── Center/         # 中间画布区域
│   │   └── right/          # 右侧属性编辑面板
│   ├── EditPage/           # 编辑页面入口
│   ├── LoginPage/          # 登录页面
│   └── ListPage/           # 页面列表
├── store/                   # 状态管理
│   ├── editStore.ts        # 编辑器状态管理（Zustand Store）
│   └── editStoreTypes.ts    # 类型定义
└── utils/                   # 工具函数
```

## 核心概念详解

### 1. 数据结构 (editStoreTypes.ts)

编辑器使用统一的数据结构来描述所有组件：

```typescript
// 所有组件的基类，包含共同属性
interface BaseComponent {
  key: number;        // 唯一标识符
  type: number;       // 组件类型：1=文本, 2=图片, 3=按钮
  name: string;       // 组件名称
  style: ComponentStyle;  // CSS 样式对象
}

// 文本组件 - 除了基类属性，还有文本特有的 props
interface TextComponent extends BaseComponent {
  type: 1;
  props: {
    value: string;              // 文本内容
    tag: "h1" | "h2" | "h3" | "p" | "span";  // HTML 标签类型
  };
}

// 图片组件
interface ImageComponent extends BaseComponent {
  type: 2;
  props: {
    src: string;   // 图片地址
    alt: string;   // alt 文字（无图片时显示）
    fit: "cover" | "contain" | "fill";  // 图片填充方式
  };
}

// 按钮组件
interface ButtonComponent extends BaseComponent {
  type: 3;
  props: {
    text: string;              // 按钮文字
    btnType: "primary" | "default" | "dashed" | "text";  // 按钮样式类型
  };
}
```

**为什么这样设计？**

- 使用 `extends` 继承机制，保证所有组件都有 `key`、`type`、`name`、`style`
- 每种组件有独特的 `props`，存放业务相关的属性
- 使用 TypeScript 联合类型 `AnyComponent` 来统一处理不同组件

### 2. 状态管理 (editStore.ts)

使用 Zustand 管理编辑器的全局状态：

```typescript
// 状态结构
interface EditStoreState {
  canvas: ICanvas;           // 画布数据
  selectedComponentKey: number | null;  // 当前选中的组件 key
}

// 操作方法
interface EditStoreAction {
  addCmp: (cmp) => void;          // 添加组件
  deleteCmp: (key: number) => void;  // 删除组件
  updateCmp: (key, data) => void;  // 更新组件（整体）
  updateCmpProps: (key, props) => void;  // 更新组件属性
  updateCmpStyle: (key, style) => void;  // 更新组件样式
  selectCmp: (key) => void;       // 选中组件
}
```

**Zustand + Immer 组合**：
- Zustand 提供简洁的状态管理 API
- Immer 允许直接修改状态对象的深层属性（如 `draft.canvas.cmps.push()`），简化 immutable 更新逻辑

### 3. 左侧组件面板 (LeftSide/)

#### 导航入口 (pages/Layout/left/index.tsx)

```
用户点击: [文本] [图片] [按钮]
              ↓
         切换显示对应组件选择列表
```

- 使用 `useState` 控制当前显示的面板
- 点击画布区域自动收起面板

#### 组件选项卡片

每个组件面板（TextSide、ImgSide、ButtonSide）都遵循相同的模式：

```typescript
// 配置数组 - 定义可添加的组件类型
const settings = [
  {
    name: "标题文本",      // 显示名称
    type: 1,              // 组件类型
    props: {...},         // 组件属性
    style: {...},         // 默认样式
  },
  // ...
];
```

**两种添加方式**：

1. **点击添加**：
   ```typescript
   onClick={() => addCmp({ name, type, props, style })}
   ```

2. **拖拽添加**（需要配合画布的 drop 事件）：
   ```typescript
   onDragStart={(e) => {
     e.dataTransfer.setData("drag-cmp", JSON.stringify(_cmp));
   }}
   ```

### 4. 中间画布 (pages/Layout/Center/index.tsx)

画布是编辑器的核心区域，负责任：

- **渲染组件**：根据 `canvas.cmps` 数组遍历渲染
- **拖拽放置**：监听 `drop` 事件，计算放置位置
- **选中组件**：点击组件时设置 `selectedComponentKey`

**组件渲染逻辑**：

```typescript
function renderComponent(cmp: AnyComponent) {
  switch (cmp.type) {
    case 1: return <TextCmp cmp={cmp} />;
    case 2: return <ImageCmp cmp={cmp} />;
    case 3: return <ButtonCmp cmp={cmp} />;
    default: return null;
  }
}
```

**拖拽放置计算**：

```typescript
const handleDrop = (e: DragEvent) => {
  const data = e.dataTransfer?.getData("drag-cmp");
  if (data) {
    const cmp = JSON.parse(data);
    const rect = canvasEl.getBoundingClientRect();
    const scale = rect.width / canvas.style.width;  // 计算缩放比例
    
    // 计算相对于画布的坐标（考虑缩放）
    const left = (e.clientX - rect.left) / scale;
    const top = (e.clientY - rect.top) / scale;
    
    addCmp({ ...cmp, style: { ...cmp.style, left, top } });
  }
};
```

### 5. 右侧属性面板 (pages/Layout/right/index.tsx)

根据选中的组件类型，渲染不同的编辑表单：

```
选中文本组件 → 显示文本编辑表单（内容、标签、字号、颜色、对齐）
选中图片组件 → 显示图片编辑表单（URL、alt、填充方式、尺寸、圆角）
选中按钮组件 → 显示按钮编辑表单（文字、类型、尺寸、字号）
```

**表单变更处理**：

```typescript
// 更新属性
const handlePropsChange = (key: string, value: any) => {
  updateCmpProps(selectedCmp.key, { [key]: value });
};

// 更新样式
const handleStyleChange = (key: string, value: any) => {
  updateCmpStyle(selectedCmp.key, { [key]: value });
};
```

## 组件类型定义详解

### 组件类型枚举

```typescript
export const ComponentType = {
  TEXT: 1,    // 文本组件
  IMAGE: 2,   // 图片组件
  BUTTON: 3,  // 按钮组件
};
```

### 样式类型 (ComponentStyle)

所有组件共享的 CSS 样式属性：

```typescript
interface ComponentStyle {
  width?: number;           // 宽度
  height?: number;          // 高度
  left?: number;            // 左边距（定位用）
  top?: number;             // 顶边距（定位用）
  position?: "absolute";   // 定位方式（绝对定位）
  backgroundColor?: string; // 背景颜色
  color?: string;           // 文字颜色
  fontSize?: number;       // 字号
  fontWeight?: string;      // 字体粗细
  textAlign?: "left" | "center" | "right";  // 文字对齐
  borderRadius?: number;    // 圆角
  padding?: number;         // 内边距
  opacity?: number;          // 透明度
  // ... 其他样式属性
}
```

## 如何扩展新组件

### 步骤 1：定义组件类型

在 `store/editStoreTypes.ts` 中添加新组件类型：

```typescript
// 添加新的组件类型常量
export const ComponentType = {
  TEXT: 1,
  IMAGE: 2,
  BUTTON: 3,
  VIDEO: 4,  // 新增：视频组件
} as const;

// 定义新组件接口
export interface VideoComponent extends BaseComponent {
  type: typeof ComponentType.VIDEO;
  props: {
    src: string;      // 视频地址
    autoplay: boolean;  // 自动播放
    loop: boolean;      // 循环播放
  };
}

// 更新联合类型
export type AnyComponent = TextComponent | ImageComponent | ButtonComponent | VideoComponent;
```

### 步骤 2：创建组件选项面板

在 `components/LeftSide/` 下创建新文件夹：

```typescript
// components/LeftSide/VideoSide/index.tsx
export default function VideoSide() {
  const addCmp = useEditStore((state) => state.addCmp);
  
  const settings = [
    {
      name: "视频",
      type: 4,  // ComponentType.VIDEO
      props: {
        src: "",
        autoplay: false,
        loop: true,
      },
      style: { width: 320, height: 180, ...defaultCommonStyle },
    },
  ];
  
  // ... 渲染逻辑
}
```

### 步骤 3：在左侧导航中注册

在 `pages/Layout/left/index.tsx` 中：

```typescript
import VideoSide from "@/components/LeftSide/VideoSide";
export const isVideoComponent = 4;

// 在渲染部分添加
{showSide === isVideoComponent && <VideoSide />}
```

### 步骤 4：在画布中渲染

在 `pages/Layout/Center/index.tsx` 中添加渲染逻辑：

```typescript
function VideoCmp({ cmp }: { cmp: VideoComponent }) {
  return (
    <video 
      src={cmp.props.src}
      autoPlay={cmp.props.autoplay}
      loop={cmp.props.loop}
      style={cmp.style}
    />
  );
}

function renderComponent(cmp: AnyComponent) {
  switch (cmp.type) {
    case 4: return <VideoCmp key={cmp.key} cmp={cmp as VideoComponent} />;
    // ... 其他 case
  }
}
```

### 步骤 5：在属性面板中添加编辑功能

在 `pages/Layout/right/index.tsx` 中：

```typescript
function VideoAttributes({ cmp, onChange, onStyleChange }) {
  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>视频</div>
        <Form layout="vertical" size="small">
          <Form.Item label="视频地址">
            <Input 
              value={cmp.props.src}
              onChange={(e) => onChange("src", e.target.value)}
            />
          </Form.Item>
          {/* 其他属性编辑项 */}
        </Form>
      </div>
    </>
  );
}

// 在 Right 组件中添加渲染
{selectedCmp.type === 4 && <VideoAttributes ... />}
```

## 状态更新流程图

```
用户操作                    Store Action           状态更新             视图响应
──────────────────────────────────────────────────────────────────────────────
点击组件选项 ──→ addCmp() ──→ canvas.cmps.push() ──→ 画布显示新组件
拖拽到画布   ──→ addCmp() ──→ canvas.cmps.push() ──→ 画布显示新组件
点击组件     ──→ selectCmp() ──→ selectedComponentKey ──→ 右侧显示属性面板
修改属性     ──→ updateCmpProps() ──→ 组件 props 更新 ──→ 画布实时预览
修改样式     ──→ updateCmpStyle() ──→ 组件 style 更新 ──→ 画布实时预览
删除组件     ──→ deleteCmp() ──→ canvas.cmps.filter() ──→ 画布移除组件
```

## 常见问题

### Q: 为什么使用数字作为组件类型而不是字符串？

性能考虑和易于比较。数字比较比字符串比较更快，也便于 switch-case 语句处理。

### Q: 为什么组件的 key 使用数字而不是字符串？

数字 key 由 `getOnlyKey()` 工具函数生成，确保全局唯一且易于管理和比较。

### Q: 如何实现组件的复制功能？

```typescript
const copyCmp = (cmp: AnyComponent) => {
  const { key, ...rest } = cmp;  // 移除原有 key
  addCmp({ ...rest });           // 添加时会生成新的 key
};
```

### Q: 如何保存编辑结果？

当前版本未实现持久化。可以将 `canvas` 状态序列化为 JSON 存储到后端或 localStorage。

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

## 注意事项

1. **组件唯一性**：每个组件通过 `key` 属性唯一标识，添加组件时自动生成
2. **样式优先级**：组件样式使用 CSS `position: absolute` 实现绝对定位
3. **类型安全**：TypeScript 类型定义确保了数据结构的类型安全

---

> 本项目是一个教学级别的低代码编辑器示例，展示了可视化编辑器的基本原理和实现方式。

---

## 近期更新（未提交变更汇总）

本次变更涉及 **9 个文件**，共 **+858 行 / -105 行**，主要围绕 **UI 美化、画布交互增强、组件选中与拖拽体验** 三个方面进行了大量改进。

### 一、左侧面板 UI 全面美化

**文件**：`src/pages/Layout/left/index.module.scss`、`src/components/LeftSide/index.module.scss`、`src/components/LeftSide/TextSide/index.tsx`、`src/components/LeftSide/ImgSide/index.tsx`、`src/components/LeftSide/ButtonSide/index.tsx`

#### 1. 左侧导航栏重构
- 背景改为 **蓝紫渐变**（`linear-gradient(135deg, #667eea, #764ba2)`），视觉上更有层次感
- 导航按钮改为 **圆形图标 + 文字** 的垂直布局，间距更宽松
- 选中状态增加 **左侧白色指示条** + 按钮背景高亮，明确标识当前分类
- 悬停时按钮有 **轻微上移 + 阴影加深** 的反馈

#### 2. 组件卡片优化
- 卡片改为 **圆角矩形**（`border-radius: 12px`），带轻微阴影
- 每个卡片内部增加 **预览区域**（`.preview`），让组件效果一目了然
- 悬停时卡片 **整体抬升 4px + 阴影扩散**，交互感更强
- 组件列表容器增加 **自定义滚动条**（细滚动条 + 圆角滑块），更精致
- 卡片描述文字改为 **深色加粗标题 + 灰色小字说明**，信息层级更清晰

### 二、画布交互能力大幅增强

**文件**：`src/pages/Layout/Center/index.tsx`、`src/pages/Layout/Center/index.module.scss`、`src/store/editStore.ts`、`src/store/editStoreTypes.ts`

#### 1. 画布缩放系统
在 Store 中新增 `zoom` 状态（默认 100%）和 `setZoom` 方法：
- 顶部工具栏新增 **缩放控制区**：缩小按钮、百分比输入框（25%-200%）、放大按钮、重置按钮
- 支持 **Ctrl + 鼠标滚轮** 快速缩放，滚轮事件通过 `e.deltaY` 以 10% 为步进调整
- 画布通过 CSS `transform: scale(zoom/100)` 实现缩放，`transform-origin: 50% 0` 确保从顶部中心放大

#### 2. 画布尺寸编辑器
新增 `showCanvasSizeEditor` 状态，点击工具栏**画布尺寸**按钮弹出 Modal：
- **预设尺寸卡片**：iPhone SE / iPhone 14 / iPhone 14 Pro Max / iPad Mini / PC 1920，两列网格布局，带设备图标
- 选中状态为 **蓝紫渐变背景 + 白色文字**，悬停有 **边框变色 + 抬升 + 阴影**
- **自定义尺寸输入**：底部一行两个 `InputNumber`，分别输入宽度和高度
- 弹窗标题栏采用 **蓝紫渐变**，与整体风格统一

#### 3. 组件选中边框与 8 点锚点 Resize
新增 `ResizableComponent` 子组件，包裹画布上的每个元素：
- **选中状态**：通过 `::before` 伪元素绘制 **蓝色 2px 边框**（`inset: -2px`），不占用文档流
- **8 个锚点**：四个角（`tl/tr/bl/br`，10px 圆点）+ 四边中点（`tc/bc/ml/mr`）
- 锚点样式：白色填充 + 蓝色边框，悬停 **放大 1.3 倍 + 背景变蓝**
- 锚点光标根据方向设置（`nw-resize`、`n-resize`、`w-resize` 等）

**Resize 核心逻辑**：
- 使用 `useRef` 存储拖拽初始状态（`dragStartRef`），避免闭包不一致导致跳动
- 基于 **初始宽高和位置** 做绝对计算，而非增量累加
- 向右/下拖拽：直接增加 `width` / `height`
- 向左/上拖拽：减少 `width` / `height` 的同时，调整 `left` / `top` 以保持对边不动
- 鼠标位移通过 `(e.clientX - startX) / (zoom/100)` 换算，消除缩放比例影响

**边框与元素偏移修复**：
- 问题：`ResizableComponent` 的 wrapper 和内部组件都设置了 `position: absolute`，wrapper 成为新的定位上下文，导致内部组件实际位置 = wrapper 位置 + 自身 left/top，产生偏移
- 解决：给 `TextCmp`/`ImageCmp`/`ButtonCmp` 增加可选 `style` prop，在选中时强制内部组件在 wrapper 内占满（`left:0, top:0, width:100%, height:100%`），使其与 wrapper 完全重合

#### 4. 组件拖拽移动
在 `ResizableComponent` 中新增 **移动模式**：
- 在组件 wrapper 上监听 `onMouseDown`（锚点阻止冒泡，因此只有点击非锚点区域才触发）
- 使用 `moveStartRef` 记录鼠标起始位置和组件初始 left/top
- `mousemove` 时基于位移更新 `left` 和 `top`，同样除以 `zoom/100` 消除缩放影响
- 与 resize 共用同一套 `mousemove/mouseup` 全局监听，通过 `isMoving` / `isDragging` 状态区分

#### 5. 点击置顶
在 Store 中新增 `moveCmpToTop` action：
- 找到组件在 `canvas.cmps` 中的索引，将其 `splice` 移除后 `push` 到数组末尾
- React 按数组顺序渲染，末尾元素自然覆盖在最上层
- 在 `Center` 中点击组件时，先调用 `moveCmpToTop(key)` 再 `selectCmp(key)`

#### 6. 拖拽放置中心对齐
修改 `handleDrop` 中的坐标计算：
```typescript
const left = (e.clientX - rect.left) / scale - (cmp.style.width || 100) / 2;
const top = (e.clientY - rect.top) / scale - (cmp.style.height || 30) / 2;
```
- 原来：组件左上角对齐鼠标位置
- 现在：减去组件宽高的一半，使**元素中心点精确落在鼠标释放位置**

### 三、Store 类型与状态扩展

**文件**：`src/store/editStoreTypes.ts`、`src/store/editStore.ts`

新增状态和 action：
```typescript
interface EditStoreState {
  zoom: number;                    // 画布缩放比例，默认 100
  showCanvasSizeEditor: boolean;   // 是否显示画布尺寸编辑器
}

interface EditStoreAction {
  setZoom: (zoom: number) => void;
  updateCanvasStyle: (style: Partial<ICanvas["style"]>) => void;
  setShowCanvasSizeEditor: (show: boolean) => void;
  moveCmpToTop: (key: number) => void;
}
```

- `setZoom` 限制范围 **25% - 200%**
- `updateCanvasStyle` 用于更新画布宽度和高度
- `moveCmpToTop` 通过 Immer 直接操作数组顺序，代码简洁

### 四、文件变更清单

| 文件 | 变更说明 |
|------|---------|
| `src/pages/Layout/left/index.module.scss` | 左侧导航栏渐变背景、圆形按钮、选中指示条 |
| `src/components/LeftSide/index.module.scss` | 组件卡片圆角、阴影、悬停动效、自定义滚动条 |
| `src/components/LeftSide/TextSide/index.tsx` | 增加 `.preview` 预览区域包裹 |
| `src/components/LeftSide/ImgSide/index.tsx` | 增加 `.preview` 预览区域包裹 |
| `src/components/LeftSide/ButtonSide/index.tsx` | 增加 `.preview` 预览区域包裹 |
| `src/pages/Layout/Center/index.tsx` | 新增 ResizableComponent、缩放工具栏、画布尺寸 Modal、拖拽移动、点击置顶、中心对齐 drop |
| `src/pages/Layout/Center/index.module.scss` | 选中边框、8 个锚点样式、预设尺寸卡片、Modal 覆盖样式 |
| `src/store/editStore.ts` | 新增 zoom、showCanvasSizeEditor、moveCmpToTop |
| `src/store/editStoreTypes.ts` | 新增对应类型定义 |

---

## 第四轮迭代：撤销重做、多选、右键删除、批量拖拽

### 一、新增功能概述

本轮在画布交互和全局操作层面做了大幅增强：

1. **顶部 Header 栏**：新增全局固定 Header，放置项目标题、撤销/重做按钮。
2. **撤销/重做（Undo/Redo）**：基于历史栈实现，最多保存 50 步画布快照。
3. **选中单个/多个组件**：单击单选，`Ctrl/Cmd + 点击` 多选切换。
4. **右键删除**：右键组件直接删除；若该组件在多选列表中，则批量删除所有选中组件。
5. **多选批量拖拽**：多选状态下拖拽任意一个选中组件，所有选中组件同步移动。

### 二、核心实现细节

#### 1. 撤销/重做与历史栈

**文件**：`src/store/editStore.ts`、`src/store/editStoreTypes.ts`

Store 中新增 `history` 状态：
```typescript
history: {
  past: ICanvas[];    // 已发生的画布快照
  future: ICanvas[];  // 被撤销后可重做的快照
}
```

关键 action：
- `recordHistory()`：将当前 `canvas` 深拷贝（`JSON.parse(JSON.stringify)`）压入 `past`，并清空 `future`。
- `undo()`：从 `past` 弹出上一个快照恢复到 `canvas`，当前状态压入 `future`。
- `redo()`：从 `future` 弹出下一个快照恢复到 `canvas`，当前状态压入 `past`。

自动记录历史的操作（内部自动调用）：
- `addCmp`（从左侧添加组件到画布）
- `deleteCmp`（删除单个组件）
- `deleteSelectedCmps`（批量删除选中的组件）

手动记录历史的操作（调用方在修改前显式调用 `recordHistory`）：
- **拖拽移动/resize**：在 `ResizableComponent` 的 `handleMouseDown` / `handleAnchorMouseDown` 开始时调用，确保 undo 可以撤销整次位移或缩放。
- **属性面板修改**：`Right` 面板中每次修改 props/style 前调用，确保撤销可以还原整次属性变更。

#### 2. 多选逻辑

**文件**：`src/pages/Layout/Center/index.tsx`

Store 中将 `selectedComponentKey: number | null` 重构为 `selectedComponentKeys: number[]`：
- `selectCmp(key, multi)`：当 `multi = true`（即 `Ctrl/Cmd + 点击`）时，切换该 key 在数组中的存在状态；否则替换为单选数组。
- `clearSelection()`：清空数组，用于点击画布空白处。

`ResizableComponent` 的 `onSelect` 改为接收 `e: React.MouseEvent`，根据 `e.ctrlKey || e.metaKey` 判断是否进入多选模式。

#### 3. 右键删除

在 `ResizableComponent` 的 wrapper 上绑定 `onContextMenu`：
```typescript
const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  const { selectedComponentKeys, deleteSelectedCmps, deleteCmp } = useEditStore.getState();
  if (selectedComponentKeys.includes(cmp.key)) {
    deleteSelectedCmps();      // 批量删除
  } else {
    deleteCmp(cmp.key);        // 单删
  }
};
```

#### 4. 多选批量拖拽

**文件**：`src/pages/Layout/Center/index.tsx`

将原来的 `moveStartRef` 扩展为支持记录多个组件的初始位置：
```typescript
moveStartRef.current = {
  x: e.clientX,
  y: e.clientY,
  items: selectedComponentKeys.map(k => {
    const c = canvas.cmps.find(x => x.key === k)!;
    return { key: k, left: c.style.left || 0, top: c.style.top || 0 };
  }),
};
```

`mousemove` 时计算全局位移，通过 `batchUpdateCmpStyle` 一次性更新所有选中组件的 `left/top`：
```typescript
const updates = ms.items.map(item => ({
  key: item.key,
  style: { left: item.left + deltaX, top: item.top + deltaY },
}));
useEditStore.getState().batchUpdateCmpStyle(updates);
```

Store 中新增 `batchUpdateCmpStyle(updates)`，在一次 Immer `set` 中批量修改，只触发一次重渲染。

#### 5. 拖拽与点击的冲突处理

在 `ResizableComponent` 中引入 `hasDraggedRef`：
- `mousedown` 时重置为 `false`。
- `mousemove` 时若位移超过 2px，置为 `true`。
- `click` 事件中若检测到 `hasDraggedRef.current === true`，跳过 `onSelect` 调用，避免拖拽结束后误触发单选/多选切换或置顶。

#### 6. 顶部 Header 组件与布局调整

**文件**：`src/pages/Layout/Header/*`、`src/pages/EditPage/*`、`src/pages/Layout/left/index.module.scss`、`src/pages/Layout/Center/index.module.scss`

- 新建 `Header` 组件，固定定位 `top: 0`，高度 `48px`，渐变背景。
- `EditPage` 改为上下结构：Header + 横向三栏（Left/Center/Right）。
- `Left` 的 `top` 从 `0` 改为 `48px`，高度改为 `calc(100% - 48px)`。
- `Center` 的 `padding-top` 从 `60px` 改为 `108px`，toolbar 的 `top` 从 `60px` 改为 `108px`，`canvasWrapper` 的 `padding-top` 同步改为 `108px`。

#### 7. 属性面板适配多选

**文件**：`src/pages/Layout/right/index.tsx`

- 未选中任何组件：显示"请选择组件"。
- 选中多个组件：显示"已选中 X 个组件"，不展示具体属性。
- 只选中单个组件：正常展示属性面板，且每次修改前调用 `recordHistory()`。

### 三、文件变更清单

| 文件 | 变更说明 |
|------|---------|
| `src/pages/Layout/Header/index.tsx` | **新增** 顶部 Header，含撤销/重做按钮 |
| `src/pages/Layout/Header/index.module.scss` | **新增** Header 固定定位、渐变背景样式 |
| `src/pages/EditPage/index.tsx` | 引入 Header，三栏布局放入 `.main` 容器 |
| `src/pages/EditPage/edit.module.scss` | 改为 flex column 上下结构 |
| `src/pages/Layout/left/index.module.scss` | `top: 48px`，高度避让 Header |
| `src/pages/Layout/Center/index.module.scss` | padding-top、toolbar top、canvasWrapper padding 均增加 48px |
| `src/pages/Layout/Center/index.tsx` | 多选交互、右键删除、批量拖拽、拖拽防误触、单/多选边框 |
| `src/pages/Layout/right/index.tsx` | 适配多选状态显示，属性修改前记录历史 |
| `src/store/editStore.ts` | 新增 history 栈、undo/redo、recordHistory、batchUpdateCmpStyle、deleteSelectedCmps、clearSelection、多选 selectCmp |
| `src/store/editStoreTypes.ts` | 新增对应类型：history、undo、redo、recordHistory、batchUpdateCmpStyle、deleteSelectedCmps、clearSelection |
