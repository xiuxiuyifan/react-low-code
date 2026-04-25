import classNames from "classnames";
import { useState, useEffect } from "react";
import TextSide from "@/components/LeftSide/TextSide";
import ImgSide from "@/components/LeftSide/ImgSide";
import ButtonSide from "@/components/LeftSide/ButtonSide";
import styles from "./index.module.scss";

export const isTplSide = "TplSide";
export const isTextComponent = 1;
export const isImgComponent = 2;
export const isButtonComponent = 3;

export default function Left() {
  const [showSide, setShowSide] = useState<number | string>(0);

  const _setShowSide = (which: number | string) => {
    if (showSide === which) {
      setShowSide(0);
    } else {
      setShowSide(which);
    }
  };

  useEffect(() => {
    const center = document.getElementById("center");
    const handleClick = () => {
      setShowSide(0);
    };
    center?.addEventListener("click", handleClick);
    return () => {
      center?.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className={styles.left}>
      <ul className={styles.cmps}>
        <li
          className={classNames(styles.cmp, showSide === isTplSide ? styles.selected : "")}
          onClick={() => _setShowSide(isTplSide)}
        >
          <i className={classNames("iconfont icon-mobankuangjia-xianxing", styles.cmpIcon)} />
          <span className={styles.cmpText}>模板</span>
        </li>
        <li
          className={classNames(styles.cmp, showSide === isTextComponent ? styles.selected : "")}
          onClick={() => _setShowSide(isTextComponent)}
        >
          <i className={classNames("iconfont icon-wenben", styles.cmpIcon)} />
          <span className={styles.cmpText}>文本</span>
        </li>
        <li
          className={classNames(styles.cmp, showSide === isImgComponent ? styles.selected : "")}
          onClick={() => _setShowSide(isImgComponent)}
        >
          <i className={classNames("iconfont icon-tupian", styles.cmpIcon)} />
          <span className={styles.cmpText}>图片</span>
        </li>
        <li
          className={classNames(styles.cmp, showSide === isButtonComponent ? styles.selected : "")}
          onClick={() => _setShowSide(isButtonComponent)}
        >
          <i className={classNames("iconfont icon-anniu", styles.cmpIcon)} />
          <span className={styles.cmpText}>按钮</span>
        </li>
      </ul>

      {showSide === isTextComponent && <TextSide />}
      {showSide === isImgComponent && <ImgSide />}
      {showSide === isButtonComponent && <ButtonSide />}
    </div>
  );
}
