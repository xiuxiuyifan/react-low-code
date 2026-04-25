import { useParams } from 'react-router-dom';
import styles from './edit.module.scss';
import Left from '../Layout/left';
import Center from '../Layout/Center';
import Right from '../Layout/right';

export default function EditPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className={styles['edit-wrapper']}>
        <Left/>
        <Center/>
        <Right/>
    </div>
  );
}
