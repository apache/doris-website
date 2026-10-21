---
{
    "title": "Doris와 MaxCompute 데이터 통합",
    "language": "ko",
    "description": "MaxCompute Catalog를 통해 Apache Doris와 Alibaba Cloud MaxCompute 간 양방향 데이터 통합을 구현합니다. 데이터 가져오기, 다시 쓰기, 데이터베이스/테이블 관리를 지원하여 기업이 효율적인 레이크하우스 아키텍처를 구축할 수 있도록 돕습니다."
}
---

이 문서에서는 [MaxCompute Catalog](../catalogs/maxcompute-catalog.md)를 통해 Apache Doris와 Alibaba Cloud MaxCompute 간 데이터 통합을 구현하는 방법을 설명합니다:

- **데이터 가져오기**: MaxCompute의 데이터를 Doris로 빠르게 가져와 분석합니다.
- **데이터 다시 쓰기** (4.1.0+): Doris의 분석 결과나 다른 소스에서 가져온 데이터를 MaxCompute에 다시 씁니다.
- **데이터베이스/테이블 관리** (4.1.0+): Doris에서 직접 MaxCompute 데이터베이스와 테이블을 생성하고 관리합니다.

이 문서는 Apache Doris 2.1.9 버전을 기준으로 작성되었습니다. 일부 기능은 4.1.0 이상의 버전이 필요합니다.

## 환경 준비 {#environment-preparation}

### 01 MaxCompute Open Storage API 활성화 {#01-enable-maxcompute-open-storage-api}

[MaxCompute 콘솔](https://maxcompute.console.aliyun.com/)의 왼쪽 사이드바에서 `Tenant Management` -> `Tenant Properties`로 이동한 다음 `Open Storage (Storage API) Switch`를 활성화합니다.

### 02 MaxCompute 권한 부여 {#02-grant-maxcompute-permissions}

Doris는 AK/SK를 사용하여 MaxCompute 서비스에 접근합니다. AK/SK에 해당하는 IAM 사용자에게 MaxCompute 서비스에 대한 다음 역할 또는 권한이 있는지 확인합니다:

```json
{
    "Statement": [
        {
            "Action": [
                "odps:List",
                "odps:Usage"
            ],
            "Effect": "Allow",
            "Resource": ["acs:odps:*:regions/*/quotas/pay-as-you-go"]
        }
    ],
    "Version": "1"
}
```

### 03 Doris와 MaxCompute 네트워크 환경 확인 {#03-verify-doris-and-maxcompute-network-environment}

Doris 클러스터와 MaxCompute 서비스를 동일한 VPC에 배치하고 보안 그룹을 적절히 구성하는 것을 강력히 권장합니다.

이 문서의 예제는 동일한 VPC 네트워크 환경에서 테스트했습니다.

## MaxCompute 데이터 가져오기 {#importing-maxcompute-data}

### 01 Catalog 생성 {#01-create-catalog}

```sql
CREATE CATALOG mc PROPERTIES (
    "type" = "max_compute",
    "mc.default.project" = "xxx",
    "mc.access_key" = "AKxxxxx",
    "mc.secret_key" = "SKxxxxx",
    "mc.endpoint" = "xxxxx"
);
```

Schema 계층 구조를 지원하려면 다음과 같이 설정합니다(3.1.3+):

```sql
CREATE CATALOG mc PROPERTIES (
    "type" = "max_compute",
    "mc.default.project" = "xxx",
    "mc.access_key" = "AKxxxxx",
    "mc.secret_key" = "SKxxxxx",
    "mc.endpoint" = "xxxxx",
    "mc.enable.namespace.schema" = "true"
);
```

자세한 내용은 [MaxCompute Catalog](../catalogs/maxcompute-catalog.md) 문서를 참고하세요.

### 02 TPCH 데이터 세트 가져오기 {#02-import-tpch-dataset}

MaxCompute 공개 데이터 세트 중 TPCH 100 데이터 세트(데이터가 이미 MaxCompute에 적재되어 있음)를 예로 들어, `CREATE TABLE AS SELECT` 문으로 MaxCompute 데이터를 Doris로 가져옵니다.

이 데이터 세트에는 테이블이 7개 있습니다. 가장 큰 테이블인 `lineitem`에는 열이 16개, 행이 600,037,902개 있으며, 디스크 공간을 약 30GB 차지합니다.

```sql
-- switch catalog
SWITCH internal;
-- create database
CREATE DATABASE tpch_100g;
-- ingest data
CREATE TABLE tpch_100g.lineitem AS SELECT * FROM mc.selectdb_test.lineitem;
CREATE TABLE tpch_100g.nation AS SELECT * FROM mc.selectdb_test.nation;
CREATE TABLE tpch_100g.orders AS SELECT * FROM mc.selectdb_test.orders;
CREATE TABLE tpch_100g.part AS SELECT * FROM mc.selectdb_test.part;
CREATE TABLE tpch_100g.partsupp AS SELECT * FROM mc.selectdb_test.partsupp;
CREATE TABLE tpch_100g.region AS SELECT * FROM mc.selectdb_test.region;
CREATE TABLE tpch_100g.supplier AS SELECT * FROM mc.selectdb_test.supplier;
```

BE가 하나인 Doris 클러스터(16C 64G)에서 위 작업을 순차적으로 실행하면 약 6-7분이 걸립니다.

### 03 GitHub Event 데이터 세트 가져오기 {#03-import-github-event-dataset}

MaxCompute 공개 데이터 세트 중 GitHub Event 데이터 세트(데이터가 이미 MaxCompute에 적재되어 있음)를 예로 들어, `CREATE TABLE AS SELECT` 문으로 MaxCompute 데이터를 Doris로 가져옵니다.

여기서는 `dwd_github_events_odps` 테이블에서 `2015-01-01`부터 `2016-01-01`까지의 365개 파티션에 있는 데이터를 선택합니다. 이 데이터에는 열이 32개, 행이 212,786,803개 있으며, 디스크 공간을 약 10GB 차지합니다.

```sql
-- switch catalog
SWITCH internal;
-- create database
CREATE DATABASE github_events;
-- ingest data
CREATE TABLE github_events.dwd_github_events_odps
AS SELECT * FROM mc.github_events.dwd_github_events_odps
WHERE ds BETWEEN '2015-01-01' AND '2016-01-01';
```

BE가 하나인 Doris 클러스터(16C 64G)에서 위 작업을 실행하면 약 2분이 걸립니다.

## MaxCompute에 데이터 다시 쓰기 (4.1.0+) {#writing-data-back-to-maxcompute-410}

4.1.0 버전부터 Doris는 MaxCompute에 데이터를 다시 쓰는 기능을 지원합니다. 이 기능은 다음과 같은 상황에 적합합니다:

- **분석 결과 다시 쓰기**: Doris에서 데이터 분석을 마친 후 다른 시스템에서 사용할 수 있도록 결과를 MaxCompute에 다시 씁니다.
- **데이터 처리**: Doris의 강력한 연산 기능으로 데이터를 ETL 처리하고, 처리한 데이터를 MaxCompute에 저장합니다.
- **여러 소스의 데이터 통합**: Doris에서 여러 소스의 데이터를 통합한 뒤 MaxCompute에 써서 통합 관리합니다.

:::note
- 이 기능은 실험적 기능이며, 4.1.0 버전부터 지원됩니다.
- 파티션 테이블과 비파티션 테이블에 쓰기를 지원합니다.
- 클러스터링 테이블, 트랜잭션 테이블, Delta Tables, 외부 테이블에는 쓰기를 지원하지 않습니다.
:::

### 01 INSERT INTO 추가 쓰기 {#01-insert-into-append-write}

INSERT 작업은 MaxCompute 대상 테이블에 데이터를 추가합니다.

```sql
-- Switch to MaxCompute Catalog
SWITCH mc;

-- Insert a single row of data
INSERT INTO mc_db.mc_tbl VALUES (val1, val2, val3, val4);

-- Import data from Doris internal table to MaxCompute
INSERT INTO mc_db.mc_tbl SELECT col1, col2 FROM internal.db1.tbl1;

-- Write to specific columns
INSERT INTO mc_db.mc_tbl(col1, col2) VALUES (val1, val2);

-- Write to specific partition (you can specify only some partition columns, with the rest written dynamically)
INSERT INTO mc_db.mc_tbl PARTITION(ds='20250201') SELECT id, name FROM internal.db1.source_tbl;
```

### 02 INSERT OVERWRITE 덮어쓰기 {#02-insert-overwrite-overwrite-write}

INSERT OVERWRITE는 테이블의 기존 데이터를 새 데이터로 완전히 교체합니다.

```sql
-- Full table overwrite
INSERT OVERWRITE TABLE mc_db.mc_tbl VALUES (val1, val2, val3, val4);

-- Overwrite from another table
INSERT OVERWRITE TABLE mc_db.mc_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;

-- Overwrite specific partition
INSERT OVERWRITE TABLE mc_db.mc_tbl PARTITION(ds='20250101') VALUES (10, 'new1');
```

### 03 CTAS 테이블 생성 및 데이터 쓰기 {#03-ctas-create-table-and-write}

`CREATE TABLE AS SELECT` 문을 사용하여 MaxCompute에 새 테이블을 생성하고 데이터를 쓸 수 있습니다.

```sql
-- Create table in MaxCompute and import data
CREATE TABLE mc_db.mc_new_tbl AS SELECT * FROM internal.db1.source_tbl;
```

## 데이터베이스/테이블 관리 (4.1.0+) {#databasetable-management-410}

4.1.0 버전부터 Doris는 MaxCompute에서 직접 데이터베이스와 테이블을 생성하고 삭제하는 기능을 지원합니다. 이 기능은 다음과 같은 상황에 적합합니다:

- **통합 데이터 관리**: MaxCompute 콘솔로 전환할 필요 없이 Doris에서 여러 데이터 소스의 메타데이터를 중앙에서 관리합니다.
- **자동화된 데이터 파이프라인**: ETL 워크플로에서 대상 테이블을 동적으로 생성하여 전체 과정을 자동화합니다.

:::note
- 이 기능은 실험적 기능이며, 4.1.0 버전부터 지원됩니다.
- `mc.enable.namespace.schema` 속성을 `true`로 설정한 경우에만 이 기능을 사용할 수 있습니다.
- 파티션 테이블과 비파티션 테이블의 생성 및 삭제를 지원합니다.
- 클러스터링 테이블, 트랜잭션 테이블, Delta Tables, 외부 테이블의 생성은 지원하지 않습니다.
:::

### 01 데이터베이스 생성 및 삭제 {#01-create-and-drop-database}

```sql
-- Switch to MaxCompute Catalog
SWITCH mc;

-- Create Schema
CREATE DATABASE IF NOT EXISTS mc_schema;

-- Create using fully qualified name
CREATE DATABASE IF NOT EXISTS mc.mc_schema;

-- Drop Schema (will also delete all tables within it)
DROP DATABASE IF EXISTS mc.mc_schema;
```

:::caution
MaxCompute 데이터베이스를 삭제하면 내부의 모든 테이블도 함께 삭제됩니다. 주의해서 진행하세요.
:::

### 02 테이블 생성 및 삭제 {#02-create-and-drop-table}

```sql
-- Create non-partitioned table
CREATE TABLE mc_schema.mc_tbl1 (
    id INT,
    name STRING,
    amount DECIMAL(18, 6),
    create_time DATETIME
);

-- Create partitioned table
CREATE TABLE mc_schema.mc_tbl2 (
    id INT,
    val STRING,
    ds STRING,
    region STRING
)
PARTITION BY (ds, region)();

-- Drop table (will also delete data, including partition data)
DROP TABLE IF EXISTS mc_schema.mc_tbl1;
```

자세한 내용은 [MaxCompute Catalog](../catalogs/maxcompute-catalog.md) 문서를 참고하세요.
