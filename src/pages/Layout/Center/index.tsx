import React, { useEffect, useRef } from "react";
import { Button } from "antd";
import useEditStore from "@/store/editStore";
import type { AnyComponent, TextComponent, ImageComponent, ButtonComponent } from "@/store/editStoreTypes";
import styles from "./index.module.scss";

function TextCmp({ cmp }: { cmp: TextComponent }) {
  const { value, tag } = cmp.props;
  const Tag = tag as keyof React.JSX.IntrinsicElements;
  return <Tag style={cmp.style}>{value}</Tag>;
}

function ImageCmp({ cmp }: { cmp: ImageComponent }) {
  const { src, alt, fit } = cmp.props;
  if (!src) {
    return <div style={cmp.style} />;
  }
  return <img src={src} alt={alt} style={{ ...cmp.style, objectFit: fit }} />;
}

function ButtonCmp({ cmp }: { cmp: ButtonComponent }) {
  const { text, btnType } = cmp.props;
  return (
    <Button type={btnType as any} style={cmp.style}>
      {text}
    </Button>
  );
}

function renderComponent(cmp: AnyComponent) {
  switch (cmp.type) {
    case 1: // TEXT
      return <TextCmp key={cmp.key} cmp={cmp as TextComponent} />;
    case 2: // IMAGE
      return <ImageCmp key={cmp.key} cmp={cmp as ImageComponent} />;
    case 3: // BUTTON
      return <ButtonCmp key={cmp.key} cmp={cmp as ButtonComponent} />;
    default:
      return null;
  }
}

export default function Center() {
  const { canvas, selectedComponentKey, selectCmp, addCmp } = useEditStore();
  const canvasRef = useRef<HTMLDivElement>(null);

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
          // 计算放置位置
          const left = (e.clientX - rect.left) / scale;
          const top = (e.clientY - rect.top) / scale;
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
      selectCmp(null);
    }
  };

  return (
    <div id="center" className={styles.center}>
      <div
        className={styles.canvas}
        style={canvas.style}
        ref={canvasRef}
        onClick={handleCanvasClick}
      >
        {canvas.cmps.map((cmp) => (
          <div
            key={cmp.key}
            style={{ position: "relative", outline: selectedComponentKey === cmp.key ? "2px solid #1890ff" : "none" }}
            onClick={(e) => {
              e.stopPropagation();
              selectCmp(cmp.key);
            }}
          >
            {renderComponent(cmp)}
          </div>
        ))}
      </div>
    </div>
  );
}
