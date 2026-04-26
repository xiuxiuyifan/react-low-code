import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button, InputNumber, Modal, message } from "antd";
import { ZoomInOutlined, ZoomOutOutlined } from "@ant-design/icons";
import useEditStore from "@/store/editStore";
import type { AnyComponent, TextComponent, ImageComponent, ButtonComponent } from "@/store/editStoreTypes";
import styles from "./index.module.scss";

// 计算附近组件（基于中心点距离，阈值 200px）
function getNearbyCmps(currentCmp: AnyComponent, allCmps: AnyComponent[], threshold = 200) {
  const cx = (currentCmp.style.left || 0) + (currentCmp.style.width || 0) / 2;
  const cy = (currentCmp.style.top || 0) + (currentCmp.style.height || 0) / 2;

  return allCmps
    .filter((c) => c.key !== currentCmp.key)
    .map((c) => {
      const ox = (c.style.left || 0) + (c.style.width || 0) / 2;
      const oy = (c.style.top || 0) + (c.style.height || 0) / 2;
      const dist = Math.sqrt((cx - ox) ** 2 + (cy - oy) ** 2);
      return { cmp: c, dist };
    })
    .filter((item) => item.dist < threshold)
    .sort((a, b) => a.dist - b.dist)
    .map((item) => item.cmp);
}

// 吸附计算
// thresholdShow = 12: 差值小于 12px 时显示吸附线
// thresholdSnap = 3:  差值小于 3px 时自动对齐吸附
interface SnapResult {
  deltaX: number;
  deltaY: number;
  linesH: number[];
  linesV: number[];
}

function calcSnap(
  cmp: AnyComponent,
  rawLeft: number,
  rawTop: number,
  canvas: { width: number; height: number },
  otherCmps: AnyComponent[],
  thresholdShow = 12,
  thresholdSnap = 3
): SnapResult {
  const w = cmp.style.width || 0;
  const h = cmp.style.height || 0;
  const rawRight = rawLeft + w;
  const rawBottom = rawTop + h;
  const rawCenterX = rawLeft + w / 2;
  const rawCenterY = rawTop + h / 2;

  const vTargets = [0, canvas.width / 2, canvas.width];
  const hTargets = [0, canvas.height / 2, canvas.height];

  otherCmps.forEach((c) => {
    const cw2 = c.style.width || 0;
    const ch2 = c.style.height || 0;
    const cl = c.style.left || 0;
    const ct = c.style.top || 0;
    vTargets.push(cl, cl + cw2 / 2, cl + cw2);
    hTargets.push(ct, ct + ch2 / 2, ct + ch2);
  });

  // 统一搜索：先找 12px 内最佳线，再判断是否 <= 3px 进行吸附
  // 这样吸附线显示的位置和实际吸附的位置始终是同一个目标
  let showX: { line: number; diff: number } | null = null;
  for (const val of [rawLeft, rawCenterX, rawRight]) {
    for (const target of vTargets) {
      const diff = target - val;
      if (Math.abs(diff) <= thresholdShow) {
        if (!showX || Math.abs(diff) < Math.abs(showX.diff)) {
          showX = { line: target, diff };
        }
      }
    }
  }

  let showY: { line: number; diff: number } | null = null;
  for (const val of [rawTop, rawCenterY, rawBottom]) {
    for (const target of hTargets) {
      const diff = target - val;
      if (Math.abs(diff) <= thresholdShow) {
        if (!showY || Math.abs(diff) < Math.abs(showY.diff)) {
          showY = { line: target, diff };
        }
      }
    }
  }

  return {
    deltaX: showX && Math.abs(showX.diff) <= thresholdSnap ? showX.diff : 0,
    deltaY: showY && Math.abs(showY.diff) <= thresholdSnap ? showY.diff : 0,
    linesH: showY ? [showY.line] : [],
    linesV: showX ? [showX.line] : [],
  };
}

// 可调整大小的组件包装
function ResizableComponent({
  cmp,
  isSelected,
  onSelect,
  onResize,
  zoom,
  onSnapChange,
}: {
  cmp: AnyComponent;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onResize: (key: number, delta: { width?: number; height?: number; left?: number; top?: number }) => void;
  zoom: number;
  onSnapChange?: (lines: { h: number[]; v: number[] }) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
  const moveStartRef = useRef<{ x: number; y: number; items: { key: number; left: number; top: number }[] }>({
    x: 0,
    y: 0,
    items: [],
  });
  const [resizeDirection, setResizeDirection] = useState<string>("");
  const hasDraggedRef = useRef(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });
  const [nearbyCmps, setNearbyCmps] = useState<AnyComponent[]>([]);

  // 右键弹出菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 先触发 document click 关闭其他组件的菜单
    document.dispatchEvent(new MouseEvent("click"));
    const { canvas } = useEditStore.getState();
    setNearbyCmps(getNearbyCmps(cmp, canvas.cmps));
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  }, [cmp]);

  // 执行删除
  const handleDeleteFromMenu = useCallback(() => {
    const { selectedComponentKeys, deleteSelectedCmps, deleteCmp } = useEditStore.getState();
    if (selectedComponentKeys.includes(cmp.key) && selectedComponentKeys.length > 1) {
      deleteSelectedCmps();
      message.success(`已删除 ${selectedComponentKeys.length} 个选中的组件`);
    } else {
      deleteCmp(cmp.key);
      message.success("已删除组件");
    }
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [cmp.key]);

  // 层级操作
  const handleMoveToTop = useCallback(() => {
    useEditStore.getState().moveCmpToTop(cmp.key);
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [cmp.key]);

  const handleMoveToBottom = useCallback(() => {
    useEditStore.getState().moveCmpToBottom(cmp.key);
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [cmp.key]);

  const handleMoveUp = useCallback(() => {
    useEditStore.getState().moveCmpUp(cmp.key);
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [cmp.key]);

  const handleMoveDown = useCallback(() => {
    useEditStore.getState().moveCmpDown(cmp.key);
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [cmp.key]);

  const handleAlign = useCallback((align: "centerX" | "centerY" | "top" | "bottom" | "left" | "right") => {
    useEditStore.getState().recordHistory();
    useEditStore.getState().alignCmp(cmp.key, align);
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [cmp.key]);

  // 点击外部关闭菜单
  useEffect(() => {
    if (!contextMenu.visible) return;
    const handleDocClick = () => setContextMenu({ visible: false, x: 0, y: 0 });
    const timer = setTimeout(() => document.addEventListener("click", handleDocClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleDocClick);
    };
  }, [contextMenu.visible]);

  // 点击选中（拖拽时不触发）
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (hasDraggedRef.current) {
        hasDraggedRef.current = false;
        return;
      }
      onSelect(e);
    },
    [onSelect]
  );

  // 拖拽移动（点击非锚点区域）
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      hasDraggedRef.current = false;
      useEditStore.getState().recordHistory();

      const { selectedComponentKeys } = useEditStore.getState();
      const isMulti = isSelected && selectedComponentKeys.length > 1;

      if (isMulti) {
        const { canvas } = useEditStore.getState();
        moveStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          items: selectedComponentKeys.map((k) => {
            const c = canvas.cmps.find((x) => x.key === k)!;
            return { key: k, left: c.style.left || 0, top: c.style.top || 0 };
          }),
        };
      } else {
        moveStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          items: [{ key: cmp.key, left: cmp.style.left || 0, top: cmp.style.top || 0 }],
        };
      }
      setIsMoving(true);
    },
    [isSelected, cmp]
  );

  // 拖拽锚点调整大小
  const handleAnchorMouseDown = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.preventDefault();
      e.stopPropagation();
      hasDraggedRef.current = false;
      useEditStore.getState().recordHistory();

      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: cmp.style.width || 100,
        height: cmp.style.height || 30,
        left: cmp.style.left || 0,
        top: cmp.style.top || 0,
      };
      setResizeDirection(direction);
      setIsDragging(true);
    },
    [cmp]
  );

  useEffect(() => {
    if (!isDragging && !isMoving) return;

    const startX = isMoving ? moveStartRef.current.x : dragStartRef.current.x;
    const startY = isMoving ? moveStartRef.current.y : dragStartRef.current.y;

    const handleMouseMove = (e: MouseEvent) => {
      const scale = zoom / 100;

      if (Math.abs(e.clientX - startX) > 2 || Math.abs(e.clientY - startY) > 2) {
        hasDraggedRef.current = true;
      }

      // 拖拽移动（支持单选/多选批量移动）
      if (isMoving) {
        const ms = moveStartRef.current;
        let deltaX = (e.clientX - ms.x) / scale;
        let deltaY = (e.clientY - ms.y) / scale;

        // 单选时启用吸附
        if (ms.items.length === 1) {
          const state = useEditStore.getState();
          const { canvas } = state;
          const firstItem = ms.items[0];
          const firstCmp = canvas.cmps.find((c) => c.key === firstItem.key);
          if (firstCmp) {
            const rawLeft = firstItem.left + deltaX;
            const rawTop = firstItem.top + deltaY;
            const snap = calcSnap(
              firstCmp,
              rawLeft,
              rawTop,
              { width: canvas.style.width, height: canvas.style.height },
              canvas.cmps.filter((c) => c.key !== firstCmp.key)
            );
            deltaX += snap.deltaX;
            deltaY += snap.deltaY;
            onSnapChange?.({ h: snap.linesH, v: snap.linesV });
          }
        } else {
          onSnapChange?.({ h: [], v: [] });
        }

        const updates = ms.items.map((item) => ({
          key: item.key,
          style: { left: item.left + deltaX, top: item.top + deltaY },
        }));
        useEditStore.getState().batchUpdateCmpStyle(updates);
        return;
      }

      // 拖拽调整大小
      const ds = dragStartRef.current;
      const deltaX = (e.clientX - ds.x) / scale;
      const deltaY = (e.clientY - ds.y) / scale;

      const newStyle: { width?: number; height?: number; left?: number; top?: number } = {};

      if (resizeDirection.includes("r")) {
        newStyle.width = Math.max(20, ds.width + deltaX);
      }
      if (resizeDirection.includes("l")) {
        const newWidth = Math.max(20, ds.width - deltaX);
        newStyle.width = newWidth;
        newStyle.left = ds.left + (ds.width - newWidth);
      }
      if (resizeDirection.includes("b")) {
        newStyle.height = Math.max(20, ds.height + deltaY);
      }
      if (resizeDirection.includes("t")) {
        const newHeight = Math.max(20, ds.height - deltaY);
        newStyle.height = newHeight;
        newStyle.top = ds.top + (ds.height - newHeight);
      }

      onResize(cmp.key, newStyle);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setResizeDirection("");
      setIsMoving(false);
      onSnapChange?.({ h: [], v: [] });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isMoving, cmp, onResize, zoom, resizeDirection, onSnapChange]);

  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    left: cmp.style.left,
    top: cmp.style.top,
    width: cmp.style.width,
    height: cmp.style.height,
  };

  const innerStyle: React.CSSProperties = {
    ...cmp.style,
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
  };

  const handleSelectNearby = useCallback((key: number) => {
    useEditStore.getState().selectCmp(key, false);
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  const menuContent = (
    <>
      {contextMenu.visible &&
        createPortal(
          <div
            className={styles.contextMenu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.menuItem} onClick={handleMoveToTop}>置顶</div>
            <div className={styles.menuItem} onClick={handleMoveToBottom}>置底</div>
            <div className={styles.menuItem} onClick={handleMoveUp}>上移一层</div>
            <div className={styles.menuItem} onClick={handleMoveDown}>下移一层</div>
            <div className={styles.menuDivider} />
            {(() => {
              const { selectedComponentKeys } = useEditStore.getState();
              if (selectedComponentKeys.length > 1) return null;
              return (
                <>
                  <div className={styles.menuItem} onClick={() => handleAlign("centerX")}>水平居中</div>
                  <div className={styles.menuItem} onClick={() => handleAlign("centerY")}>垂直居中</div>
                  <div className={styles.menuItemWithSubmenu}>
                    <span>对齐画布</span>
                    <span className={styles.submenuArrow}>▶</span>
                    <div className={styles.submenu}>
                      <div className={styles.submenuItem} onClick={() => handleAlign("top")}>顶部</div>
                      <div className={styles.submenuItem} onClick={() => handleAlign("bottom")}>底部</div>
                      <div className={styles.submenuItem} onClick={() => handleAlign("left")}>左侧</div>
                      <div className={styles.submenuItem} onClick={() => handleAlign("right")}>右侧</div>
                    </div>
                  </div>
                  <div className={styles.menuDivider} />
                </>
              );
            })()}
            <div className={styles.menuItemWithSubmenu}>
              <span>附近的组件</span>
              <span className={styles.submenuArrow}>▶</span>
              <div className={styles.submenu}>
                {nearbyCmps.length === 0 ? (
                  <div className={styles.submenuItemEmpty}>无附近组件</div>
                ) : (
                  nearbyCmps.map((c) => (
                    <div
                      key={c.key}
                      className={styles.submenuItem}
                      onClick={() => handleSelectNearby(c.key)}
                    >
                      {c.name}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className={styles.menuDivider} />
            <div className={styles.menuItem} onClick={handleDeleteFromMenu}>
              {(() => {
                const { selectedComponentKeys } = useEditStore.getState();
                if (selectedComponentKeys.includes(cmp.key) && selectedComponentKeys.length > 1) {
                  return `删除选中的 ${selectedComponentKeys.length} 个组件`;
                }
                return "删除";
              })()}
            </div>
          </div>,
          document.body
        )}
    </>
  );

  if (!isSelected) {
    return (
      <div
        ref={wrapperRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        style={wrapperStyle}
      >
        {renderComponent(cmp, innerStyle)}
        {menuContent}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={styles.selectedWrapper}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      style={wrapperStyle}
    >
      {renderComponent(cmp, innerStyle)}

      {/* 锚点 - 8个调整手柄 */}
      <div className={`${styles.anchor} ${styles.anchorTl}`} onMouseDown={(e) => handleAnchorMouseDown(e, "tl")} />
      <div className={`${styles.anchor} ${styles.anchorTc}`} onMouseDown={(e) => handleAnchorMouseDown(e, "tc")} />
      <div className={`${styles.anchor} ${styles.anchorTr}`} onMouseDown={(e) => handleAnchorMouseDown(e, "tr")} />
      <div className={`${styles.anchor} ${styles.anchorMl}`} onMouseDown={(e) => handleAnchorMouseDown(e, "ml")} />
      <div className={`${styles.anchor} ${styles.anchorMr}`} onMouseDown={(e) => handleAnchorMouseDown(e, "mr")} />
      <div className={`${styles.anchor} ${styles.anchorBl}`} onMouseDown={(e) => handleAnchorMouseDown(e, "bl")} />
      <div className={`${styles.anchor} ${styles.anchorBc}`} onMouseDown={(e) => handleAnchorMouseDown(e, "bc")} />
      <div className={`${styles.anchor} ${styles.anchorBr}`} onMouseDown={(e) => handleAnchorMouseDown(e, "br")} />
      {menuContent}
    </div>
  );
}

function TextCmp({ cmp, style }: { cmp: TextComponent; style?: React.CSSProperties }) {
  const { value, tag } = cmp.props;
  const Tag = tag as keyof React.JSX.IntrinsicElements;
  return <Tag style={style || cmp.style}>{value}</Tag>;
}

function ImageCmp({ cmp, style }: { cmp: ImageComponent; style?: React.CSSProperties }) {
  const { src, alt, fit } = cmp.props;
  const finalStyle = style || cmp.style;
  if (!src) {
    return <div style={finalStyle} />;
  }
  return <img src={src} alt={alt} style={{ ...finalStyle, objectFit: fit }} />;
}

function ButtonCmp({ cmp, style }: { cmp: ButtonComponent; style?: React.CSSProperties }) {
  const { text, btnType } = cmp.props;
  return (
    <Button type={btnType as any} style={style || cmp.style}>
      {text}
    </Button>
  );
}

function renderComponent(cmp: AnyComponent, style?: React.CSSProperties) {
  switch (cmp.type) {
    case 1: // TEXT
      return <TextCmp key={cmp.key} cmp={cmp as TextComponent} style={style} />;
    case 2: // IMAGE
      return <ImageCmp key={cmp.key} cmp={cmp as ImageComponent} style={style} />;
    case 3: // BUTTON
      return <ButtonCmp key={cmp.key} cmp={cmp as ButtonComponent} style={style} />;
    default:
      return null;
  }
}

// 预设画布尺寸
const PRESET_SIZES = [
  { name: "iPhone SE", width: 375, height: 667, icon: "📱" },
  { name: "iPhone 14", width: 390, height: 844, icon: "📱" },
  { name: "iPhone 14 Pro Max", width: 430, height: 932, icon: "📱" },
  { name: "iPad Mini", width: 768, height: 1024, icon: "📲" },
  { name: "PC 1920", width: 1920, height: 1080, icon: "🖥️" },
];

export default function Center() {
  const {
    canvas,
    selectedComponentKeys,
    selectCmp,
    clearSelection,
    addCmp,
    zoom,
    setZoom,
    updateCanvasStyle,
    showCanvasSizeEditor,
    setShowCanvasSizeEditor,
    updateCmpStyle,
    moveCmpToTop,
  } = useEditStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [localZoom, setLocalZoom] = useState(zoom);
  const [snapLines, setSnapLines] = useState<{ h: number[]; v: number[] }>({ h: [], v: [] });

  // 处理组件大小调整
  const handleResize = useCallback(
    (key: number, delta: { width?: number; height?: number; left?: number; top?: number }) => {
      updateCmpStyle(key, delta);
    },
    [updateCmpStyle]
  );

  // 同步本地缩放值
  useEffect(() => {
    setLocalZoom(zoom);
  }, [zoom]);

  // 处理滚轮缩放
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        setZoom(zoom + delta);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [zoom, setZoom]);

  // 处理拖拽放置
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer?.getData("drag-cmp");
      if (data) {
        try {
          const cmp = JSON.parse(data);
          const rect = canvasEl.getBoundingClientRect();
          const scale = rect.width / canvas.style.width;
          // 计算放置位置（元素中心对齐鼠标）
          const left = (e.clientX - rect.left) / scale - (cmp.style.width || 100) / 2;
          const top = (e.clientY - rect.top) / scale - (cmp.style.height || 30) / 2;
          addCmp({
            ...cmp,
            style: {
              ...cmp.style,
              left,
              top,
            },
          });
        } catch (err) {
          console.error("Failed to parse drag data:", err);
        }
      }
    };

    canvasEl.addEventListener("dragover", handleDragOver);
    canvasEl.addEventListener("drop", handleDrop);

    return () => {
      canvasEl.removeEventListener("dragover", handleDragOver);
      canvasEl.removeEventListener("drop", handleDrop);
    };
  }, [canvas.style.width, addCmp]);

  // 点击画布空白区域取消选择
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      clearSelection();
    }
  };

  // 缩放控制
  const handleZoomIn = () => setZoom(zoom + 10);
  const handleZoomOut = () => setZoom(zoom - 10);
  const handleZoomReset = () => setZoom(100);
  const handleZoomInputChange = (value: number | null) => {
    if (value) {
      setLocalZoom(value);
    }
  };
  const handleZoomInputBlur = () => {
    setZoom(localZoom);
  };

  // 画布尺寸编辑
  const [tempSize, setTempSize] = useState({ width: canvas.style.width, height: canvas.style.height });

  useEffect(() => {
    if (showCanvasSizeEditor) {
      setTempSize({ width: canvas.style.width, height: canvas.style.height });
    }
  }, [showCanvasSizeEditor, canvas.style.width, canvas.style.height]);

  const handlePresetSize = (preset: (typeof PRESET_SIZES)[0]) => {
    if (preset.width === 0) {
      // 自定义
      return;
    }
    setTempSize({ width: preset.width, height: preset.height });
  };

  const applySize = () => {
    updateCanvasStyle({
      width: tempSize.width,
      height: tempSize.height,
    });
    setShowCanvasSizeEditor(false);
  };

  return (
    <div id="center" className={styles.center} ref={containerRef}>
      {/* 顶部工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.zoomControls}>
          <Button icon={<ZoomOutOutlined />} size="small" onClick={handleZoomOut} disabled={zoom <= 25} />
          <div className={styles.zoomInput}>
            <InputNumber
              size="small"
              min={25}
              max={200}
              value={localZoom}
              onChange={handleZoomInputChange}
              onBlur={handleZoomInputBlur}
              onPressEnter={handleZoomInputBlur}
              formatter={(value) => `${value}%`}
              parser={(value) => Number(value?.replace("%", "") || 0)}
              style={{ width: 70 }}
            />
          </div>
          <Button icon={<ZoomInOutlined />} size="small" onClick={handleZoomIn} disabled={zoom >= 200} />
          <Button size="small" onClick={handleZoomReset}>
            重置
          </Button>
        </div>
        <Button size="small" onClick={() => setShowCanvasSizeEditor(true)}>
          画布尺寸
        </Button>
      </div>

      {/* 画布区域 */}
      <div className={styles.canvasWrapper}>
        <div
          className={styles.canvas}
          style={{
            ...canvas.style,
            transform: `scale(${zoom / 100})`,
          }}
          ref={canvasRef}
          onClick={handleCanvasClick}
        >
          {canvas.cmps.map((cmp) => (
            <ResizableComponent
              key={cmp.key}
              cmp={cmp}
              isSelected={selectedComponentKeys.includes(cmp.key)}
              onSelect={(e) => {
                const multi = e.ctrlKey || e.metaKey;
                moveCmpToTop(cmp.key);
                selectCmp(cmp.key, multi);
              }}
              onResize={handleResize}
              zoom={zoom}
              onSnapChange={setSnapLines}
            />
          ))}
          {/* 吸附辅助线 */}
          <div className={styles.snapLinesLayer}>
            {snapLines.h.map((y, i) => (
              <div key={`h-${i}`} className={styles.snapLineH} style={{ top: y }} />
            ))}
            {snapLines.v.map((x, i) => (
              <div key={`v-${i}`} className={styles.snapLineV} style={{ left: x }} />
            ))}
          </div>
        </div>
      </div>

      {/* 画布尺寸编辑弹窗 */}
      <Modal
        className="canvas-size-modal"
        title="调整画布尺寸"
        open={showCanvasSizeEditor}
        onOk={applySize}
        onCancel={() => setShowCanvasSizeEditor(false)}
        okText="应用"
        cancelText="取消"
        width={400}
      >
        <div className={styles.sizeEditor}>
          {/* 预设尺寸列表 */}
          <div className={styles.presetList}>
            {PRESET_SIZES.map((preset) => (
              <div
                key={preset.name}
                className={`${styles.presetItem} ${
                  tempSize.width === preset.width && tempSize.height === preset.height ? styles.active : ""
                }`}
                onClick={() => handlePresetSize(preset)}
              >
                <span className={styles.itemIcon}>{preset.icon}</span>
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{preset.name}</div>
                  <div className={styles.itemSize}>
                    {preset.width} × {preset.height}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 自定义尺寸输入 */}
          <div className={styles.customRow}>
            <span className={styles.customLabel}>自定义</span>
            <div className={styles.customInput}>
              <InputNumber
                min={100}
                max={3840}
                value={tempSize.width}
                onChange={(v) => setTempSize((s) => ({ ...s, width: v || 375 }))}
                size="small"
                style={{ width: 90 }}
              />
            </div>
            <span className={styles.sizeDivider}>×</span>
            <div className={styles.customInput}>
              <InputNumber
                min={100}
                max={2160}
                value={tempSize.height}
                onChange={(v) => setTempSize((s) => ({ ...s, height: v || 667 }))}
                size="small"
                style={{ width: 90 }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
