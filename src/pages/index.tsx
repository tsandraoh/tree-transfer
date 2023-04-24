import styles from './index.less';
import Container from './demo';
import SortableRender from './sortable';
import TreetransferRender from './test/demo';

export default function IndexPage() {
  return (
    <div>

      {/* <div><Container /></div> */}
    <div><SortableRender /></div> 
      <div><TreetransferRender /></div>
    </div>
  );
}
