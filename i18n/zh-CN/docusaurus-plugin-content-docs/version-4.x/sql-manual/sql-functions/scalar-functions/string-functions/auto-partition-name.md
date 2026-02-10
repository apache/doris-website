---
{
    "title": "AUTO_PARTITION_NAME",
    "language": "zh-CN",
    "description": "AUTOPARTITIONNAME 函数用于生成自动分区的分区名称。支持两种模式：RANGE 模式按时间单位生成分区名，LIST 模式根据字符串生成分区名。"
}
---

## 描述

AUTO_PARTITION_NAME 函数用于生成自动分区的分区名称。支持两种模式：RANGE 模式按时间单位生成分区名，LIST 模式根据字符串生成分区名。

自 Apache Doris 2.1.6 版本开始支持。

## 语法

```sql
AUTO_PARTITION_NAME('RANGE', <unit>, <datetime>)
AUTO_PARTITION_NAME('LIST', <value>[, <value> ...])
```

## 参数

| 参数 | 说明 |
| ----------- | ----------------------------------------- |
| `'RANGE'` | RANGE 分区模式，根据时间生成分区名 |
| `'LIST'` | LIST 分区模式，根据字符串值生成分区名 |
| `<unit>` | RANGE 模式的时间单位：`year`、`month`、`day`、`hour`、`minute`、`second`。类型：VARCHAR |
| `<datetime>` | RANGE 模式的日期时间值。类型：DATETIME |
| `<value>` | LIST 模式的分区值（可多个）。类型：VARCHAR |

## 返回值

返回 VARCHAR 类型，为生成的分区名称。

特殊情况：
- RANGE 模式：分区名格式为 `pYYYYMMDDHHMMSS`，根据 unit 截断到对应精度
- LIST 模式：分区名格式为 `p<value><length>`，多个值用长度分隔
- 如果参数无效，返回错误

## 示例

1. 基本用法：RANGE 按天分区
```sql
SELECT auto_partition_name('range', 'day', '2022-12-12 19:20:30');
```
```text
+------------------------------------------------------------+
| auto_partition_name('range', 'day', '2022-12-12 19:20:30') |
+------------------------------------------------------------+
| p20221212000000                                            |
+------------------------------------------------------------+
```

2. RANGE 按月分区
```sql
SELECT auto_partition_name('range', 'month', '2022-12-12 19:20:30');
```
```text
+--------------------------------------------------------------+
| auto_partition_name('range', 'month', '2022-12-12 19:20:30') |
+--------------------------------------------------------------+
| p20221201000000                                              |
+--------------------------------------------------------------+
```

3. LIST 单个值
```sql
SELECT auto_partition_name('list', 'helloworld');
```
```text
+-------------------------------------------+
| auto_partition_name('list', 'helloworld') |
+-------------------------------------------+
| phelloworld10                             |
+-------------------------------------------+
```

4. LIST 多个值
```sql
SELECT auto_partition_name('list', 'hello', 'world');
```
```text
+-----------------------------------------------+
| auto_partition_name('list', 'hello', 'world') |
+-----------------------------------------------+
| phello5world5                                 |
+-----------------------------------------------+
```

5. UTF-8 特殊字符支持：LIST 模式
```sql
SELECT auto_partition_name('list', 'ṭṛì', 'ḍḍumai');
```
```text
+------------------------------------------------+
| auto_partition_name('list', 'ṭṛì', 'ḍḍumai')  |
+------------------------------------------------+
| pṭṛì9ḍḍumai12                                  |
+------------------------------------------------+
```

6. 无效的 unit 参数
```sql
SELECT auto_partition_name('range', 'years', '2022-12-12');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = range auto_partition_name must accept year|month|day|hour|minute|second for 2nd argument
```

### Keywords

    AUTO_PARTITION_NAME,AUTO,PARTITION,NAME