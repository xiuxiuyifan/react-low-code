import { isImgComponent } from "@/pages/Layout/left";
import { defaultCommonStyle } from "@/utils";
import leftSideStyles from "../index.module.scss";
import useEditStore from "@/store/editStore";
import type { ComponentType } from "@/store/editStoreTypes";

const defaultStyle = {
  ...defaultCommonStyle,
  width: 200,
  height: 150,
  backgroundColor: "#f5f5f5",
};

const settings = [
  {
    name: "网络图片",
    type: 2 as ComponentType.IMAGE,
    props: {
      src: "https://via.placeholder.com/200x150/1890ff/ffffff?text=Image",
      alt: "网络图片",
      fit: "cover",
    },
    style: defaultStyle,
  },
  {
    name: "占位图片",
    type: 2 as ComponentType.IMAGE,
    props: {
      src: "",
      alt: "占位图片",
      fit: "cover",
    },
    style: {
      ...defaultStyle,
      backgroundImage: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
      backgroundSize: "cover",
    },
  },
];

export default function ImgSide() {
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
                type: isImgComponent,
                props: item.props,
                style: item.style,
              })
            }
            draggable="true"
            onDragStart={(e) => onDragStart(e, { ...item, type: isImgComponent })}
          >
            {item.props.src ? (
              <img src={item.props.src} alt={item.props.alt} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: item.style.backgroundColor as string }} />
            )}
            <div className={leftSideStyles.desc}>{item.name}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
