---
{
    "title": "SWITCH CATALOG",
    "language": "zh-CN",
    "description": "该语句用于切换数据目录（catalog）。"
}
---

## 描述

该语句用于切换数据目录（catalog）。

## 语法

```sql
SWITCH <catalog_name>
```

## 必选参数

**1. `<catalog_name>`**
> 要切换的数据目录名称。

## 权限控制

| 权限        | 对象   | 说明                                  |
|-----------|------|-------------------------------------|
| SELECT_PRIV | 数据目录 | 需要对要切换的数据目录（catalog）有 SELECT_PRIV 权限。 |


## 示例

1. 切换到数据目录 hive

   ```sql
  	SWITCH hive;
  	```

