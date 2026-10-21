---
title: 사전으로 JOIN 쿼리 가속화
sidebar_label: 사전 가속화
language: ko
description: Doris 사전을 사용하여 차원 테이블 JOIN을 메모리 내 키-값 조회로 변환하고 쿼리 성능을 높입니다.
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

사전은 JOIN 연산을 가속화하기 위해 Doris에서 제공하는 특수한 데이터 구조입니다. 일반 테이블을 기반으로 구축되며, 원본 테이블의 해당 컬럼을 키-값 관계로 취급하고 이 컬럼들의 전체 데이터를 메모리에 미리 적재하여 빠른 조회를 지원하므로 쿼리 성능을 높일 수 있습니다.

사전은 키-값 조회가 빈번한 시나리오에 특히 적합합니다. 키-값 조회 솔루션인 사전에서는 중복 키를 허용하지 않습니다.

:::tip
이 기능은 실험적 기능이며 4.1.0 버전부터 지원됩니다.
:::

## 사용 사례 {#use-cases}

<!-- Knowledge type: Architecture selection decision -->

사전은 주로 다음 시나리오에 적합합니다.

1. 키-값 조회가 빈번한 시나리오
2. 차원 테이블이 전체를 메모리에 담을 수 있을 만큼 작은 시나리오
3. 데이터 업데이트 빈도가 비교적 낮은 시나리오

기존에 LEFT OUTER JOIN으로 구현해야 했던 키-값 조회는 사전을 사용하면 일반 함수 호출로 전환되어 JOIN 오버헤드를 완전히 제거할 수 있습니다.

### 시나리오 예시 {#scenario-example}

전자상거래 시스템에서 주문 테이블(`orders`, 팩트 테이블)은 대량의 거래 데이터를 기록하며, 상세한 상품 정보를 얻기 위해 상품 테이블(`products`, 차원 테이블)과 자주 조인해야 합니다.

**1단계: 기본 팩트 테이블과 차원 테이블을 생성하고 예제 데이터 삽입**

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

**2단계: 기존 JOIN 방식**

기존에는 카테고리별 주문 수와 총매출을 집계하려면 LEFT OUTER JOIN을 사용하여 상품 테이블에서 상품 정보를 가져와야 했습니다.

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

이러한 쿼리에서는 `product_id`로 다른 상품 정보를 자주 조회해야 하며, 이는 본질적으로 KV 조회 연산입니다.

**3단계: JOIN 대신 사전 사용**

키-값 관계가 정의되면 해당 사전을 미리 구축하여 기존 JOIN 연산을 더 가벼운 키-값 조회로 완전히 전환하고 SQL 실행 효율을 높일 수 있습니다.

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

사전을 사용하면 원래 쿼리의 JOIN 연산이 가벼운 KV 조회인 `dict_get` 함수 조회로 전환됩니다.

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

## 사전 정의 {#dictionary-definition}

4.1.5부터 사전을 생성하려면 대상 사전 객체에 대한 `CREATE` 권한과 원본 테이블에 대한 `SELECT` 권한이 필요합니다. 사전을 삭제하려면 사전 객체에 대한 `DROP` 권한이 필요합니다. 원본 테이블이 외부 Catalog에 속한 경우에도 원본 테이블에 대한 권한을 확인합니다.

<!-- Knowledge type: Configuration parameters / Operation steps -->

### 기본 구문 {#basic-syntax}

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

매개변수 설명:

| 매개변수 | 의미 |
| --- | --- |
| `<dict_name>` | 사전 이름 |
| `<source_table>` | 원본 데이터 테이블 |
| `<key_column>` | 키로 사용하는 원본 테이블의 컬럼 이름 |
| `<value_column>` | 값으로 사용하는 원본 테이블의 컬럼 이름 |
| `<layout_type>` | 사전의 저장 레이아웃 타입. 자세한 내용은 아래 참조 |
| `<priority_item_key>` | 사전의 속성 이름 |
| `<priority_item_value>` | 사전의 속성 값 |

`<key_column>`과 `<value_column>`이 각각 하나 이상 있어야 합니다. `<key_column>`이 반드시 `<value_column>` 앞에 올 필요는 없습니다.

### 레이아웃 타입 {#layout-types}

현재 두 가지 레이아웃 타입을 지원합니다.

| 레이아웃 타입 | 사용 사례 | 설명 |
| --- | --- | --- |
| `HASH_MAP` | 일반적인 키-값 조회 시나리오 | 해시 테이블 기반 구현 |
| `IP_TRIE` | IP 주소 조회 | IP 주소 조회에 특화하여 최적화된 Trie 기반 구현. 키 컬럼은 CIDR 표기법으로 표현된 IP 주소여야 하며, 쿼리는 해당 CIDR 표기와 일치하는지 확인합니다 |

### 속성 {#properties}

| 속성 | 값 타입 | 의미 | 필수 여부 |
| --- | --- | --- | --- |
| `data_lifetime` | Integer, 초 단위 | 데이터 유효 기간. 사전의 마지막 업데이트 이후 경과 시간이 이 값을 초과하고 기본 테이블의 데이터가 변경되었으면 자동으로 다시 데이터를 가져옵니다. 데이터 가져오기 로직은 [자동 데이터 적재](#auto-import)를 참조하세요 | 예 |
| `skip_null_key` | Boolean | 사전에 데이터를 적재할 때 키 컬럼에 null 값이 있으면, 이 속성이 `true`인 경우 해당 행을 건너뛰고, 그렇지 않으면 오류를 보고합니다. 기본값은 `false`입니다 | 아니요 |
| `memory_limit` | Integer, 바이트 단위 | 단일 BE에서 사전이 사용하는 메모리의 상한입니다. 기본값은 `2147483648`, 즉 2GB입니다 | 아니요 |

### 생성 예제 {#creation-example}

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

이 테이블을 기반으로 `city_dict` 사전과 `dict_get` 함수를 함께 사용하면 해당 `id`를 조회할 수 있으며, 조회 키인 `city` 값은 `source_table`에서 가져옵니다.

### 사용 제한 {#usage-restrictions}

**1. 키 컬럼 제한**

- IP_TRIE 사전의 키 컬럼은 Varchar 또는 String 타입이어야 하며, **키 컬럼의 값은 CIDR 형식이어야 합니다**.
- IP_TRIE 사전에는 키 컬럼을 하나만 지정할 수 있습니다.
- HASH_MAP 사전의 키 컬럼은 모든 단순 타입을 지원합니다. 즉, Map 및 Array와 같은 중첩 타입은 모두 제외됩니다.
- 키 컬럼으로 사용하는 컬럼은 **원본 테이블에서 중복 값을 포함해서는 안 됩니다**. 중복 값이 있으면 사전의 데이터 적재 시 오류가 보고됩니다.

**2. null 값 처리**

- 사전의 모든 컬럼은 Nullable 컬럼일 수 있지만, 키 컬럼에 실제로 null 값이 있어서는 안 됩니다. null 값이 있으면 동작은 `skip_null_key`에 따라 달라집니다. 자세한 내용은 [속성](#properties)을 참조하세요.

## 사용 및 관리 {#usage-and-management}

### 데이터 적재(새로고침) {#loading-refreshing-data}

<!-- Knowledge type: Operation steps -->

사전은 자동 및 수동 데이터 적재를 모두 지원합니다. 사전의 데이터 적재를 "새로고침" 작업이라고도 합니다.

#### 자동 데이터 적재 {#auto-import}

다음 시점에 자동 데이터 적재가 수행됩니다.

1. 사전 생성 후
2. 사전 데이터가 만료되었을 때([속성](#properties) 참조)
3. BE 상태에 해당 사전의 데이터가 없는 것으로 표시될 때(새 BE가 온라인 상태가 되거나 기존 BE가 재시작되는 경우 등에 발생할 수 있음)

Doris는 `dictionary_auto_refresh_interval_seconds`초마다 모든 사전 데이터의 만료 여부를 확인합니다. 사전이 업데이트되지 않은 시간이 `data_lifetime`초를 초과하고 **마지막 데이터 적재 이후 기본 테이블의 데이터가 변경되었으면**, Doris는 해당 사전의 데이터 적재 작업을 자동으로 제출합니다.

일부 BE에 데이터가 없고 마지막 데이터 적재 이후 기본 테이블의 데이터가 변경되지 않았다면, Doris는 해당 BE에 현재 버전의 데이터만 채웁니다. 모든 BE를 대상으로 새로고침 작업을 제출하지 않으며, 사전 버전도 변경되지 않습니다.

#### 수동 데이터 적재 {#manual-import}

- **목적**: 사전 데이터의 새로고침을 수동으로 트리거합니다.
- **명령어**:

    ```sql
    REFRESH DICTIONARY <dict_name>;
    ```

- **설명**: `<dict_name>`은 데이터를 적재할 사전의 이름입니다.

#### 데이터 적재 시 주의 사항 {#notes-for-loading}

1. 사전은 데이터가 적재된 후에만 쿼리할 수 있습니다.
2. 데이터 적재 중 키 컬럼에 중복 값이 있으면 데이터 적재 트랜잭션이 실패합니다.
3. 데이터 적재 트랜잭션이 이미 진행 중이면(사전 상태가 `LOADING`인 경우) 수동 데이터 적재가 실패합니다. 진행 중인 데이터 적재가 완료될 때까지 기다린 후 다시 시도하세요.
4. 적재된 사전의 크기가 설정된 `memory_limit`을 초과하면 데이터 적재 트랜잭션이 실패합니다.

### 사전 쿼리 {#querying-a-dictionary}

<!-- Knowledge type: Operation steps -->

`dict_get` 함수와 `dict_get_many` 함수를 사용하여 각각 단일 키/값 컬럼 또는 여러 키/값 컬럼으로 사전을 쿼리할 수 있습니다.

첫 쿼리를 실행하기 전에 사전의 데이터 적재가 완료될 때까지 기다리세요.

#### 구문 {#syntax}

```sql
dict_get("<db_name>.<dict_name>", "<query_column>", <query_key_value>);
dict_get_many("<db_name>.<dict_name>", <query_columns>, <query_key_values>);
```

매개변수 설명:

| 매개변수 | 설명 |
| --- | --- |
| `<db_name>` | 사전이 속한 데이터베이스의 이름 |
| `<dict_name>` | 사전 이름 |
| `<query_column>` | 조회할 값 컬럼의 이름. `VARCHAR` 타입이며 **상수여야 합니다** |
| `<query_columns>` | 조회할 모든 값 컬럼의 이름. `ARRAY<VARCHAR>` 타입이며 **상수여야 합니다** |
| `<query_key_value>` | 쿼리에 사용하는 키 컬럼 데이터 |
| `<query_key_values>` | 사전의 **모든 키 컬럼**에 대해 조회할 데이터를 담은 STRUCT |

반환 타입:

- `dict_get`의 반환 타입은 `<query_column>`에 대응하는 사전 컬럼의 타입입니다.
- `dict_get_many`의 반환 타입은 [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT)이며, `<query_columns>`에 대응하는 사전 컬럼의 타입으로 구성됩니다.

#### 쿼리 예제 {#query-examples}

**예제 1: 단일 키, 단일 값 쿼리**

`city_dict` 사전을 `test_db` 데이터베이스에서 쿼리하여, 키 컬럼 값이 "Beijing"일 때의 `id` 값을 가져옵니다.

```sql
SELECT dict_get("test_db.city_dict", "id", "Beijing");
```

**예제 2: 단일 키, 다중 값 쿼리**

`single_key_dict` 사전을 `test_db` 데이터베이스에서 쿼리하여, 키 컬럼 값이 1일 때의 `k1` 및 `k3` 컬럼 값을 가져옵니다.

```sql
SELECT dict_get_many("test_db.single_key_dict", ["k1", "k3"], struct(1));
```

**예제 3: 다중 키, 다중 값 쿼리**

`multi_key_dict` 사전을 `test_db` 데이터베이스에서 쿼리하여, 두 키 컬럼 값이 각각 2와 'ABC'일 때의 `k2` 및 `k3` 컬럼 값을 가져옵니다.

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

예를 들어 테이블 생성 구문이 다음과 같다면,

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

앞서 제시한 다음 구문의 반환 타입은

```sql
SELECT dict_get_many("test_db.multi_key_dict", ["k2", "k3"], struct(2, 'ABC'));
```

`STRUCT<float, varchar>`입니다.

#### 쿼리 시 주의 사항 {#notes-for-queries}

1. 조회한 키 데이터가 사전에 없거나 **키 데이터가 null이면**, null이 반환됩니다.
2. IP_TRIE 사전을 쿼리할 때 **`<query_key_value>`의 타입은 `IPV4` 또는 `IPV6`이어야 합니다**.
3. IP_TRIE 사전을 사용할 때 키 컬럼 `<key_column>`의 데이터와 쿼리에 사용하는 `<query_key_value>`는 모두 `IPV4` 및 `IPV6` 형식을 지원합니다.
4. 특정 BE가 최근 온라인 상태가 되었거나 다운 후 재시작되어 사전 데이터가 없는 경우, 해당 BE에 쿼리가 스케줄링되면 사전 쿼리가 실패합니다. 쿼리가 해당 BE에 스케줄링되는지는 여러 요인에 따라 달라집니다. FE Master의 부하가 높지 않다면 [설정 항목](#configuration-items)인 `dictionary_auto_refresh_interval_seconds` 값을 줄여 사전을 사용할 수 없는 시간을 단축할 수 있습니다.

### 사전 관리 {#dictionary-management}

<!-- Knowledge type: Operation steps -->

사전은 다음 관리 및 확인 구문을 지원합니다.

**1. 현재 데이터베이스에 있는 모든 사전의 상태 확인**

```sql
SHOW DICTIONARIES [LIKE <LIKE_NAME>];
```

**2. 특정 사전의 정의 확인**

```sql
DESC DICTIONARY <dict_name>;
```

**3. 사전 삭제**

```sql
DROP DICTIONARY <dict_name>;
```

사전을 삭제해도 BE에서 즉시 제거되지 않을 수 있습니다.

#### 설정 항목 {#configuration-items}

사전은 다음 설정 항목을 지원하며, 모두 FE CONFIG입니다.

| 설정 항목 | 기본값 | 동적 조정 가능 여부 | 설명 |
| --- | --- | --- | --- |
| `dictionary_task_queue_size` | 1024 | 아니요 | 모든 사전 작업을 처리하는 스레드 풀의 큐 길이. 일반적으로 조정할 필요가 없습니다 |
| `job_dictionary_task_consumer_thread_num` | 3 | 아니요 | 모든 사전 작업을 처리하는 스레드 풀의 스레드 수 |
| `dictionary_rpc_timeout_ms` | 5000 (5s) | 예 | 모든 사전 관련 RPC의 타임아웃. 일반적으로 조정할 필요가 없습니다 |
| `dictionary_auto_refresh_interval_seconds` | 5 (초) | 예 | 모든 사전 데이터의 만료 여부를 자동으로 확인하는 간격 |

### 상태 표시 {#status-display}

`SHOW DICTIONARIES` 구문은 각 사전에 대응하는 기본 테이블, 현재 데이터 버전 번호, FE 및 BE에서의 해당 상태를 표시합니다.

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

필드 의미:

1. `Version`: 데이터 버전 번호로, 데이터를 적재할 때마다 1씩 증가합니다.
2. `Status`: 사전 상태로, 각 상태의 의미는 다음과 같습니다.

    | 상태 이름 | 의미 |
    | --- | --- |
    | NORMAL | 사전이 현재 정상 상태입니다 |
    | LOADING | 사전이 현재 데이터를 적재하고 있습니다 |
    | OUT_OF_DATE | 사전 데이터가 만료되었습니다 |

    데이터 적재가 이미 진행 중이면 사전에 데이터를 다시 적재할 수 없습니다.

3. `DataDistribution`: 버전 번호와 메모리 사용량(KB)을 포함한 각 BE의 현재 상태입니다.
4. `LastUpdateResult`: 이전 데이터 적재(자동 또는 수동)의 결과입니다. 오류가 있으면 여기에 상세 정보가 표시됩니다.

사전의 컬럼 정의를 확인하려면 `DESC DICTIONARY`를 사용합니다. 예:

```sql
> DESC DICTIONARY city_code_dict;
+-------------+-------------+------+-------+
| Field       | Type        | Null | Key   |
+-------------+-------------+------+-------+
| city_name   | varchar(32) | NO   | true  |
| region_code | varchar(32) | NO   | false |
+-------------+-------------+------+-------+
```

## 주의 사항 {#notes}

<!-- Knowledge type: Best practices -->

### 데이터 일관성 {#data-consistency}

- 사전을 새로고침할 때마다 새 버전이 생성됩니다. 쿼리 중 BE에 기록된 버전이 FE의 버전과 다르면 쿼리가 실패합니다.
- Doris는 사전과 기본 테이블 간에 강한 데이터 일관성을 유지하지 않습니다. 자동 업데이트가 이루어지도록 사전의 `data_lifetime`을 적절하게 설정하고, 필요한 경우 비즈니스 로직에 따라 수동 업데이트를 병행해야 합니다.
- 원본 테이블이 어떤 방식으로든 삭제되면 해당 사전도 자동으로 삭제됩니다.

### 성능 고려 사항 {#performance-considerations}

- 사전은 차원 테이블 데이터처럼 비교적 정적인 데이터에 적합합니다.
- 사전은 순수 메모리 내 테이블이며, 전체 데이터가 모든 BE의 메모리에 저장되므로 상당한 메모리를 차지합니다. 메모리 사용량과 쿼리 성능 사이의 균형을 고려하여 사전을 생성할 테이블을 적절하게 선택해야 합니다.

### 권장 사항 {#best-practices}

1. **키 및 값 컬럼의 적절한 선택**:

    - 카디널리티가 적당한 컬럼을 키로 선택합니다.

2. **레이아웃 선택**:

    - 일반적인 시나리오에는 HASH_MAP 레이아웃을 사용합니다.
    - IP 주소 범위 매칭 시나리오에는 IP_TRIE 레이아웃을 사용합니다.

3. **상태 관리**:

    - 사전의 메모리 사용량을 정기적으로 모니터링합니다.
    - 적절한 데이터 업데이트 간격을 선택하고, 데이터가 최신 상태가 아닌 것으로 확인되면 비즈니스 측에서 사전을 수동으로 새로고침합니다.
    - 사전을 사용할 때는 BE 메모리를 주의 깊게 모니터링하여, 사전이 너무 많거나 커서 메모리를 과도하게 소비하고 BE가 비정상 상태에 빠지는 일을 방지합니다.

## 전체 예제 {#complete-examples}

<!-- Knowledge type: Operation steps -->

### 예제 1: HASH_MAP, 단일 키와 단일 값 {#example-1-hash_map-single-key-and-single-value}

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

### 예제 2: IP_TRIE, CIDR 기반 IP 조회 {#example-2-ip_trie-cidr-based-ip-lookup}

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

### 예제 3: HASH_MAP, 다중 키와 다중 값 {#example-3-hash_map-multiple-keys-and-multiple-values}

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

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting -->

| 오류 증상 | 해결 방법 |
| --- | --- |
| 쿼리에서 `can not find dict name` 오류 보고 | 먼저 `SHOW DICTIONARIES`를 실행하여 사전이 존재하는지 확인합니다. 존재한다면 해당 사전 데이터를 다시 새로고침합니다 |
| 쿼리에서 `dict_get() only support IP type for IP_TRIE` 오류 보고 | IP_TRIE 사전의 키 컬럼이 CIDR 형식을 엄격하게 따르는지 확인합니다 |
| 데이터 적재 시 `Version ID is not greater than the existing version ID for the dictionary.` 오류 보고 | `DROP DICTIONARY` 명령어로 해당 사전을 삭제한 후 다시 생성하고 데이터를 다시 적재합니다 |
| `SHOW DICTIONARIES`에서 특정 BE의 사전 Version이 FE Version보다 높은 것으로 표시됨 | `DROP DICTIONARY` 명령어로 해당 사전을 삭제한 후 다시 생성하고 데이터를 다시 적재합니다 |
| 데이터 적재 시 `Dictionary X commit version Y failed` 오류 보고 | 사전에 데이터를 다시 적재합니다 |

**대체 방안**: 대부분의 오류는 일반적인 조치로 해결되지 않을 경우 사전을 삭제한 후 다시 생성하여 해결할 수 있습니다.

## 자주 묻는 질문 {#faq}

**Q1: 사전과 일반 구체화된 뷰의 차이는 무엇인가요?**

사전은 순수 메모리 내 KV 구조로, 키-값 조회 연산을 가속화하고 기존 JOIN 연산을 `dict_get` 함수 호출로 전환하도록 설계되었습니다. 구체화된 뷰는 더 일반적인 사전 계산 시나리오를 위한 기능입니다.

**Q2: 사전 데이터는 기본 테이블과 강한 일관성을 유지하나요?**

아니요. Doris는 사전과 기본 테이블 간에 강한 데이터 일관성을 유지하지 않습니다. `data_lifetime`을 통한 자동 업데이트 또는 수동 `REFRESH DICTIONARY`를 통해 데이터를 동기화해야 합니다.

**Q3: HASH_MAP 대신 IP_TRIE를 선택해야 하는 경우는 언제인가요?**

CIDR 기반 IP 범위 매칭 쿼리를 수행해야 할 때는 IP_TRIE를 사용합니다. 그 외의 모든 키-값 매칭 시나리오에는 HASH_MAP을 사용합니다.

**Q4: 사전이 메모리를 너무 많이 사용하면 어떻게 해야 하나요?**

`memory_limit` 속성을 사용하여 단일 BE의 메모리 사용 상한을 제한할 수 있습니다. 사전이 지나치게 커지는 것을 방지하려면 카디널리티가 적당한 컬럼을 사전의 원본으로 선택하는 것도 권장합니다.

**Q5: 사전 쿼리에서 null이 반환되는 원인은 무엇인가요?**

조회한 키가 사전에 없거나 조회한 키 데이터가 null이면 null이 반환됩니다.
