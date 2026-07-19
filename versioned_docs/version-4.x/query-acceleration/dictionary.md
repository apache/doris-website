---
title: Accelerate JOIN Queries with Dictionaries
sidebar_label: Dictionary Acceleration
language: en
description: Use Doris Dictionaries to convert dimension-table JOINs into in-memory key-value lookups and speed up query performance.
keywords:
    - Doris Dictionary
    - Dictionary
    - JOIN acceleration
    - dimension table query
    - dict_get
    - HASH_MAP
    - IP_TRIE
    - KV lookup
---

<!-- Knowledge type: Feature definition / Operation steps / Configuration parameters -->
<!-- Applicable scenarios: Query performance tuning / Dimension table join acceleration -->

A Dictionary is a special data structure provided by Doris to accelerate JOIN operations. It is built on top of a regular table, treats the corresponding columns of the source table as a key-value relationship, and preloads the full data of these columns into memory to enable fast lookup operations, thereby improving query performance.

Dictionaries are especially suitable for scenarios that require frequent key-value lookups. As a key-value lookup solution, dictionaries do not allow duplicate keys.

:::tip
This feature is experimental and is supported starting from version 4.1.0.
:::

## Use Cases

<!-- Knowledge type: Architecture selection decision -->

Dictionaries are mainly suitable for the following scenarios:

1. Scenarios that require frequent key-value lookups
2. Scenarios where the dimension table is small enough to fit entirely in memory
3. Scenarios with a relatively low data update frequency

Key-value lookups that originally had to be implemented with a LEFT OUTER JOIN can completely eliminate the JOIN overhead with the help of a dictionary, turning into a regular function call.

### Scenario Example

In an e-commerce system, the order table (`orders`, the fact table) records a large amount of transaction data and frequently needs to be joined with the product table (`products`, the dimension table) to obtain detailed product information.

**Step 1: Create the base fact table and dimension table, and insert sample data**

```sql
-- Product dimension table
CREATE TABLE products (
    product_id BIGINT NOT NULL COMMENT "Product ID",
    product_name VARCHAR(128) NOT NULL COMMENT "Product name",
    brand_name VARCHAR(64) NOT NULL COMMENT "Brand name",
    category_name VARCHAR(64) NOT NULL COMMENT "Category name",
    retail_price DECIMAL(10,2) NOT NULL COMMENT "Retail price",
    update_time DATETIME NOT NULL COMMENT "Update time"
)
DISTRIBUTED BY HASH(`product_id`) BUCKETS 10;

-- Order fact table
CREATE TABLE orders (
    order_id BIGINT NOT NULL COMMENT "Order ID",
    product_id BIGINT NOT NULL COMMENT "Product ID",
    user_id BIGINT NOT NULL COMMENT "User ID",
    quantity INT NOT NULL COMMENT "Purchase quantity",
    actual_price DECIMAL(10,2) NOT NULL COMMENT "Actual transaction price",
    order_time DATETIME NOT NULL COMMENT "Order time"
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 32;

-- Insert sample data
INSERT INTO products VALUES
(1001, 'iPhone 15 Pro 256G Black', 'Apple', 'Mobile & Digital', 8999.00, '2024-01-01 00:00:00'),
(1002, 'MacBook Pro M3 Max', 'Apple', 'Computers & Office', 19999.00, '2024-01-01 00:00:00'),
(1003, 'AirPods Pro 2', 'Apple', 'Phone Accessories', 1999.00, '2024-01-01 00:00:00');

INSERT INTO orders VALUES
(10001, 1001, 88001, 1, 8899.00, '2024-02-22 10:15:00'),
(10002, 1002, 88002, 1, 19599.00, '2024-02-22 11:30:00'),
(10003, 1003, 88001, 2, 1899.00, '2024-02-22 14:20:00');
```

**Step 2: Traditional JOIN approach**

To count the number of orders and total sales for each category, you previously had to use a LEFT OUTER JOIN to retrieve product information from the product table:

```sql
-- Count the number of orders and total sales for each category
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
+---------------------+------------+-------------+----------------+--------------+
| category_name       | brand_name | order_count | total_quantity | total_amount |
+---------------------+------------+-------------+----------------+--------------+
| Computers & Office  | Apple      |           1 |              1 |     19599.00 |
| Mobile & Digital    | Apple      |           1 |              1 |      8899.00 |
| Phone Accessories   | Apple      |           1 |              2 |      3798.00 |
+---------------------+------------+-------------+----------------+--------------+
```

In this kind of query, you frequently need to look up other product information by `product_id`, which is essentially a KV lookup operation.

**Step 3: Use a dictionary instead of JOIN**

Once the key-value relationship is defined, you can build the corresponding dictionary in advance to fully convert the previous JOIN operation into a more lightweight key-value lookup, which improves SQL execution efficiency:

```sql
-- Create the product information dictionary
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
    'data_lifetime'='300'  -- Considering how often product information changes, refresh every 5 minutes
);
```

With the dictionary, the JOIN operation in the original query is converted into a `dict_get` function lookup, which is a lightweight KV lookup:

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
+---------------------+------------+-------------+----------------+--------------+
| category_name       | brand_name | order_count | total_quantity | total_amount |
+---------------------+------------+-------------+----------------+--------------+
| Computers & Office  | Apple      |           1 |              1 |     19599.00 |
| Mobile & Digital    | Apple      |           1 |              1 |      8899.00 |
| Phone Accessories   | Apple      |           1 |              2 |      3798.00 |
+---------------------+------------+-------------+----------------+--------------+
```

## Dictionary Definition

<!-- Knowledge type: Configuration parameters / Operation steps -->

### Basic Syntax

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

Parameter descriptions:

| Parameter | Meaning |
| --- | --- |
| `<dict_name>` | The name of the dictionary |
| `<source_table>` | The source data table |
| `<key_column>` | The column name in the source table that serves as a key |
| `<value_column>` | The column name in the source table that serves as a value |
| `<layout_type>` | The storage layout type of the dictionary, see below for details |
| `<priority_item_key>` | The name of a property of the dictionary |
| `<priority_item_value>` | The value of a property of the dictionary |

There must be at least one `<key_column>` and one `<value_column>`. The `<key_column>` does not have to appear before the `<value_column>`.

### Layout Types

Two layout types are currently supported:

| Layout Type | Use Case | Description |
| --- | --- | --- |
| `HASH_MAP` | General key-value lookup scenarios | Hash-table-based implementation |
| `IP_TRIE` | IP address lookups | Trie-based implementation, optimized specifically for IP address lookups. The key column must be IP addresses in CIDR notation, and queries are matched against the CIDR notation |

### Properties

| Property | Value Type | Meaning | Required |
| --- | --- | --- | --- |
| `data_lifetime` | Integer, in seconds | Data validity period. When the time since the last update of the dictionary exceeds this value and the base table has data changes, a re-import is automatically triggered. See [Auto Import](#auto-import) for the import logic | Yes |
| `skip_null_key` | Boolean | When loading data into the dictionary, if a null value appears in the key column, skip that row when this property is `true`; otherwise, an error is reported. The default value is `false` | No |
| `memory_limit` | Integer, in bytes | The upper limit of memory used by the dictionary on a single BE. The default value is `2147483648`, that is, 2GB | No |

### Creation Example

```sql
-- Create the source data table
CREATE TABLE source_table (
    id INT NOT NULL,
    city VARCHAR(32) NOT NULL,
    code VARCHAR(32) NOT NULL
) ENGINE=OLAP
DISTRIBUTED BY HASH(id) BUCKETS 1;

-- Create the dictionary
CREATE DICTIONARY city_dict USING source_table
(
    city KEY,
    id VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime' = '600');
```

Based on this table, you can use the `city_dict` dictionary together with the `dict_get` function to look up the corresponding `id` by the `city` value of `source_table`.

### Usage Restrictions

**1. Key column restrictions**

- The key column of an IP_TRIE dictionary must be of type Varchar or String, and **values in the key column must be in CIDR format**.
- An IP_TRIE dictionary allows only one key column.
- The key column of a HASH_MAP dictionary supports all simple types (that is, all nested types such as Map and Array are excluded).
- The column used as a key column **must not contain duplicate values in the source table**; otherwise, an error is reported when the dictionary loads data.

**2. Null value handling**

- All columns of a dictionary can be Nullable columns, but null values should not actually appear in the key column. If they do, the behavior depends on `skip_null_key` in the [Properties](#properties).

## Usage and Management

### Loading (Refreshing) Data

<!-- Knowledge type: Operation steps -->

Dictionaries support both automatic and manual loading. Loading a dictionary is also referred to as a "refresh" operation.

#### Auto Import

Automatic loading happens at the following times:

1. After the dictionary is created
2. When the dictionary data has expired (see [Properties](#properties))
3. When the BE state shows that this dictionary's data is missing (this can happen when a new BE comes online, or an old BE restarts, etc.)

Doris checks whether all dictionary data has expired every `dictionary_auto_refresh_interval_seconds` seconds. When a dictionary has not been updated for more than `data_lifetime` seconds and **the base table data has changed since the last load**, Doris automatically submits a load for that dictionary.

If some BEs are missing data and the base table data has not changed since the last load, Doris only fills in the current version of the data on the affected BEs. It does not submit a refresh task for all BEs, and the dictionary version does not change.

#### Manual Import

- **Purpose**: Manually trigger a refresh of dictionary data.
- **Command**:

    ```sql
    REFRESH DICTIONARY <dict_name>;
    ```

- **Description**: `<dict_name>` is the name of the dictionary whose data is to be loaded.

#### Notes for Loading

1. A dictionary can only be queried after data has been loaded.
2. If the key column contains duplicate values during loading, the load transaction fails.
3. If a load transaction is already in progress (the dictionary Status is `LOADING`), a manual load fails. Wait for the in-progress load to finish before trying again.
4. If the size of the loaded dictionary exceeds the configured `memory_limit`, the load transaction fails.

### Querying a Dictionary

<!-- Knowledge type: Operation steps -->

You can use the `dict_get` and `dict_get_many` functions to query a dictionary with a single key/value column or with multiple key/value columns, respectively.

For the first query, wait until the dictionary load completes.

#### Syntax

```sql
dict_get("<db_name>.<dict_name>", "<query_column>", <query_key_value>);
dict_get_many("<db_name>.<dict_name>", <query_columns>, <query_key_values>);
```

Parameter descriptions:

| Parameter | Description |
| --- | --- |
| `<db_name>` | The name of the database that the dictionary belongs to |
| `<dict_name>` | The name of the dictionary |
| `<query_column>` | The name of the value column to query, of type `VARCHAR`, **must be a constant** |
| `<query_columns>` | The names of all value columns to query, of type `ARRAY<VARCHAR>`, **must be a constant** |
| `<query_key_value>` | The key column data used for the query |
| `<query_key_values>` | A STRUCT containing the data to query for **all key columns** of the dictionary |

Return types:

- The return type of `dict_get` is the type of the dictionary column corresponding to `<query_column>`.
- The return type of `dict_get_many` is a [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT) composed of the types of the dictionary columns corresponding to `<query_columns>`.

#### Query Examples

**Example 1: Single key, single value query**

Query the `city_dict` dictionary in the `test_db` database to retrieve the `id` value when the key column value is "Beijing":

```sql
SELECT dict_get("test_db.city_dict", "id", "Beijing");
```

**Example 2: Single key, multiple value query**

Query the `single_key_dict` dictionary in the `test_db` database to retrieve the `k1` and `k3` column values when the key column value is 1:

```sql
SELECT dict_get_many("test_db.single_key_dict", ["k1", "k3"], struct(1));
```

**Example 3: Multiple key, multiple value query**

Query the `multi_key_dict` dictionary in the `test_db` database to retrieve the `k2` and `k3` column values when the two key column values are 2 and 'ABC' respectively:

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

For example, if the table creation statement is:

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

Then the return type of the previous statement

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

is `STRUCT<float, varchar>`.

#### Notes for Queries

1. When the queried key data does not exist in the dictionary, **or when the key data is null**, null is returned.
2. When querying an IP_TRIE dictionary, **the type of `<query_key_value>` must be `IPV4` or `IPV6`**.
3. When using an IP_TRIE dictionary, both the data in the key column `<key_column>` and the `<query_key_value>` used for the query support both `IPV4` and `IPV6` formats.
4. When a specific BE has no dictionary data because of a recent online event or a downtime restart, queries against that dictionary fail if scheduled to that BE. Whether a query is scheduled to that BE depends on multiple factors. When the FE Master is not under heavy load, decreasing the [configuration item](#configuration-items) `dictionary_auto_refresh_interval_seconds` can shorten the period during which the dictionary is unavailable.

### Dictionary Management

<!-- Knowledge type: Operation steps -->

Dictionaries support the following management and inspection statements:

**1. View the status of all dictionaries in the current database**

```sql
SHOW DICTIONARIES [LIKE <LIKE_NAME>];
```

**2. View the definition of a specific dictionary**

```sql
DESC DICTIONARY <dict_name>;
```

**3. Drop a dictionary**

```sql
DROP DICTIONARY <dict_name>;
```

After a dictionary is dropped, it may not be removed from the BEs immediately.

#### Configuration Items

Dictionaries support the following configuration items, all of which are FE CONFIG:

| Configuration Item | Default Value | Dynamically Adjustable | Description |
| --- | --- | --- | --- |
| `dictionary_task_queue_size` | 1024 | No | The queue length of the thread pool for all dictionary tasks. Usually does not need to be adjusted |
| `job_dictionary_task_consumer_thread_num` | 3 | No | The number of threads in the thread pool for all dictionary tasks |
| `dictionary_rpc_timeout_ms` | 5000 (5s) | Yes | The timeout for all dictionary-related RPCs. Usually does not need to be adjusted |
| `dictionary_auto_refresh_interval_seconds` | 5 (seconds) | Yes | The interval for automatically checking whether all dictionary data has expired |

### Status Display

The `SHOW DICTIONARIES` statement shows the base table corresponding to each dictionary, the current data version number, and the corresponding status on the FE and BE.

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

Field meanings:

1. `Version`: The data version number, which is incremented by 1 each time data is loaded.
2. `Status`: The dictionary status, with the following meanings:

    | Status Name | Meaning |
    | --- | --- |
    | NORMAL | The dictionary is currently normal |
    | LOADING | The dictionary is currently loading data |
    | OUT_OF_DATE | The dictionary data has expired |

    A dictionary cannot be loaded again while a load is already in progress.

3. `DataDistribution`: The current state on each BE, including the version number and memory usage (KB).
4. `LastUpdateResult`: The result of the previous load (either automatic or manual). If there is an error, detailed information is shown here.

To view the column definitions of a dictionary, use `DESC DICTIONARY`. For example:

```sql
> DESC DICTIONARY city_code_dict;
+-------------+-------------+------+-------+
| Field       | Type        | Null | Key   |
+-------------+-------------+------+-------+
| city_name   | varchar(32) | NO   | true  |
| region_code | varchar(32) | NO   | false |
+-------------+-------------+------+-------+
```

## Notes

<!-- Knowledge type: Best practices -->

### Data Consistency

- Each refresh of a dictionary produces a new version. If the version recorded by the BE differs from the version on the FE during a query, the query fails.
- Doris does not maintain strong data consistency between the dictionary and the base table. You need to set `data_lifetime` of the dictionary appropriately to allow for automatic updates, and supplement with manual updates based on business logic when necessary.
- When the source table is dropped in any way, the corresponding dictionary is automatically dropped as well.

### Performance Considerations

- Dictionaries are suitable for relatively static data, such as dimension table data.
- A dictionary is a pure in-memory table, and its full data is stored in the memory of all BEs, which takes up a significant amount of memory. You need to balance memory usage and query performance, and choose appropriate tables to derive dictionaries from.

### Best Practices

1. **Choose key and value columns reasonably**:

    - Choose columns with moderate cardinality as keys.

2. **Layout selection**:

    - Use the HASH_MAP layout for general scenarios.
    - Use the IP_TRIE layout for IP address range matching scenarios.

3. **State management**:

    - Regularly monitor the memory usage of dictionaries.
    - Choose an appropriate data update interval, and manually refresh the dictionary on the business side when data is known to be stale.
    - When using dictionaries, pay attention to BE memory monitoring to prevent too many or too large dictionaries from consuming too much memory and causing abnormal BE states.

## Complete Examples

<!-- Knowledge type: Operation steps -->

### Example 1: HASH_MAP, single key and single value

```sql
-- Create the source data table
CREATE TABLE cities (
    city_id INT NOT NULL,
    city_name VARCHAR(32) NOT NULL,
    region_code VARCHAR(32) NOT NULL
) ENGINE=OLAP
DISTRIBUTED BY HASH(city_id) BUCKETS 1;

-- Insert data
INSERT INTO cities VALUES
(1, 'Beijing', 'BJ'),
(2, 'Shanghai', 'SH'),
(3, 'Guangzhou', 'GZ');

-- Create the dictionary
CREATE DICTIONARY city_code_dict USING cities
(
    city_name KEY,
    region_code VALUE
)
LAYOUT(HASH_MAP)
PROPERTIES('data_lifetime' = '600');

-- Query using the dictionary
SELECT dict_get("test_refresh_dict.city_code_dict", "region_code", "Beijing");
```

```text
+------------------------------------------------------------------------+
| dict_get('test_refresh_dict.city_code_dict', 'region_code', 'Beijing') |
+------------------------------------------------------------------------+
| BJ                                                                     |
+------------------------------------------------------------------------+
```

### Example 2: IP_TRIE, CIDR-based IP lookup

```sql
-- Create the source data table
CREATE TABLE ip_locations (
    ip_range VARCHAR(30) NOT NULL,
    country VARCHAR(64) NOT NULL,
    region VARCHAR(64) NOT NULL,
    city VARCHAR(64) NOT NULL
) ENGINE=OLAP
DISTRIBUTED BY HASH(ip_range) BUCKETS 1;

-- Insert some sample data
INSERT INTO ip_locations VALUES
('1.0.0.0/24', 'United States', 'California', 'Los Angeles'),
('1.0.1.0/24', 'China', 'Beijing', 'Beijing'),
('1.0.4.0/24', 'Japan', 'Tokyo', 'Tokyo');

-- Create the IP address dictionary
CREATE DICTIONARY ip_location_dict USING ip_locations
(
    ip_range KEY,
    country VALUE,
    region VALUE,
    city VALUE
)
LAYOUT(IP_TRIE)
PROPERTIES('data_lifetime' = '600');

-- Query the location information for an IP address, matched by CIDR.
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

### Example 3: HASH_MAP, multiple keys and multiple values

```sql
-- Product SKU dimension table: contains the basic attributes of products
CREATE TABLE product_sku_info (
    product_id INT NOT NULL COMMENT "Product ID",
    color_code VARCHAR(32) NOT NULL COMMENT "Color code",
    size_code VARCHAR(32) NOT NULL COMMENT "Size code",
    product_name VARCHAR(128) NOT NULL COMMENT "Product name",
    color_name VARCHAR(32) NOT NULL COMMENT "Color name",
    size_name VARCHAR(32) NOT NULL COMMENT "Size name",
    stock INT NOT NULL COMMENT "Stock",
    price DECIMAL(10,2) NOT NULL COMMENT "Price",
    update_time DATETIME NOT NULL COMMENT "Update time"
)
DISTRIBUTED BY HASH(`product_id`) BUCKETS 10;

-- Order detail table: records actual sales data
CREATE TABLE order_details (
    order_id BIGINT NOT NULL COMMENT "Order ID",
    product_id INT NOT NULL COMMENT "Product ID",
    color_code VARCHAR(32) NOT NULL COMMENT "Color code",
    size_code VARCHAR(32) NOT NULL COMMENT "Size code",
    quantity INT NOT NULL COMMENT "Purchase quantity",
    order_time DATETIME NOT NULL COMMENT "Order time"
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 10;

-- Insert product SKU data
INSERT INTO product_sku_info VALUES
(1001, 'BLK', 'M', 'Nike Sports T-Shirt', 'Black', 'Size M', 100, 199.00, '2024-02-23 10:00:00'),
(1001, 'BLK', 'L', 'Nike Sports T-Shirt', 'Black', 'Size L', 80, 199.00, '2024-02-23 10:00:00'),
(1001, 'WHT', 'M', 'Nike Sports T-Shirt', 'White', 'Size M', 90, 199.00, '2024-02-23 10:00:00'),
(1001, 'WHT', 'L', 'Nike Sports T-Shirt', 'White', 'Size L', 70, 199.00, '2024-02-23 10:00:00'),
(1002, 'RED', 'S', 'Adidas Sports Pants', 'Red', 'Size S', 50, 299.00, '2024-02-23 10:00:00'),
(1002, 'RED', 'M', 'Adidas Sports Pants', 'Red', 'Size M', 60, 299.00, '2024-02-23 10:00:00'),
(1002, 'BLU', 'S', 'Adidas Sports Pants', 'Blue', 'Size S', 55, 299.00, '2024-02-23 10:00:00'),
(1002, 'BLU', 'M', 'Adidas Sports Pants', 'Blue', 'Size M', 65, 299.00, '2024-02-23 10:00:00');

-- Insert order data
INSERT INTO order_details VALUES
(10001, 1001, 'BLK', 'M', 2, '2024-02-23 12:01:00'),
(10002, 1001, 'WHT', 'L', 1, '2024-02-23 12:05:00'),
(10003, 1002, 'RED', 'S', 1, '2024-02-23 12:10:00'),
(10004, 1001, 'BLK', 'L', 3, '2024-02-23 12:15:00'),
(10005, 1002, 'BLU', 'M', 2, '2024-02-23 12:20:00');

-- Create a multi-key, multi-value dictionary
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

-- Example of a query using dict_get_many: get order details and SKU information
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
+----------+---------------------+---------------------+------------+-----------+----------+------------+--------------+---------------+
| order_id | order_time          | product_name        | color_name | size_name | quantity | unit_price | total_amount | current_stock |
+----------+---------------------+---------------------+------------+-----------+----------+------------+--------------+---------------+
|    10001 | 2024-02-23 12:01:00 | Nike Sports T-Shirt | Black      | Size M    |        2 |     199.00 |       398.00 |           100 |
|    10002 | 2024-02-23 12:05:00 | Nike Sports T-Shirt | White      | Size L    |        1 |     199.00 |       199.00 |            70 |
|    10003 | 2024-02-23 12:10:00 | Adidas Sports Pants | Red        | Size S    |        1 |     299.00 |       299.00 |            50 |
|    10004 | 2024-02-23 12:15:00 | Nike Sports T-Shirt | Black      | Size L    |        3 |     199.00 |       597.00 |            80 |
|    10005 | 2024-02-23 12:20:00 | Adidas Sports Pants | Blue       | Size M    |        2 |     299.00 |       598.00 |            65 |
+----------+---------------------+---------------------+------------+-----------+----------+------------+--------------+---------------+
```

## Troubleshooting

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting -->

| Error Symptom | Solution |
| --- | --- |
| Query reports `can not find dict name` | First, run `SHOW DICTIONARIES` to confirm whether the dictionary exists. If it does, refresh the corresponding dictionary data again |
| Query reports `dict_get() only support IP type for IP_TRIE` | Check whether the key column of the IP_TRIE dictionary strictly follows the CIDR format |
| Load reports `Version ID is not greater than the existing version ID for the dictionary.` | Use the `DROP DICTIONARY` command to drop the corresponding dictionary, then re-create it and reload the data |
| `SHOW DICTIONARIES` shows that the Version of the dictionary on a certain BE is greater than the FE Version | Use the `DROP DICTIONARY` command to drop the corresponding dictionary, then re-create it and reload the data |
| Load reports `Dictionary X commit version Y failed` | Reload the dictionary |

**Fallback strategy**: For the vast majority of errors, if normal operations fail, dropping the dictionary and re-creating it can resolve the issue.

## FAQ

**Q1: What is the difference between a dictionary and a regular materialized view?**

A dictionary is a pure in-memory KV structure, designed specifically to accelerate key-value lookup operations and to convert the original JOIN operation into a `dict_get` function call. A materialized view, on the other hand, is aimed at more general precomputation scenarios.

**Q2: Is the data of a dictionary kept strongly consistent with the base table?**

No. Doris does not maintain strong data consistency between a dictionary and its base table. Data needs to be synchronized through automatic updates via `data_lifetime` or manual `REFRESH DICTIONARY`.

**Q3: When should you choose IP_TRIE over HASH_MAP?**

Use IP_TRIE when you need to perform IP range matching queries based on CIDR. For all other key-value matching scenarios, use HASH_MAP.

**Q4: What should you do if a dictionary uses too much memory?**

You can use the `memory_limit` property to limit the memory upper bound on a single BE. It is also recommended to choose columns with moderate cardinality as the source for the dictionary, to avoid the dictionary becoming too large.

**Q5: What are the possible reasons a dictionary query returns null?**

When the queried key does not exist in the dictionary, or when the queried key data is null, null is returned.
