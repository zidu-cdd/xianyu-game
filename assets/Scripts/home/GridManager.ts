
import {
    _decorator,
    Component,
    Prefab,
    instantiate,
} from 'cc';

import {
    IconItem,
    IconItemData
} from './IconItem';

const { ccclass, property } = _decorator;

@ccclass('GridManager')
export class GridManager extends Component {

    @property(Prefab)
    iconPrefab: Prefab | null = null;


    /**
     * Item 之间的出现间隔
     *
     * 单位：秒
     */
    @property
    appearInterval = 0.03;


    start() {

        this.createItems();

    }


    // =========================================================
    // 创建首页按钮
    // =========================================================

    /**
     * 创建首页所有功能按钮
     *
     * 父节点挂 GridLayout，
     * 由 GridLayout 自动排列。
     */
    private createItems() {

        if (!this.iconPrefab) {

            console.error(
                '[GridManager] iconPrefab 未设置'
            );

            return;
        }


        const dataList =
            this.getDataList();


        for (
            let index = 0;
            index < dataList.length;
            index++
        ) {

            const data =
                dataList[index];


            /**
             * 实例化 Item
             */
            const item =
                instantiate(
                    this.iconPrefab
                );


            /**
             * 加入 Grid 父节点
             *
             * GridLayout 会自动计算位置。
             */
            this.node.addChild(item);


            /**
             * 获取 IconItem
             */
            const iconItem =
                item.getComponent(
                    IconItem
                );


            if (!iconItem) {

                console.error(
                    '[GridManager] iconPrefab 上没有找到 IconItem 组件'
                );

                continue;
            }


            /**
             * 错峰设置数据
             *
             * 第一个：
             * 0ms
             *
             * 第二个：
             * 60ms
             *
             * 第三个：
             * 120ms
             *
             * ...
             */
            const delay =
                index *
                this.appearInterval;


            if (delay <= 0) {

                iconItem.setData(data);

            } else {

                this.scheduleOnce(() => {

                    /**
                     * 防止场景已经销毁
                     */
                    if (!this.isValid) {
                        return;
                    }


                    if (!item.isValid) {
                        return;
                    }


                    iconItem.setData(data);

                }, delay);
            }
        }


        console.log(
            `[GridManager] 首页按钮创建完成，共 ${dataList.length} 个`
        );
    }


    // =========================================================
    // 首页按钮配置
    // =========================================================

    private getDataList(): IconItemData[] {

        return [

            // =================================================
            // 等级
            // =================================================

            {
                type: 'level',

                level: 1,

                name: '等级',

                iconPath: 'Home/Level',

                target: 'Profile',

                redPoint: false
            },


            // =================================================
            // 功能
            // =================================================

            {
                type: 'function',

                name: '签到',

                iconPath: 'Home/CheckIn',

                target: 'scene_sign',

                redPoint: true
            },


            {
                type: 'function',

                name: '设置',

                iconPath: 'Home/Settings',

                target: 'Settings',

                redPoint: false
            },


            {
                type: 'function',

                name: '图鉴',

                iconPath: 'Home/IllustrationBook',

                target: 'Collection',

                redPoint: false
            },


            {
                type: 'function',

                name: '客服',

                iconPath: 'Home/Customer',

                target: 'scene_service',

                redPoint: false
            },


            {
                type: 'function',

                name: '商城',

                iconPath: 'Home/Mall',

                target: 'scene_shop',

                redPoint: false
            },


            {
                type: 'function',

                name: '灵宠',

                iconPath: 'Home/Pet',

                target: 'scene_pet',

                redPoint: false
            },


            {
                type: 'function',

                name: '福利',

                iconPath: 'Home/Benefits',

                target: 'scene_welfare',

                redPoint: true
            }
        ];
    }
}

