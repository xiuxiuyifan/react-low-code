import { useParams } from 'react-router-dom';
import styles from './edit.module.scss';
import Header from '../Layout/Header';
import Left from '../Layout/left';
import Center from '../Layout/Center';
import Right from '../Layout/right';

export default function EditPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className={styles['edit-wrapper']}>
        <Header />
        <div className={styles.main}>
          <Left/>
          <Center/>
          <Right/>
        </div>
    </div>
  );
}
