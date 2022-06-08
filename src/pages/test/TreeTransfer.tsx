import React, { useState, PropsWithChildren, useEffect, Key, useMemo } from 'react';
import { Transfer, Select, Tree, Empty, Row, Col } from 'antd';
import type { TransferDirection, TransferItem } from 'antd/es/transfer';
import initData from './mock';

import '../index.less'
import { useDebounceFn } from 'ahooks';


interface Props {
  dataSource: TreeNode[]
  propsKeys: Key[] | undefined;
  itemMap: Record<string, TreeNode>
  handleOnChange: (value: Key[]) => void;
}

interface franchiseeItem {
  id: number;
  franchiseeName: string;
  withdrawalMobile: null | string;
  subjectType: number;
  status: number;
  msg: null | string;
  valid: boolean;
  createTime: Date;
  updateTime: Date;
  remark: string;
  userIdType: null | number;
}

interface InitDataItem {
  subjectType: number;
  subjectTypeName: string;
  franchiseesTypeList: franchiseeItem[];
}

enum TreeNodeType {
  'FRANCHTYPE' = 1,
  'Shop' = 2,
}

interface TreeNode {
  key: Key;
  title: string;
  value: string;
  type: TreeNodeType;
  description: string;
  disabled: boolean;
  children?: TreeNode[];
}

interface FormatedInitData {
  dataSource: TreeNode[];
  itemMap: Record<string, TreeNode>
  options: Array<{ label: string, value: Key }>
}

function parsedInitData(initData?: InitDataItem[]): FormatedInitData {
  const itemMap: Record<string, TreeNode> = {};
  const options: Array<{ label: string, value: Key }> = [];
  const treeData: TreeNode[] = (initData || []).map((item) => {
     const parsedTypeItem: TreeNode = {
       type: TreeNodeType.FRANCHTYPE,
       key: item.subjectType,
       value: `franch-${item.subjectType}`,
       title: item.subjectTypeName,
       description: item.subjectTypeName,
       disabled: false,
       children: (item.franchiseesTypeList || []).map((ele) => {
         const title = !ele.remark ? ele.franchiseeName : `${ele.franchiseeName} (${ele.remark})`
         const parsedShopItem = {
           type: TreeNodeType.Shop,
           key: ele.id,
           value: `shop-${ele.id}`,
           title,
           disabled: false,
           description: title,
         }
         itemMap[parsedShopItem.key] = parsedShopItem;
         options.push({ label: parsedShopItem.title, value: parsedShopItem.key  });
         return parsedShopItem;
       }),
     }
    itemMap[parsedTypeItem.key] = parsedTypeItem;
    options.push({ label: parsedTypeItem.title, value: parsedTypeItem.key });
    return parsedTypeItem;
   })
  return { dataSource: treeData, itemMap, options };
};

function buildTreeData (formatedFranchShops: TreeNode[], targetKeys: Key[]) {
  function buildShop(formatedShopItem: TreeNode): TreeNode {
    return {
      ...formatedShopItem,
      disabled: targetKeys.includes(formatedShopItem.key) || formatedShopItem.disabled,
    };
  }

  function buildFranch(formatedFranchItem: TreeNode): TreeNode {
    const children = (formatedFranchItem.children || []).map((item) => {
      if (item.type === TreeNodeType.Shop) {
        return buildShop(item);
      }
      return buildFranch(item);
    });
  
    let disabled = false;
    if (children.length) {
      disabled = children.every((i) => i.disabled);
    } else {
      disabled = true;
    }
    return {
      ...formatedFranchItem,
      disabled,
      children,
    };
  }

  return formatedFranchShops.map(buildFranch);
};

function getExpandedKeys(keywords: string, treeData: TreeNode[]): string[] {
  const keys: string[] = [];

  const traverse = (treeNodeData: TreeNode, previousKey: Key) => {
    if (treeNodeData.title.indexOf(keywords) !== -1) {
      keys.push(previousKey as string);
    }
    if ('children' in treeNodeData) {
      (treeNodeData.children || []).forEach((subTreeNodeData) =>
        traverse(subTreeNodeData, treeNodeData.key)
      );
    }
  };

  treeData.forEach((treeNodeData) => traverse(treeNodeData, ''));

  return keys;
}

const TreeTransfer = ({ dataSource, propsKeys, itemMap, handleOnChange }: PropsWithChildren<Props>) => {
  const [targetKeys, setTargetKeys] = useState<Key[]>([]);
  const [orgTreeData, setOrgTreeData] = useState<TreeNode[]>([])
  const [targetTreeData, setTatgetTreeData] = useState<TreeNode[]>([])
  const [transferDataSource] = useState < TransferItem[]>([])
  const [leftSearchKey, setLeftSearchKey] = useState<string>('');
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [leftTotalCount, setLeftTotalCount] = useState<number>(0);

  const handleChange = (targetKeys: Key[]) => {
    const newTargetKeys: Key[] = [];

    const getFranchShops = (node: TreeNode): Key[] => {
      const shopKeys: Key[] = [];
      (node?.children || []).forEach((item) => {
        shopKeys.push(item.key);
      });
      return shopKeys;
    };

    targetKeys.forEach((key: Key) => {
      const target = itemMap[key];
      if (target) {
        if (target.type === TreeNodeType.Shop) {
          newTargetKeys.push(key);
        } else {
          const subKeys = getFranchShops(target);
          subKeys.forEach((subKey) => newTargetKeys.push(subKey));
        }
      }
    });
    setTargetKeys(newTargetKeys);
    handleOnChange(newTargetKeys); // 通知父级 数据变更
  };

  useEffect(() => {
    setOrgTreeData(buildTreeData(dataSource, targetKeys))
  }, [dataSource, targetKeys]);

  const isChecked = (selectedKeys: Key[], eventKey: Key) =>
    selectedKeys.includes(eventKey);

  useEffect(() => {
    let count = 0;
    function flatten(list: TreeNode[] = []) {
      list.forEach((item) => {
        transferDataSource.push({ ...item, disabled: false } as TransferItem);
        if (item.children) {
          count += item.children.length;
          flatten(item.children);
        }
      });
    }
    flatten(orgTreeData);
    setLeftTotalCount(count);
    setTatgetTreeData(orgTreeData);
  }, [orgTreeData]);

  const loop = (initData: TreeNode[], searchKey?: string): any[] =>
    (initData || []).map((item) => {
      const index = item.title.indexOf(searchKey || '');
      const beforeStr = item.title.substring(0, index);
      const afterStr = item.title.substring(index + (searchKey || '').length);
      console.log(index, beforeStr, afterStr, '------index, before, after');
      
      const title =
        index > -1 ? (
          <span>
            {beforeStr}
            <span style={{ color: '#f50' }}>{searchKey}</span>
            {afterStr}
          </span>
        ) : (
          <span>{item.title}</span>
        );

      if (item.children) {
        return { ...item, title, key: item.key, children: loop(item.children, searchKey) };
      }

      return {
        ...item,
        title,
        key: item.key,
      };
    });

  const { run: handleSearch } = useDebounceFn((direction: 'left' | 'right', value: string) => {
    if (direction === 'left') {
      const expandedKeys = getExpandedKeys(value, orgTreeData);
      setExpandedKeys(expandedKeys);
      setAutoExpandParent(true);
      setLeftSearchKey(value);
    }
  });

  const onExpand = (expandedKeysValue: Key[]) => {
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  return (
    <Transfer
      onChange={handleChange}
      targetKeys={targetKeys as string[]}
      dataSource={transferDataSource}
      className="tree-transfer custom-tree-transfer"
      render={(item) => item.title!}
      showSelectAll={false}
      showSearch
      onSearch={handleSearch}
      titles={['全部', '已选']}
      operations={['绑定', '移除']}
      selectAllLabels={[() => <div>{leftTotalCount}&nbsp;项</div>, (info) => <div>{info.totalCount}&nbsp;项</div>]}
      locale={{ itemUnit: '项', itemsUnit: '项', searchPlaceholder: '请输入搜索内容', notFoundContent: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />}}
    >
      {({ direction, onItemSelect, selectedKeys }) => {
        if (direction === 'left') {
          const checkedKeys = [...selectedKeys, ...targetKeys];
          return (
            <Tree
              blockNode
              checkable
              checkedKeys={checkedKeys}
              onExpand={onExpand}
              expandedKeys={expandedKeys.length ? expandedKeys : []}
              autoExpandParent={autoExpandParent}
              treeData={leftSearchKey ? loop(targetTreeData, leftSearchKey) : targetTreeData}
              onCheck={(_, { node: { key } }) => {
                onItemSelect(key as any, !isChecked(checkedKeys, key));
              }}
              onSelect={(_, { node: { key } }) => {
                onItemSelect(key as any, !isChecked(checkedKeys, key));
              }}
            />
          );
        }
      }}
    </Transfer>
  );
};


const Item = ({ value, onChange }: { value?: Key[]; onChange?: (value: Key[]) => void }) => {
  const [propsValue, setPropsValue] = useState<Key[]>([]);
  const [data, setData] = useState<{
    dataSource: TreeNode[];
    itemMap: Record<string, TreeNode>;
    options: Array<{ label: string; value: Key }>;
  }>({
    dataSource: [],
    itemMap: {},
    options: [],
  });

  useEffect(() => {
    setData(parsedInitData(initData));
    setPropsValue(value || []);
  }, [value])

  const handleOnChange = (value: Key[]) => {
    onChange && onChange(value);
  };

  return (
    <Select
      mode="multiple"
      maxTagCount={2}
      value={value || propsValue}
      options={data.options}
      dropdownRender={() => TreeTransfer({ ...data, propsKeys: value, handleOnChange })}
    />
  );
};

export default Item;
