---
{
    "title": "ADMIN-SET-CONFIG",
    "language": "zh-CN"
}
---

## ADMIN-SET-CONFIG

### Name

ADMIN SET CONFIG

## 描述

该语句用于设置集群的配置项（当前仅支持设置FE的配置项）。
可设置的配置项，可以通过 ADMIN SHOW FRONTEND CONFIG; 命令查看。

语法：

```sql
 ADMIN SET FRONTEND CONFIG ("key" = "value");
```

## 举例

1. 设置 'disable_balance' 为 true

        ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");

### Keywords

    ADMIN, SET, CONFIG

### Best Practice

