---
{
    "title": "异常数据处理",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

在导入过程中，源数据列与目标列的数据类型可能存在不一致的情况。导入过程会对这些类型不一致的数据进行转换，但在转换过程中可能会出现字段类型不匹配、字段超长、精度不匹配等问题，从而导致转换失败。

为了处理这些异常情况，Doris 提供了两个重要的控制参数：

- 严格模式 (strict_mode)：用于控制是否过滤转换失败的数据行。
- 最大过滤比例 (max_filter_ratio)：用于设置可容忍的异常数据所占总数据的最大比例。

## 严格模式 

严格模式具有两个主要功能：
1. 对导入过程中发生列类型转换失败的数据行进行过滤。
2. 在部分列更新场景中，限制只能更新已存在的列。

### 列类型转换失败的过滤策略

根据严格模式的设置，系统会采取不同的处理策略：

- 关闭严格模式时：转换失败的字段将被设置为 NULL 值，包含这些 NULL 值的异常数据行会与正确的数据行一起导入。

- 开启严格模式时：系统会过滤掉转换失败的数据行，仅导入正确的数据行。这里的"转换失败"特指：原始数据非 NULL，但在列类型转换后结果为 NULL 的情况。需要注意的是，这里的列类型转换不包括使用函数计算得到的 NULL 值。

- 对于 NULL 值的处理：无论是正确的数据行还是异常的数据行都可能包含 NULL 值。如果目标列被定义为不允许 NULL 值，则包含 NULL 值的数据行都会被过滤掉。

**1. 以列类型为 TinyInt 来举例：**

| 原始数据类型 | 原始数据举例  | 转换为 TinyInt 后的值 | 严格模式   | 结果             |
| ------------ | ------------- | --------------------- | ---------- | ---------------- |
| 空值         | \N            | NULL                  | 开启或关闭 | NULL             |
| 非空值       | "abc" or 2000 | NULL                  | 开启       | 非法值（被过滤） |
| 非空值       | "abc"         | NULL                  | 关闭       | NULL             |
| 非空值       | 1             | 1                     | 开启或关闭 | 正确导入         |

:::tip
1. 表中的列允许导入空值

2. `abc` 及 `2000` 在转换为 TinyInt 后，会因类型或精度问题变为 NULL。在严格模式开启的情况下，这类数据将会被过滤。而如果是关闭状态，则会导入 `null`。
:::

**2. 以列类型为 Decimal(1,0) 举例**

| 原始数据类型 | 原始数据举例 | 转换为 Decimal 后的值 | 严格模式   | 结果             |
| ------------ | ------------ | --------------------- | ---------- | ---------------- |
| 空值         | \N           | null                  | 开启或关闭 | NULL             |
| 非空值       | aaa          | NULL                  | 开启       | 非法值（被过滤） |
| 非空值       | aaa          | NULL                  | 关闭       | NULL             |
| 非空值       | 1 or 10      | 1 or 10               | 开启或关闭 | 正确导入         |

:::tip
1. 表中的列允许导入空值

2. `abc` 在转换为 Decimal 后，会因类型问题变为 NULL。在严格模式开启的情况下，这类数据将会被过滤。而如果是关闭状态，则会导入 `null`。

3. `10` 虽然是一个超过范围的值，但是因为其类型符合 decimal 的要求，所以严格模式对其不产生影响。
:::


### 限定部分列更新只能更新已有的列

在严格模式下，部分列更新插入的每一行数据必须满足该行数据的 Key 在表中已经存在。而在非严格模式下，进行部分列更新时可以更新 Key 已经存在的行，也可以插入 Key 不存在的新行。

例如有表结构如下：
```sql
CREATE TABLE user_profile
(
    id               INT,
    name             VARCHAR(10),
    age              INT,
    city             VARCHAR(10),
    balance          DECIMAL(9, 0),
    last_access_time DATETIME
) ENGINE=OLAP
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true"
);
```

表中有一条数据如下：
```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time   |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     400 | 2023-07-01 12:00:00|
+------+-------+------+----------+---------+---------------------+
```

当用户使用严格模式的 Insert Into 部分列更新向表中插入上述数据时，由于开启了严格模式且第二、三行的数据的 key(`(3)`, `(18)`) 不在原表中，所以本次插入会失败：
```sql
SET enable_unique_key_partial_update=true;
SET enable_insert_strict = true;
INSERT INTO user_profile (id, balance, last_access_time) VALUES
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has filtered data in strict mode
```

当用户使用非严格模式的 Insert Into 部分列更新向表中插入如下数据时：
```sql
SET enable_unique_key_partial_update=true;
SET enable_insert_strict = false;
INSERT INTO user_profile (id, balance, last_access_time) VALUES 
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
```

表中原有的一条数据将会被更新，此外还向表中插入了两条新数据。对于插入的数据中用户没有指定的列，如果该列有默认值，则会以默认值填充；否则，如果该列可以为 NULL，则将以 NULL 值填充；否则本次插入不成功。

查询结果如下：
```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time    |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     500 | 2023-07-03 12:00:01 |
|    3 | NULL  | NULL | NULL     |      23 | 2023-07-03 12:00:02 |
|   18 | NULL  | NULL | NULL     | 9999999 | 2023-07-03 12:00:03 |
+------+-------+------+----------+---------+---------------------+
```

### 开启严格模式
严格模式（strict_mode）默认为 False，以下是各种导入方式的设置方法：

**Stream Load**
 ```shell
 curl --location-trusted -u user:passwd \
 -H "strict_mode: true" \
 -T data.txt \
 http://host:port/api/example_db/test_table/_stream_load
 ```

**Broker Load**
```sql
LOAD LABEL example_db.label_1
(
    DATA INFILE("s3://bucket/data.txt")
    INTO TABLE test_table
)
WITH S3 (...)
PROPERTIES
(
    "strict_mode" = "true"
);
```

**Routine Load**
 ```sql
 CREATE ROUTINE LOAD example_db.job1 ON test_table
 PROPERTIES
 (
     "strict_mode" = "true"
 )
 FROM KAFKA (...);
 ```

 **MySQL Load**
```sql
LOAD DATA LOCAL INFILE 'data.txt'
INTO TABLE test_table
PROPERTIES
(
    "strict_mode" = "true"
);
```

**Insert Into**
```sql
SET enable_insert_strict = true;
INSERT INTO test_table ...;
```

## 最大过滤比例

最大过滤比例（max_filter_ratio）是一个重要的导入控制参数，它定义了导入过程中可以容忍的异常数据所占总数据的最大比例。如果实际过滤比例低于设定的最大过滤比例，导入任务将继续执行，异常数据会被忽略；如果超过这个比例，导入任务将失败。

### 过滤比例计算方法

- Filtered Rows 因数据质量不合格而被过滤掉的数据。数据质量不合格包括类型错误、精度错误、字符串长度超长、文件列数不匹配等数据格式问题，以及因没有对应的分区而被过滤掉的数据行。

- Unselected Rows 这部分为因 [前置过滤](./load-data-convert.md#前置过滤) 或 [后置过滤](./load-data-convert.md#后置过滤) 条件而被过滤掉的数据行。

- Loaded Rows 被正确导入的数据行。

过滤比例的计算公式为：
```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```

也就是说 `Unselected Rows` 不会参与过滤比例的计算。


### 最大过滤比例设置
最大过滤比例（max_filter_ratio）默认为 0，表示不允许任何异常数据。以下是各种导入方式的设置方法：

**Stream Load**
```shell
curl --location-trusted -u user:passwd \
-H "max_filter_ratio: 0.1" \
-T data.txt \
http://host:port/api/example_db/my_table/_stream_load
```

**Broker Load**
```sql
LOAD LABEL example_db.label_1
(
    DATA INFILE("s3://bucket/data.txt")
    INTO TABLE test_table
)
WITH S3 (...)
PROPERTIES
(
    "max_filter_ratio" = "0.1"
);
```

**Routine Load**
```sql
CREATE ROUTINE LOAD example_db.job1 ON test_table
PROPERTIES
(
    "max_filter_ratio" = "0.1"
)
FROM KAFKA (...);
```

**MySQL Load**
```sql
LOAD DATA LOCAL INFILE 'data.txt'
INTO TABLE test_table
PROPERTIES
(
    "max_filter_ratio" = "0.1"
);
```

**Insert Into**
```sql
SET insert_max_filter_ratio = 0.1;
INSERT INTO test_table FROM S3/HDFS/LOCAL();
```

:::tip
对于 Insert Into 语句，`insert_max_filter_ratio` 仅在 `enable_insert_strict = false` 时生效，且只适用于 `INSERT INTO FROM S3/HDFS/LOCAL()` 语法。默认值为 1.0，表示允许所有异常数据被过滤。
::: 