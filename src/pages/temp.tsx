import React, { useEffect, useState } from 'react';
import { Col, message, Row, Spin, Transfer, Tree } from 'antd';
import createModal from '@/utils/antd/createModal';
import { getBindedShopsData, getAllBindingShopsData, bindShops } from './server';
import styles from './index.less';

interface OriginShopItem {
  isBanding: boolean;
  platform: number;
  platformShopId: string;
  shopId: string;
  shopName: string;
}

interface OriginOrganationItem {
  brandId: number;
  id: number;
  name: string;
  children: OriginOrganationItem[];
  shopInfos: {
    platformShops: OriginShopItem[];
  }[];
}

enum ItemType {
  Shop,
  Org,
}

interface FormatedShopItem {
  type: ItemType.Shop;
  key: string;
  title: string;
  selectedInOtherShop: boolean;
  disabled?: boolean;
  description: string;
  platformId: number;
  platformShopId: string;
}

type PureFormatedShopItem = Omit<FormatedShopItem, 'selectedInOtherShop'>;

interface FormatedOrganationItem {
  type: ItemType.Org;
  key: string;
  disabled?: boolean;
  title: string;
  description: string;
  children: Array<FormatedOrganationItem | FormatedShopItem>;
}

function formatData(
  originOrganationItem: OriginOrganationItem,
  boundShopItems: { platformId: number; platformShopId: string }[]
): {
  formatedOrganationItems: FormatedOrganationItem[];
  allShopItems: PureFormatedShopItem[];
  selectedShopKeys: string[];
  itemMap: Record<string, PureFormatedShopItem | FormatedOrganationItem>;
} {
  const formatedOrganationItems: FormatedOrganationItem[] = [];
  const allShopItems: PureFormatedShopItem[] = [];
  const selectedShopKeys: string[] = [];
  const itemMap: Record<string, PureFormatedShopItem | FormatedOrganationItem> = {};

  function formatShop(shopItem: OriginShopItem): FormatedShopItem {
    const isSelected = boundShopItems.find(
      (item) =>
        item.platformId === shopItem.platform && item.platformShopId === shopItem.platformShopId
    );
    const selectedInOtherShop = shopItem.isBanding && !isSelected;
    const formatedShopItem: PureFormatedShopItem = {
      type: ItemType.Shop,
      key: `shop-${shopItem.platform}-${shopItem.platformShopId}`,
      title: `${shopItem.shopName}(${shopItem.platformShopId})`,
      description: `${shopItem.shopName}${shopItem.platformShopId}`,
      platformId: shopItem.platform,
      platformShopId: shopItem.platformShopId,
      disabled: selectedInOtherShop,
    };

    if (!selectedInOtherShop) {
      allShopItems.push(formatedShopItem);
      if (isSelected) {
        selectedShopKeys.push(formatedShopItem.key);
      }
    }

    itemMap[formatedShopItem.key] = formatedShopItem;

    return {
      selectedInOtherShop,
      ...formatedShopItem,
    };
  }

  function formatOrganation(organationItem: OriginOrganationItem): FormatedOrganationItem {
    const formatedShopItems: FormatedShopItem[] = organationItem.shopInfos.reduce(
      (items, shopInfo) => {
        shopInfo.platformShops.forEach((shop) => {
          items.push(formatShop(shop));
        });
        return items;
      },
      [] as FormatedShopItem[]
    );

    const formatedOrganationItem: FormatedOrganationItem = {
      type: ItemType.Org,
      key: `org-${organationItem.id}`,
      title: organationItem.name,
      description: organationItem.name,
      children: [...organationItem.children.map(formatOrganation), ...formatedShopItems],
    };

    itemMap[formatedOrganationItem.key] = formatedOrganationItem;
    return formatedOrganationItem;
  }

  formatedOrganationItems.push(formatOrganation(originOrganationItem));

  return {
    formatedOrganationItems,
    allShopItems,
    selectedShopKeys,
    itemMap,
  };
}

const buildTreeData = (formatedOrganationItems: FormatedOrganationItem[], targetKeys: string[]) => {
  function buildShop(formatedShopItem: FormatedShopItem): FormatedShopItem {
    return {
      ...formatedShopItem,
      disabled: targetKeys.includes(formatedShopItem.key) || formatedShopItem.disabled,
    };
  }

  function buildOrg(formatedOrganationItem: FormatedOrganationItem): FormatedOrganationItem {
    const children = formatedOrganationItem.children.map((item) => {
      if (item.type === ItemType.Shop) {
        return buildShop(item);
      }
      return buildOrg(item);
    });
    let disabled = false;
    if (children.length) {
      disabled = children.every((i) => i.disabled);
    } else {
      disabled = true;
    }
    return {
      ...formatedOrganationItem,
      disabled,
      children,
    };
  }

  return formatedOrganationItems.map(buildOrg);
};

export default createModal<{}>(
  (_, setVisible, payload) => {
    const [rateStatus, setRateStatus] = useState<{ id: number; name: string }>({
      id: 0,
      name: '',
    });
    const [tansLoading, setTansLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const [itemMap, setItemMap] = useState<
      Record<string, PureFormatedShopItem | FormatedOrganationItem>
    >({});
    const [originOrgTreeData, setOriginOrgTreeData] = useState<FormatedOrganationItem[]>([]);
    const [orgTreeData, setOrgTreeData] = useState<FormatedOrganationItem[]>([]);
    const [allShopItems, setAllShopItems] = useState<PureFormatedShopItem[]>([]);
    const [selectedShopKeys, setSelectedShopKeys] = useState<string[]>([]);

    useEffect(() => {
      if (!payload || !payload.data) return;
      setRateStatus(payload.data);
    }, [payload]);

    useEffect(() => {
      if (!rateStatus.id) return;
      if (!tansLoading) setTansLoading(true);
      Promise.all([getBindedShopsData({ rateId: rateStatus.id }), getAllBindingShopsData()])
        .then(([boundShopItems, originOrganationItem]) => {
          const { formatedOrganationItems, allShopItems, selectedShopKeys, itemMap } = formatData(
            originOrganationItem,
            // @ts-ignore
            boundShopItems
          );
          setItemMap(itemMap);
          setOriginOrgTreeData(formatedOrganationItems);
          setAllShopItems(allShopItems);
          setSelectedShopKeys(selectedShopKeys);
        })
        .finally(() => setTansLoading(false));
    }, [rateStatus]);

    const handleChange = (targetKeys: string[]) => {
      const newTargetKeys: string[] = [];

      const getOrgShops = (org: FormatedOrganationItem): string[] => {
        const shopKeys: string[] = [];
        org.children.forEach((item) => {
          if (item.type === ItemType.Shop) {
            shopKeys.push(item.key);
          } else {
            const subKeys = getOrgShops(item);
            subKeys.forEach((subKey) => shopKeys.push(subKey));
          }
        });
        return shopKeys;
      };

      targetKeys.forEach((key: string) => {
        const target = itemMap[key];
        if (target) {
          if (target.type === ItemType.Shop) {
            newTargetKeys.push(key);
          } else {
            const subKeys = getOrgShops(target);
            subKeys.forEach((subKey) => newTargetKeys.push(subKey));
          }
        }
      });
      setSelectedShopKeys(newTargetKeys);
    };

    const handleOk = () => {
      // @ts-ignore
      const selectedShopItems: {
        platformId: number;
        platformShopId: string;
      }[] = selectedShopKeys
        .map((key) => {
          const target = itemMap[key];
          if (target && target.type === ItemType.Shop) {
            return {
              platformId: target.platformId,
              platformShopId: target.platformShopId,
            };
          }
          return null;
        })
        .filter((i) => i);
      if (!confirmLoading) setConfirmLoading(true);
      const bindExistingParams = {
        rateId: rateStatus.id,
        shopList: selectedShopItems,
      };
      bindShops(bindExistingParams)
        .then(() => {
          message.success('绑定已有门店成功！');
          setVisible(false);
          payload.onSuccess && payload.onSuccess();
        })
        .finally(() => setConfirmLoading(false));
    };

    const isChecked = (selectedKeys, eventKey) => selectedKeys.indexOf(eventKey) !== -1;

    useEffect(() => {
      setOrgTreeData(buildTreeData(originOrgTreeData, selectedShopKeys));
    }, [originOrgTreeData, selectedShopKeys]);

    const children = (
      <>
        <Spin spinning={tansLoading}>
          <Row style={{ paddingLeft: 80, marginBottom: 40 }}>
            <Col style={{ fontWeight: 700 }}>
              <span>费率模版名称：</span>
              <span>
                {rateStatus.name || (
                  <span style={{ fontSize: 13, fontStyle: 'italic' }}>暂无数据</span>
                )}
              </span>
            </Col>
          </Row>
          <Row justify="center" className={styles.transfer}>
            <Transfer
              titles={['待选门店', '已绑定门店']}
              operations={['绑定', '移除']}
              dataSource={allShopItems}
              targetKeys={selectedShopKeys}
              onChange={handleChange}
              render={(item) => item.title}
            >
              {({ direction, onItemSelect, selectedKeys }) => {
                if (direction === 'left') {
                  const checkedKeys = [...selectedKeys, ...selectedShopKeys];
                  return (
                    <Tree
                      blockNode
                      checkable
                      defaultExpandAll
                      checkedKeys={selectedKeys}
                      treeData={orgTreeData}
                      onCheck={(_, { node: { key } }) => {
                        onItemSelect(key, !isChecked(checkedKeys, key));
                      }}
                      onSelect={(_, { node: { key } }) => {
                        onItemSelect(key, !isChecked(checkedKeys, key));
                      }}
                    />
                  );
                }
                return null;
              }}
            </Transfer>
          </Row>
        </Spin>
      </>
    );
    return [
      {
        confirmLoading,
        onCancel: () => {
          !confirmLoading && setVisible(false);
        },
        onOk: handleOk,
      },
      children,
    ];
  },
  {
    title: '绑定门店',
    width: 800,
  }
);
