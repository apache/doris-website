---
{
    "title": "BITMAP",
    "language": "zh-CN",
    "description": "介绍如何在 Apache Doris 中导入 BITMAP 类型数据，包含建表规范、Stream Load 示例及多元素 Bitmap 的两种导入方式。",
    "keywords": [
        "Doris BITMAP",
        "BITMAP 导入",
        "BITMAP_UNION",
        "to_bitmap",
        "bitmap_from_string",
        "bitmap_from_array",
        "Stream Load Bitmap",
        "聚合表 Bitmap"
    ]
}
---

<!-- 知识类型: 操作步骤 + 配置参数 -->
<!-- 适用场景: BITMAP 类型数据导入 / 精确去重 / 用户画像标签 -->

BITMAP 类型常用于精确去重、用户画像标签等场景。本文介绍 BITMAP 列在 Apache Doris 中的建表规范，并通过 Stream Load 演示单值与多元素两种导入方式。

## BITMAP 类型使用约束

在导入 BITMAP 数据前，请先了解以下约束：

| 约束项 | 说明 |
| --- | --- |
| 适用表模型 | Duplicate 表、Unique 表、Aggregate 表 |
| 列位置 | 仅可作为 Value 列，不能作为 Key 列 |
| 聚合表要求 | 在 Aggregate 表中必须使用聚合类型 `BITMAP_UNION` |
| 长度与默认值 | 无需指定长度和默认值，长度由系统根据聚合程度自动控制 |

更多类型说明请参考 [BITMAP 数据类型](../../../sql-manual/basic-element/sql-data-types/aggregate/BITMAP)。

## 场景一：导入单值 BITMAP 数据

适用于源数据中每行只包含一个整数值的场景，使用 `to_bitmap` 函数将单个整数转换为 BITMAP。

### 第 1 步：准备数据

创建 CSV 文件 `test_bitmap.csv`，每行包含一个整数值：

```text
1|koga|17723
2|nijg|146285
3|lojn|347890
4|lofn|489871
5|jfin|545679
6|kon|676724
7|nhga|767689
8|nfubg|879878
9|huang|969798
10|buag|97997
```

### 第 2 步：创建目标表

在 `testdb` 库中创建包含 BITMAP 列的聚合表：

```sql
CREATE TABLE testdb.test_bitmap(
    typ_id     BIGINT                NULL   COMMENT "ID",
    hou        VARCHAR(10)           NULL   COMMENT "one",
    arr        BITMAP  BITMAP_UNION  NOT NULL   COMMENT "two"
)
AGGREGATE KEY(typ_id,hou)
DISTRIBUTED BY HASH(typ_id,hou) BUCKETS 10;
```

### 第 3 步：执行 Stream Load 导入

通过 `to_bitmap` 函数将整数列转换为 BITMAP：

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=to_bitmap(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

### 第 4 步：验证导入结果

使用 `bitmap_to_string` 将 BITMAP 转回字符串以查看导入数据：

```sql
mysql> select typ_id,hou,bitmap_to_string(arr) from testdb.test_bitmap;
+--------+-------+-----------------------+
| typ_id | hou   | bitmap_to_string(arr) |
+--------+-------+-----------------------+
|      4 | lofn  | 489871                |
|      6 | kon   | 676724                |
|      9 | huang | 969798                |
|      3 | lojn  | 347890                |
|      8 | nfubg | 879878                |
|      7 | nhga  | 767689                |
|      1 | koga  | 17723                 |
|      2 | nijg  | 146285                |
|      5 | jfin  | 545679                |
|     10 | buag  | 97997                 |
+--------+-------+-----------------------+
10 rows in set (0.07 sec)
```

## 场景二：导入多元素 BITMAP 数据

当源数据中每行包含多个整数（例如多个用户 ID）时，可根据源文件格式选择以下两种方法之一。两种方法的差异如下：

| 方法 | 源文件格式 | 是否需要 cast 转换 | 备注 |
| --- | --- | --- | --- |
| `bitmap_from_string` | 逗号分隔，**不允许**方括号 | 否 | 出现方括号会被判定为数据质量错误 |
| `bitmap_from_array` | 逗号分隔，**允许**方括号 | 必须 `cast` 为 `array<int>` | 不做 cast 会因函数签名匹配失败而报错 |

### 方式 A：使用 bitmap_from_string

#### 数据格式要求

源文件 arr 列使用逗号分隔，不能包含方括号：

```text
1|koga|17,723
2|nijg|146,285
3|lojn|347,890
4|lofn|489,871
5|jfin|545,679
6|kon|676,724
7|nhga|767,689
8|nfubg|879,878
9|huang|969,798
10|buag|97,997
```

#### Stream Load 命令

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=bitmap_from_string(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

### 方式 B：使用 bitmap_from_array

#### 数据格式要求

源文件 arr 列允许包含方括号：

```text
1|koga|[17,723]
2|nijg|[146,285]
3|lojn|[347,890]
4|lofn|[489,871]
5|jfin|[545,679]
6|kon|[676,724]
7|nhga|[767,689]
8|nfubg|[879,878]
9|huang|[969,798]
10|buag|[97,997]
```

#### Stream Load 命令

在 Stream Load 中必须先将字符串 `cast` 成 `array<int>`，再通过 `bitmap_from_array` 转换：

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr_str,arr=bitmap_from_array(cast(arr_str as array<int>))" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

## 常见问题（Troubleshooting）

### 使用 bitmap_from_array 时报函数不存在错误

报错示例：

```text
[ANALYSIS_ERROR]TStatus: errCode = 2, detailMessage = Does not support non-builtin functions, or function does not exist: bitmap_from_array(<slot 8>)
```

- **原因**：未将 string 类型显式转换为 `array<int>`，导致无法匹配 `bitmap_from_array` 的函数签名。
- **解决方法**：在 Stream Load 的 `columns` 参数中使用 `cast(arr_str as array<int>)` 显式转换。

### 如何在查询时查看 BITMAP 列内容

BITMAP 是二进制聚合类型，无法直接 `SELECT` 查看，需要通过函数转换：

- `bitmap_to_string(col)`：将 BITMAP 转换为逗号分隔的字符串。
- `bitmap_count(col)`：返回 BITMAP 中元素的去重数量。

### 为什么 BITMAP 不能作为 Key 列

BITMAP 是聚合二进制类型，不支持作为 Key 列参与排序与去重，仅能作为 Value 列存储聚合结果。
