import { isButtonComponent } from "@/pages/Layout/left";
import { defaultCommonStyle } from "@/utils";
import leftSideStyles from "../index.module.scss";
import useEditStore from "@/store/editStore";
import type { ComponentType } from "@/store/editStoreTypes";

const defaultStyle = {
  ...defaultCommonStyle,
  width: 120,
  height: 40,
  lineHeight: "40px",
  fontSize: 14,
  fontWeight: "normal",
  color: "#ffffff",
  backgroundColor: "#1890ff",
  textAlign: "center",
  borderRadius: 4,
};

const settings = [
  {
    name: "主按钮",
    type: 3 as ComponentType.BUTTON,
    props: {
      text: "按钮",
      btnType: "primary",
    },
    style: defaultStyle,
  },
  {
    name: "默认按钮",
    type: 3 as ComponentType.BUTTON,
    props: {
      text: "按钮",
      btnType: "default",
    },
    style: {
      ...defaultStyle,
      color: "#000000d9",
      backgroundColor: "#ffffff",
      border: "1px solid #d9d9d9",
    },
  },
  {
    name: "虚线按钮",
    type: 3 as ComponentType.BUTTON,
    props: {
      text: "按钮",
      btnType: "dashed",
    },
    style: {
      ...defaultStyle,
      color: "#000000d9",
      backgroundColor: "#ffffff",
      border: "1px dashed #d9d9d9",
    },
  },
  {
    name: "文字按钮",
    type: 3 as ComponentType.BUTTON,
    props: {
      text: "按钮",
      btnType: "text",
    },
    style: {
      ...defaultStyle,
      color: "#1890ff",
      backgroundColor: "transparent",
      border: "none",
    },
  },
];

export default function ButtonSide() {
  const addCmp = useEditStore((state) => state.addCmp);

  const onDragStart = (e: React.DragEvent, _cmp: any) => {
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
                type: isButtonComponent,
                props: item.props,
                style: item.style,
              })
            }
            draggable="true"
            onDragStart={(e) => onDragStart(e, { ...item, type: isButtonComponent })}
          >
            <div className={leftSideStyles.preview}>
              <span style={item.style}>{item.props.text}</span>
            </div>
            <div className={leftSideStyles.desc}>{item.name}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
