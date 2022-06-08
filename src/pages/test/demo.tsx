import React from 'react';
import 'antd/dist/antd.css';
import TreeTransfer from './TreeTransfer';
// import './index.css';
import { Form, Button } from 'antd';

const Demo = () => {
  const [form] = Form.useForm();

  // const [targetKeys, setTargetKeys] = useState<number[]>(propsKeys);
  // const handleChange = (keys: Key[]) => {
  //   // setTargetKeys(keys); // 向下更新
  //   handleOnChange(keys); // 通知父级 数据变更
  // };

  //  const treeData: TreeNode[] = [
//     {
//       key: 10,
//       title: '0-0',
//       type: TreeNodeType.TYPE,
//       children: [
//         { key: 101, title: '0-0-0', type: TreeNodeType.FRANCHISEE },
//         { key: 102, title: '0-0-1', type: TreeNodeType.FRANCHISEE },
//       ],
//     },
//     {
//       key: 20,
//       type: TreeNodeType.TYPE,
//       title: '0-1',
//       children: [
//         { key: 201, title: '0-1-0', type: TreeNodeType.FRANCHISEE },
//         { key: 202, title: '0-1-1', type: TreeNodeType.FRANCHISEE },
//       ],
//     },
//     { key: 30, title: '0-3', type: TreeNodeType.TYPE },
//   ];

  return (
    <Form form={form} style={{ margin: '88px' }}>
      <Form.Item label="选商户" name="franchisees">
        <TreeTransfer />
      </Form.Item>
      <Button
        type="primary"
        onClick={() => {
          console.log(form.getFieldsValue(), '-----form-value');
        }}
      >
        提交
      </Button>
    </Form>
  );
};

export default Demo;
