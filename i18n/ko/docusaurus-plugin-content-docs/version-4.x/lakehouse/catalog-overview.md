---
{
    "title": "데이터 Catalog 개요",
    "language": "ko",
    "description": "Apache Doris 데이터 Catalog의 개념과 사용법을 알아봅니다. 외부 데이터 Catalog를 생성하여 Hive, Iceberg, Paimon, PostgreSQL 및 기타 데이터 소스에 연결하고, 소스 간 연합 쿼리, 데이터 적재, 데이터 다시 쓰기를 수행합니다."
}
---

데이터 Catalog는 데이터 소스의 속성을 정의합니다.

Doris에서는 서로 다른 데이터 소스(예: Hive, Iceberg, Paimon, PostgreSQL)를 가리키는 여러 데이터 Catalog를 생성할 수 있습니다. Doris는 데이터 Catalog를 통해 해당 데이터 소스에서 데이터베이스, 테이블, 스키마, 파티션, 데이터 위치를 자동으로 가져옵니다. 사용자는 표준 SQL 문으로 이러한 데이터 Catalog에 접근하여 데이터를 분석하고, 여러 데이터 Catalog의 데이터를 조인하는 쿼리를 실행할 수 있습니다.

Doris에는 두 가지 유형의 데이터 Catalog가 있습니다.

| 유형 | 설명 |
| ---------------- | -------------------------------------------------------- |
| 내부 Catalog | 이름이 `internal`로 고정된 내장 데이터 Catalog로, Doris 내부 테이블 데이터를 저장하는 데 사용됩니다. 생성, 수정, 삭제할 수 없습니다. |
| 외부 Catalog | 내부 Catalog를 제외한 모든 데이터 Catalog를 의미합니다. 사용자가 외부 데이터 Catalog를 생성, 수정, 삭제할 수 있습니다. |

데이터 Catalog는 주로 다음 세 가지 시나리오에 사용되지만, 각 데이터 Catalog에 적합한 시나리오는 다릅니다. 자세한 내용은 해당 데이터 Catalog 문서를 참고하세요.

| 시나리오 | 설명 |
| ---- | ------------------------------------------- |
| 쿼리 가속 | Hive, Iceberg, Paimon 등의 레이크하우스 데이터에 대한 쿼리를 직접 가속합니다. |
| 데이터 통합 | ZeroETL 방식으로 서로 다른 데이터 소스에 직접 접근하여 결과 데이터를 생성하거나, 데이터 소스 간 데이터 흐름을 간편하게 구성합니다. |
| 데이터 다시 쓰기 | Doris에서 데이터를 처리하고 변환한 다음 외부 데이터 소스에 다시 씁니다. |

이 문서에서는 [Iceberg Catalog](./catalogs/iceberg-catalog)를 예로 들어 데이터 Catalog의 기본 작업을 소개합니다. 각 데이터 Catalog에 대한 자세한 소개는 해당 데이터 Catalog 문서를 참고하세요.

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

기본적으로 Doris에서 생성한 데이터 Catalog는 해당 데이터 소스의 메타데이터 서비스(예: Hive Metastore)와 스토리지 서비스(예: HDFS/S3)에 접근하는 "프록시" 역할을 합니다. Doris는 데이터 Catalog의 연결 속성 등의 정보만 저장하며, 해당 데이터 소스의 실제 메타데이터나 데이터는 저장하지 않습니다.

### 공통 속성 {#common-properties}

각 데이터 Catalog의 고유한 속성 외에도, 모든 데이터 Catalog가 공유하는 공통 속성 `{CommonProperties}`를 이 절에서 소개합니다.

| 속성 | 설명 | 예시 |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| `include_database_list` | 동기화할 데이터베이스를 여러 개 지정하며, `,`로 구분합니다. 기본적으로 모든 데이터베이스를 동기화합니다. 데이터베이스 이름은 대소문자를 구분합니다. 외부 데이터 소스에 데이터베이스가 많지만 일부에만 접근해야 하는 경우, 이 매개변수로 대량의 메타데이터 동기화를 방지할 수 있습니다. | `'include_database_list' = 'db1,db2'` |
| `exclude_database_list` | 동기화에서 제외할 데이터베이스를 여러 개 지정하며, `,`로 구분합니다. 기본적으로 필터링을 적용하지 않고 모든 데이터베이스를 동기화합니다. 데이터베이스 이름은 대소문자를 구분합니다. 위와 동일한 시나리오에 적용되지만, 접근할 필요가 없는 데이터베이스를 반대로 제외하는 데 사용합니다. 충돌이 발생하면 `exclude`가 `include`보다 우선합니다. | `'exclude_database_list' = 'db1,db2'` |
| `include_table_list` | 동기화할 테이블을 `db.tbl` 형식으로 여러 개 지정하며, `,`로 구분합니다. 이 속성을 설정하면 데이터베이스의 테이블 목록을 조회할 때 원격 메타데이터 서비스에서 전체 테이블 목록을 가져오는 대신 지정한 테이블만 반환합니다. 외부 데이터 소스에 테이블이 많아 전체 테이블 목록을 가져올 때 시간 초과가 발생할 수 있는 경우에 적합합니다. | `'include_table_list' = 'db1.tbl1,db1.tbl2,db2.tbl3'` |
| `lower_case_table_names` | Catalog 수준에서 테이블 이름의 대소문자 처리를 제어합니다. 값과 의미는 아래의 [테이블 이름의 대소문자 구분](#table-name-case-sensitivity-lower_case_table_names) 절을 참고하세요. 기본값은 전역 변수 `lower_case_table_names`의 값을 상속합니다. | `'lower_case_table_names' = '1'` |
| `lower_case_database_names` | Catalog 수준에서 데이터베이스 이름의 대소문자 처리를 제어합니다. 값과 의미는 아래의 [데이터베이스 이름의 대소문자 구분](#database-name-case-sensitivity-lower_case_database_names) 절을 참고하세요. 기본값은 `0`(대소문자 구분)입니다. | `'lower_case_database_names' = '2'` |

### 테이블 목록 지정 {#specifying-table-list}

이 기능은 4.1.0 버전부터 지원됩니다.

외부 데이터 소스(예: Hive Metastore)에 테이블이 많으면 원격 메타데이터 서비스에서 전체 테이블 목록을 가져오는 데 시간이 오래 걸리거나 시간 초과가 발생할 수 있습니다. `include_table_list` 속성을 설정하면 동기화할 테이블을 지정하여 원격 서비스에서 전체 테이블 목록을 가져오는 작업을 방지할 수 있습니다.

`include_table_list`는 `db.tbl` 형식을 사용하며, 테이블이 여러 개일 경우 쉼표 `,`로 구분합니다.

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'include_table_list' = 'db1.table1,db1.table2,db2.table3'
);
```

설정 후 동작은 다음과 같습니다.

- `db1`의 테이블 목록을 조회하면 원격 메타데이터 서비스의 전체 테이블 목록 API를 호출하지 않고 `table1`과 `table2`만 반환합니다.
- `db2`의 테이블 목록을 조회하면 `table3`만 반환합니다.
- `include_table_list`에 포함되지 않은 데이터베이스(예: `db3`)의 경우에는 여전히 원격 메타데이터 서비스에서 전체 테이블 목록을 가져옵니다.
- `include_table_list`에서 형식이 올바르지 않은 항목(`db.tbl` 형식이 아닌 항목)은 무시됩니다.

:::tip
이 속성은 `include_database_list`와 함께 사용할 수 있습니다. 예를 들어 먼저 `include_database_list`로 필요한 데이터베이스를 필터링한 다음, `include_table_list`로 필요한 테이블을 추가로 지정할 수 있습니다.
:::

### 테이블 이름의 대소문자 구분 {#table-name-case-sensitivity-lower_case_table_names}

이 기능은 4.1.0 버전부터 지원됩니다.

`lower_case_table_names` 속성을 사용하면 Catalog 수준에서 테이블 이름의 대소문자 처리를 제어할 수 있습니다. 이 속성은 세 가지 모드를 지원합니다.

| 값 | 모드 | 설명 |
| -- | ---- | ---- |
| `0` | 대소문자 구분(기본값) | 테이블 이름을 원래의 대소문자를 유지하여 저장하고 비교합니다. 테이블 이름을 참조할 때는 원격 메타데이터의 대소문자와 정확히 일치해야 합니다. |
| `1` | 소문자로 저장 | Doris에 테이블 이름을 소문자로 저장합니다. 소문자 테이블 이름으로 통일하여 외부 데이터 소스에 접근하려는 경우에 적합합니다. |
| `2` | 대소문자를 구분하지 않고 비교 | 테이블 이름을 비교할 때 대소문자를 구분하지 않지만, 표시할 때는 원격 메타데이터의 원래 대소문자를 유지합니다. 외부 데이터 소스에서 테이블 이름의 대소문자가 일관되지 않아 대소문자를 구분하지 않고 테이블에 접근하려는 경우에 적합합니다. |

이 속성을 설정하지 않으면 기본적으로 전역 변수 `lower_case_table_names`의 값을 상속합니다.

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'lower_case_table_names' = '2'
);
```

:::caution
`lower_case_table_names`를 `1` 또는 `2`로 설정했을 때 원격 메타데이터에 대소문자만 다른 이름의 테이블(예: `MyTable`과 `mytable`)이 있으면 충돌이 발생할 수 있습니다. Doris는 이러한 충돌을 감지하고 오류를 보고합니다.
:::

### 데이터베이스 이름의 대소문자 구분 {#database-name-case-sensitivity-lower_case_database_names}

이 기능은 4.1.0 버전부터 지원됩니다.

`lower_case_database_names` 속성을 사용하면 Catalog 수준에서 데이터베이스 이름의 대소문자 처리를 제어할 수 있습니다. 이 속성은 세 가지 모드를 지원합니다.

| 값 | 모드 | 설명 |
| -- | ---- | ---- |
| `0` | 대소문자 구분(기본값) | 데이터베이스 이름을 원래의 대소문자를 유지하여 저장하고 비교합니다. 데이터베이스 이름을 참조할 때는 원격 메타데이터의 대소문자와 정확히 일치해야 합니다. |
| `1` | 소문자로 저장 | Doris에 데이터베이스 이름을 소문자로 저장합니다. 소문자 데이터베이스 이름으로 통일하여 외부 데이터 소스에 접근하려는 경우에 적합합니다. |
| `2` | 대소문자를 구분하지 않고 비교 | 데이터베이스 이름을 비교할 때 대소문자를 구분하지 않지만, 표시할 때는 원격 메타데이터의 원래 대소문자를 유지합니다. 외부 데이터 소스에서 데이터베이스 이름의 대소문자가 일관되지 않아 대소문자를 구분하지 않고 데이터베이스에 접근하려는 경우에 적합합니다. |

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
`lower_case_database_names`를 `1` 또는 `2`로 설정했을 때 원격 메타데이터에 대소문자만 다른 이름의 데이터베이스(예: `MyDB`와 `mydb`)가 있으면 충돌이 발생할 수 있습니다. Doris는 이러한 충돌을 감지하고 오류를 보고합니다.
:::

:::info
`lower_case_database_names`와 `lower_case_table_names`는 서로 영향을 주지 않고 독립적으로 설정할 수 있습니다. 예를 들어 데이터베이스 이름은 대소문자를 구분하도록(`0`), 테이블 이름은 대소문자를 구분하지 않도록(`2`) 설정할 수 있습니다.
:::

### 컬럼 타입 매핑 {#column-type-mapping}

사용자가 데이터 Catalog를 생성하면 Doris는 해당 데이터 Catalog의 데이터베이스, 테이블, 스키마를 자동으로 동기화합니다. 각 데이터 Catalog의 컬럼 타입 매핑 규칙은 해당 데이터 Catalog 문서를 참고하세요.

현재 Doris 컬럼 타입으로 매핑할 수 없는 `UNION`, `INTERVAL` 등의 외부 데이터 타입은 `UNSUPPORTED` 컬럼 타입으로 매핑됩니다. `UNSUPPORTED` 타입이 포함된 쿼리는 다음 예제를 참고하세요.

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

현재 Doris는 외부 테이블 컬럼의 Nullable 속성 지원에 특별한 제한이 있습니다. 구체적인 동작은 다음과 같습니다.

| 소스 타입 | Doris 읽기 동작 | Doris 쓰기 동작 |
| --- | --- | --- |
| Nullable | Nullable | Null 값 쓰기 허용 |
| Not Null | Nullable, 즉 NULL을 허용하는 컬럼으로 읽음 | Null 값 쓰기를 허용하며, Null 값을 엄격하게 검사하지 않습니다. 사용자가 직접 데이터 무결성과 일관성을 보장해야 합니다. |

## 데이터 Catalog 사용 {#using-data-catalogs}

### 데이터 Catalog 조회 {#viewing-data-catalogs}

생성 후 `SHOW CATALOGS` 명령으로 Catalog를 조회할 수 있습니다.

```text
mysql> SHOW CATALOGS;
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
| CatalogId | CatalogName     | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
|     10024 | iceberg_catalog | iceberg  | yes       | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
|         0 | internal        | internal |           | NULL                    | NULL                | Doris internal catalog |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
```

[SHOW CREATE CATALOG](../sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG)를 사용하면 CREATE CATALOG 문을 확인할 수 있습니다.

### 데이터 Catalog 전환 {#switching-data-catalogs}

Doris는 연결 세션의 컨텍스트를 해당 데이터 Catalog로 전환하는 `SWITCH` 문을 제공합니다. 이는 `USE` 문으로 데이터베이스를 전환하는 것과 유사합니다.

데이터 Catalog로 전환한 후에는 `USE` 문으로 특정 데이터베이스로 전환하거나, `SHOW DATABASES`로 현재 데이터 Catalog의 데이터베이스를 조회할 수 있습니다.

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

`USE` 문에 정규화된 전체 이름인 `catalog_name.database_name`을 지정하면 특정 데이터 Catalog의 특정 데이터베이스로 직접 전환할 수도 있습니다.

```sql
USE iceberg_catalog.iceberg_db;
```

정규화된 전체 이름은 MySQL 명령줄이나 JDBC 연결 문자열에서도 사용할 수 있으며, MySQL 연결 프로토콜과 호환됩니다.

```sql
# Command line tool
mysql -h host -P9030 -uroot -Diceberg_catalog.iceberg_db

# JDBC url
jdbc:mysql://host:9030/iceberg_catalog.iceberg_db
```

내장 데이터 Catalog의 이름은 `internal`로 고정되어 있습니다. 전환 방법은 외부 데이터 Catalog와 동일합니다.

### 기본 데이터 Catalog {#default-data-catalog}

사용자 속성 `default_init_catalog`로 특정 사용자의 기본 데이터 Catalog를 설정할 수 있습니다. 설정 후 해당 사용자가 Doris에 연결하면 세션이 설정된 데이터 Catalog로 자동 전환됩니다.

```sql
SET PROPERTY default_init_catalog=hive_catalog;
```

참고 1: MySQL 명령줄이나 JDBC 연결 문자열에서 데이터 Catalog를 명시적으로 지정하면 해당 Catalog가 우선하며, `default_init_catalog` 사용자 속성은 적용되지 않습니다.

참고 2: 사용자 속성 `default_init_catalog`로 설정한 데이터 Catalog가 더 이상 존재하지 않으면 세션이 기본 데이터 Catalog인 `internal`로 자동 전환됩니다.

참고 3: 이 기능은 3.1.x 버전부터 지원됩니다.

### 간단한 쿼리 {#simple-queries}

Doris가 지원하는 모든 SQL 문으로 외부 데이터 Catalog의 테이블을 쿼리할 수 있습니다.

```sql
SELECT id, SUM(cost) FROM iceberg_db.table1
GROUP BY id ORDER BY id;
```

### Catalog 간 쿼리 {#cross-catalog-queries}

Doris는 데이터 Catalog 간 조인 쿼리를 지원합니다.

여기서는 [MySQL Catalog](./catalogs/jdbc-mysql-catalog.md)를 추가로 생성합니다.

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

그런 다음 SQL로 Iceberg 테이블과 MySQL 테이블 간의 조인 쿼리를 실행합니다.

```sql
SELECT * FROM
iceberg_catalog.iceberg_db.table1 tbl1 JOIN mysql_catalog.mysql_db.dim_table tbl2
ON tbl1.id = tbl2.id;
```

### 데이터 적재 {#data-ingestion}

`INSERT` 명령으로 데이터 소스의 데이터를 Doris에 적재할 수 있습니다.

```sql
INSERT INTO internal.doris_db.tbl1
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

`CTAS (Create Table As Select)` 문으로 외부 데이터 소스에서 Doris 내부 테이블을 생성하고 데이터를 적재할 수도 있습니다.

```sql
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

### 데이터 다시 쓰기 {#data-write-back}

Doris는 `INSERT` 문으로 외부 데이터 소스에 데이터를 직접 다시 쓰는 기능을 지원합니다. 자세한 내용은 다음 문서를 참고하세요.

* [Hive Catalog](./catalogs/hive-catalog.mdx)

* [Iceberg Catalog](./catalogs/iceberg-catalog.mdx)

* [JDBC Catalog](./catalogs/jdbc-catalog-overview.md)

## 데이터 Catalog 새로 고침 {#refreshing-data-catalogs}

Doris에서 생성한 데이터 Catalog는 해당 데이터 소스의 메타데이터 서비스에 접근하는 "프록시" 역할을 합니다. Doris는 일부 메타데이터를 캐시합니다. 캐시를 사용하면 메타데이터 접근 성능을 높이고 빈번한 네트워크 간 요청을 줄일 수 있습니다. 하지만 캐시의 최신성도 문제가 될 수 있습니다. 캐시를 새로 고치지 않으면 최신 메타데이터에 접근할 수 없습니다. 따라서 Doris는 데이터 Catalog를 새로 고치는 여러 방법을 제공합니다.

```sql
-- Refresh catalog
REFRESH CATALOG catalog_name;

-- Refresh specified database
REFRESH DATABASE catalog_name.db_name;

-- Refresh specified table
REFRESH TABLE catalog_name.db_name.table_name;
```

Doris는 최신 메타데이터에 실시간으로 접근할 수 있도록 메타데이터 캐시를 비활성화하는 기능도 지원합니다.

- Doris 4.1.x 이전: [메타데이터 캐시](./meta-cache.md)를 참고하세요.
- Doris 4.1.x 이상: 각 Catalog 문서의 "메타데이터 캐시" 절을 참고하세요.
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

외부 데이터 Catalog의 데이터베이스와 테이블에 대한 권한 관리 방법은 내부 테이블과 동일합니다. 자세한 내용은 [인증 및 권한 부여](../admin-manual/auth/authentication-and-authorization.md) 문서를 참고하세요.

## 외부 테이블 파티션 검증(4.1.5부터) {#external-table-partition-validation-since-415}

4.1.5부터 외부 테이블을 생성할 때 파티션 정의를 변환하기 전에 Catalog 파티션 모델을 검증합니다.

| Catalog | 지원되는 정의 | 지원되지 않는 정의 |
| --- | --- | --- |
| Hive | 기존 컬럼 이름을 사용하는 `PARTITION BY LIST` | RANGE, 파티션 표현식, 명시적 파티션 값 |
| Paimon / MaxCompute | 컬럼 이름으로 지정한 파티션 키 | 파티션 함수 표현식, 명시적 파티션 값 |
| Iceberg | 지원되는 컬럼 또는 변환 기반 파티션 정의 | Doris 내부 테이블 구문으로 지정한 명시적 파티션 값 |

파티션 값을 열거하는 내부 테이블 정의를 외부 테이블에 재사용하지 마세요. 예를 들어 Hive는 기록된 데이터에 따라 파티션을 생성하므로, `VALUES IN (...)`을 미리 나열할 필요가 없습니다.
