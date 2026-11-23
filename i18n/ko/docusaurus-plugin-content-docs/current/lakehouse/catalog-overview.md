---
{
    "title": "데이터 Catalog 개요",
    "language": "ko",
    "description": "Apache Doris 데이터 Catalog의 개념과 사용법을 알아봅니다. 외부 데이터 Catalog를 생성해 Hive, Iceberg, Paimon, PostgreSQL 등의 데이터 소스에 연결하고, 여러 소스에 걸친 연합 쿼리, 데이터 가져오기, 데이터 쓰기 작업을 수행할 수 있습니다."
}
---

데이터 Catalog는 데이터 소스의 속성을 설명합니다.

Doris에서는 Hive, Iceberg, Paimon, PostgreSQL 등 서로 다른 데이터 소스를 가리키는 데이터 Catalog를 여러 개 생성할 수 있습니다. Doris는 데이터 Catalog를 통해 해당 데이터 소스의 데이터베이스, 테이블, 스키마, 파티션, 데이터 위치를 자동으로 가져옵니다. 사용자는 표준 SQL 문으로 데이터 Catalog에 접근해 데이터를 분석하고, 여러 데이터 Catalog의 데이터를 조인하는 쿼리를 실행할 수 있습니다.

Doris의 데이터 Catalog는 두 가지 유형으로 나뉩니다.

| 유형 | 설명 |
| ---------------- | -------------------------------------------------------- |
| Internal Catalog | 이름이 `internal`로 고정된 내장 데이터 Catalog로, Doris 내부 테이블 데이터를 저장하는 데 사용합니다. 생성, 수정 또는 삭제할 수 없습니다. |
| External Catalog | Internal Catalog를 제외한 모든 외부 데이터 Catalog입니다. 사용자가 생성, 수정, 삭제할 수 있습니다. |

데이터 Catalog는 주로 다음 세 가지 시나리오에 사용되지만, 적용 가능한 시나리오는 데이터 Catalog마다 다릅니다. 자세한 내용은 해당 데이터 Catalog 문서를 참조하세요.

| 시나리오 | 설명 |
| ---- | ------------------------------------------- |
| 쿼리 가속 | Hive, Iceberg, Paimon 등의 레이크하우스 데이터에 대한 쿼리를 직접 가속합니다. |
| 데이터 통합 | ZeroETL 방식으로 여러 데이터 소스에 직접 접근해 결과 데이터를 생성하거나, 데이터 소스 간에 데이터를 손쉽게 이동합니다. |
| 데이터 다시 쓰기 | Doris에서 데이터를 처리하고 변환한 후 외부 데이터 소스에 다시 씁니다. |

이 문서에서는 [Iceberg Catalog](./catalogs/iceberg-catalog)를 예로 들어 데이터 Catalog의 기본 작업을 설명합니다. 각 데이터 Catalog에 대한 자세한 내용은 해당 문서를 참조하세요.

## 민감한 속성 마스킹 {#sensitive-property-masking}

공통 Catalog 속성 마스킹 정책은 Doris 4.2.0과 5.0 이상 버전에 도입될 예정입니다. 지원되는 표시, 감사, 계보 경로에서는 비밀번호, 액세스 키, 토큰, JDBC 문자열, URL 자격 증명이 마스킹됩니다. 실행 시 사용하는 연결 값은 변경되지 않습니다. 규칙, 버전별 차이, 설정 및 제한 사항은 [Catalog 속성 마스킹](./catalog-property-masking.md)을 참조하세요.

## 데이터 Catalog 생성 {#creating-a-data-catalog}

`CREATE CATALOG` 문으로 Iceberg Catalog를 생성합니다.

```sql
CREATE CATALOG iceberg_catalog PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hadoop',
    'warehouse' = 's3://bucket/dir/key',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```

Doris에서 생성한 데이터 Catalog는 해당 데이터 소스의 메타데이터 서비스(예: Hive Metastore)와 스토리지 서비스(예: HDFS/S3)에 접근하는 “프록시” 역할을 합니다. Doris는 데이터 Catalog의 연결 속성 등만 저장하며, 해당 데이터 소스의 실제 메타데이터나 데이터는 저장하지 않습니다.

### 공통 속성 {#common-properties}

각 데이터 Catalog에 고유한 속성 외에, 모든 데이터 Catalog가 공유하는 공통 속성 `{CommonProperties}`를 설명합니다.

| 속성 | 설명 | 예시 |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| `include_database_list` | 동기화할 여러 데이터베이스를 `,`로 구분해 지정합니다. 기본적으로 모든 데이터베이스를 동기화합니다. 데이터베이스 이름은 대소문자를 구분합니다. 외부 데이터 소스에 데이터베이스가 많지만 일부에만 접근해야 하는 경우, 이 속성으로 대량의 메타데이터 동기화를 피할 수 있습니다. | `'include_database_list' = 'db1,db2'` |
| `exclude_database_list` | 동기화에서 제외할 여러 데이터베이스를 `,`로 구분해 지정합니다. 기본적으로 필터링 없이 모든 데이터베이스를 동기화합니다. 데이터베이스 이름은 대소문자를 구분합니다. 위와 같은 시나리오에서 접근할 필요가 없는 데이터베이스를 반대로 제외할 때 사용합니다. 충돌하는 경우 `exclude`가 `include`보다 우선합니다. | `'exclude_database_list' = 'db1,db2'` |
| `include_table_list` | 동기화할 여러 테이블을 `db.tbl` 형식으로 `,`로 구분해 지정합니다. 설정하면 데이터베이스의 테이블 목록을 표시할 때 원격 메타데이터 서비스에서 전체 목록을 가져오는 대신 지정한 테이블만 반환합니다. 외부 데이터 소스에 테이블이 많아 전체 목록을 가져오는 작업이 시간 초과될 수 있는 경우에 사용합니다. | `'include_table_list' = 'db1.tbl1,db1.tbl2,db2.tbl3'` |
| `lower_case_table_names` | Catalog 수준에서 테이블 이름의 대소문자 처리 방식을 제어합니다. 값과 의미는 아래 [테이블 이름의 대소문자 구분](#table-name-case-sensitivity-lower_case_table_names) 절을 참조하세요. 기본값은 전역 변수 `lower_case_table_names`에서 상속합니다. | `'lower_case_table_names' = '1'` |
| `lower_case_database_names` | Catalog 수준에서 데이터베이스 이름의 대소문자 처리 방식을 제어합니다. 값과 의미는 아래 [데이터베이스 이름의 대소문자 구분](#database-name-case-sensitivity-lower_case_database_names) 절을 참조하세요. 기본값은 `0`(대소문자 구분)입니다. | `'lower_case_database_names' = '2'` |

### 테이블 목록 지정 {#specifying-table-list}

이 기능은 버전 4.1.0부터 지원됩니다.

외부 데이터 소스(예: Hive Metastore)에 테이블이 많으면 원격 메타데이터 서비스에서 전체 테이블 목록을 가져오는 데 시간이 오래 걸리거나 시간 초과가 발생할 수 있습니다. `include_table_list` 속성을 설정하면 동기화할 테이블을 지정해 원격 서비스에서 전체 테이블 목록을 가져오지 않아도 됩니다.

`include_table_list`에는 `db.tbl` 형식을 사용하며, 여러 테이블은 쉼표 `,`로 구분합니다.

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'include_table_list' = 'db1.table1,db1.table2,db2.table3'
);
```

설정 후 동작은 다음과 같습니다.

- `db1`의 테이블을 나열하면 원격 메타데이터 서비스의 전체 테이블 목록 API를 호출하지 않고 `table1`과 `table2`만 반환합니다.
- `db2`의 테이블을 나열하면 `table3`만 반환합니다.
- `include_table_list`에 포함되지 않은 데이터베이스(예: `db3`)는 원격 메타데이터 서비스에서 전체 테이블 목록을 가져옵니다.
- `include_table_list`에서 형식이 잘못된 항목(`db.tbl` 형식이 아닌 항목)은 무시합니다.

:::tip
이 속성은 `include_database_list`와 함께 사용할 수 있습니다. 예를 들어 `include_database_list`로 필요한 데이터베이스를 먼저 필터링한 다음, `include_table_list`로 필요한 테이블을 더 구체적으로 지정할 수 있습니다.
:::

### 테이블 이름의 대소문자 구분 {#table-name-case-sensitivity-lower_case_table_names}

이 기능은 버전 4.1.0부터 지원됩니다.

`lower_case_table_names` 속성을 사용하면 Catalog 수준에서 테이블 이름의 대소문자 처리 방식을 제어할 수 있습니다. 세 가지 모드를 지원합니다.

| 값 | 모드 | 설명 |
| -- | ---- | ---- |
| `0` | 대소문자 구분(기본값) | 테이블 이름을 원래 대소문자 그대로 저장하고 비교합니다. 테이블 이름을 참조할 때 원격 메타데이터의 대소문자와 정확히 일치해야 합니다. |
| `1` | 소문자로 저장 | Doris에서 테이블 이름을 소문자로 저장합니다. 외부 데이터 소스에 접근할 때 테이블 이름을 일관되게 소문자로 사용하려는 경우에 적합합니다. |
| `2` | 대소문자를 구분하지 않고 비교 | 테이블 이름을 비교할 때 대소문자를 구분하지 않지만, 표시할 때는 원격 메타데이터의 원래 대소문자를 유지합니다. 외부 데이터 소스에서 테이블 이름의 대소문자가 일관되지 않아 대소문자 구분 없이 테이블에 접근하려는 경우에 적합합니다. |

이 속성을 설정하지 않으면 기본적으로 전역 변수 `lower_case_table_names`의 값을 상속합니다.

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'lower_case_table_names' = '2'
);
```

:::caution
`lower_case_table_names`를 `1` 또는 `2`로 설정한 상태에서 원격 메타데이터에 대소문자만 다른 이름의 테이블(예: `MyTable`과 `mytable`)이 있으면 충돌이 발생할 수 있습니다. Doris는 이러한 충돌을 감지하고 오류를 보고합니다.
:::

### 데이터베이스 이름의 대소문자 구분 {#database-name-case-sensitivity-lower_case_database_names}

이 기능은 버전 4.1.0부터 지원됩니다.

`lower_case_database_names` 속성을 사용하면 Catalog 수준에서 데이터베이스 이름의 대소문자 처리 방식을 제어할 수 있습니다. 세 가지 모드를 지원합니다.

| 값 | 모드 | 설명 |
| -- | ---- | ---- |
| `0` | 대소문자 구분(기본값) | 데이터베이스 이름을 원래 대소문자 그대로 저장하고 비교합니다. 데이터베이스 이름을 참조할 때 원격 메타데이터의 대소문자와 정확히 일치해야 합니다. |
| `1` | 소문자로 저장 | Doris에서 데이터베이스 이름을 소문자로 저장합니다. 외부 데이터 소스에 접근할 때 데이터베이스 이름을 일관되게 소문자로 사용하려는 경우에 적합합니다. |
| `2` | 대소문자를 구분하지 않고 비교 | 데이터베이스 이름을 비교할 때 대소문자를 구분하지 않지만, 표시할 때는 원격 메타데이터의 원래 대소문자를 유지합니다. 외부 데이터 소스에서 데이터베이스 이름의 대소문자가 일관되지 않아 대소문자 구분 없이 데이터베이스에 접근하려는 경우에 적합합니다. |

기본값은 `0`(대소문자 구분)입니다.

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'lower_case_database_names' = '2',
    'lower_case_table_names' = '2'
);
```

:::caution
`lower_case_database_names`를 `1` 또는 `2`로 설정한 상태에서 원격 메타데이터에 대소문자만 다른 이름의 데이터베이스(예: `MyDB`와 `mydb`)가 있으면 충돌이 발생할 수 있습니다. Doris는 이러한 충돌을 감지하고 오류를 보고합니다.
:::

:::info
`lower_case_database_names`와 `lower_case_table_names`는 서로 영향을 주지 않으므로 독립적으로 설정할 수 있습니다. 예를 들어 데이터베이스 이름은 대소문자를 구분하도록(`0`), 테이블 이름은 대소문자를 구분하지 않도록(`2`) 설정할 수 있습니다.
:::

### 열 유형 매핑 {#column-type-mapping}

사용자가 데이터 Catalog를 생성하면 Doris는 해당 Catalog의 데이터베이스, 테이블, 스키마를 자동으로 동기화합니다. 데이터 Catalog별 열 유형 매핑 규칙은 해당 문서를 참조하세요.

`UNION`, `INTERVAL` 등 현재 Doris 열 유형으로 매핑할 수 없는 외부 데이터 유형은 Doris에서 `UNSUPPORTED`로 매핑합니다. `UNSUPPORTED` 유형이 포함된 쿼리의 동작은 다음 예시를 참조하세요.

동기화된 테이블 스키마가 다음과 같다고 가정합니다.

```text
k1 INT,
k2 INT,
k3 UNSUPPORTED,
k4 INT
```

쿼리 동작은 다음과 같습니다.

```sql
SELECT * FROM table;                -- Error: Unsupported type 'UNSUPPORTED_TYPE' in 'k3'
SELECT * EXCEPT(k3) FROM table;     -- Query OK.
SELECT k1, k3 FROM table;           -- Error: Unsupported type 'UNSUPPORTED_TYPE' in 'k3'
SELECT k1, k4 FROM table;           -- Query OK.
```

### Nullable 속성 {#nullable-property}

현재 Doris에서는 외부 테이블 열의 Nullable 속성을 지원하는 방식에 다음과 같은 특별한 제한이 있습니다.

| 소스 유형 | Doris 읽기 동작 | Doris 쓰기 동작 |
| --- | --- | --- |
| Nullable | Nullable | Null 값 쓰기를 허용합니다. |
| Not Null | Nullable, 즉 NULL을 허용하는 열로 읽습니다. | Null 값 쓰기를 허용하며, Null 값에 대한 엄격한 검사를 수행하지 않습니다. 사용자가 직접 데이터 무결성과 일관성을 보장해야 합니다. |

## 데이터 Catalog 사용 {#using-data-catalogs}

### 데이터 Catalog 조회 {#viewing-data-catalogs}

생성한 Catalog는 `SHOW CATALOGS` 명령으로 확인할 수 있습니다.

```text
mysql> SHOW CATALOGS;
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
| CatalogId | CatalogName     | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
|     10024 | iceberg_catalog | iceberg  | yes       | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
|         0 | internal        | internal |           | NULL                    | NULL                | Doris internal catalog |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
```

[SHOW CREATE CATALOG](../sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG)으로 CREATE CATALOG 문을 확인할 수 있습니다.

### 데이터 Catalog 전환 {#switching-data-catalogs}

Doris는 `USE` 문으로 데이터베이스를 전환하는 것과 비슷하게, 연결 세션의 컨텍스트를 해당 데이터 Catalog로 전환하는 `SWITCH` 문을 제공합니다.

데이터 Catalog를 전환한 후에는 `USE` 문으로 특정 데이터베이스로 전환하거나, `SHOW DATABASES`로 현재 데이터 Catalog의 데이터베이스를 확인할 수 있습니다.

```sql
SWITCH iceberg_catalog;

SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| test               |
| iceberg_db         |
+--------------------+

USE iceberg_db;
```

`USE` 문에 정규화된 전체 이름 `catalog_name.database_name`을 사용하면 특정 데이터 Catalog의 데이터베이스로 바로 전환할 수도 있습니다.

```sql
USE iceberg_catalog.iceberg_db;
```

MySQL 연결 프로토콜과의 호환성을 위해 MySQL 명령줄이나 JDBC 연결 문자열에서도 정규화된 전체 이름을 사용할 수 있습니다.

```sql
# Command line tool
mysql -h host -P9030 -uroot -Diceberg_catalog.iceberg_db

# JDBC url
jdbc:mysql://host:9030/iceberg_catalog.iceberg_db
```

내장 데이터 Catalog의 이름은 `internal`로 고정되어 있습니다. 전환 방법은 외부 데이터 Catalog와 같습니다.

### 기본 데이터 Catalog {#default-data-catalog}

사용자 속성 `default_init_catalog`를 사용해 특정 사용자의 기본 데이터 Catalog를 설정할 수 있습니다. 설정 후 해당 사용자가 Doris에 연결하면 세션이 설정된 데이터 Catalog로 자동 전환됩니다.

```sql
SET PROPERTY default_init_catalog=hive_catalog;
```

참고 1: MySQL 명령줄이나 JDBC 연결 문자열에 데이터 Catalog를 명시하면 해당 Catalog가 우선하며, 사용자 속성 `default_init_catalog`는 적용되지 않습니다.

참고 2: 사용자 속성 `default_init_catalog`에 설정된 데이터 Catalog가 더 이상 존재하지 않으면 세션은 기본 `internal` 데이터 Catalog로 자동 전환됩니다.

참고 3: 이 기능은 버전 3.1.x부터 지원됩니다.

### 간단한 쿼리 {#simple-queries}

Doris가 지원하는 모든 SQL 문을 사용해 외부 데이터 Catalog의 테이블을 쿼리할 수 있습니다.

```sql
SELECT id, SUM(cost) FROM iceberg_db.table1
GROUP BY id ORDER BY id;
```

### Catalog 간 쿼리 {#cross-catalog-queries}

Doris는 데이터 Catalog 간 조인 쿼리를 지원합니다.

여기서는 [MySQL Catalog](./catalogs/jdbc-mysql-catalog.md)를 하나 더 생성합니다.

```sql
CREATE CATALOG mysql_catalog properties(
    'type' = 'jdbc',
    'user' = 'root',
    'password' = '123456',
    'jdbc_url' = 'jdbc:mysql://host:3306/mysql_db',
    'driver_url' = 'mysql-connector-java-8.0.25.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);
```

그런 다음 SQL로 Iceberg 테이블과 MySQL 테이블을 조인합니다.

```sql
SELECT * FROM
iceberg_catalog.iceberg_db.table1 tbl1 JOIN mysql_catalog.mysql_db.dim_table tbl2
ON tbl1.id = tbl2.id;
```

### 데이터 가져오기 {#data-ingestion}

`INSERT` 명령으로 데이터 소스의 데이터를 Doris로 가져올 수 있습니다.

```sql
INSERT INTO internal.doris_db.tbl1
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

`CTAS (Create Table As Select)` 문을 사용해 외부 데이터 소스에서 Doris 내부 테이블을 생성하고 데이터를 가져올 수도 있습니다.

```sql
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

### 데이터 다시 쓰기 {#data-write-back}

Doris는 `INSERT` 문으로 외부 데이터 소스에 데이터를 직접 다시 쓰는 기능을 지원합니다. 자세한 내용은 다음 문서를 참조하세요.

* [Hive Catalog](./catalogs/hive-catalog.mdx)

* [Iceberg Catalog](./catalogs/iceberg-catalog.mdx)

* [JDBC Catalog](./catalogs/jdbc-catalog-overview.md)

## 데이터 Catalog 새로고침 {#refreshing-data-catalogs}

Doris에서 생성한 데이터 Catalog는 해당 데이터 소스의 메타데이터 서비스에 접근하는 “프록시” 역할을 합니다. Doris는 일부 메타데이터를 캐시합니다. 캐싱은 메타데이터 접근 성능을 높이고 잦은 네트워크 간 요청을 줄여 줍니다. 하지만 캐시를 새로고침하지 않으면 최신 메타데이터에 접근할 수 없는 시의성 문제가 있습니다. 따라서 Doris는 데이터 Catalog를 새로고침하는 여러 방법을 제공합니다.

```sql
-- Refresh catalog
REFRESH CATALOG catalog_name;

-- Refresh specified database
REFRESH DATABASE catalog_name.db_name;

-- Refresh specified table
REFRESH TABLE catalog_name.db_name.table_name;
```

Doris는 메타데이터 캐싱을 비활성화해 최신 메타데이터에 실시간으로 접근하는 기능도 지원합니다.

- Doris 4.1.x 이전: [메타데이터 캐시](./meta-cache.md)를 참조하세요.
- Doris 4.1.x 이상: 각 Catalog 문서의 “메타데이터 캐시” 절을 참조하세요.
    - [Hive Catalog](./catalogs/hive-catalog.mdx#meta-cache)
    - [Iceberg Catalog](./catalogs/iceberg-catalog.mdx#meta-cache)
    - [Hudi Catalog](./catalogs/hudi-catalog.md#meta-cache)
    - [Paimon Catalog](./catalogs/paimon-catalog.mdx#meta-cache)
    - [MaxCompute Catalog](./catalogs/maxcompute-catalog.md#meta-cache)

## 데이터 Catalog 수정 {#modifying-data-catalogs}

`ALTER CATALOG`로 데이터 Catalog의 속성이나 이름을 수정할 수 있습니다.

```sql
-- Rename a catalog
ALTER CATALOG iceberg_catalog RENAME iceberg_catalog2;

-- Modify properties of a catalog
ALTER CATALOG iceberg_catalog SET PROPERTIES ('key1' = 'value1' [, 'key' = 'value2']);

-- Modify the comment of a catalog
ALTER CATALOG iceberg_catalog MODIFY COMMENT 'my iceberg catalog';
```

## 데이터 Catalog 삭제 {#dropping-data-catalogs}

`DROP CATALOG`로 지정한 외부 데이터 Catalog를 삭제할 수 있습니다.

```sql
DROP CATALOG [IF EXISTS] iceberg_catalog;
```

Doris에서 외부 데이터 Catalog를 삭제해도 실제 데이터는 삭제되지 않습니다. Doris에 저장된 데이터 Catalog 매핑만 제거됩니다.

## 권한 관리 {#permission-management}

외부 데이터 Catalog의 데이터베이스와 테이블에 대한 권한 관리는 내부 테이블과 같습니다. 자세한 내용은 [인증 및 권한 부여](../admin-manual/auth/authentication-and-authorization.md) 문서를 참조하세요.

## 외부 테이블 파티션 정의 검증(4.1.5부터) {#external-table-partition-validation-since-415}

버전 4.1.5부터는 외부 테이블을 생성할 때 파티션 정의를 변환하기 전에 Catalog의 파티션 모델을 검증합니다.

| Catalog | 지원되는 정의 | 지원되지 않는 정의 |
| --- | --- | --- |
| Hive | 기존 열 이름을 사용하는 `PARTITION BY LIST` | RANGE, 파티션 표현식, 명시적인 파티션 값 |
| Paimon / MaxCompute | 열 이름으로 지정한 파티션 키 | 파티션 함수 표현식과 명시적인 파티션 값 |
| Iceberg | 지원되는 열 또는 변환 기반 파티션 정의 | Doris 내부 테이블 구문으로 지정한 명시적인 파티션 값 |

파티션 값을 열거하는 내부 테이블 정의를 외부 테이블에 그대로 사용하지 마세요. 예를 들어 Hive는 기록된 데이터로 파티션을 생성하므로 `VALUES IN (...)`을 미리 나열할 필요가 없습니다.
