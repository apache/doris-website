---
{
    "title": "동기 구체화된 뷰",
    "language": "ko",
    "description": "Doris 동기 구체화된 뷰로 집계, 접두사 인덱스 매칭, 표현식 계산을 어떻게 가속할 수 있을까요? 이 문서에서는 활용 시나리오, 구문, 뷰 사용 여부 확인 방법, 자주 묻는 질문을 설명합니다.",
    "keywords": ["Doris 동기 구체화된 뷰", "구체화된 뷰", "쿼리 가속", "bitmap_union", "접두사 인덱스", "집계 사전 계산"]
}
---

<!-- Knowledge type: concept + how-to guide -->
<!-- Applicable scenarios: aggregation precomputation, prefix index matching, prefiltering, expression precomputation -->

동기 구체화된 뷰(Sync Materialized View)는 기본 테이블에 대한 SELECT 문의 결과를 미리 계산하여 저장하는 Doris의 특수한 테이블입니다. Doris가 자동으로 관리하며, 쓰기 시 기본 테이블과 강한 일관성을 유지하고, 쿼리 시 최적의 뷰를 자동으로 매칭하여 읽기를 가속합니다.

## 사용 시 유의 사항 {#usage-notes}

동기 구체화된 뷰를 사용하기 전에 다음 사항을 확인하세요.

- **단일 테이블** SELECT 문만 대상으로 하며, JOIN, HAVING, LIMIT, LATERAL VIEW는 포함할 수 없습니다.
- SELECT 목록에는 자동 증가 컬럼, 상수, 중복 표현식, 윈도우 함수, VARBINARY 타입 컬럼을 포함할 수 없습니다.
- SELECT 목록의 집계 함수는 최상위 표현식이어야 합니다(`sum(a + 1)`은 지원하지만, `sum(a) + 1`은 지원하지 않습니다).
- 구체화된 뷰의 컬럼 이름은 기본 테이블이나 다른 뷰의 컬럼 이름과 충돌하면 안 됩니다(`col as xxx` 별칭으로 충돌을 피할 수 있습니다).
- 단일 테이블에 생성하는 뷰의 수가 데이터 적재 성능에 미치는 영향을 평가해야 합니다.
- Unique Key 모델에서는 뷰로 컬럼 순서만 변경할 수 있으며, 집계는 수행할 수 없습니다.

## 동기 구체화된 뷰란 {#what-is-a-sync-materialized-view}

<!-- Knowledge type: concept -->

동기 구체화된 뷰는 정의된 SELECT 문을 바탕으로 미리 계산한 데이터셋을 저장하는 Doris의 특수한 테이블입니다. Doris는 동기 구체화된 뷰의 데이터를 자동으로 관리합니다. 데이터를 추가하거나 삭제할 때 기본 테이블과 구체화된 뷰 테이블이 동기적으로 업데이트되어 일관성을 유지하도록 보장합니다. 동기화가 완료된 후에만 관련 명령이 종료되므로 별도의 수동 관리가 필요하지 않습니다. 쿼리 시 Doris는 최적의 구체화된 뷰를 자동으로 매칭하고 해당 뷰에서 직접 데이터를 읽습니다.

## 활용 시나리오 {#applicable-scenarios}

<!-- Applicable scenarios: when to choose a sync materialized view -->

| 시나리오 | 설명 |
| --- | --- |
| 집계 가속 | SUM/COUNT/BITMAP_UNION과 같이 시간이 오래 걸리는 집계를 미리 계산합니다. |
| 다른 접두사 인덱스 매칭 | 쿼리의 필터 컬럼이 기본 테이블의 접두사 인덱스와 일치하지 않으면, 필터 컬럼을 앞에 배치한 뷰를 생성합니다. |
| 사전 필터링으로 스캔량 감소 | WHERE 조건으로 데이터를 미리 필터링하여 데이터량을 줄입니다. |
| 복잡한 표현식 사전 계산 | `abs(k1)+k2+1`과 같은 복잡한 표현식을 미리 계산하고 쿼리 시 직접 재사용합니다. |

## 제한 사항 {#limitations}

<!-- Knowledge type: constraints -->

| 범주 | 제한 사항 |
| --- | --- |
| 구문 범위 | WHERE/GROUP BY/ORDER BY를 포함하는 단일 테이블 SELECT만 지원하며, JOIN, HAVING, LIMIT, LATERAL VIEW는 지원하지 않습니다. |
| 쿼리 방식 | 동기 구체화된 뷰를 직접 쿼리할 수 없습니다(비동기 구체화된 뷰와 다름). |
| SELECT 목록 | 자동 증가 컬럼, 상수, 중복 표현식, 윈도우 함수를 포함할 수 없으며, VARBINARY 타입 컬럼도 포함할 수 없습니다. |
| 컬럼 이름 요구 사항 | 기본 테이블이나 해당 기본 테이블의 다른 구체화된 뷰에 있는 이름과 중복되면 안 됩니다. 별칭(`col as xxx`)을 사용하여 충돌을 피하세요. |
| 집계 함수 | 최상위 표현식이어야 합니다(`sum(a) + 1`은 지원하지 않지만, `sum(a + 1)`은 지원합니다). 집계 함수 뒤에는 다른 비집계 표현식이 올 수 없습니다(`SELECT x, sum(a)`는 허용되지만, `SELECT sum(a), x`는 허용되지 않습니다). |
| 삭제 제한 | DELETE 조건에서 참조하는 컬럼이 구체화된 뷰에 있으면, 데이터를 삭제하기 전에 해당 뷰를 먼저 삭제해야 합니다. |
| 데이터 적재 성능 | 단일 테이블에 구체화된 뷰가 너무 많으면 기본 테이블과 함께 뷰도 업데이트되므로 데이터 적재 속도가 느려집니다. |
| 데이터 모델 | Unique Key 모델의 구체화된 뷰는 컬럼 순서만 변경할 수 있으며, 집계는 수행할 수 없습니다. |

## 동기 구체화된 뷰 사용하기 {#using-a-sync-materialized-view}

Doris는 구체화된 뷰의 생성, 조회, 삭제를 위한 DDL 문을 제공합니다. 다음 예제에서는 구체화된 뷰를 사용하여 집계를 가속하는 방법을 설명합니다.

### 기본 테이블 데이터 준비 {#prepare-base-table-data}

각 거래의 거래 ID, 판매자, 매장, 판매 시각, 금액을 기록하는 판매 상세 테이블이 있다고 가정합니다.

```sql
-- Create a test_db
create database test_db;
use test_db;

-- Create the table
create table sales_records
(
    record_id int, 
    seller_id int, 
    store_id int, 
    sale_date date, 
    sale_amt bigint
) 
distributed by hash(record_id) 
properties("replication_num" = "1");

-- Insert data
insert into sales_records values(1,1,1,"2020-02-02",1), (1,1,1,"2020-02-02",2);
```

### 구체화된 뷰 생성 {#create-a-materialized-view}

**목적**: 매장별 매출을 자주 분석하는 쿼리를 위해 사전 집계된 뷰를 생성합니다.

**명령**:

```sql
create materialized view store_amt as 
select store_id as store_id_, sum(sale_amt) from sales_records group by store_id;
```

**설명**: 이 뷰는 `store_id`로 그룹화하고 각 매장의 `sale_amt`를 합산하여 매장 기준의 집계 쿼리를 가속합니다.

### 구체화된 뷰 생성 여부 확인 {#check-whether-the-materialized-view-is-created}

**목적**: 구체화된 뷰는 비동기적으로 생성되므로 작업 상태를 확인해야 합니다.

**명령**:

```sql
show alter table materialized view from test_db;
```

**설명**: 결과에는 해당 데이터베이스의 모든 구체화된 뷰 생성 작업이 표시됩니다. 출력 예시는 다음과 같습니다.

```sql
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
| JobId  | TableName     | CreateTime          | FinishTime          | BaseIndexName | RollupIndexName | RollupId | TransactionId | State    | Msg  | Progress | Timeout |
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
| 494349 | sales_records | 2020-07-30 20:04:56 | 2020-07-30 20:04:57 | sales_records | store_amt       | 494350   | 133107        | FINISHED |      | NULL     | 2592000 |
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
```

주요 필드 설명:

| 필드 | 의미 |
| --- | --- |
| TableName | 구체화된 뷰의 원본 테이블 |
| RollupIndexName | 구체화된 뷰의 이름 |
| State | 작업 상태. `FINISHED`는 뷰가 성공적으로 생성되어 쿼리가 자동으로 매칭할 수 있음을 의미합니다. |

### 구체화된 뷰 생성 취소 {#cancel-creation-of-a-materialized-view}

**목적**: 백그라운드 비동기 작업이 실행 중일 때 생성 작업을 취소합니다.

**명령**:

```sql
cancel alter table materialized view from test_db.sales_records;
```

**설명**: 구체화된 뷰가 이미 생성되었다면 이 명령으로 생성을 취소할 수 없습니다. 이 경우 삭제 명령으로 구체화된 뷰를 삭제할 수 있습니다.

### 구체화된 뷰의 스키마 조회 {#view-the-schema-of-a-materialized-view}

**목적**: 대상 테이블의 모든 구체화된 뷰와 해당 스키마를 조회합니다.

**명령**:

```sql
desc sales_records all;
```

**설명**: 출력은 다음과 같습니다.

```sql
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
| IndexName     | IndexKeysType | Field               | Type   | InternalType | Null | Key   | Default | Extra | Visible | DefineExpr | WhereClause |
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
| sales_records | DUP_KEYS      | record_id           | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | seller_id           | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | store_id            | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | sale_date           | DATE   | DATEV2       | Yes  | false | NULL    | NONE  | true    |            |             |
|               |               | sale_amt            | BIGINT | BIGINT       | Yes  | false | NULL    | NONE  | true    |            |             |
|               |               |                     |        |              |      |       |         |       |         |            |             |
| store_amt     | AGG_KEYS      | mv_store_id         | INT    | INT          | Yes  | true  | NULL    |       | true    | `store_id` |             |
|               |               | mva_SUM__`sale_amt` | BIGINT | BIGINT       | Yes  | false | NULL    | SUM   | true    | `sale_amt` |             |
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
```

`sales_records`에 `store_amt`라는 구체화된 뷰가 있음을 확인할 수 있습니다. 이 뷰는 이전 단계에서 생성한 뷰입니다.

### 구체화된 뷰의 CREATE 문 조회 {#view-the-create-statement-of-a-materialized-view}

**목적**: 구체화된 뷰의 원본 DDL을 조회합니다.

**명령**:

```sql
show create materialized view store_amt on sales_records;
```

**설명**: 출력은 다음과 같습니다.

```sql
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
| TableName     | ViewName  | CreateStmt                                                                                                 |
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
| sales_records | store_amt | create materialized view store_amt as select store_id, sum(sale_amt) from sales_records group by store_id |
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
```

### 구체화된 뷰 쿼리 {#query-the-materialized-view}

**목적**: 쿼리는 계속 기본 테이블을 대상으로 작성하며, Doris가 구체화된 뷰를 사용하도록 자동으로 재작성합니다.

**명령**:

```sql
select store_id, sum(sale_amt) from sales_records group by store_id;
```

위 쿼리는 `store_amt`에 자동으로 매칭됩니다. `EXPLAIN` 명령으로 현재 쿼리가 구체화된 뷰를 사용하는지 확인할 수 있습니다.

```sql
explain select store_id, sum(sale_amt) from sales_records group by store_id;
```

**설명**: 결과는 다음과 같습니다.

```sql
+------------------------------------------------------------------------+
| Explain String (Nereids Planner)                                       |
+------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                        |
|   OUTPUT EXPRS:                                                        |
|     store_id[#11]                                                      |
|     sum(sale_amt)[#12]                                                 |
|   PARTITION: HASH_PARTITIONED: store_id_[#7]                           |
|                                                                        |
|   HAS_COLO_PLAN_NODE: true                                             |
|                                                                        |
|   VRESULT SINK                                                         |
|      MYSQL_PROTOCAL                                                    |
|                                                                        |
|   3:VAGGREGATE (merge finalize)(384)                                   |
|   |  output: sum(partial_sum(__sum_1)[#8])[#10]                        |
|   |  group by: store_id_[#7]                                           |
|   |  sortByGroupKey: false                                             |
|   |  cardinality = 1                                                   |
|   |  final projections: store_id_[#9], sum(__sum_1)[#10]               |
|   |  final project output tuple id: 4                                  |
|   |  distribute expr lists: store_id_[#7]                              |
|   |                                                                    |
|   2:VEXCHANGE                                                          |
|      offset: 0                                                         |
|      distribute expr lists:                                            |
|                                                                        |
| PLAN FRAGMENT 1                                                        |
|                                                                        |
|   PARTITION: HASH_PARTITIONED: record_id[#2]                           |
|                                                                        |
|   HAS_COLO_PLAN_NODE: false                                            |
|                                                                        |
|   STREAM DATA SINK                                                     |
|     EXCHANGE ID: 02                                                    |
|     HASH_PARTITIONED: store_id_[#7]                                    |
|                                                                        |
|   1:VAGGREGATE (update serialize)(374)                                 |
|   |  STREAMING                                                         |
|   |  output: partial_sum(__sum_1[#1])[#8]                              |
|   |  group by: store_id_[#0]                                           |
|   |  sortByGroupKey: false                                             |
|   |  cardinality = 1                                                   |
|   |  distribute expr lists:                                            |
|   |                                                                    |
|   0:VOlapScanNode(369)                                                 |
|      TABLE: test_db.sales_records(store_amt), PREAGGREGATION: ON       |
|      partitions = 1/1 (sales_records)                                  |
|      tablets = 10/10, tabletList = 266568, 266570, 266572 ...          |
|      cardinality = 1, avgRowSize = 1805.0, numNodes = 1                |
|      pushAggOp = NONE                                                  |
|                                                                        |
|                                                                        |
| ========== MATERIALIZATIONS ==========                                 |
|                                                                        |
| MaterializedView                                                       |
| MaterializedViewRewriteSuccessAndChose:                                |
|   internal.test_db.sales_records.store_amt chose,                      |
|                                                                        |
| MaterializedViewRewriteSuccessButNotChose:                             |
|   not chose: none,                                                     |
|                                                                        |
| MaterializedViewRewriteFail:                                           |
|                                                                        |
|                                                                        |
| ========== STATISTICS ==========                                       |
| planned with unknown column statistics                                 |
+------------------------------------------------------------------------+
```

`MaterializedViewRewriteSuccessAndChose`에는 쿼리에 성공적으로 사용된 구체화된 뷰가 표시됩니다. 구체적인 예시는 다음과 같습니다.

```sql
+------------------------------------------------------------------------+
| MaterializedViewRewriteSuccessAndChose:                                |  
|   internal.test_db.sales_records.store_amt chose,                      |
+------------------------------------------------------------------------+
```

위 출력은 쿼리가 `store_amt`라는 구체화된 뷰를 성공적으로 사용했음을 나타냅니다. 대상 테이블에 데이터가 없으면 구체화된 뷰가 사용되지 않을 수 있습니다.

#### MATERIALIZATIONS 필드 설명 {#materializations-field-descriptions}

| 필드 | 의미 |
| --- | --- |
| MaterializedViewRewriteSuccessAndChose | 쿼리 최적화를 위해 성공적으로 선택되어 사용된 구체화된 뷰 |
| MaterializedViewRewriteSuccessButNotChose | 매칭에는 성공했지만 선택되지 않은 구체화된 뷰(비용 평가 결과 최적이 아님) |
| MaterializedViewRewriteFail | 매칭되지 않은 구체화된 뷰. 원본 SQL을 기존 뷰와 매칭할 수 없었습니다. |

### 구체화된 뷰 삭제 {#drop-a-materialized-view}

**목적**: 더 이상 필요하지 않은 구체화된 뷰를 삭제합니다.

**명령**:

```sql
drop materialized view store_amt on sales_records;
```

## 예제 {#examples}

### 예제 1: 집계 쿼리 가속 {#example-1-accelerate-aggregation-queries}

<!-- Applicable scenarios: exact deduplication aggregation such as UV/PV -->

**업무 시나리오**: 광고의 UV(순 방문자 수)와 PV(페이지 조회 수)를 계산합니다.

**절차**:

1. 광고 클릭 상세 정보를 저장하는 원본 테이블을 생성합니다.

    ```sql
    create table advertiser_view_record
    (
        click_time datetime, 
        advertiser varchar(10), 
        channel varchar(10), 
        user_id int
    ) distributed by hash(user_id) properties("replication_num" = "1");
    insert into advertiser_view_record values("2020-02-02 02:02:02",'a','a',1), ("2020-02-02 02:02:02",'a','a',2);
    ```

2. 사용자는 광고의 UV를 조회하려고 합니다(동일 광고에 대한 사용자의 중복을 정확하게 제거). 일반적인 쿼리는 다음과 같습니다.

    ```sql
    select 
        advertiser, 
        channel, 
        count(distinct user_id) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

3. UV 시나리오에서는 `bitmap_union`을 사용하는 구체화된 뷰를 생성하여 사전에 중복을 정확하게 제거합니다. Doris에서 `count(distinct)`의 결과는 `bitmap_union_count`와 동일하므로, `bitmap_union`으로 집계한 구체화된 뷰로 쿼리를 가속할 수 있습니다.

    ```sql
    create materialized view advertiser_uv as 
    select 
        advertiser as advertiser_, 
        channel as channel_, 
        bitmap_union(to_bitmap(user_id)) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

4. 구체화된 뷰를 생성한 후 원래의 UV 쿼리를 다시 실행합니다. Doris는 자동으로 `advertiser_uv`에서 데이터를 읽습니다.

    ```sql
    select 
        advertiser, 
        channel, 
        count(distinct user_id) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

5. 구체화된 뷰가 선택되면 실제 쿼리는 다음과 같이 재작성됩니다.

    ```sql
    select 
        advertiser, 
        channel, 
        bitmap_union_count(to_bitmap(user_id)) 
    from 
        advertiser_uv 
    group by 
        advertiser, channel;
    ```

6. `explain` 명령으로 쿼리가 구체화된 뷰에 매칭되었는지 확인합니다.

    ```sql
    explain select 
        advertiser, 
        channel, 
        count(distinct user_id) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

7. 출력은 다음과 같습니다.

    ```sql
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                                                                                         |
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    | PLAN FRAGMENT 0                                                                                                                                         |
    |   OUTPUT EXPRS:                                                                                                                                         |
    |     advertiser[#13]                                                                                                                                     |
    |     channel[#14]                                                                                                                                        |
    |     count(DISTINCT user_id)[#15]                                                                                                                        |
    |   PARTITION: HASH_PARTITIONED: advertiser_[#7], channel_[#8]                                                                                            |
    |                                                                                                                                                         |
    |   HAS_COLO_PLAN_NODE: true                                                                                                                              |
    |                                                                                                                                                         |
    |   VRESULT SINK                                                                                                                                          |
    |      MYSQL_PROTOCAL                                                                                                                                     |
    |                                                                                                                                                         |
    |   3:VAGGREGATE (merge finalize)(440)                                                                                                                    |
    |   |  output: bitmap_union_count(partial_bitmap_union_count(__bitmap_union_2)[#9])[#12]                                                                  |
    |   |  group by: advertiser_[#7], channel_[#8]                                                                                                            |
    |   |  sortByGroupKey:false                                                                                                                               |
    |   |  cardinality=1                                                                                                                                      |
    |   |  final projections: advertiser_[#10], channel_[#11], bitmap_union_count(__bitmap_union_2)[#12]                                                      |
    |   |  final project output tuple id: 4                                                                                                                   |
    |   |  distribute expr lists: advertiser_[#7], channel_[#8]                                                                                               |
    |   |                                                                                                                                                     |
    |   2:VEXCHANGE                                                                                                                                           |
    |      offset: 0                                                                                                                                          |
    |      distribute expr lists:                                                                                                                             |
    |                                                                                                                                                         |
    | PLAN FRAGMENT 1                                                                                                                                         |
    |                                                                                                                                                         |
    |   PARTITION: HASH_PARTITIONED: user_id[#6]                                                                                                              |
    |                                                                                                                                                         |
    |   HAS_COLO_PLAN_NODE: false                                                                                                                             |
    |                                                                                                                                                         |
    |   STREAM DATA SINK                                                                                                                                      |
    |     EXCHANGE ID: 02                                                                                                                                     |
    |     HASH_PARTITIONED: advertiser_[#7], channel_[#8]                                                                                                     |
    |                                                                                                                                                         |
    |   1:VAGGREGATE (update serialize)(430)                                                                                                                  |
    |   |  STREAMING                                                                                                                                          |
    |   |  output: partial_bitmap_union_count(__bitmap_union_2[#2])[#9]                                                                                       |
    |   |  group by: advertiser_[#0], channel_[#1]                                                                                                            |
    |   |  sortByGroupKey:false                                                                                                                               |
    |   |  cardinality=1                                                                                                                                      |
    |   |  distribute expr lists:                                                                                                                             |
    |   |                                                                                                                                                     |
    |   0:VOlapScanNode(425)                                                                                                                                  |
    |      TABLE: test_db.advertiser_view_record(advertiser_uv), PREAGGREGATION: ON                                                                           |
    |      partitions=1/1 (advertiser_view_record)                                                                                                            |
    |      tablets=10/10, tabletList=266637,266639,266641 ...                                                                                                 |
    |      cardinality=1, avgRowSize=0.0, numNodes=1                                                                                                          |
    |      pushAggOp=NONE                                                                                                                                     |
    |                                                                                                                                                         |
    |                                                                                                                                                         |
    | ========== MATERIALIZATIONS ==========                                                                                                                  |
    |                                                                                                                                                         |
    | MaterializedView                                                                                                                                        |
    | MaterializedViewRewriteSuccessAndChose:                                                                                                                 |
    |   internal.test_db.advertiser_view_record.advertiser_uv chose,                                                                                          |
    |                                                                                                                                                         |
    | MaterializedViewRewriteSuccessButNotChose:                                                                                                              |
    |   not chose: none,                                                                                                                                      |
    |                                                                                                                                                         |
    | MaterializedViewRewriteFail:                                                                                                                            |
    |                                                                                                                                                         |
    |                                                                                                                                                         |
    | ========== STATISTICS ==========                                                                                                                        |
    | planed with unknown column statistics                                                                                                                   |
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    ```

8. `explain` 출력에서 `internal.test_db.advertiser_view_record.advertiser_uv chose`를 확인할 수 있습니다. 이는 쿼리가 구체화된 뷰의 데이터를 직접 스캔하며 매칭에 성공했음을 의미합니다. 동시에 `count(distinct)`는 `user_id` 컬럼에 대해 `bitmap_union_count(to_bitmap)`으로 재작성되어 Bitmap으로 중복을 정확하게 제거합니다.

### 예제 2: 다른 접두사 인덱스 매칭 {#example-2-match-a-different-prefix-index}

<!-- Applicable scenarios: filter conditions not covered by the base table prefix index -->

**업무 시나리오**: 접두사 인덱스에 매칭합니다.

사용자의 원본 테이블에는 세 컬럼(k1, k2, k3)이 있으며, k1과 k2가 접두사 인덱스 컬럼으로 설정되어 있습니다. 쿼리 조건에 `where k1=1 and k2=2`가 포함되면 인덱스로 쿼리를 가속할 수 있습니다. 하지만 `where k3=3`과 같은 조건은 접두사 인덱스를 사용할 수 없습니다. 이 문제를 해결하려면 첫 번째 컬럼이 `k3`인 구체화된 뷰를 생성하면 됩니다.

**절차**:

1. 테이블을 생성하고 데이터를 삽입합니다.

    ```sql
    create table test_table
    (
        k1 int, 
        k2 int, 
        k3 int, 
        kx int
    ) 
    distributed by hash(k1) 
    properties("replication_num" = "1");
    
    insert into test_table values(1,1,1,1),(3,3,3,3);
    ```

2. k3를 접두사 인덱스로 사용하는 구체화된 뷰를 생성합니다.

    ```sql
    create materialized view mv_1 as SELECT k3 as k3_, k2 as k2_, k1 as k1_ FROM test_table;
    ```

3. `EXPLAIN`으로 쿼리가 구체화된 뷰에 매칭되는지 확인합니다.

    ```sql
    explain select k1, k2, k3 from test_table where k3=3;
    ```

4. 출력은 다음과 같습니다.

    ```sql
    +----------------------------------------------------------+
    | Explain String(Nereids Planner)                          |
    +----------------------------------------------------------+
    | PLAN FRAGMENT 0                                          |
    |   OUTPUT EXPRS:                                          |
    |     k1[#7]                                               |
    |     k2[#8]                                               |
    |     k3[#9]                                               |
    |   PARTITION: HASH_PARTITIONED: k1_[#2]                   |
    |                                                          |
    |   HAS_COLO_PLAN_NODE: false                              |
    |                                                          |
    |   VRESULT SINK                                           |
    |      MYSQL_PROTOCAL                                      |
    |                                                          |
    |   0:VOlapScanNode(256)                                   |
    |      TABLE: test_db.test_table(mv_1), PREAGGREGATION: ON |
    |      PREDICATES: (mv_k3[#0] = 3)                         |
    |      partitions=1/1 (test_table)                         |
    |      tablets=10/10, tabletList=271177,271179,271181 ...  |
    |      cardinality=1, avgRowSize=0.0, numNodes=1           |
    |      pushAggOp=NONE                                      |
    |      final projections: k1_[#2], mv_k2[#1], mv_k3[#0]    |
    |      final project output tuple id: 2                    |
    |                                                          |
    |                                                          |
    | ========== MATERIALIZATIONS ==========                   |
    |                                                          |
    | MaterializedView                                         |
    | MaterializedViewRewriteSuccessAndChose:                  |
    |   internal.test_db.test_table.mv_1 chose,                |
    |                                                          |
    | MaterializedViewRewriteSuccessButNotChose:               |
    |   not chose: none,                                       |
    |                                                          |
    | MaterializedViewRewriteFail:                             |
    |                                                          |
    |                                                          |
    | ========== STATISTICS ==========                         |
    | planed with unknown column statistics                    |
    +----------------------------------------------------------+
    ```

5. `EXPLAIN` 출력에서 `internal.test_db.test_table.mv_1 chose`를 확인할 수 있습니다. 이는 쿼리가 구체화된 뷰를 성공적으로 사용했음을 의미합니다.

### 예제 3: 사전 필터링과 표현식 계산으로 쿼리 가속 {#example-3-accelerate-queries-with-prefiltering-and-expression-computation}

<!-- Applicable scenarios: repeated computation of complex expressions or subset queries under fixed WHERE conditions -->

**업무 시나리오**: 데이터를 미리 필터링하거나 표현식 계산을 가속합니다.

**절차**:

1. 테이블을 생성하고 데이터를 삽입합니다.

    ```sql
    create table d_table (
       k1 int null,
       k2 int not null,
       k3 bigint null,
       k4 date null
    )
    duplicate key (k1,k2,k3)
    distributed BY hash(k1) buckets 3
    properties("replication_num" = "1");
    
    insert into d_table select 1,1,1,'2020-02-20';
    insert into d_table select 2,2,2,'2021-02-20';
    insert into d_table select 3,-3,null,'2022-02-20';
    ```

2. 표현식 사전 계산용 뷰와 데이터 사전 필터링용 뷰, 두 개의 구체화된 뷰를 생성합니다.

    ```sql
    -- mv1 performs expression computation in advance
    create materialized view mv1 as 
    select 
        abs(k1)+k2+1,        
        sum(abs(k2+2)+k3+3) 
    from 
        d_table 
    group by 
        abs(k1)+k2+1;
    
    -- mv2 filters with a where expression in advance to reduce the data volume in the materialized view
    create materialized view mv2 as 
    select 
        year(k4),
        month(k4) 
    from 
        d_table 
    where 
        year(k4) = 2020;
    ```

3. 구체화된 뷰가 사용되는지 확인합니다.

    ```sql
    -- Hits mv1
    select 
        abs(k1)+k2+1,
        sum(abs(k2+2)+k3+3) 
    from 
        d_table 
    group by 
        abs(k1)+k2+1;
        
    -- Hits mv1
    select 
        bin(abs(k1)+k2+1),
        sum(abs(k2+2)+k3+3) 
    from 
        d_table 
    group by 
        bin(abs(k1)+k2+1);
    
    -- Hits mv2
    select 
        year(k4) + month(k4) 
    from 
        d_table 
    where 
        year(k4) = 2020;
    
    -- Hits the original table d_table; does not hit mv2 because the where condition does not match
    select 
        year(k4),
        month(k4) 
    from 
        d_table;
    ```

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

### Q1: 구체화된 뷰를 생성한 후에도 쿼리가 성공적으로 재작성되지 않는 이유는 무엇인가요? {#q1-after-the-materialized-view-is-created-why-is-it-not-rewritten-successfully}

**원인**: 구체화된 뷰가 아직 생성 중일 수 있습니다.

**진단 명령**:

```sql
show alter table materialized view from test_db;
```

**설명**: `State` 필드가 `FINISHED`가 아니면 생성이 완료될 때까지 기다리세요. 상태가 `FINISHED`로 바뀐 후에만 쿼리가 구체화된 뷰를 사용할 수 있습니다. 또한 기본 테이블에 데이터가 없으면 구체화된 뷰가 사용되지 않을 수 있습니다.

### Q2: 2.x에서 3.0.0으로 업그레이드한 후 기존 동기 구체화된 뷰가 더 이상 사용되지 않는 이유는 무엇인가요? {#q2-after-upgrading-from-2x-to-300-why-are-previous-sync-materialized-views-no-longer-hit}

**원인**: 3.0.0 버전부터는 기본적으로 실행 계획의 구조 정보를 기반으로 동기 구체화된 뷰를 활용하는 투명한 쿼리 재작성이 수행됩니다.

**해결 방법**: 2.x에서는 구체화된 뷰가 사용되지만 3.0.0에서는 사용되지 않는다면, 다음 설정을 끄세요(기본적으로 활성화되어 있음).

```sql
SET enable_sync_mv_cost_based_rewrite = false;
```

### Q3: 동기 구체화된 뷰와 비동기 구체화된 뷰는 어떻게 다른가요? {#q3-what-is-the-difference-between-sync-and-async-materialized-views}

| 비교 항목 | 동기 구체화된 뷰 | 비동기 구체화된 뷰 |
| --- | --- | --- |
| 데이터 일관성 | 기본 테이블과 강한 일관성을 유지하며, 쓰기 시 동기적으로 업데이트됨 | 비동기적으로 새로 고쳐지므로 지연이 발생함 |
| 지원 구문 | 단일 테이블 SELECT만 지원 | 여러 테이블의 JOIN과 같은 복잡한 쿼리 지원 |
| 직접 쿼리 | 지원하지 않으며, 기본 테이블 쿼리의 자동 재작성을 통해 사용해야 함 | 뷰를 직접 쿼리할 수 있음 |
| 관리 비용 | 수동 개입 없이 자동으로 관리됨 | 새로 고침 정책이 필요함 |
| 활용 시나리오 | 단일 테이블 집계, 접두사 인덱스, 사전 필터링, 표현식 사전 계산 | 여러 테이블의 JOIN 및 테이블 간 사전 계산 |
