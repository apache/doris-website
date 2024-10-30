---
{
    "title": "错误数据处理",
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

在导入过程中，原始列跟目标列的数据类型可能不完全一致，导入会对数据类型不一致的原始列值进行转换。转换过程中可能会发生字段类型不匹配、字段超长、精度不匹配等转换失败的情况。

严格模式 (strict_mode) 用于控制导入过程中是否会对这些转换失败的错误数据行进行过滤。

最大错误率 (max_filter_ratio) 用于控制能容忍的过滤掉的错误数据行所占的最大比例。

## 严格模式 

严格模式有两个作用，一是对导入过程中列类型转换失败的错误数据行进行过滤；二是对部分列更新场景，限定部分列更新只能更新已有的列。

### 列类型转换失败进行过滤

严格模式过滤的策略如下：

- 关闭严格模式，会把转换失败的错误字段转换成 NULL 值，并把这些包含 NULL 值的错误数据行跟正确的数据行一起导入。

- 开启严格模式，会把转换失败的错误数据行过滤掉，只导入正确的数据行。这里的错误数据行是指：原始数据并不为 `NULL`，而在进行列类型转换后结果为 `NULL` 的这行数据。这里说指的 `列类型转换`，并不包括用函数计算得出的 `NULL` 值。

- 正确的数据行和错误的数据行都有可能存在 `NULL` 值。如果目标列不允许 `NULL` 值，也会把这些包含 `NULL` 值的数据行过滤掉。

对于导入的某列类型包含范围限制的，如果原始数据能正常通过类型转换，但无法通过范围限制的，严格模式对其也不产生影响。例如：如果类型是 `decimal(1,0)`, 原始数据为 10，则属于可以通过类型转换但不在列声明的范围内。这种数据严格模式对其不产生影响。

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

3. `10` 虽然是一个超过范围的值，但是因为其类型符合 decimal 的要求，所以严格模式对其不产生影响。`10` 最后会在其他导入处理流程中被过滤。但不会被严格模式过滤。
:::


### 限定部分列更新只能更新已有的列

在严格模式下，部分列更新插入的每一行数据必须满足该行数据的 Key 在表中已经存在。而在而非严格模式下，进行部分列更新时可以更新 Key 已经存在的行，也可以插入 Key 不存在的新行。

例如有表结构如下：
```
mysql> desc user_profile;
+------------------+-----------------+------+-------+---------+-------+
| Field            | Type            | Null | Key   | Default | Extra |
+------------------+-----------------+------+-------+---------+-------+
| id               | INT             | Yes  | true  | NULL    |       |
| name             | VARCHAR(10)     | Yes  | false | NULL    | NONE  |
| age              | INT             | Yes  | false | NULL    | NONE  |
| city             | VARCHAR(10)     | Yes  | false | NULL    | NONE  |
| balance          | DECIMALV3(9, 0) | Yes  | false | NULL    | NONE  |
| last_access_time | DATETIME        | Yes  | false | NULL    | NONE  |
+------------------+-----------------+------+-------+---------+-------+
```

表中有一条数据如下：

```sql
1,"kevin",18,"shenzhen",400,"2023-07-01 12:00:00"
```

当用户使用非严格模式的 Stream Load 部分列更新向表中插入如下数据时

```sql
1,500,2023-07-03 12:00:01
3,23,2023-07-03 12:00:02
18,9999999,2023-07-03 12:00:03
```

```shell
curl  --location-trusted -u root -H "partial_columns:true" -H "strict_mode:false" -H "column_separator:," -H "columns:id,balance,last_access_time" -T /tmp/test.csv http://host:port/api/db1/user_profile/_stream_load
```

表中原有的一条数据将会被更新，此外还向表中插入了两条新数据。对于插入的数据中用户没有指定的列，如果该列有默认值，则会以默认值填充；否则，如果该列可以为 NULL，则将以 NULL 值填充；否则本次插入不成功。

当用户使用严格模式的 Stream Load 部分列更新向表中插入上述数据时，由于开启了严格模式且第二、三行的数据的 key(`(3)`, `(18)`) 不在原表中，所以本次导入会失败。

```shell
curl  --location-trusted -u root -H "partial_columns:true" -H "strict_mode:true" -H "column_separator:," -H "columns:id,balance,last_access_time" -T /tmp/test.csv http://host:port/api/db1/user_profile/_stream_load
```

### 设置方法
严格模式默认情况下都为 False，即关闭状态。 不同的导入方式设置严格模式的方式不尽相同。

[STREAM LOAD](./import-way/stream-load-manual.md)

   ```shell
   curl --location-trusted -u user:passwd \
   -H "strict_mode: true" \
   -T 1.txt \
   http://host:port/api/example_db/my_table/_stream_load
   ```

[BROKER LOAD](./import-way/broker-load-manual.md)

   ```sql
   LOAD LABEL example_db.example_label_1
   (
       DATA INFILE("s3://your_bucket_name/your_file.txt")
       INTO TABLE load_test
       COLUMNS TERMINATED BY ","
   )
   WITH S3
   (
       "AWS_ENDPOINT" = "AWS_ENDPOINT",
       "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
       "AWS_SECRET_KEY"="AWS_SECRET_KEY",
       "AWS_REGION" = "AWS_REGION"
   )
   PROPERTIES
   (
        "strict_mode" = "true"
   );
   ```
[ROUTINE LOAD](./import-way/routine-load-manual.md)

   ```sql
   CREATE ROUTINE LOAD example_db.test_job ON my_table
   PROPERTIES
   (
       "strict_mode" = "true"
   ) 
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic"
   );
   ```

[MySQL Load](./import-way/mysql-load-manual.md)

   ```sql
   LOAD DATA LOCAL
   INFILE 'testData'
   INTO TABLE testDb.testTbl
   PROPERTIES
   (
       "strict_mode" = "true"
   );
   ```

[INSERT INTO](./import-way/insert-into-manual.md)

   ```sql
   SET enable_insert_strict = true;
   INSERT INTO my_table ...;
   ```

## 最大错误率

导入任务允许用户设置最大错误率 `max_filter_ratio` ，如果导入数据的错误率低于最大错误率，则这些错误行将被忽略，其他正确的数据将被导入, 否则该次导入就会失败。

### 错误率计算方法
导入作业中被处理的数据行可以分为如下三种：

- Filtered Rows 因数据质量不合格而被过滤掉的数据。数据质量不合格包括类型错误、精度错误、字符串长度超长、文件列数不匹配等数据格式问题，以及因没有对应的分区而被过滤掉的数据行。

- Unselected Rows 这部分为因 [前置过滤](./load-data-convert.md) 或 [后置过滤](./load-data-convert.md) 条件而被过滤掉的数据行。

- Loaded Rows 被正确导入的数据行。

错误率的计算为：

```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```

也就是说 `Unselected Rows` 不会参与错误率的计算。

### 设置方法
`max_filter_ratio` 默认为 0, 表示当有一条错误数据时，整个导入任务将会失败。

[Stream Load](./import-way/stream-load-manual.md)

   ```shell
   curl --location-trusted -u user:passwd \
   -H "max_filter_ratio: 0.1" \
   -T 1.txt \
   http://host:port/api/example_db/my_table/_stream_load
   ```

[Broker Load](./import-way/broker-load-manual.md)

   ```sql
   LOAD LABEL example_db.example_label_1
   (
        DATA INFILE("s3://your_bucket_name/your_file.txt")
        INTO TABLE load_test
        COLUMNS TERMINATED BY ","
   )
   WITH S3
   (
        "AWS_ENDPOINT" = "AWS_ENDPOINT",
        "AWS_ACCESS_KEY" = "AWS_ACCESS_KEY",
        "AWS_SECRET_KEY"="AWS_SECRET_KEY",
        "AWS_REGION" = "AWS_REGION"
   )
   PROPERTIES
   (
        "max_filter_ratio" = "0.1"
   );
   ```
[Routine Load](./import-way/routine-load-manual.md)

   ```sql
   CREATE ROUTINE LOAD example_db.test_job ON my_table
   PROPERTIES
   (
        "max_filter_ratio" = "0.1"
   ) 
   FROM KAFKA
   (
        "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
        "kafka_topic" = "my_topic"
   );
   ```

[MySQL Load](./import-way/mysql-load-manual.md)

   ```sql
   LOAD DATA LOCAL
   INFILE 'testData'
   INTO TABLE testDb.testTbl
   PROPERTIES (
        "max_filter_ratio"="0.1"
    );
   ```

[INSERT INTO](./import-way/insert-into-manual.md)

   ```sql
   SET insert_max_filter_ratio = 0.1;
   INSERT INTO my_table FROM S3/HDFS/LOCAL();
   ```
:::tip
仅当 `enable_insert_strict` 值为 `false` 时， `insert_max_filter_ratio` 才生效，只用于控制 `INSERT INTO FROM S3/HDFS/LOCAL()` 的最大错误率。默认为 1.0，表示容忍所有错误。
:::
