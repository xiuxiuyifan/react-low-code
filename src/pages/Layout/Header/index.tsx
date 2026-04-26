import { Button, Space } from "antd";
import { UndoOutlined, RedoOutlined } from "@ant-design/icons";
import useEditStore from "@/store/editStore";
import styles from "./index.module.scss";

export default function Header() {
  const { canvas, history, undo, redo } = useEditStore();
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <span className={styles.title}>{canvas.title}</span>
      </div>
      <Space>
        <Button
          size="small"
          icon={<UndoOutlined />}
          onClick={undo}
          disabled={!canUndo}
        >
          撤销
        </Button>
        <Button
          size="small"
          icon={<RedoOutlined />}
          onClick={redo}
          disabled={!canRedo}
        >
          重做
        </Button>
      </Space>
    </div>
  );
}
