---
{
    "title": "ALTER STORAGE POLICY",
    "language": "zh-CN",
    "description": "该语句用于修改一个已有的冷热分层迁移策略。仅 root 或 admin 用户可以修改资源。"
}
---

## 描述

该语句用于修改一个已有的冷热分层迁移策略。仅 root 或 admin 用户可以修改资源。

## 语法
```sql
ALTER STORAGE POLICY  '<policy_name>' PROPERTIE ("<key>"="<value>"[, ... ]);
```

## 必选参数
| 参数名称          | 描述                                                         |
|-------------------|--------------------------------------------------------------|
| `<policy_name>`   | 存储策略的名称。这是您想要修改的存储策略的唯一标识符，必须指定一个已经存在的存储策略名称。 |

## 可选参数

| 参数名称          | 描述                                                         |
|-------------------|--------------------------------------------------------------|
| `retention_days`  | 数据保留天数。定义数据在存储中保持的时间长度，超过此期限的数据将被自动删除。 |
| `redundancy_level`| 冗余级别。定义数据副本的数量，以确保高可用性和容错能力。例如，值为 `2` 表示每个数据块有两份副本。 |
| `storage_type`    | 存储类型。指定使用的存储介质，如 SSD、HDD 或混合存储。这会影响性能和成本。 |
| `cooloff_time`    | 冷却时间。在数据被标记为可删除后，等待实际删除之前的时间间隔。用于防止误操作导致的数据丢失。 |
| `location_policy` | 地理位置策略。定义数据存放的地理位置，例如跨区域复制以实现灾难恢复。 |

## 示例

1. 修改名为 cooldown_datetime 冷热分层数据迁移时间点：
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES("cooldown_datetime" = "2023-06-08 00:00:00");
```
2. 修改名为 cooldown_ttl 的冷热分层数据迁移倒计时

```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "10000");
```
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "1h");
```
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "3d");
```
