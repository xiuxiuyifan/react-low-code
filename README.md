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
