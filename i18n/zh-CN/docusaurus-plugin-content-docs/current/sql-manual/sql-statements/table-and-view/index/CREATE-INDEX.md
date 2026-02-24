---
{
    "title": "CREATE INDEX",
    "language": "zh-CN",
    "description": "为表创建新的索引，必须指定表名和索引名，可选指定索引类型、属性、注释。"
}
---

## 描述

为表创建新的索引，必须指定表名和索引名，可选指定索引类型、属性、注释。

## 语法

```sql
CREATE INDEX [IF NOT EXISTS] <index_name> 
             ON <table_name> (<column_name> [, ...])
             [USING {INVERTED | NGRAM_BF}]
             [PROPERTIES ("<key>" = "<value>"[ , ...])]
             [COMMENT '<index_comment>']
```

## 必选参数

**1. `<index_name>`**

> 指定索引的标识符（即名称），在其所在的表（Table）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

**2. `<table_name>`**

> 指定表的标识符（即名称），在其所在的数据库（Database）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

**3. `<column_name> [, ...]`**

> 指定在哪些列上创建索引（目前仅支持一个），列在其所在的（Table）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

## 可选参数

**1. `USING {INVERTED | NGRAM_BF}`**

> 指定索引类型，目前支持两种：**INVERTED** 倒排索引，**NGRAM_BF** ngram bloomfilter 索引。

**2. `PROPERTIES ("<key>" = "<value>"[ ,  ...])`**

> 指定索引的参数，使用通用的 PROPERTIES 格式，每个索引支持的参数及语义，请参考具体类型的索引文档。

**3. `COMMENT '<index_comment>'`**

> 指定索引的注释，便于维护。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限 | 对象 | 说明                 |
| :---------------- | :------------- | :----------------------------- |
| ALTER_PRIV        | 表    | CREATE INDEX 属于表 ALTER 操作 |

## 注意事项

- **INVERTED** 倒排索引创建后对新写入的数据立即生效，历史数据的索引需要进行 BUILD INDEX 操作。
- **NGRAM_BF** NGram BloomFilter 索引创建后会在后台对所用数据进行 schema change 以完成索引构建，进度可以通过 SHOW ALTER TABLE COLUMN 查看进度

## 示例

- 在 table1 上创建倒排索引 index1

    ```sql
    CREATE INDEX index1 ON table1 USING INVERTED;
    ```

- 在 table1 上创建 NGram BloomFilter 索引 index2

    ```sql
    CREATE INDEX index2 ON table1 USING NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="1024");
    ```

- 在 table1 上创建 ANN 索引 index3

    ```sql
    CREATE INDEX index3 ON table1 (`embedding`) USING ANN PROPERTIES(
      "index_type"="hnsw",
      "metric_type"="l2_distance",
      "dim"="128"
    );
    ```
