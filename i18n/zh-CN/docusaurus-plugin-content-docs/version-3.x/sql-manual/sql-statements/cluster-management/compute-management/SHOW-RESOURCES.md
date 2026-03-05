---
{
    "title": "SHOW RESOURCES",
    "language": "zh-CN",
    "description": "该语句用于展示用户有使用权限的资源。普通用户仅能展示有使用权限的资源，root 或 admin 用户会展示所有的资源。"
}
---

## 描述

该语句用于展示用户有使用权限的资源。普通用户仅能展示有使用权限的资源，root 或 admin 用户会展示所有的资源。

## 语法

```sql
SHOW RESOURCES
[
  WHERE
  [NAME [ = "<your_resource_name>" | LIKE "<name_matcher>"]]
  [RESOURCETYPE = "<type>"]
] | [LIKE "<pattern>"]
[ORDER BY ...]
[LIMIT <limit>][OFFSET <offset>];
```

## 注意事项

1. 如果使用 NAME LIKE，则会匹配 RESOURCES 的 Name 包含 name_matcher 的 Resource
2. 如果使用 NAME = ，则精确匹配指定的 Name
3. 如果指定了 RESOURCETYPE，则匹配对应的 Resource 类型，支持的 RESOURCETYPE，可参考 [CREATE-RESOURCE](./CREATE-RESOURCE.md);
4. 可以使用 ORDER BY 对任意列组合进行排序
5. 如果指定了 LIMIT，则显示 limit 条匹配记录。否则全部显示
6. 如果指定了 OFFSET，则从偏移量 offset 开始显示查询结果。默认情况下偏移量为 0。
7. 如果使用了 LIKE，则会忽略 WHERE 语句。

## 示例

1. 展示当前用户拥有权限的所有 Resource
    
    ```sql
    SHOW RESOURCES;
    ```

2. 展示指定 Resource，NAME 中包含字符串 "20140102"，展示 10 个属性
    
    ```sql
    SHOW RESOURCES WHERE NAME LIKE "2014_01_02" LIMIT 10;
    ```

3. 展示指定 Resource，指定 NAME 为 "20140102" 并按 KEY 降序排序
    
    ```sql
    SHOW RESOURCES WHERE NAME = "20140102" ORDER BY `KEY` DESC;
    ```

4. 使用 LIKE 进行模糊匹配

    ```sql
    SHOW RESOURCES LIKE "jdbc%";
    ```