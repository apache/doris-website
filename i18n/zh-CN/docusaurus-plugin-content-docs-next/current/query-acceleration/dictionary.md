---
{
    "title": "字典表（实验性功能）",
    "language": "zh-CN",
    "description": "字典表(Dictionary) 是 Doris 提供的一种用于加速 JOIN 操作的特殊数据结构。它在普通表的基础上建立，将原表的对应列视为键值关系，将这些列的全部数据预先加载到内存中，实现快速的查找操作，从而提升查询性能。特别适用于需要频繁进行键值查找的场景。"
}
---

## 概述

字典表(Dictionary) 是 Doris 提供的一种用于加速 JOIN 操作的特殊数据结构。它在普通表的基础上建立，将原表的对应列视为键值关系，将这些列的全部数据预先加载到内存中，实现快速的查找操作，从而提升查询性能。特别适用于需要频繁进行键值查找的场景。

自然地，作为键值查找解决方案，字典表不容许重复 Key 的出现。

## 使用场景

字典表主要适用于以下场景：

1. 需要频繁进行键值查找的场景
2. 维度表较小，可以完全加载到内存中
3. 数据更新频率相对较低的场景

原本需要使用 LEFT OUTER JOIN 实现的键值查找，在字典表的帮助下可以完全省去 JOIN 的开销，转变为普通的函数调用。以下是一个完整的场景示例：

### 场景示例

在电商系统中，订单表(`orders`, 事实表)记录了大量交易数据，需要经常关联商品表(`products`, 维度表)来获取商品的详细信息。

```sql
-- 商品维度表
CREATE TABLE products (
    product_id BIGINT NOT NULL COMMENT "商品ID",
    product_name VARCHAR(128) NOT NULL COMMENT "商品名称",
    brand_name VARCHAR(64) NOT NULL COMMENT "品牌名称",
    category_name VARCHAR(64) NOT NULL COMMENT "品类名称",
    retail_price DECIMAL(10,2) NOT NULL COMMENT "零售价",
    update_time DATETIME NOT NULL COMMENT "更新时间"
)
DISTRIBUTED BY HASH(`product_id`) BUCKETS 10;

-- 订单事实表
CREATE TABLE orders (
    order_id BIGINT NOT NULL COMMENT "订单ID",
    product_id BIGINT NOT NULL COMMENT "商品ID",
    user_id BIGINT NOT NULL COMMENT "用户ID",
    quantity INT NOT NULL COMMENT "购买数量",
    actual_price DECIMAL(10,2) NOT NULL COMMENT "实际成交价",
    order_time DATETIME NOT NULL COMMENT "下单时间"
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 32;

-- 插入示例数据
INSERT INTO products VALUES
(1001, 'iPhone 15 Pro 256G 黑色', 'Apple', '手机数码', 8999.00, '2024-01-01 00:00:00'),
(1002, 'MacBook Pro M3 Max', 'Apple', '电脑办公', 19999.00, '2024-01-01 00:00:00'),
(1003, 'AirPods Pro 2', 'Apple', '手机配件', 1999.00, '2024-01-01 00:00:00');

INSERT INTO orders VALUES
(10001, 1001, 88001, 1, 8899.00, '2024-02-22 10:15:00'),
(10002, 1002, 88002, 1, 19599.00, '2024-02-22 11:30:00'),
(10003, 1003, 88001, 2, 1899.00, '2024-02-22 14:20:00');
```

以下是一组典型的查询，为了统计各品类的订单量和销售额，以往我们需要使用 LEFT OUTER JOIN 来完成从商品表中提取商品信息的功能。

```sql
-- 统计各品类的订单量和销售额
SELECT 
    p.category_name,
    p.brand_name,
    COUNT(DISTINCT o.order_id) as order_count,
    SUM(o.quantity) as total_quantity,
    SUM(o.actual_price * o.quantity) as total_amount
FROM orders o
LEFT JOIN products p ON o.product_id = p.product_id
WHERE o.order_time >= '2024-02-22 00:00:00'
GROUP BY p.category_name, p.brand_name
ORDER BY total_amount DESC;
```

```text
+---------------+------------+-------------+----------------+--------------+
| category_name | brand_name | order_count | total_quantity | total_amount |
+---------------+------------+-------------+----------------+--------------+
| 电脑办公      | Apple      |           1 |              1 |     19599.00 |
| 手机数码      | Apple      |           1 |              1 |      8899.00 |
| 手机配件      | Apple      |           1 |              2 |      3798.00 |
+---------------+------------+-------------+----------------+--------------+
```

在这类查询中，我们需要频繁地通过 `product_id` 查询商品的其他信息，这本质上是一种 KV 查找操作。

设定好键值对关系，预先构建对应的字典表，可以完全将之前的 JOIN 操作转换为更轻的键值查找，提升 SQL 执行效率：

```sql
-- 创建商品信息字典
CREATE DICTIONARY product_info_dict USING products
(
    product_id KEY,
    product_name VALUE,
    brand_name VALUE,
    category_name VALUE,
    retail_price VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES(
    'data_lifetime'='300'  -- 考虑到商品信息变更频率，设置5分钟更新一次
);
```

原始查询借助字典表将 JOIN 操作转换为了 `dict_get` 函数查找，该函数为较轻的 KV 查找操作：

```sql
SELECT
    dict_get("test.product_info_dict", "category_name", o.product_id) as category_name,
    dict_get("test.product_info_dict", "brand_name", o.product_id) as brand_name,
    COUNT(DISTINCT o.order_id) as order_count,
    SUM(o.quantity) as total_quantity,
    SUM(o.actual_price * o.quantity) as total_amount
FROM orders o
WHERE o.order_time >= '2024-02-22 00:00:00'
GROUP BY
    dict_get("test.product_info_dict", "category_name", o.product_id),
    dict_get("test.product_info_dict", "brand_name", o.product_id)
ORDER BY total_amount DESC;
```

```text
+---------------+------------+-------------+----------------+--------------+
| category_name | brand_name | order_count | total_quantity | total_amount |
+---------------+------------+-------------+----------------+--------------+
| 电脑办公      | Apple      |           1 |              1 |     19599.00 |
| 手机数码      | Apple      |           1 |              1 |      8899.00 |
| 手机配件      | Apple      |           1 |              2 |      3798.00 |
+---------------+------------+-------------+----------------+--------------+
```

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

`<key_column>` 和 `<value_column>` 至少各有一个。`<key_column>` 不必出现在 `<value_column>` 前。

### 布局类型

目前支持两种布局类型：

- `HASH_MAP`：基于哈希表的实现，适用于一般的键值查找场景
- `IP_TRIE`：基于 Trie 树的实现，专门优化用于 IP 地址类型的查找。Key 列需要为 CIDR 表示法表示的 IP 地址，查询时依 CIDR 表示法匹配。

### 属性

|属性名|值类型|含义|必须项|
|-|-|-|-|
|`date_lifetime`|整数，单位为秒|数据有效期。当该字典上次更新距今时间超过该值且基表有数据变化时，将会自动发起重新导入，导入逻辑详见[自动导入](#自动导入)|是|
|`skip_null_key`|布尔值|向字典导入时如果 Key 列中出现 null 值，如果该值为 `true`，跳过该行数据，否则报错。缺省值为 `false`|否|
|`memory_limit`|整数，单位为 byte|该字典在单一 BE 上所占内存的上限，缺省值为 `2147483648` 即 2GB|否|

### 示例

```sql
-- 创建源数据表
CREATE TABLE source_table (
    id INT NOT NULL,
    city VARCHAR(32) NOT NULL,
    code VARCHAR(32) NOT NULL
) ENGINE=OLAP
DISTRIBUTED BY HASH(id) BUCKETS 1;

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
   - IP_TRIE 类型的字典只允许出现一个 Key 列。
   - HASH_MAP 类型字典的 Key 列支持所有简单类型（即排除所有 Map、Array 等嵌套类型）。
   - 作为 Key 列的列，**在源表中不得存在重复值**，否则字典导入数据时将报错。

2. Null 值处理

   - 字典的所有列都可以是 Nullable 列，但 Key 列不应当实际出现 null 值。如果出现，行为取决于[属性](#属性)当中的 `skip_null_key`。

## 使用与管理

### 导入（刷新）数据

字典支持自动与手动导入。字典的导入也被称为“刷新”操作。

#### 自动导入

自动导入发生在以下时机：

1. 字典建立以后
2. 字典数据过期时（见[属性](#属性)）
3. BE 状态显示缺少该字典数据（有新 BE 上线，或旧 BE 重启等均有可能造成）

Doris 将每隔 `dictionary_auto_refresh_interval_seconds` 秒检查所有字典数据是否过期。当某字典未更新数据超过 `data_lifetime` 秒，且**基表数据相比上次导入时有变化**时，Doris 将会自动提交对该字典的导入。

如果部分 BE 缺少数据，且基表数据相比上次导入没有变化，则 Doris 仅会在对应 BE 上补齐当前版本的数据，不会提交全体 BE 的刷新任务，字典的 version 也不会变化。

#### 手动导入

Doris 支持通过以下命令手动刷新字典的数据：

```sql
REFRESH DICTIONARY <dict_name>;
```

其中 `<dict_name>` 为要导入数据的字典名。

#### 导入注意事项

1. 只有导入数据后的字典才可以查询。
2. 如果导入时 Key 列具有重复值，导入事务会失败。
3. 如果当前已经有导入事务正在进行（字典 Status 为 `LOADING` ），则手动进行的导入会失败。请等待正在进行的导入完成后操作。
4. 如果导入的字典大小超过设定的 `memory_limit`，导入事务会失败。

### 查询字典

可以分别使用 `dict_get` 和 `dict_get_many` 函数进行单一 Key、Value 列和多 Key、Value 列的字典表查询。

首次查询请待字典导入完成以后进行。

#### 语法

```sql
dict_get("<db_name>.<dict_name>", "<query_column>", <query_key_value>);
dict_get_many("<db_name>.<dict_name>", <query_columns>, <query_key_values>);
```

其中：

- `<db_name>` 为字典所在的 database 名
- `<dict_name>` 为字典名
- `<query_column>` 为要查询的 value 列列名，类型为 `VARCHAR`，**必须为常量**
- `<query_columns>` 为要查询的所有 value 列列名，类型为 `ARRAY<VARCHAR>`，**必须为常量**
- `<query_key_value>` 为用来查询的 key 列数据
- `<query_key_values>` 为一个包含该字典**所有 key 列**的需查询数据的 STRUCT

`dict_get` 的返回类型为 `<query_column>` 对应的字典列类型。
`dict_get_many` 的返回类型为 `<query_columns>` 对应的各个字典列类型所组成的 [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT)。

#### 查询示例

该语句查询 `test_db` database 内的字典 `city_dict`，查询 key 列值为 "Beijing" 时的对应 `id` 列值：

```sql
SELECT dict_get("test_db.city_dict", "id", "Beijing");
```

该语句查询 `test_db` database 内的字典 `single_key_dict`，查询 key 列值为 1 时的对应 `k1` 和 `k3` 列值：

```sql
SELECT dict_get_many("test_db.single_key_dict", ["k1", "k3"], struct(1));
```

该语句查询 `test_db` database 内的字典 `multi_key_dict`，查询 2 个 key 列值依次为 2 和 'ABC' 时的对应 `k2` 和 `k3` 列值：

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
DISTRIBUTED BY HASH(`k0`) BUCKETS auto;

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

1. 当查询的 Key 数据不存在于字典表内，**或 Key 数据为 null 时**，返回 null。
2. IP_TRIE 类型进行查询时，**`<query_key_value>` 类型必须为 `IPV4` 或 `IPV6`**。
3. 使用 IP_TRIE 类型字典时，key 列 `<key_column>` 内的数据和查询时使用的 `<query_key_value>` 同时支持 `IPV4` 和 `IPV6` 格式数据。
4. 当特定 BE 因为新上线或宕机重启等原因没有字典数据时，如果在该 BE 上执行对应字典的查询将会失败。查询是否调度到该 BE 取决于多种因素。在 FE Master 压力不大时减小[配置项](#配置项) `dictionary_auto_refresh_interval_seconds` 的值可以缩短字典不可用时间。

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

    删除字典表后，被删除的字典可能不会立即从 BE 中移除。

#### 配置项

字典表支持以下配置项，均为 FE CONFIG：

1. `dictionary_task_queue_size` —— 字典所有任务的线程池的队列长度，不可动态调整。默认值 1024，一般不需要调整。
2. `job_dictionary_task_consumer_thread_num` —— 字典所有任务的线程池的线程数量，不可动态调整。默认值 3。
3. `dictionary_rpc_timeout_ms` —— 字典所有相关 rpc 的超时时间，可以动态调整。默认 5000（即 5s），一般不需要调整。
4. `dictionary_auto_refresh_interval_seconds` —— 自动检查所有字典数据是否过期的间隔，默认 5（秒），可以动态调整。

### 状态显示

通过 `SHOW DICTIONARIES` 语句，可以查看字典对应的基表，当前数据版本号，以及对应在 FE 和 BE 的状态。

```sql
> SHOW DICTIONARIES;
```

```text
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

    |状态名|含义|
    |-|-|
    |NORMAL|字典当前正常|
    |LOADING|字典当前正在进行导入|
    |OUT_OF_DATE|字典当前数据已过期|

    字典正在导入时，不能再次对其进行导入。

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

## 注意事项

1. 数据一致性

   - 字典每次刷新都将产生新的版本，查询时如 BE 记录的版本与 FE 版本不一致，查询将会失败。
   - Doris 不会保持字典表与基表的数据强一致性。用户需要妥善设置字典的 `data_lifetime` 以期自动更新，并在必要时根据业务逻辑辅以手动更新。
   - 当源表以任何方式被删除时，对应的字典表也会被自动删除。

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
       - 选取合适的数据更新间隔，并在业务侧明确数据过期时手动刷新字典。
       - 使用字典表时应关注 BE 内存监控，防止字典表过多、过大占据过多内存，导致 BE 状态异常。

## 完整示例

1. HASH_MAP

    ```sql
    -- 创建源数据表
    CREATE TABLE cities (
        city_id INT NOT NULL,
        city_name VARCHAR(32) NOT NULL,
        region_code VARCHAR(32) NOT NULL
    ) ENGINE=OLAP
    DISTRIBUTED BY HASH(city_id) BUCKETS 1;

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

    -- 使用字典表查询
    SELECT dict_get("test_refresh_dict.city_code_dict", "region_code", "Beijing");
    ```

    ```text
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
    DISTRIBUTED BY HASH(ip_range) BUCKETS 1;

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

    -- 查询 IP 地址对应的位置信息，依 CIDR 匹配。
    SELECT
        dict_get("test_refresh_dict.ip_location_dict", "country", cast('1.0.0.1' as ipv4)) AS country,
        dict_get("test_refresh_dict.ip_location_dict", "region", cast('1.0.0.2' as ipv4)) AS region,
        dict_get("test_refresh_dict.ip_location_dict", "city", cast('1.0.0.3' as ipv4)) AS city;
    ```

    ```text
    +---------------+------------+-------------+
    | country       | region     | city        |
    +---------------+------------+-------------+
    | United States | California | Los Angeles |
    +---------------+------------+-------------+
    ```

3. HASH_MAP 多 Key / 多 Value

    ```sql
    -- 商品SKU维度表：包含了商品的基本属性
    CREATE TABLE product_sku_info (
        product_id INT NOT NULL COMMENT "商品ID",
        color_code VARCHAR(32) NOT NULL COMMENT "颜色编码",
        size_code VARCHAR(32) NOT NULL COMMENT "尺码编码",
        product_name VARCHAR(128) NOT NULL COMMENT "商品名称",
        color_name VARCHAR(32) NOT NULL COMMENT "颜色名称",
        size_name VARCHAR(32) NOT NULL COMMENT "尺码名称",
        stock INT NOT NULL COMMENT "库存",
        price DECIMAL(10,2) NOT NULL COMMENT "价格",
        update_time DATETIME NOT NULL COMMENT "更新时间"
    )
    DISTRIBUTED BY HASH(`product_id`) BUCKETS 10;

    -- 订单明细表：记录实际的销售数据
    CREATE TABLE order_details (
        order_id BIGINT NOT NULL COMMENT "订单ID",
        product_id INT NOT NULL COMMENT "商品ID",
        color_code VARCHAR(32) NOT NULL COMMENT "颜色编码",
        size_code VARCHAR(32) NOT NULL COMMENT "尺码编码",
        quantity INT NOT NULL COMMENT "购买数量",
        order_time DATETIME NOT NULL COMMENT "下单时间"
    )
    DISTRIBUTED BY HASH(`order_id`) BUCKETS 10;

    -- 插入商品SKU数据
    INSERT INTO product_sku_info VALUES
    (1001, 'BLK', 'M', 'Nike运动T恤', '黑色', 'M码', 100, 199.00, '2024-02-23 10:00:00'),
    (1001, 'BLK', 'L', 'Nike运动T恤', '黑色', 'L码', 80, 199.00, '2024-02-23 10:00:00'),
    (1001, 'WHT', 'M', 'Nike运动T恤', '白色', 'M码', 90, 199.00, '2024-02-23 10:00:00'),
    (1001, 'WHT', 'L', 'Nike运动T恤', '白色', 'L码', 70, 199.00, '2024-02-23 10:00:00'),
    (1002, 'RED', 'S', 'Adidas运动裤', '红色', 'S码', 50, 299.00, '2024-02-23 10:00:00'),
    (1002, 'RED', 'M', 'Adidas运动裤', '红色', 'M码', 60, 299.00, '2024-02-23 10:00:00'),
    (1002, 'BLU', 'S', 'Adidas运动裤', '蓝色', 'S码', 55, 299.00, '2024-02-23 10:00:00'),
    (1002, 'BLU', 'M', 'Adidas运动裤', '蓝色', 'M码', 65, 299.00, '2024-02-23 10:00:00');

    -- 插入订单数据
    INSERT INTO order_details VALUES
    (10001, 1001, 'BLK', 'M', 2, '2024-02-23 12:01:00'),
    (10002, 1001, 'WHT', 'L', 1, '2024-02-23 12:05:00'),
    (10003, 1002, 'RED', 'S', 1, '2024-02-23 12:10:00'),
    (10004, 1001, 'BLK', 'L', 3, '2024-02-23 12:15:00'),
    (10005, 1002, 'BLU', 'M', 2, '2024-02-23 12:20:00');

    -- 创建多键多值字典
    CREATE DICTIONARY sku_dict USING product_sku_info
    (
        product_id KEY,
        color_code KEY,
        size_code KEY,
        product_name VALUE,
        color_name VALUE,
        size_name VALUE,
        price VALUE,
        stock VALUE
    )
    LAYOUT(HASH_MAP)
    PROPERTIES('data_lifetime'='300');

    -- 使用dict_get_many的查询示例：获取订单详情及SKU信息
    WITH order_sku_info AS (
        SELECT 
            o.order_id,
            o.quantity,
            o.order_time,
            dict_get_many("test.sku_dict", 
                ["product_name", "color_name", "size_name", "price", "stock"],
                struct(o.product_id, o.color_code, o.size_code)
            ) as sku_info
        FROM order_details o
        WHERE o.order_time >= '2024-02-23 12:00:00'
            AND o.order_time < '2024-02-23 13:00:00'
    )
    SELECT 
        order_id,
        order_time,
        struct_element(sku_info, 'product_name') as product_name,
        struct_element(sku_info, 'color_name') as color_name,
        struct_element(sku_info, 'size_name') as size_name,
        quantity,
        struct_element(sku_info, 'price') as unit_price,
        quantity * struct_element(sku_info, 'price') as total_amount,
        struct_element(sku_info, 'stock') as current_stock
    FROM order_sku_info
    ORDER BY order_time;
    ```

    ```text
    +----------+---------------------+-----------------+------------+-----------+----------+------------+--------------+---------------+
    | order_id | order_time          | product_name    | color_name | size_name | quantity | unit_price | total_amount | current_stock |
    +----------+---------------------+-----------------+------------+-----------+----------+------------+--------------+---------------+
    |    10001 | 2024-02-23 12:01:00 | Nike运动T恤     | 黑色       | M码       |        2 |     199.00 |       398.00 |           100 |
    |    10002 | 2024-02-23 12:05:00 | Nike运动T恤     | 白色       | L码       |        1 |     199.00 |       199.00 |            70 |
    |    10003 | 2024-02-23 12:10:00 | Adidas运动裤    | 红色       | S码       |        1 |     299.00 |       299.00 |            50 |
    |    10004 | 2024-02-23 12:15:00 | Nike运动T恤     | 黑色       | L码       |        3 |     199.00 |       597.00 |            80 |
    |    10005 | 2024-02-23 12:20:00 | Adidas运动裤    | 蓝色       | M码       |        2 |     299.00 |       598.00 |            65 |
    +----------+---------------------+-----------------+------------+-----------+----------+------------+--------------+---------------+
    ```

## 错误排查

1. 查询时报错 "can not find dict name"

    首先通过 `SHOW DICTIONARIES` 确认字典是否存在。如存在，重新刷新对应字典数据。

2. 查询报错 "dict_get() only support IP type for IP_TRIE"

    确认 IP_TRIE 类型字典的 Key 列是否严格满足 CIDR 格式。

3. 导入报错 "Version ID is not greater than the existing version ID for the dictionary."

    通过 `DROP DICTIONARY` 命令删除对应字典后重新建立并导入数据。

4. `SHOW DICTIONARIES` 发现字典在某个 BE 的 Version 大于 FE Version

    通过 `DROP DICTIONARY` 命令删除对应字典后重新建立并导入数据。

5. 导入报错 "Dictionary `X` commit version `Y` failed"

    重新对该字典进行导入。

6. 兜底策略

    对于绝大多数报错，如果正常操作失败， `DROP` 之后重建字典可以解决。
