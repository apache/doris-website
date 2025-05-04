---
{
    "title": "Dictionary Table(Experimental)",
    "language": "en"
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

## Overview

Dictionary is a special data structure provided by Doris to speed up JOIN operations. It is built on the basis of ordinary tables, treating the corresponding columns of the original table as key-value relationships, and pre-loading all the data of these columns into memory to achieve fast lookup operations, thus improving query performance. It is especially suitable for scenarios that require frequent key-value lookups.

Naturally, as a key-value lookup solution, dictionary tables do not allow duplicate keys.

## Usage Scenario

The dictionary table is mainly suitable for the following scenarios:

1. Scenarios where frequent key-value lookups are required
2. Dimension tables are small and can be fully loaded into memory
3. Scenarios with relatively low frequency of data updates

The key-value lookup that originally needed to be implemented using LEFT OUTER JOIN can be completely eliminated with the help of the dictionary table, transforming into a normal function call. Here is a complete scenario example:

### Scenario Example

In e-commerce systems, the order table (`orders`, fact table) records a large amount of transaction data, and it needs to frequently associate with the product table (`products`, dimension table) to obtain detailed product information.

```sql
-- Product Dimension Table
CREATE TABLE products (
    product_id BIGINT NOT NULL COMMENT "商品ID",
    product_name VARCHAR(128) NOT NULL COMMENT "商品名称",
    brand_name VARCHAR(64) NOT NULL COMMENT "品牌名称",
    category_name VARCHAR(64) NOT NULL COMMENT "品类名称",
    retail_price DECIMAL(10,2) NOT NULL COMMENT "零售价",
    update_time DATETIME NOT NULL COMMENT "更新时间"
)
DISTRIBUTED BY HASH(`product_id`) BUCKETS 10;

-- Order Fact Table
CREATE TABLE orders (
    order_id BIGINT NOT NULL COMMENT "订单ID",
    product_id BIGINT NOT NULL COMMENT "商品ID",
    user_id BIGINT NOT NULL COMMENT "用户ID",
    quantity INT NOT NULL COMMENT "购买数量",
    actual_price DECIMAL(10,2) NOT NULL COMMENT "实际成交价",
    order_time DATETIME NOT NULL COMMENT "下单时间"
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 32;

INSERT INTO products VALUES
(1001, 'iPhone 15 Pro 256G 黑色', 'Apple', '手机数码', 8999.00, '2024-01-01 00:00:00'),
(1002, 'MacBook Pro M3 Max', 'Apple', '电脑办公', 19999.00, '2024-01-01 00:00:00'),
(1003, 'AirPods Pro 2', 'Apple', '手机配件', 1999.00, '2024-01-01 00:00:00');

INSERT INTO orders VALUES
(10001, 1001, 88001, 1, 8899.00, '2024-02-22 10:15:00'),
(10002, 1002, 88002, 1, 19599.00, '2024-02-22 11:30:00'),
(10003, 1003, 88001, 2, 1899.00, '2024-02-22 14:20:00');
```

The following is a set of typical queries. In order to count the order volume and sales of each category, in the past, we needed to use LEFT OUTER JOIN to achieve the function of extracting product information from the product table.

```sql
-- Analyze the order volume and sales revenue of each category
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

In such queries, we need to frequently retrieve other information about products using the `product_id`, which essentially involves a KV lookup operation.

By setting up the key-value pair relationships and pre-building the corresponding dictionary tables, we can completely convert previous JOIN operations into lighter key-value lookups, thereby improving SQL execution efficiency:

```sql
-- Create product information dictionary
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
    'data_lifetime'='300'  -- Considering the frequency of changes in product information, set the update interval to 5 minutes.
);
```

The original query converts the JOIN operation into a `dict_get` function lookup using a dictionary table, which is a lighter KV lookup operation:

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

## Dictionary Table Definition

### Basic Grammar

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

Among:

- `<dict_name>`: The name of the dictionary table
- `<source_table>`: Source data table
- `<key_column>`: The column name in the source table that serves as a key
- `<value_column>`: The column name in the source table that serves as a value
- `<layout_type>`: The storage layout type of the dictionary table, see later for details.
- `<priority_item_key>`: The name of a certain property of a table
- `<priority_item_value>`: The value of a certain property of a table

`<key_column>` and `<value_column>` each must have at least one. `<key_column>` does not have to appear before `<value_column>`.

### Layout Type

Currently, two layout types are supported:

- `HASH_MAP`: An implementation based on a hash table, suitable for general key-value lookup scenarios.

- `IP_TRIE`: An implementation based on a Trie tree, specifically optimized for IP address type lookups. The Key column needs to be represented in CIDR notation for IP addresses, and queries are matched according to CIDR notation.

### Property

|Property Name|Value Type|Meaning|Required|
|-|-|-|-|
|`date_lifetime`|Integer, unit in seconds|Data validity period. When the time since the last update of this dictionary exceeds this value and the source table has data changes, it will automatically initiate a import. The import logic is detailed in [Automatic Import](#automatic-import)|Yes|
|`skip_null_key`|Boolean|If the Key column contains null values when load to a dictionary, skip the row if the value is `true`, otherwise raise an error. The default value is `false`|No|
|`memory_limit`|Integer, unit in bytes|The upper limit of memory occupied by this dictionary on a single BE. The deafult value is `2147483648`, which equals to 2GB.|No|

### Example

```sql
-- Create source data table
CREATE TABLE source_table (
    id INT NOT NULL,
    city VARCHAR(32) NOT NULL,
    code VARCHAR(32) NOT NULL
) ENGINE=OLAP
DISTRIBUTED BY HASH(id) BUCKETS 1;

-- Create dictionary table
CREATE DICTIONARY city_dict USING source_table
(
    city KEY,
    id VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime' = '600');
```

Based on the table, we can use the dictionary `city_dict` through the `dict_get` function to query the corresponding `id` based on the `city` value in `source_table`.

### Usage Restrictions

1. Key Columns

   - The Key column of the IP_TRIE type dictionary must be of Varchar or String type, **the values in the Key column must be in CIDR format**.
   - The dictionary of the IP_TRIE type allows only one Key column.
   - The Key column of the HASH_MAP type dictionary supports all simple types (i.e., excluding all nested types such as Map, Array, etc.).
   - As a Key column, **there must not be duplicate values in the source table**, otherwise an error will be reported when importing dictionary data.

2. Null Value Handling

   - All columns in the dictionary can be nullable columns, but the Key column should not actually appear with null values. If it does, the behavior depends on the `skip_null_key` in the [Property](#property).

## Use and Management

### Import (Refresh) Data

The dictionary supports automatic and manual import. "import" is also called "refresh" here.

#### Automatic Import

Automatic import occurs at the following times:

1. After the dictionary is established
2. When the dictionary data expires (see [Property](#property))
3. When the BE state shows the lack of the dictionary data (new BE going online, or old BE restarting, etc.)

Doris will check all dictionary data for expiration every `dictionary_auto_refresh_interval_seconds` seconds. When a dictionary has not been updated for more than `data_lifetime` seconds, and the source table data has changed compared to the last import, Doris will automatically submit the import for that dictionary.

If some BEs are missing data and the source table data has not changed compared to the last import, Doris will only fill in the current version of the data on the corresponding BEs, will not submit the refresh task for all BEs, and the dictionary's version will not change.

#### Manual Import

Doris supports manually refreshing dictionary data through the following commands:

```sql
REFRESH DICTIONARY <dict_name>;
```

Among them, `<dict_name>` is the name of the dictionary to be imported.

#### Attention Points of Import

1. Only dictionaries that have imported data can be queried.
2. If the Key column has duplicate values during import, the import transaction will fail.
3. If there is already an ongoing import transaction at the moment (dictionary Status is `LOADING`), the manual import will fail. Please wait until the ongoing import is completed before proceeding.
4. If the size of the imported dictionary exceeds the set `memory_limit`, the import transaction will fail.

### Query Dictionary

You can use the `dict_get` and `dict_get_many` functions for dictionary table queries of single Key, Value list and multi Key, Value list respectively.

Please wait until the dictionary is imported before performing the first query to a dictionary.

#### Grammar

```sql
dict_get("<db_name>.<dict_name>", "<query_column>", <query_key_value>);
dict_get_many("<db_name>.<dict_name>", <query_columns>, <query_key_values>);
```

Among:

- `<db_name>` is the name of the database where the dictionary is located.
- `<dict_name>` is the name of the dictionary
- `<query_column>` is the column name for the value column to be queried, with a type of `VARCHAR`, **must be a constant**
- `<query_columns>` are the column names for all value columns to be queried, with a type of `ARRAY<VARCHAR>`, **must be constants**.
- `<query_key_value>` is data for key columns used in queries
- `<query_key_values>` is a STRUCT that contains all Key columns of the data to be queried in a dictionary.

The return type of `dict_get` is the dictionary column type corresponding to `<query_column>`.
The return type of `dict_get_many` is a [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT) corresponding to the types of various dictionary columns in `<query_columns>`。

#### Query Example

The statement queries the dictionary `city_dict` within the `test_db` database, for the corresponding `id` value when the `key` column value is "Beijing":

```sql
SELECT dict_get("test_db.city_dict", "id", "Beijing");
```

The statement queries the dictionary `single_key_dict` within the `test_db` database, for the corresponding values of `k1` and `k3` when the value of the `key` column is 1:

```sql
SELECT dict_get_many("test_db.single_key_dict", ["k1", "k3"], struct(1));
```

The statement queries the dictionary `multi_key_dict` within the `test_db` database, for the corresponding `k2` and `k3` column values when the 2 key column values are 2 and 'ABC' in sequence:

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

For example, the table creation statement is as follows:

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

Then the above statement

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

returns type of `STRUCT<float, varchar>`。

#### Attention Points of Query

1. When the query Key data does not exist in the dictionary table, **or the Key data is null**, return null.
2. For IP_TRIE type queries, **`<query_key_value>` type must be `IPV4` or `IPV6`**.
3. When using an IP_TRIE type dictionary, the data in the Key column `<key_column>` and the `<query_key_value>` used for querying both support `IPV4` and `IPV6` format data.
4. When a specific BE lacks dictionary data due to reasons such as new launch or restart, executing a query using corresponding dictionary on that BE will fail. Whether the query is scheduled to that BE depends on various factors. Reducing the value of the configuration item `dictionary_auto_refresh_interval_seconds` when the FE Master is not under heavy pressure can shorten the time when the dictionary is unavailable.

### Dictionary Management

The dictionary table supports the following management and viewing statements:

1. Check the status of all dictionary tables in the current database.

    ```sql
    SHOW DICTIONARIES [LIKE <LIKE_NAME>];
    ```

2. Check the definition of a specific dictionary

    ```sql
    DESC DICTIONARY <dict_name>;
    ```

3. Delete dictionary table

    ```sql
    DROP DICTIONARY <dict_name>;
    ```

    After deleting the dictionary table, the deleted dictionary may not be removed from BE immediately.

#### Config Item

The dictionary table supports the following configuration items, all of which are FE CONFIG:

1. `dictionary_task_queue_size` —— The queue length of the thread pool for all tasks in the dictionary is not dynamically adjustable. The default value is 1024, and it is generally not necessary to adjust it.
2. `job_dictionary_task_consumer_thread_num` —— The number of threads in the thread pool for all tasks in the dictionary is not dynamically adjustable. Default value is 3.
3. `dictionary_rpc_timeout_ms` —— The timeout duration for all related RPCs in the dictionary can be dynamically adjusted. The default is 5000 (i.e., 5 seconds), and it generally does not need to be adjusted.
4. `dictionary_auto_refresh_interval_seconds` —— The interval for automatically checking if all dictionary data is up to date is default 5 (seconds), and it can be dynamically adjusted.

### Status Display

By using the `SHOW DICTIONARIES` statement, you can view the base table corresponding to the dictionary, the current data version number, and the corresponding status in FE and BE:

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

Among:

1. `Version` represents the data version number, which will increment by 1 each time data is imported.

2. `Status` represents the dictionary status, meaning as follows:

    |Status Name|Meaning|
    |-|-|
    |NORMAL|The dictionary is currently normal|
    |LOADING|The dictionary is currently importing|
    |OUT_OF_DATE|The current dictionary data has expired|

    The dictionary cannot be imported again while it is being imported.

3. `DataDistribution` represents the current status of each BE, including the version number and memory usage size (KB).

4. `LastUpdateResult` indicates the result of the last import (including automatic and manual), and detailed error message will be displayed here if there are any exceptions.

To view the column definitions of the dictionary table, you can use `DESC DICTIONARY`. For example:

```sql
> DESC DICTIONARY city_code_dict;
+-------------+-------------+------+-------+
| Field       | Type        | Null | Key   |
+-------------+-------------+------+-------+
| city_name   | varchar(32) | NO   | true  |
| region_code | varchar(32) | NO   | false |
+-------------+-------------+------+-------+
```

## Cautionary Notes

1. Data consistency

   - Each refresh of the dictionary will generate a new version. If the version of the BE record doesn't match the FE version during the query, the query will fail.
   - Doris does not maintain strong data consistency between dictionary tables and base tables. Users need to properly set the `data_lifetime` of the dictionary to achieve automatic updates, and manually update when necessary based on business logic.
   - When the source table is deleted by any way, the corresponding dictionary table will also be automatically deleted.

2. Performance Considerations

   - Dictionary tables are suitable for relatively static data, such as dimension table data.

   - Dictionary tables are pure in-memory tables, with full data stored in the memory of all BEs, may occupying a large amount, and it is necessary to weigh memory usage and query performance to choose an appropriate table to derive dictionary.

3. Best Practices

   1. Reasonable Selection of Key Value Columns:

      - Choose columns with a moderate cardinality as keys

   2. Layout Selection:

      - Use HASH_MAP layout for general scenarios
      - Use IP_TRIE layout for IP address range matching scenarios

   3. State Management:

      - Regularly monitor the memory usage of dictionary tables
      - Select an appropriate data update interval and manually refresh the dictionary when data expires on the business side
      - When using dictionary tables, pay attention to the BE memory monitoring to prevent the dictionary tables from being too numerous or too large, occupying excessive memory and causing abnormal BE status.

## Complete Example

1. HASH_MAP

    ```sql
    -- Create source data table
    CREATE TABLE cities (
        city_id INT NOT NULL,
        city_name VARCHAR(32) NOT NULL,
        region_code VARCHAR(32) NOT NULL
    ) ENGINE=OLAP
    DISTRIBUTED BY HASH(city_id) BUCKETS 1;

    INSERT INTO cities VALUES
    (1, 'Beijing', 'BJ'),
    (2, 'Shanghai', 'SH'),
    (3, 'Guangzhou', 'GZ');

    -- Create dictionary table
    CREATE DICTIONARY city_code_dict USING cities
    (
        city_name KEY,
        region_code VALUE
    )
    LAYOUT(HASH_MAP)
    PROPERTIES('data_lifetime' = '600');

    -- Query using a dictionary table
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
    CREATE TABLE ip_locations (
        ip_range VARCHAR(30) NOT NULL,
        country VARCHAR(64) NOT NULL,
        region VARCHAR(64) NOT NULL,
        city VARCHAR(64) NOT NULL
    ) ENGINE=OLAP
    DISTRIBUTED BY HASH(ip_range) BUCKETS 1;

    INSERT INTO ip_locations VALUES
    ('1.0.0.0/24', 'United States', 'California', 'Los Angeles'),
    ('1.0.1.0/24', 'China', 'Beijing', 'Beijing'),
    ('1.0.4.0/24', 'Japan', 'Tokyo', 'Tokyo');

    -- Create an IP address dictionary table
    CREATE DICTIONARY ip_location_dict USING ip_locations
    (
        ip_range KEY,
        country VALUE,
        region VALUE,
        city VALUE
    )
    LAYOUT(IP_TRIE)
    PROPERTIES('data_lifetime' = '600');

    -- Query the location information corresponding to the IP address, based on CIDR matching.
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

3. HASH_MAP with multi-key / multi-value

    ```sql
    -- Product SKU Dimension Table: Includes basic product attributes
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

    -- Order Details Table: Records actual sales data
    CREATE TABLE order_details (
        order_id BIGINT NOT NULL COMMENT "订单ID",
        product_id INT NOT NULL COMMENT "商品ID",
        color_code VARCHAR(32) NOT NULL COMMENT "颜色编码",
        size_code VARCHAR(32) NOT NULL COMMENT "尺码编码",
        quantity INT NOT NULL COMMENT "购买数量",
        order_time DATETIME NOT NULL COMMENT "下单时间"
    )
    DISTRIBUTED BY HASH(`order_id`) BUCKETS 10;

    -- Insert product SKU data
    INSERT INTO product_sku_info VALUES
    (1001, 'BLK', 'M', 'Nike运动T恤', '黑色', 'M码', 100, 199.00, '2024-02-23 10:00:00'),
    (1001, 'BLK', 'L', 'Nike运动T恤', '黑色', 'L码', 80, 199.00, '2024-02-23 10:00:00'),
    (1001, 'WHT', 'M', 'Nike运动T恤', '白色', 'M码', 90, 199.00, '2024-02-23 10:00:00'),
    (1001, 'WHT', 'L', 'Nike运动T恤', '白色', 'L码', 70, 199.00, '2024-02-23 10:00:00'),
    (1002, 'RED', 'S', 'Adidas运动裤', '红色', 'S码', 50, 299.00, '2024-02-23 10:00:00'),
    (1002, 'RED', 'M', 'Adidas运动裤', '红色', 'M码', 60, 299.00, '2024-02-23 10:00:00'),
    (1002, 'BLU', 'S', 'Adidas运动裤', '蓝色', 'S码', 55, 299.00, '2024-02-23 10:00:00'),
    (1002, 'BLU', 'M', 'Adidas运动裤', '蓝色', 'M码', 65, 299.00, '2024-02-23 10:00:00');

    -- Insert order data
    INSERT INTO order_details VALUES
    (10001, 1001, 'BLK', 'M', 2, '2024-02-23 12:01:00'),
    (10002, 1001, 'WHT', 'L', 1, '2024-02-23 12:05:00'),
    (10003, 1002, 'RED', 'S', 1, '2024-02-23 12:10:00'),
    (10004, 1001, 'BLK', 'L', 3, '2024-02-23 12:15:00'),
    (10005, 1002, 'BLU', 'M', 2, '2024-02-23 12:20:00');

    -- Create a multi-key multi-value dictionary
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

    -- Query example using dict_get_many: Retrieve order details and SKU information
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

## Troubleshooting

1. The query reports an error of "can not find dict name"

    Firstly, confirm the existence of the dictionary by using `SHOW DICTIONARIES`. If it exists, refresh the corresponding dictionary data.

2. The query reports an error of "dict_get() only support IP type for IP_TRIE"

    Confirm whether the Key column of the IP_TRIE type dictionary strictly meets to the CIDR format.

3. The importing reports an error of "Version ID is not greater than the existing version ID for the dictionary."

    Delete the corresponding dictionary using the `DROP DICTIONARY` command, recreate it, and then import the data.

4. `SHOW DICTIONARIES` result shows that the dictionary is in a BE version greater than the FE version.

    Delete the corresponding dictionary using the `DROP DICTIONARY` command, recreate it, and then import the data.

5. The importing reports an error of "Dictionary `X` commit version `Y` failed"

    Re-refresh the dictionary.

6. Contingency Strategy

    For the vast majority of error messages, if normal operation fails, rebuilding the dictionary after `DROP` can resolve the issue.
