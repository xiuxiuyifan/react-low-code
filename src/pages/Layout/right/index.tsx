import { Form, Input, InputNumber, Select, Divider } from "antd";
import useEditStore from "@/store/editStore";
import type { TextComponent, ImageComponent, ButtonComponent } from "@/store/editStoreTypes";
import styles from "./index.module.scss";

export default function Right() {
  const { canvas, selectedComponentKey, updateCmpProps, updateCmpStyle } = useEditStore();

  const selectedCmp = canvas.cmps.find((c) => c.key === selectedComponentKey);

  if (!selectedCmp) {
    return (
      <div className={styles.right}>
        <div className={styles.empty}>请选择组件</div>
      </div>
    );
  }

  const handlePropsChange = (key: string, value: any) => {
    updateCmpProps(selectedCmp.key, { [key]: value });
  };

  const handleStyleChange = (key: string, value: any) => {
    updateCmpStyle(selectedCmp.key, { [key]: value });
  };

  return (
    <div className={styles.right}>
      <div className={styles.title}>属性面板</div>
      <Divider />

      {/* 根据组件类型渲染不同属性 */}
      {selectedCmp.type === 1 && <TextAttributes cmp={selectedCmp as TextComponent} onChange={handlePropsChange} onStyleChange={handleStyleChange} />}
      {selectedCmp.type === 2 && <ImageAttributes cmp={selectedCmp as ImageComponent} onChange={handlePropsChange} onStyleChange={handleStyleChange} />}
      {selectedCmp.type === 3 && <ButtonAttributes cmp={selectedCmp as ButtonComponent} onChange={handlePropsChange} onStyleChange={handleStyleChange} />}
    </div>
  );
}

// ==================== 文本属性面板 ====================
function TextAttributes({
  cmp,
  onChange,
  onStyleChange,
}: {
  cmp: TextComponent;
  onChange: (key: string, value: any) => void;
  onStyleChange: (key: string, value: any) => void;
}) {
  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>内容</div>
        <Form layout="vertical" size="small">
          <Form.Item label="文本内容">
            <Input.TextArea
              value={cmp.props.value}
              onChange={(e) => onChange("value", e.target.value)}
              rows={3}
            />
          </Form.Item>
          <Form.Item label="标签类型">
            <Select
              value={cmp.props.tag}
              onChange={(value) => onChange("tag", value)}
              options={[
                { label: "标题1", value: "h1" },
                { label: "标题2", value: "h2" },
                { label: "标题3", value: "h3" },
                { label: "段落", value: "p" },
                { label: "行内文本", value: "span" },
              ]}
            />
          </Form.Item>
        </Form>
      </div>

      <Divider />

      <div className={styles.section}>
        <div className={styles.sectionTitle}>样式</div>
        <Form layout="vertical" size="small">
          <Form.Item label="字号">
            <InputNumber
              value={cmp.style.fontSize}
              onChange={(value) => onStyleChange("fontSize", value)}
              min={12}
              max={72}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="颜色">
            <Input
              type="color"
              value={cmp.style.color || "#000000"}
              onChange={(e) => onStyleChange("color", e.target.value)}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="文字对齐">
            <Select
              value={cmp.style.textAlign || "left"}
              onChange={(value) => onStyleChange("textAlign", value)}
              options={[
                { label: "左对齐", value: "left" },
                { label: "居中", value: "center" },
                { label: "右对齐", value: "right" },
              ]}
            />
          </Form.Item>
        </Form>
      </div>
    </>
  );
}

// ==================== 图片属性面板 ====================
function ImageAttributes({
  cmp,
  onChange,
  onStyleChange,
}: {
  cmp: ImageComponent;
  onChange: (key: string, value: any) => void;
  onStyleChange: (key: string, value: any) => void;
}) {
  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>图片</div>
        <Form layout="vertical" size="small">
          <Form.Item label="图片地址">
            <Input
              value={cmp.props.src}
              onChange={(e) => onChange("src", e.target.value)}
              placeholder="请输入图片URL"
            />
          </Form.Item>
          <Form.Item label="alt文字">
            <Input
              value={cmp.props.alt}
              onChange={(e) => onChange("alt", e.target.value)}
              placeholder="请输入alt文字"
            />
          </Form.Item>
          <Form.Item label="填充方式">
            <Select
              value={cmp.props.fit}
              onChange={(value) => onChange("fit", value)}
              options={[
                { label: "cover - 覆盖", value: "cover" },
                { label: "contain - 包含", value: "contain" },
                { label: "fill - 拉伸", value: "fill" },
              ]}
            />
          </Form.Item>
        </Form>
      </div>

      <Divider />

      <div className={styles.section}>
        <div className={styles.sectionTitle}>尺寸</div>
        <Form layout="vertical" size="small">
          <Form.Item label="宽度">
            <InputNumber
              value={cmp.style.width}
              onChange={(value) => onStyleChange("width", value)}
              min={0}
              max={1000}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="高度">
            <InputNumber
              value={cmp.style.height}
              onChange={(value) => onStyleChange("height", value)}
              min={0}
              max={1000}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="圆角">
            <InputNumber
              value={cmp.style.borderRadius}
              onChange={(value) => onStyleChange("borderRadius", value)}
              min={0}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </div>
    </>
  );
}

// ==================== 按钮属性面板 ====================
function ButtonAttributes({
  cmp,
  onChange,
  onStyleChange,
}: {
  cmp: ButtonComponent;
  onChange: (key: string, value: any) => void;
  onStyleChange: (key: string, value: any) => void;
}) {
  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>按钮</div>
        <Form layout="vertical" size="small">
          <Form.Item label="按钮文字">
            <Input
              value={cmp.props.text}
              onChange={(e) => onChange("text", e.target.value)}
              placeholder="请输入按钮文字"
            />
          </Form.Item>
          <Form.Item label="按钮类型">
            <Select
              value={cmp.props.btnType}
              onChange={(value) => onChange("btnType", value)}
              options={[
                { label: "主按钮", value: "primary" },
                { label: "默认按钮", value: "default" },
                { label: "虚线按钮", value: "dashed" },
                { label: "文字按钮", value: "text" },
              ]}
            />
          </Form.Item>
        </Form>
      </div>

      <Divider />

      <div className={styles.section}>
        <div className={styles.sectionTitle}>样式</div>
        <Form layout="vertical" size="small">
          <Form.Item label="宽度">
            <InputNumber
              value={cmp.style.width}
              onChange={(value) => onStyleChange("width", value)}
              min={0}
              max={500}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="高度">
            <InputNumber
              value={cmp.style.height}
              onChange={(value) => onStyleChange("height", value)}
              min={0}
              max={200}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="字号">
            <InputNumber
              value={cmp.style.fontSize}
              onChange={(value) => onStyleChange("fontSize", value)}
              min={12}
              max={32}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
