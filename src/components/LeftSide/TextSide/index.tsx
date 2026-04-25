import { isTextComponent } from "@/pages/Layout/left";
import leftSideStyles from "../index.module.scss";
import useEditStore from "@/store/editStore";
import type { TextComponent, ComponentStyle } from "@/store/editStoreTypes";

const defaultStyle: ComponentStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  width: 170,
  height: 40,
  lineHeight: "40px",
  fontSize: 16,
  fontWeight: "normal",
  color: "#000000",
  backgroundColor: "transparent",
  textAlign: "left",
};

const settings: Array<{
  name: string;
  type: number;
  props: TextComponent["props"];
  style: ComponentStyle;
}> = [
  {
    name: "标题文本",
    type: 1,
    props: {
      value: "双击编辑标题",
      tag: "h1",
    },
    style: {
      ...defaultStyle,
      fontSize: 32,
      height: 50,
      lineHeight: "50px",
      fontWeight: "bold",
    },
  },
  {
    name: "副标题",
    type: 1,
    props: {
      value: "双击编辑副标题",
      tag: "h2",
    },
    style: {
      ...defaultStyle,
      fontSize: 24,
      height: 40,
      lineHeight: "40px",
      fontWeight: "bold",
    },
  },
  {
    name: "正文文本",
    type: 1,
    props: {
      value: "双击编辑正文内容",
      tag: "p",
    },
    style: defaultStyle,
  },
  {
    name: "行内文本",
    type: 1,
    props: {
      value: "行内文本",
      tag: "span",
    },
    style: {
      ...defaultStyle,
      width: "auto" as any,
      height: "auto" as any,
      lineHeight: "normal",
    },
  },
];

export default function TextSide() {
  const addCmp = useEditStore((state) => state.addCmp);

  const onDragStart = (e: React.DragEvent, _cmp: typeof settings[0]) => {
    e.dataTransfer.setData("drag-cmp", JSON.stringify(_cmp));
  };

  return (
    <div className={leftSideStyles.main}>
      <ul className={leftSideStyles.box}>
        {settings.map((item) => (
          <li
            key={item.name}
            className={leftSideStyles.item}
            onClick={() =>
              addCmp({
                name: item.name,
                type: isTextComponent,
                props: item.props,
                style: item.style,
              })
            }
            draggable="true"
            onDragStart={(e) => onDragStart(e, { ...item, type: isTextComponent })}
          >
            <div style={item.style}>
              {item.props.value.replace("双击编辑", "")}
            </div>
            <div className={leftSideStyles.desc}>{item.name}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
