---
{
    "title": "JDBC Catalog",
    "language": "ko",
    "description": "JDBC Catalog는 표준 JDBC 인터페이스를 통해 JDBC 프로토콜과 호환되는 데이터베이스에 연결할 수 있습니다."
}
---

JDBC Catalog는 표준 JDBC 인터페이스를 통해 JDBC 프로토콜과 호환되는 데이터베이스에 연결할 수 있습니다.

이 문서에서는 JDBC Catalog의 일반적인 구성과 사용법을 소개합니다. 각 JDBC 소스에 대한 자세한 내용은 해당 문서를 참조하세요.

:::info 참고
Doris의 JDBC Catalog 기능은 Java 계층을 사용하여 데이터를 읽고 처리하므로 JDK 버전에 따라 전반적인 성능이 달라질 수 있습니다. 이전 JDK 버전(예: JDK 8)의 일부 내부 라이브러리는 효율이 낮아 리소스 사용량이 늘어날 수 있습니다. 더 높은 성능이 필요하다면 기본적으로 JDK 17로 컴파일되어 전반적인 성능이 더 나은 Doris 3.0을 사용하는 것이 좋습니다.
:::

## 적용 시나리오 {#applicable-scenarios}

JDBC Catalog는 데이터 소스에서 소량의 데이터를 Doris로 가져오거나 JDBC 데이터 소스의 작은 테이블을 대상으로 조인 쿼리를 수행하는 등의 데이터 통합 용도에만 적합합니다. JDBC Catalog는 데이터 소스의 쿼리를 가속하거나 한 번에 대량의 데이터에 접근할 수 없습니다.

## 지원 데이터베이스 {#supported-databases}

Doris JDBC Catalog는 다음 데이터베이스에 대한 연결을 지원합니다.

| 지원 데이터 소스 |
| ---------------------------------- |
| [ MySQL](./jdbc-mysql-catalog.md)      |
| [ PostgreSQL](./jdbc-pg-catalog.md) |
| [ Oracle](./jdbc-oracle-catalog.md)     |
| [ SQL Server](./jdbc-sqlserver-catalog.md) |
| [ IBM DB2](./jdbc-ibmdb2-catalog.md)    |
| [ ClickHouse](./jdbc-clickhouse-catalog.md) |
| [ SAP HANA](./jdbc-saphana-catalog.md)   |
| [ Oceanbase](./jdbc-oceanbase-catalog.md) |

아직 지원되지 않는 새로운 JDBC 데이터 소스에 대한 지원을 개발하려면 [개발자 가이드](https://doris.apache.org/community/developer-guide/data-source-extension/jdbc-catalog-developer-guide)를 참조하세요.

## Catalog 구성 {#configuring-catalog}

### 구문 {#syntax}

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'jdbc', -- required
    {JdbcProperties},
    {CommonProperties}
);
```

* `{JdbcProperties}`

  * 필수 속성

      | 매개변수 이름   | 설명                              | 예시                       |
      | ---------------- | ---------------------------------------- | ----------------------------- |
      | `user`           | 데이터 소스 사용자 이름                     |                               |
      | `password`       | 데이터 소스 비밀번호                     |                               |
      | `jdbc_url`       | 데이터 소스 연결 URL               | `jdbc:mysql://host:3306`      |
      | `driver_url`     | JDBC 드라이버 파일 경로입니다. 드라이버 패키지 보안에 대해서는 부록을 참조하세요. | 아래의 세 가지 방식을 지원합니다. |
      | `driver_class`   | JDBC 드라이버의 클래스 이름            |                               |

      `driver_url`은 다음 세 가지 지정 방식을 지원합니다.
    
      1. 파일 이름. 예: `mysql-connector-j-8.3.0.jar`. Jar 파일을 FE 및 BE 배포 디렉터리 아래의 `jdbc_drivers/` 디렉터리에 미리 배치해야 합니다. 시스템이 이 디렉터리에서 자동으로 파일을 검색합니다. 이 위치는 `jdbc_drivers_dir` 설정을 통해 변경할 수도 있으며, 해당 설정은 `fe.conf`와 `be.conf`에 있습니다.
      
      2. 로컬 절대 경로. 예: `file:///path/to/mysql-connector-j-8.3.0.jar`. 모든 FE/BE 노드의 지정된 경로에 Jar 파일을 미리 배치해야 합니다.
      
      3. HTTP URL. 예: `https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.3.0/mysql-connector-j-8.3.0.jar`. 시스템이 이 HTTP 주소에서 드라이버 파일을 다운로드합니다. 인증이 없는 HTTP 서비스만 지원합니다.

      4.1.5부터 URI 스킴이 없는 드라이버 위치는 `[A-Za-z0-9._-]+.jar`와 일치하는 파일 이름이어야 합니다. URL 디코딩된 경로에는 `..` 상위 디렉터리 세그먼트가 포함되어서는 안 됩니다. 이 검사는 `ALTER CATALOG`와 Iceberg 및 Paimon JDBC Catalog의 드라이버 위치에도 적용됩니다. 기존의 드라이버 디렉터리 보안 검사와 허용 목록 검사도 계속 적용됩니다.

  * 선택적 속성

      | 매개변수 이름                | 기본값 | 설명                                                                                                                                   |
      | ----------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
      | `lower_case_meta_names`       | false         | 외부 데이터 소스의 데이터베이스, 테이블 및 열 이름을 소문자로 동기화할지 여부                                        |
      | `meta_names_mapping`          |               | 외부 데이터 소스에 `MY_TABLE`과 `my_table`처럼 대소문자만 다른 이름이 있으면 Catalog 쿼리 시 Doris가 모호성으로 인한 오류를 보고합니다. 충돌을 해결하려면 `meta_names_mapping` 매개변수를 구성해야 합니다. |
      | `only_specified_database`     | false         | `jdbc_url`에 지정된 데이터베이스만 동기화할지 여부입니다. 이 데이터베이스는 Doris의 데이터베이스 계층에 매핑됩니다.                       |
      | `connection_pool_min_size`    | 1             | 연결 풀의 최소 연결 수를 정의합니다. 풀을 초기화할 때 사용되며, keep-alive가 활성화되어 있을 때 활성 연결을 최소한 이 수만큼 유지합니다. |
      | `connection_pool_max_size`    | 30            | 연결 풀의 최대 연결 수를 정의합니다. 각 Catalog에 대해 각 FE 또는 BE 노드는 최대 이 수만큼 연결을 유지할 수 있습니다. |
      | `connection_pool_max_wait_time`| 5000         | 풀에 사용 가능한 연결이 없을 때 클라이언트가 연결을 기다릴 수 있는 최대 시간을 밀리초 단위로 정의합니다.                         |
      | `connection_pool_max_life_time`| 1800000      | 풀에 있는 연결의 최대 활성 유지 시간을 밀리초 단위로 설정합니다. 이 시간을 초과한 연결은 회수됩니다. 또한 이 값의 절반을 풀의 최소 유휴 제거 시간으로 사용하므로, 유휴 시간이 이 기준에 도달한 연결은 제거 대상이 됩니다. |
      | `connection_pool_keep_alive`  | false         | BE 노드에서만 적용되며, 최소 유휴 제거 시간에 도달했지만 최대 수명에는 도달하지 않은 연결을 활성 상태로 유지할지 결정합니다. 불필요한 리소스 사용을 줄이기 위해 기본적으로 비활성화되어 있습니다. |
        
* `[CommonProperties]`

  CommonProperties 부분에서는 공통 속성을 구성합니다. [Catalog 개요](../catalog-overview.md)의 **공통 속성** 부분을 참조하세요.

## 쿼리 작업 {#query-operations}

### 기본 쿼리 {#basic-query}

```sql
-- 1. switch to catalog, use database and query
SWITCH mysql_ctl;
USE mysql_db;
SELECT * FROM mysql_tbl LIMIT 10;

-- 2. use mysql database directly
USE mysql_ctl.mysql_db;
SELECT * FROM mysql_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM mysql_ctl.mysql_db.mysql_tbl LIMIT 10;
```

### 쿼리 최적화 {#query-optimization}

#### 조건자 푸시다운 {#predicate-pushdown}

JDBC Catalog가 데이터 소스에 접근할 때는 기본적으로 BE 노드를 선택하고 JDBC Client를 사용하여 생성된 SQL 쿼리를 소스에 전송한 다음 데이터를 가져옵니다. 따라서 성능은 생성된 SQL이 소스 측에서 얼마나 효율적으로 실행되는지에 전적으로 달려 있습니다. Doris는 조건자 조건을 푸시다운하여 생성된 SQL에 포함하려고 시도합니다. `EXPLAIN SQL` 문으로 생성된 SQL을 확인할 수 있습니다.

```sql
EXPLAIN SELECT smallint_u, sum(int_u)
FROM all_types WHERE smallint_u > 10 GROUP BY smallint_u;

...
|   0:VJdbcScanNode(206)                                                                             |
|      TABLE: `doris_test`.`all_types`                                                               |
|      QUERY: SELECT `smallint_u`, `int_u` FROM `doris_test`.`all_types` WHERE ((`smallint_u` > 10)) |
|      PREDICATES: (smallint_u[#1] > 10)                                                             |
|      final projections: smallint_u[#1], int_u[#3]                                                  |
|      final project output tuple id: 1   
...                                                           |
```

#### 함수 푸시다운 {#function-pushdown}

조건자의 의미나 동작은 Doris와 외부 데이터 소스에서 서로 다를 수 있습니다. 따라서 Doris는 다음 매개변수와 변수를 통해 JDBC 외부 테이블 쿼리의 조건자 푸시다운을 제한하고 제어합니다.

> 참고: 현재 Doris는 MySQL, Clickhouse 및 Oracle 데이터 소스에 대해서만 조건자 푸시다운을 지원합니다. 앞으로 더 많은 데이터 소스를 지원할 예정입니다.

- `enable_jdbc_oracle_null_predicate_push_down`

    세션 변수입니다. 기본값은 `false`입니다. 즉, 조건자 조건에 `NULL` 값이 포함되어 있으면 해당 조건자를 Oracle 데이터 소스로 푸시다운하지 않습니다. Oracle 21 이전 버전에서는 `NULL`을 연산자로 지원하지 않기 때문입니다.

    이 매개변수는 2.1.7 및 3.0.3부터 지원됩니다.

- `enable_jdbc_cast_predicate_push_down`

    세션 변수입니다. 기본값은 `false`입니다. 즉, 조건자 조건에 명시적 또는 암시적 CAST가 있으면 해당 조건자를 JDBC 데이터 소스로 푸시다운하지 않습니다. 데이터베이스마다 CAST의 동작이 다르므로 정확성을 보장하기 위해 기본적으로 CAST를 푸시다운하지 않습니다. 다만 사용자가 CAST의 동작이 일치하는지 직접 확인할 수 있습니다. 동작이 일치한다면 이 매개변수를 `true`로 설정하여 더 많은 조건자를 푸시다운하고 성능을 개선할 수 있습니다.

    이 매개변수는 2.1.7 및 3.0.3부터 지원됩니다.

- 함수 푸시다운 블랙리스트 및 화이트리스트

    시그니처가 같은 함수라도 Doris와 외부 데이터 소스에서 의미가 다를 수 있습니다. Doris에는 함수 푸시다운을 위한 일부 블랙리스트와 화이트리스트가 미리 정의되어 있습니다.

    | 데이터 소스   | 블랙리스트 | 화이트리스트 | 설명     |
    | ---------- | ----- | --- | --------- |
    | MySQL      | - `DATE_TRUNC`<br>- `MONEY_FORMAT`<br>- `NEGTIVE`  |  | MySQL은 FE 설정 항목 `jdbc_mysql_unsupported_pushdown_functions`를 통해 블랙리스트 항목을 추가할 수도 있습니다. 예: `jdbc_mysql_unsupported_pushdown_functions==func1,func2` |
    | Clickhouse | | - `FROM_UNIXTIME`<br>- `UNIX_TIMESTAMP` |       |
    | Oracle     |  | - `NVL`<br>- `IFNULL`   |          |

- 함수 재작성 규칙

    Doris와 외부 데이터 소스에는 동작은 같지만 이름이 다른 함수가 있습니다. Doris는 함수 푸시다운 시 이러한 함수를 재작성할 수 있습니다. 현재 다음 재작성 규칙이 내장되어 있습니다.

    | 데이터 소스   | Doris 함수 | 대상 함수 |
    | ---------- | ----- | --- |
    | MySQL | nvl | ifnull |
    | MySQL | to_date | date |
    | Clickhouse | from_unixtime | FROM_UNIXTIME |
    | Clickhouse | unix_timestamp | toUnixTimestamp |
    | Oracle | ifnull | nvl |

- 사용자 정의 함수 푸시다운 및 재작성 규칙

    3.0.7 이후 버전에서 Doris는 더 유연한 함수 푸시다운 및 재작성 규칙을 지원합니다. 사용자는 Catalog 속성에서 특정 Catalog의 함수 푸시다운 및 재작성 규칙을 설정할 수 있습니다.

    ```sql
    create catalog jdbc properties (
    ...
    'function_rules' = '{"pushdown" : {"supported": ["to_date"], "unsupported" : ["abs"]}, "rewrite" : {"to_date" : "date2"}}'
    )
    ```

    `function_rules`를 통해 다음 규칙을 지정할 수 있습니다.

    - `pushdown`

        함수 푸시다운 규칙을 지정합니다. `supported` 및 `unsupported` 배열은 각각 푸시다운할 수 있는 함수 이름과 푸시다운할 수 없는 함수 이름을 지정합니다. 함수가 두 배열에 모두 있으면 `supported`가 우선합니다.

        Doris는 시스템에 미리 정의된 블랙리스트와 화이트리스트를 먼저 적용한 다음 사용자가 지정한 블랙리스트와 화이트리스트를 적용합니다.

    - `rewrite`

        함수 재작성 규칙을 정의합니다. 위 예시에서는 함수 이름 `to_date`를 `date2`로 재작성하여 푸시다운합니다.

        참고: 푸시다운이 허용된 함수만 재작성됩니다.

#### 행 수 제한 {#row-count-limitation}

쿼리에 `LIMIT` 키워드가 포함되어 있으면 Doris는 `LIMIT` 절을 데이터 소스로 푸시다운하여 데이터 전송량을 줄입니다. `EXPLAIN` 문으로 생성된 SQL에 `LIMIT` 절이 포함되어 있는지 확인할 수 있습니다.

## 쓰기 작업 {#write-operations}

Doris는 JDBC 프로토콜을 통해 해당 데이터 소스에 데이터를 다시 쓰는 기능을 지원합니다.

```sql
INSERT INTO mysql_table SELECT * FROM internal.doris_db.doris_tbl;
```

## 구문 패스스루 {#statement-passthrough}

### 적용 시나리오 {#applicable-scenarios-1}

Doris는 구문 패스스루를 통해 JDBC 데이터 소스에서 해당 DDL, DML 및 쿼리 문을 직접 실행할 수 있습니다. 이 기능은 다음 시나리오에 적용할 수 있습니다.

* 복잡한 쿼리의 성능 개선

  기본적으로 Doris 쿼리 옵티마이저는 원본 SQL을 파싱하고 일정한 규칙에 따라 데이터 소스로 전송할 SQL을 생성합니다. 이렇게 생성된 SQL은 일반적으로 단순한 단일 테이블 쿼리이며 집계나 조인 쿼리와 같은 연산자를 포함할 수 없습니다. 다음 쿼리를 예로 들어 보겠습니다.

  ```sql
  SELECT smallint_u, sum(int_u)
  FROM all_types WHERE smallint_u > 10 GROUP BY smallint_u;
  ```

  최종적으로 생성되는 SQL은 다음과 같습니다.

  ```sql
  SELECT smallint_u, int_u 
  FROM all_types
  WHERE smallint_u > 10;
  ```

  이 경우 집계 연산은 Doris 내부에서 수행됩니다. 따라서 일부 시나리오에서는 네트워크를 통해 소스에서 대량의 데이터를 읽어야 하므로 쿼리 효율이 낮아질 수 있습니다. 구문 패스스루를 사용하면 원본 SQL을 데이터 소스에 직접 전달하고 데이터 소스 자체의 연산 기능으로 SQL을 실행하여 쿼리 성능을 개선할 수 있습니다.

* 통합 관리

  구문 패스스루 기능은 쿼리 SQL뿐 아니라 DDL 및 DML 문도 전달할 수 있습니다. 따라서 사용자는 Doris를 통해 소스 데이터에 대한 데이터베이스 및 테이블 작업을 직접 수행할 수 있습니다. 예를 들어 테이블 생성, 삭제 또는 테이블 구조 변경이 가능합니다.

### SQL 패스스루 {#passthrough-sql}

```sql
SELECT * FROM
QUERY(
  'catalog' = 'mysql_catalog', 
  'query' = 'SELECT smallint_u, sum(int_u) FROM db.all_types WHERE smallint_u > 10 GROUP BY smallint_u;'
);
```

`QUERY` 테이블 함수는 두 매개변수를 받습니다.

* `catalog`: Catalog의 이름으로, 해당 Catalog의 이름과 일치해야 합니다.
* `query`: 실행할 쿼리 문으로, 해당 데이터 소스의 구문을 사용하여 직접 작성합니다.

### DDL 및 DML 패스스루 {#passthrough-ddl-and-dml}

```sql
CALL EXECUTE_STMT("jdbc_catalog", "insert into db1.tbl1 values(1,2), (3, 4)");

CALL EXECUTE_STMT("jdbc_catalog", "delete from db1.tbl1 where k1 = 2");

CALL EXECUTE_STMT("jdbc_catalog", "create table dbl1.tbl2 (k1 int)");
```

`EXECUTE_STMT()` 함수는 두 매개변수를 받습니다.

* 첫 번째 매개변수: Catalog의 이름입니다. 현재는 JDBC 유형의 Catalog만 지원됩니다.
* 두 번째 매개변수: 실행할 SQL 문입니다. 현재는 DDL 및 DML 문만 지원되며, 해당 데이터 소스의 구문을 사용하여 작성해야 합니다.

### 사용 제한 사항 {#usage-restrictions}

`CALL EXECUTE_STMT()` 명령을 사용하면 Doris는 사용자가 작성한 SQL 문을 해당 Catalog에 연결된 JDBC 데이터 소스로 직접 전송하여 실행합니다. 따라서 이 작업에는 다음과 같은 제한이 있습니다.

* SQL 문은 해당 데이터 소스의 구문을 따라야 합니다. Doris는 구문이나 의미를 검사하지 않습니다.

* SQL 문에서 참조하는 테이블 이름에는 `db.tbl`과 같이 정규화된 전체 이름을 사용하는 것이 좋습니다. 데이터베이스를 지정하지 않으면 JDBC Catalog의 JDBC URL에 있는 데이터베이스 이름을 사용합니다.

* SQL 문은 JDBC 데이터 소스 외부의 데이터베이스나 테이블을 참조할 수 없으며, Doris의 데이터베이스나 테이블도 참조할 수 없습니다. 다만 Doris JDBC Catalog와 동기화되지 않은 JDBC 데이터 소스 내부의 테이블은 참조할 수 있습니다.

* DML 문을 실행할 때 삽입, 업데이트 또는 삭제된 행 수는 가져올 수 없으며, 명령의 성공 또는 실패 여부만 확인할 수 있습니다.

* Catalog에 대한 `LOAD` 권한이 있는 사용자만 `CALL EXECUTE_STMT()` 명령을 실행할 수 있습니다.

* Catalog에 대한 `SELECT` 권한이 있는 사용자만 `query()` 테이블 함수를 실행할 수 있습니다.

* Catalog를 생성할 때 지정한 JDBC 사용자에게는 해당 구문을 실행하는 데 필요한 소스 측 권한이 있어야 합니다.

* `query()` 테이블 함수가 읽은 결과의 데이터 타입은 쿼리 대상 Catalog 유형에서 지원하는 데이터 타입과 일치합니다.

## 부록 {#appendix}

### 대소문자 구분 설정 {#case-sensitivity-settings}


기본적으로 Doris의 데이터베이스 및 테이블 이름은 대소문자를 구분하고, 열 이름은 대소문자를 구분하지 않습니다. 이 동작은 구성 매개변수로 변경할 수 있습니다. 또한 일부 JDBC 데이터 소스의 데이터베이스, 테이블 및 열 이름에 대한 대소문자 구분 규칙은 Doris와 다를 수 있습니다. 이러한 차이로 인해 JDBC Catalog를 통한 이름 매핑 시 이름 충돌이 발생할 수 있습니다. 다음 절에서는 이러한 문제를 해결하는 방법을 설명합니다.

#### 표시 이름과 쿼리 이름 {#display-name-and-query-name}

Doris에서 객체 이름(여기서는 테이블 이름을 예로 듭니다)은 **표시 이름**과 **쿼리 이름**으로 나눌 수 있습니다. 테이블 이름을 예로 들면, **표시 이름**은 `SHOW TABLES` 결과에 표시되는 이름이고, **쿼리 이름**은 `SELECT` 문에서 사용할 수 있는 이름입니다.

예를 들어 테이블의 실제 이름이 `MyTable`이면 이 테이블의 **표시 이름**과 **쿼리 이름**은 Frontend (FE) 매개변수 `lower_case_table_names`의 설정에 따라 달라질 수 있습니다.

| 설정 | 설명 | 실제 이름 | 표시 이름 | 쿼리 이름 |
| --- | --- | --- | --- | --- |
| `lower_case_table_names=0` | 기본 설정입니다. 원래 이름을 저장하고 표시하며, 쿼리 시 대소문자를 구분합니다. | `MyTable` | `MyTable` | 쿼리 시 대소문자를 구분하므로 반드시 `MyTable`을 사용해야 합니다. |
| `lower_case_table_names=1` | 이름을 소문자로 저장하고 표시하며, 쿼리 시 대소문자를 구분하지 않습니다. | `MyTable` | `mytable` | 쿼리 시 대소문자를 구분하지 않으므로, 예를 들어 `MyTable` 또는 `mytable`을 사용할 수 있습니다. |
| `lower_case_table_names=2` | 원래 이름을 저장하고 표시하지만, 쿼리 시 대소문자를 구분하지 않습니다. | `MyTable` | `MyTable` | 쿼리 시 대소문자를 구분하지 않으므로, 예를 들어 `MyTable` 또는 `mytable`을 사용할 수 있습니다. |

#### JDBC Catalog 이름의 대소문자 구분 규칙 {#jdbc-catalog-name-case-sensitivity-rules}

Doris 자체에서는 **테이블 이름**의 대소문자 구분 규칙만 구성할 수 있습니다. 하지만 JDBC Catalog에서는 **데이터베이스 이름**과 **열 이름**도 추가로 처리해야 합니다. 따라서 추가 Catalog 속성인 `lower_case_meta_names`를 `lower_case_table_names`와 함께 사용합니다.

| 설정 | 설명 |
| --- | --- |
| `lower_case_meta_names` | Catalog를 생성할 때 `properties`를 통해 지정하며 해당 Catalog에만 적용됩니다. 기본값은 `false`입니다. `true`로 설정하면 Doris는 모든 데이터베이스, 테이블 및 열 이름을 소문자로 변환하여 저장하고 표시합니다. 쿼리에서는 Doris의 소문자 이름을 사용해야 합니다. |
| `lower_case_table_names` | Frontend (FE) 설정 항목으로, `fe.conf`에서 구성하며 전체 클러스터에 적용됩니다. 기본값은 `0`입니다. |

> 참고: `lower_case_meta_names = true`이면 `lower_case_table_names` 설정은 무시되며 모든 데이터베이스, 테이블 및 열 이름이 소문자로 변환됩니다.

`lower_case_meta_names` (true/false)와 `lower_case_table_names` (0/1/2)의 조합에 따른 데이터베이스, 테이블 및 열 이름의 **저장** 및 **쿼리** 동작은 다음 표와 같습니다("원본"은 외부 데이터 소스의 대소문자를 유지한다는 뜻이고, "소문자"는 자동으로 소문자로 변환한다는 뜻이며, "대소문자 무관"은 쿼리에서 대소문자에 관계없이 사용할 수 있다는 뜻입니다).

| `lower_case_table_names` & `lower_case_meta_names` | 데이터베이스 표시 이름 | 테이블 표시 이름 | 열 표시 이름 | 데이터베이스 쿼리 이름 | 테이블 쿼리 이름 | 열 쿼리 이름 |
| -------------------------------------------------- | --------------------- | ------------------ | ------------------- | ------------------- | ---------------- | ----------------- |
| `0 & false`                                       | 원본              | 원본           | 원본            | 원본            | 원본         | 대소문자 무관          |
| `0 & true`                                        | 소문자             | 소문자          | 소문자           | 소문자           | 소문자        | 대소문자 무관          |
| `1 & false`                                       | 원본              | 소문자          | 원본            | 원본            | 대소문자 무관         | 대소문자 무관          |
| `1 & true`                                        | 소문자             | 소문자          | 소문자           | 소문자           | 대소문자 무관         | 대소문자 무관          |
| `2 & false`                                       | 원본              | 원본           | 원본            | 원본            | 대소문자 무관         | 대소문자 무관          |
| `2 & true`                                        | 소문자             | 소문자          | 소문자           | 소문자           | 대소문자 무관         | 대소문자 무관          |

#### 대소문자 충돌 검사 {#case-conflict-check}

JDBC Catalog를 통해 이름을 매핑할 때 이름 충돌이 발생할 수 있습니다. 예를 들어 소스의 열 이름이 대소문자를 구분하고 `ID`와 `id`라는 두 열이 있다고 가정해 보겠습니다. `lower_case_meta_names = true`를 설정하면 이 두 열은 소문자로 변환된 후 충돌합니다. Doris는 다음 규칙에 따라 충돌을 검사합니다.

* 모든 경우에 Doris는 **열 이름**의 대소문자 충돌을 검사합니다. 예를 들어 `id`와 `ID`가 동시에 존재하는지 확인합니다.

* `lower_case_meta_names = true`이면 Doris는 데이터베이스 이름, 테이블 이름 및 열 이름의 대소문자 충돌을 검사합니다. 예를 들어 `DORIS`와 `doris`가 동시에 존재하는지 확인합니다.

* `lower_case_meta_names = false`이고 `lower_case_table_names`가 `1` 또는 `2`로 설정되어 있으면 Doris는 **테이블 이름**의 충돌을 검사합니다. 예를 들어 `orders`와 `ORDERS`가 동시에 존재하는지 확인합니다.

* `lower_case_table_names = 0`이면 데이터베이스 및 테이블 이름은 대소문자를 구분하며 추가 변환이 필요하지 않습니다.

#### 대소문자 충돌 해결 방법 {#solutions-to-case-conflicts}

충돌이 발생하면 Doris는 오류를 발생시키며, 다음 방법으로 충돌을 해결해야 합니다.

데이터베이스, 테이블 또는 열 이름이 대소문자만 달라(예: `DORIS`와 `doris`) Doris가 이를 제대로 구분할 수 없다면, Catalog의 `meta_names_mapping`을 설정하여 수동 매핑을 지정하는 방식으로 충돌을 해결할 수 있습니다.

**예시**

```json
{
  "databases": [
    {
      "remoteDatabase": "DORIS",
      "mapping": "doris_1"
    },
    {
      "remoteDatabase": "doris",
      "mapping": "doris_2"
    }
  ],
  "tables": [
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "DORIS",
      "mapping": "doris_1"
    },
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "doris",
      "mapping": "doris_2"
    }
  ],
  "columns": [
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "DORIS",
      "remoteColumn": "DORIS",
      "mapping": "doris_1"
    },
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "DORIS",
      "remoteColumn": "doris",
      "mapping": "doris_2"
    }
  ]
}
```

### 드라이버 패키지 보안 {#driver-package-security}

드라이버 패키지는 사용자가 Doris 클러스터에 업로드하므로 보안 위험이 있을 수 있습니다. 다음 조치로 보안을 강화할 수 있습니다.

1. Doris는 `jdbc_drivers_dir` 디렉터리에 있는 모든 드라이버 패키지를 안전한 것으로 간주하며 경로 검사를 수행하지 않습니다. 관리자는 이 디렉터리의 파일을 직접 관리하여 보안을 보장해야 합니다.

2. 로컬 경로나 HTTP 경로로 드라이버 패키지를 지정하면 Doris는 다음 검사를 수행합니다.

   * 허용되는 드라이버 패키지 경로는 FE 설정 항목 `jdbc_driver_secure_path`를 통해 제어합니다. 이 설정에는 세미콜론으로 구분하여 여러 경로를 포함할 수 있습니다. 이 설정이 지정되어 있으면 Doris는 `driver_url`의 경로 접두사가 `jdbc_driver_secure_path`에 포함되어 있는지 확인합니다. 포함되어 있지 않으면 생성을 거부합니다.

     예시:

     `jdbc_driver_secure_path = "file:///path/to/jdbc_drivers;http://path/to/jdbc_drivers"`로 구성하면 `file:///path/to/jdbc_drivers` 또는 `http://path/to/jdbc_drivers`로 시작하는 드라이버 패키지 경로만 허용됩니다.

   * 이 매개변수의 기본값은 `*`입니다. 비어 있거나 `*`로 설정되어 있으면 모든 Jar 패키지 경로를 허용합니다.

3. 데이터 디렉터리를 생성할 때 `checksum` 매개변수를 사용하여 드라이버 패키지의 체크섬을 지정할 수 있습니다. Doris는 드라이버 패키지를 불러온 후 체크섬을 검증하며, 검증에 실패하면 생성을 거부합니다.

### 연결 풀 정리 {#connection-pool-cleanup}

Doris의 각 FE 및 BE 노드는 개별 데이터 소스 연결을 빈번하게 열고 닫는 작업을 줄이기 위해 연결 풀을 유지합니다. 풀의 각 연결은 데이터 소스와 연결을 설정하고 쿼리를 실행하는 데 사용할 수 있습니다. 작업이 완료되면 연결을 풀에 반환하여 재사용합니다. 이를 통해 성능을 개선하고 연결 설정에 드는 시스템 오버헤드를 줄이며 데이터 소스의 연결 한도에 도달하는 것을 방지할 수 있습니다.

연결 풀 크기는 실제 요구 사항에 따라 조정하여 다양한 워크로드에 더 잘 대응할 수 있습니다. 일반적으로 풀의 최소 연결 수는 1로 설정하여 keep-alive 메커니즘이 활성화되어 있을 때 적어도 하나의 연결이 활성 상태를 유지하도록 해야 합니다. 최대 연결 수는 과도한 리소스 사용을 방지할 수 있는 적절한 값으로 설정해야 합니다.

BE에 사용하지 않는 연결 풀 캐시가 누적되는 것을 방지하려면 BE의 `jdbc_connection_pool_cache_clear_time_sec` 매개변수를 설정하여 캐시 정리 간격을 지정할 수 있습니다. 기본값은 28,800초 (8시간)이며, 이 시간이 지나면 BE는 해당 시간 동안 사용되지 않은 모든 연결 풀 캐시를 강제로 정리합니다.

### 인증 정보 업데이트 {#credential-update}

JDBC Catalog를 사용하여 외부 데이터 소스에 연결할 때는 데이터베이스 인증 정보를 신중하게 업데이트해야 합니다.

Doris는 쿼리에 빠르게 응답하기 위해 연결 풀을 통해 활성 연결을 유지합니다. 하지만 인증 정보를 변경한 후에도 연결 풀이 이전 인증 정보로 새 연결을 시도하여 실패할 수 있습니다. 시스템은 일정 수의 활성 연결을 유지하려고 하므로 이러한 잘못된 연결 시도가 반복됩니다. 일부 데이터베이스 시스템에서는 빈번한 실패로 인해 계정이 잠길 수 있습니다.

인증 정보를 변경해야 할 때는 Doris JDBC Catalog 구성도 함께 업데이트하고 Doris 클러스터를 다시 시작하는 것이 좋습니다. 이렇게 하면 모든 노드가 최신 인증 정보를 사용하므로 연결 실패와 계정 잠금 가능성을 방지할 수 있습니다.

계정 잠금 시 다음과 같은 메시지가 표시될 수 있습니다.

```text
MySQL: account is locked

Oracle: ORA-28000: the account is locked

SQL Server: Login is locked out
```

### 연결 풀 문제 해결 {#connection-pool-troubleshooting}

1. HikariPool 연결 시간 초과 오류: `Connection is not available, request timed out after 5000ms`

   * 가능한 원인

     * 원인 1: 네트워크 문제(예: 서버에 연결할 수 없음)

     * 원인 2: 잘못된 사용자 이름이나 비밀번호 등의 인증 문제

     * 원인 3: 높은 네트워크 지연 시간으로 인해 연결 생성이 5초의 제한 시간을 초과함

     * 원인 4: 동시 쿼리가 너무 많아 풀에 구성된 최대 연결 수를 초과함

   * 해결 방법

     * `Connection is not available, request timed out after 5000ms` 오류만 발생한다면 원인 3 및 4를 확인하세요.

       * 네트워크 지연 시간이 높거나 리소스가 고갈되었는지 확인합니다.

       * 풀의 최대 연결 수를 늘립니다.

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_size' = '100');
           ```

       * 연결 제한 시간을 늘립니다.

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_wait_time' = '10000');
           ```

     * `Connection is not available, request timed out after 5000ms` 외에 추가 오류 메시지가 있다면 해당 오류를 확인하세요.

       * 네트워크 문제(예: 서버에 연결할 수 없음)로 인해 연결이 실패할 수 있습니다. 네트워크 연결이 안정적인지 확인합니다.

       * 인증 문제(예: 잘못된 사용자 이름이나 비밀번호)로 인해 연결이 실패할 수도 있습니다. 구성의 데이터베이스 인증 정보를 확인하여 사용자 이름과 비밀번호가 올바른지 확인합니다.

       * 구체적인 오류 메시지를 바탕으로 네트워크, 데이터베이스 또는 인증 관련 문제를 조사하여 근본 원인을 파악합니다.
