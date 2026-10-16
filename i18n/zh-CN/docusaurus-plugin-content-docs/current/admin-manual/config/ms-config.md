---
{
    "title": "Meta Service 配置项",
    "language": "zh-CN",
    "description": "存算分离模式下 Meta Service 配置项的类型、默认值、动态修改能力及作用。"
}
---

本页收录 4.1.5 新增的 Meta Service 配置项，尚未覆盖全部配置。Meta Service 使用 `doris_cloud.conf`；这些配置不属于 FE 的 `fe.conf` 或 BE 的 `be.conf`。

## 事务管理

### `enable_get_prepare_txn_by_coordinator_by_running_key`

| 项 | 值 |
| --- | --- |
| 类型 | Boolean |
| 默认值 | `true` |
| 是否支持动态修改 | 是 |
| 版本 | 4.1.5 新增 |

控制按 Coordinator 查找准备阶段事务时的扫描方式。默认先扫描运行中事务的索引，再取得相应事务信息，避免扫描数量更多的全部事务记录；设置为 `false` 时直接扫描事务信息记录。两种方式不改变查询事务的条件和结果，通常保留默认值即可。

在 Meta Service 的 `doris_cloud.conf` 中可显式配置：

```properties
enable_get_prepare_txn_by_coordinator_by_running_key = true
```
