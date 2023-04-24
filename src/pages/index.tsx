import styles from './index.less';
import DrapAndDropRender from './demo';
import SortableRender from './sortable';
import TreetransferRender from './test/demo';

export default function IndexPage() {
  return (
    <div>
      <div><DrapAndDropRender /></div>
      <div><SortableRender /></div> 
      <div><TreetransferRender /></div>
    </div>
  );
}
