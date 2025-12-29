---
{
    "title": "SHOW INDEX",
    "language": "zh-CN",
    "description": "该语句用于展示一个表中索引的相关信息，目前只支持 inverted index, ann index 索引"
}
---

## 描述

 该语句用于展示一个表中索引的相关信息，目前只支持 inverted index, ann index 索引

## 语法  

```SQL
SHOW INDEX [ ES ] FROM [ <db_name>. ] <table_name> [ FROM <db_name> ];
```

## 变种语法

```SQL
SHOW KEY[ S ] FROM [ <db_name>. ] <table_name> [ FROM <db_name> ];
```

## 必选参数

**1. `<table_name>`**：索引归属的表名。

## 可选参数

**1. `<db_name>`**：库名，选填，不填默认当前库。

## 返回值

| 列名           | 类型     | 说明                                                                                                       |
|--------------|--------|----------------------------------------------------------------------------------------------------------|
| Table        | string | 索引所在的表的名称。                                                                                               |
| Non_unique   | int    | 指示该索引是否为唯一索引：<br> - `0`：唯一索引<br> - `1`：非唯一索引                                                             |
| Key_name     | string | 索引的名称。                                                                                                   |
| Seq_in_index | int    | 索引中列的顺序。该列显示的是列在索引中的位置，多个列组成复合索引时使用。                                                                     |
| Column_name  | string | 被索引的列名。                                                                                                  |
| Collation    | string | 索引列的排序方式：<br> - `A`：升序<br> - `D`：降序。                                                     |
| Cardinality  | int    | 索引中独立值的数量。该值用于估计查询效率，值越大，表示索引的选择性越高，查询效率越好。                                                              |
| Sub_part     | int    | 索引所使用的前缀长度。如果索引列为字符串类型，`Sub_part` 表示索引的前几个字符长度。                                                          |
| Packed       | string | 索引是否压缩。                                                                                                  |
| Null         | string | 是否允许 `NULL` 值：<br> - `YES`：允许 `NULL` 值<br> - `NO`：不允许 `NULL` 值                                           |
| Index_type   | string | 索引的类型：<br> - `BTREE`：B+ 树索引（MySQL 默认类型）<br> - `HASH`：哈希索引<br> - `RTREE`：R 树索引<br> - `INVERTED`：倒排索引（如全文索引） |
| Comment      | string | 索引的注释或描述，通常为自定义的备注信息。                                                                                    |
| Properties   | string | 索引的附加属性。                                                                                                 |


## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象          | 说明    |
|:-----------|:------------|:------|
| SHOW_PRIV  | 库（Database） |       |

## 示例

- 展示指定 table_name 的下索引
     
     ```SQL
      SHOW INDEX FROM example_db.table_name;
     ```


