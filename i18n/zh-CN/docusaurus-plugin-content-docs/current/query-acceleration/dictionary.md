---
{
    "title": "字典表（实验性功能）",
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

## 概述

字典表（Dictionary）是 Doris 提供的一种用于加速 JOIN 操作的特殊数据结构。它通过将常用的键值对预先加载到内存中，实现快速的查找操作，从而提升查询性能。字典表特别适用于需要频繁进行键值查找的场景。

## 使用场景

字典表主要适用于以下场景：

1. 需要频繁进行键值查找的场景
2. 维度表较小，可以完全加载到内存中
3. 数据更新频率相对较低的场景
4. 需要优化 JOIN 操作性能的场景

## 字典表定义

### 基本语法

```sql
CREATE DICTIONARY <dict_name> USING <source_table>
(
    <key_column> KEY[,
    ...,
    <key_columns> VALUE]
    <value_column> VALUE[,
    ...,
    <value_columns> VALUE]
)
LAYOUT(<layout_type>)
PROPERTIES(
    "<priority_item_key>" = "<priority_item_value>"[,
    ...,
    "<priority_item_key>" = "<priority_item_value>"]
);
```

其中：

- `<dict_name>`：字典表的名字
- `<source_table>`：源数据表
- `<key_column>`：作为键的列在源表中的列名
- `<value_column>`：作为值的列在源表中的列名
- `<layout_type>`：字典表的存储布局类型，详见后文。
- `<priority_item_key>`：表的某项属性名
- `<priority_item_value>`：表的某项属性取值

`<key_column>` 不必出现在 `<value_column>` 前。

### 布局类型

目前支持两种布局类型：

- `HASH_MAP`：基于哈希表的实现，适用于一般的键值查找场景
- `IP_TRIE`：基于 Trie 树的实现，专门优化用于 IP 地址类型的查找。Key 列需要为 CIDR 表示法表示的 IP 地址，查询时依 CIDR 表示法匹配。

### 属性

当前字典仅有一项允许且必须出现的属性：

|属性名|值类型|含义|
|-|-|-|
|`date_lifetime`|整数，单位为秒|数据有效期。当该字典上次更新距今时间超过该值时，将会自动发起重新导入|

### 示例

```sql
-- 创建源数据表
CREATE TABLE source_table (
    id INT NOT NULL,
    city VARCHAR(32) NOT NULL,
    code VARCHAR(32) NOT NULL
) ENGINE=OLAP
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES("replication_num" = "1");

-- 创建字典表
CREATE DICTIONARY city_dict USING source_table
(
    city KEY,
    id VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime' = '600');
```

基于该表，我们可以使用字典 `city_dict` 通过 `dict_get` 函数，基于 `source_table` 的 `city` 值查询对应的 `id`。

### 使用限制

1. Key 列

   - IP_TRIE 类型字典的 Key 列必须为 Varchar 或 String 类型，**Key 列中的值必须为 CIDR 格式**。
   - HASH_MAP 类型字典的 Key 列支持所有简单类型（即排除所有 Map、Array 等嵌套类型）。
   - 作为 Key 列的列，**在源表中不得存在重复值**，否则字典导入数据时将报错。

2. Nullable 属性

   - 所有 Key 列必须为 NOT NULLABLE, Value 列无限制。

## 使用与管理

### 导入（刷新）数据

字典支持自动与手动导入。

#### 自动导入

自动导入发生在以下时机：

1. 字典建立以后
2. 字典数据过期时（见[属性](#属性)）
3. BE 状态显示丢失该字典数据（有新 BE 上线，或旧 BE 重启等均有可能造成）

#### 手动导入

Doris 支持通过以下命令手动刷新字典的数据：

```sql
REFRESH DICTIONARY <dict_name>;
```

其中 `<dict_name>` 为要导入数据的字典名。

#### 导入注意事项

1. 只有导入数据后的字典才可以查询。
2. 如果导入时 Key 列具有重复值，导入事务会失败。
3. 如果导入的数据版本早于 BE 已有的版本，则事务会失败。
4. 如果当前已经有导入事务正在进行（字典 Status 为 `LOADING` ），则手动进行的导入会失败。请等待正在进行的导入完成后操作。

### 查询字典

可以分别使用 `dict_get` 和 `dict_get_many` 函数进行单一 Key、Value 列和多 Key、Value 列的字典表查询。

#### 语法

```sql
VALUE_TYPE dict_get("<db_name>.<dict_name>", "<query_column>", <query_key_value>);
STRUCT<VALUE_TYPES> dict_get_many("<db_name>.<dict_name>", ARRAY<VARCHAR> <query_columns>, STRUCT <query_key_values>);
```

其中：

- `<db_name>` 为字典所在的 database 名
- `<dict_name>` 为字典名
- `<query_columns>` 为要查询的 value 列列名
- `<query_key_value>` 为用来查询的 key 列数据
- `<value_col_names>` 为一个包含要查询的 value 列列名的常量数组
- `<query_key_values>` 为一个包含该字典所有 key 列对应数据的 STRUCT

`dict_get` 的返回类型为 `<query_column>` 对应的字典列类型。
`dict_get_many` 的返回类型为 `<query_columns>` 对应的各个字典列类型所组成的 STRUCT。

#### 查询示例

该语句查询 `test_db` database 内的字典 `city_dict`，查询 key 列值为 "Beijing" 时的对应 `id` 列值：

```sql
SELECT dict_get("test_db.city_dict", "id", "Beijing");
```

该语句查询 `test_db` database 内的字典 `single_key_dict`，查询 key 列值为 1 时的对应 `k1` 和 `k3` 列值：

```sql
SELECT dict_get_many("test_db.single_key_dict", ["k1", "k3"], struct(1));
```

该语句查询 `test_db` database 内的字典 `multi_key_dict`，查询 2 个 key 列值依次为 2 和 'ABC' 时的对应 `k1` 和 `k3` 列值：

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

例如建表语句如下：

```sql
create table if not exists multi_key_table(
    k0 int not null,
    k1 varchar not null,
    k2 float not null,
    k3 varchar not null
)
DISTRIBUTED BY HASH(`k0`) BUCKETS auto
properties("replication_num" = "1");

create dictionary multi_key_dict using multi_key_table
(
    k0 KEY,
    k1 KEY,
    k2 VALUE,
    k3 VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime' = '600');
```

则上述语句

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

的返回值类型为 `STRUCT<float, varchar>`。

#### 查询注意事项

1. 当查询的 Key 数据不存在于字典表内时，返回 null。
2. IP_TRIE 类型进行查询时，**`<query_key_value>` 类型必须为 `IPV4` 或 `IPV6`**。
3. 使用 IP_TRIE 类型字典时，key 列 `<key_column>` 内的数据和查询时使用的 `<query_key_value>` 同时支持 `IPV4` 和 `IPV6` 格式数据。
4. 当查询的值不存在时，返回值为 null。

### 字典表管理

字典表支持以下管理和查看语句：

1. 查看当前 database 内所有字典表状态

    ```sql
    SHOW DICTIONARIES [LIKE <LIKE_NAME>];
    ```

2. 查看特定字典定义

    ```sql
    DESC DICTIONARY <dict_name>;
    ```

3. 删除字典表

    ```sql
    DROP DICTIONARY <dict_name>;
    ```

### 状态显示

通过 `SHOW DICTIONARIES` 语句，可以查看字典对应的基表，当前数据版本号，以及对应在 FE 和 BE 的状态。

```sql
> SHOW DICTIONARIES;
+--------------+----------------+----------------------------------------------+---------+--------+------------------------------------+------------------------------+
| DictionaryId | DictionaryName | BaseTableName                                | Version | Status | DataDistribution                   | LastUpdateResult             |
+--------------+----------------+----------------------------------------------+---------+--------+------------------------------------+------------------------------+
| 51           | precision_dict | internal.test_refresh_dict.precision_test    | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=368} | 2025-02-18 09:58:12: succeed |
| 48           | product_dict   | internal.test_refresh_dict.product_info      | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=240} | 2025-02-18 09:58:12: succeed |
| 49           | ip_dict        | internal.test_refresh_dict.ip_info           | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=194} | 2025-02-18 09:58:12: succeed |
| 52           | order_dict     | internal.test_refresh_dict.column_order_test | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=432} | 2025-02-18 09:58:12: succeed |
| 50           | user_dict      | internal.test_refresh_dict.user_info         | 2       | NORMAL | {10.16.10.2:9767 ver=2 memory=240} | 2025-02-18 09:58:12: succeed |
+--------------+----------------+----------------------------------------------+---------+--------+------------------------------------+------------------------------+
```

其中：

1. `Version` 代表数据版本号，每次数据导入时将会自增 1。

2. `Status` 代表字典状态，含义如下：

    |状态名|含义|可以进行的操作|
    |-|-|-|
    |NORMAL|字典当前正常|查询、导入、删除|
    |LOADING|字典当前正在进行导入|查询|
    |OUT_OF_DATE|字典当前数据已过期|查询、导入、删除|

3. `DataDistribution` 表示在各个 BE 的当前状态，包括版本号及内存占用大小(KB)。

4. `LastUpdateResult` 表示上一次导入（包括自动及手动）的结果，如果有异常，将会在此处显示详细信息。

如需查看字典表的列定义，可以通过 `DESC DICTIONARY` 进行。例如：

```sql
> DESC DICTIONARY city_code_dict;
+-------------+-------------+------+-------+
| Field       | Type        | Null | Key   |
+-------------+-------------+------+-------+
| city_name   | varchar(32) | NO   | true  |
| region_code | varchar(32) | NO   | false |
+-------------+-------------+------+-------+
```

#### 状态注意事项

1. 每次 `SHOW DICTIONARIES` 都会实时拉取所有 BE 的对应字典状态，如当前 Database 内字典过多，推荐通过 LIKE 子句依 `DictionaryName` 进行过滤。

## 注意事项

1. 数据一致性

   - 字典每次刷新都将产生新的版本，查询时如 BE 记录的版本与 FE 版本不一致，查询将会失败。
   - Doris 不会监控字典表与基表的数据一致性。用户需要通过业务逻辑适时更新。
   - 当源表被删除时，对应的字典表也会被自动删除。
   - 删除数据库时，其中的字典表也会被删除。

2. 性能考虑

   - 字典表适用于相对静态的数据，如维表数据等。
   - 字典表为纯内存表，全量数据存储于所有 BE 内存中，占用较大，需要权衡内存使用和查询性能，选择合适的表派生字典。

3. 最佳实践

    1. 合理选择键值列：

       - 选择基数适中的列作为键

    2. 布局选择：

       - 对于一般场景使用 HASH_MAP 布局
       - 对于 IP 地址的范围匹配场景使用 IP_TRIE 布局

    3. 状态管理：

       - 定期监控字典表的内存使用情况
       - 适时更新字典表数据以保持数据的最新状态

## 完整示例

1. HASH_MAP

    ```sql
    -- 创建源数据表
    CREATE TABLE cities (
        city_id INT NOT NULL,
        city_name VARCHAR(32) NOT NULL,
        region_code VARCHAR(32) NOT NULL
    ) ENGINE=OLAP
    DISTRIBUTED BY HASH(city_id) BUCKETS 1
    PROPERTIES("replication_num" = "1");

    -- 插入数据
    INSERT INTO cities VALUES
    (1, 'Beijing', 'BJ'),
    (2, 'Shanghai', 'SH'),
    (3, 'Guangzhou', 'GZ');

    -- 创建字典表
    CREATE DICTIONARY city_code_dict USING cities
    (
        city_name KEY,
        region_code VALUE
    )
    LAYOUT(HASH_MAP)
    PROPERTIES('data_lifetime' = '600');

    -- 刷新字典
    REFERSH DICTIONARY city_code_dict;

    -- 使用字典表查询
    SELECT dict_get("test_refresh_dict.city_code_dict", "region_code", "Beijing");
    +------------------------------------------------------------------------+
    | dict_get('test_refresh_dict.city_code_dict', 'region_code', 'Beijing') |
    +------------------------------------------------------------------------+
    | BJ                                                                     |
    +------------------------------------------------------------------------+
    ```

2. IP_TRIE

    ```sql
    -- 创建源数据表
    CREATE TABLE ip_locations (
        ip_range VARCHAR(30) NOT NULL,
        country VARCHAR(64) NOT NULL,
        region VARCHAR(64) NOT NULL,
        city VARCHAR(64) NOT NULL
    ) ENGINE=OLAP
    DISTRIBUTED BY HASH(ip_range) BUCKETS 1
    PROPERTIES("replication_num" = "1");

    -- 插入一些示例数据
    INSERT INTO ip_locations VALUES
    ('1.0.0.0/24', 'United States', 'California', 'Los Angeles'),
    ('1.0.1.0/24', 'China', 'Beijing', 'Beijing'),
    ('1.0.4.0/24', 'Japan', 'Tokyo', 'Tokyo');

    -- 创建 IP 地址字典表
    CREATE DICTIONARY ip_location_dict USING ip_locations
    (
        ip_range KEY,
        country VALUE,
        region VALUE,
        city VALUE
    )
    LAYOUT(IP_TRIE)
    PROPERTIES('data_lifetime' = '600');

    -- 刷新字典表数据
    REFRESH DICTIONARY ip_location_dict;

    -- 查询 IP 地址对应的位置信息，依 CIDR 匹配。
    SELECT
        dict_get("test_refresh_dict.ip_location_dict", "country", cast('1.0.0.1' as ipv4)) AS country,
        dict_get("test_refresh_dict.ip_location_dict", "region", cast('1.0.0.2' as ipv4)) AS region,
        dict_get("test_refresh_dict.ip_location_dict", "city", cast('1.0.0.3' as ipv4)) AS city;
    +---------------+------------+-------------+
    | country       | region     | city        |
    +---------------+------------+-------------+
    | United States | California | Los Angeles |
    +---------------+------------+-------------+
    ```

## 错误排查

1. 查询时报错 "can not find dict name"

    首先通过 `SHOW DICTIONARIES` 确认字典是否存在。如存在，重新刷新对应字典数据。

2. 查询报错 "dict_get() only support IP type for IP_TRIE"

    确认 IP_TRIE 类型字典的 Key 列是否严格满足 CIDR 格式。

3. 导入报错 "Version ID is not greater than the existing version ID for the dictionary."

    通过 `DROP DICTIONARY` 命令删除对应字典后重新建立并导入数据。
