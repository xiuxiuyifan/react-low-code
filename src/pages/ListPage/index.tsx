import styles from './list.module.scss';

export default function ListPage() {
  return (
    <div className={styles['list-wrapper']}>
      <h1>列表页</h1>
      <p>这是列表页面，只有登录后才能访问。</p>
    </div>
  );
}
