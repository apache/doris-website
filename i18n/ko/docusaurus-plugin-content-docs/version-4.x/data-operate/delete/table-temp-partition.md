---
{
    "title": "임시 파티션",
    "language": "ko",
    "description": "Apache Doris 임시 파티션 가이드: 임시 파티션을 사용하여 데이터를 원자적으로 덮어쓰고, 버킷 수를 변경하고, 파티션을 병합하거나 분할하며, 서비스 중단 없이 파티션 데이터를 전환하는 방법을 설명합니다.",
    "keywords": [
        "Doris 임시 파티션",
        "임시 파티션",
        "원자적 덮어쓰기",
        "REPLACE PARTITION",
        "버킷 수 변경",
        "파티션 병합",
        "파티션 분할"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenarios: Atomic data overwrite / Partition structure adjustment / Bucket count change -->

**임시 파티션**은 Doris 파티션 테이블에서 정식 파티션과 독립적으로 존재하는 파티션 유형입니다. 일반 쿼리의 조회 대상에 포함되지 않으며, 전용 구문으로 명시적으로 접근해야 합니다. 주로 온라인 읽기와 쓰기에 영향을 주지 않고 원자적으로 데이터를 전환하거나 파티션 구조를 조정하는 데 사용합니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 | 핵심 기능 |
| --- | --- | --- |
| 원자적 덮어쓰기 | "기존 데이터를 삭제한 뒤 새 데이터를 적재하는" 공백 구간 없이 파티션의 데이터를 다시 작성 | `REPLACE PARTITION`을 통한 원자적 교체 |
| 버킷 수 변경 | 기존 파티션의 버킷 수가 적절하지 않아 조정이 필요한 경우 | 임시 파티션에 새 버킷 수를 지정한 뒤 교체 |
| 파티션 병합 / 분할 | 여러 파티션을 하나로 병합하거나 큰 파티션 하나를 여러 개로 분할하여 파티션 단위를 조정 | `INSERT INTO`로 데이터를 재분배한 뒤 교체 |

> 팁: **파티션이 없는 테이블**의 원자적 덮어쓰기는 [테이블 교체 문서](../../data-operate/delete/atomicity-replace)를 참조하세요.

## 핵심 제약 사항 {#core-constraints}

임시 파티션은 정식 파티션과 동일한 테이블 스키마를 공유하지만, 다음과 같은 독립성을 가집니다.

- 임시 파티션의 **파티션 컬럼**은 정식 파티션과 동일하며 수정할 수 없습니다.
- 모든 **임시 파티션**의 파티션 범위는 서로 겹치면 안 됩니다.
- 임시 파티션과 **정식 파티션**의 범위는 **겹칠 수 있습니다**.
- 임시 파티션의 이름은 정식 파티션이나 다른 임시 파티션의 이름과 같을 수 없습니다.

## 작업 흐름 개요 {#operation-workflow-overview}

일반적인 작업 흐름은 다음 네 단계로 구성됩니다.

1. 임시 파티션 **추가**(범위 / 열거 값 / 버킷 수 지정)
2. 임시 파티션에 데이터 **적재**(`INSERT INTO` / Stream Load / Broker Load / Routine Load)
3. 정식 파티션 **교체**(`REPLACE PARTITION`, 원자적 작업)
4. (선택 사항) 사용하지 않는 임시 파티션 **삭제**

---

## 임시 파티션 추가 {#add-a-temporary-partition}

`ALTER TABLE ADD TEMPORARY PARTITION` 문을 사용하여 임시 파티션을 생성합니다. Range 파티션과 List 파티션을 모두 지원하며, 복제본 수와 버킷 분할 규칙을 독립적으로 지정할 수 있습니다.

```sql
-- Range partition: LESS THAN form
ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01");

-- Range partition: fixed-interval form
ALTER TABLE tbl2 ADD TEMPORARY PARTITION tp1 VALUES [("2020-01-01"), ("2020-02-01"));

-- Range partition: custom replica count and bucketing
ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;

-- List partition: single-column enumeration
ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai");

-- List partition: multi-column enumeration
ALTER TABLE tbl4 ADD TEMPORARY PARTITION tp1 VALUES IN ((1, "Beijing"), (1, "Shanghai"));

-- List partition: custom replica count and bucketing
ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;
```

## 임시 파티션에 데이터 적재 {#load-data-into-a-temporary-partition}

임시 파티션을 지정하는 구문은 데이터 적재 방식에 따라 조금씩 다릅니다.

```sql
-- INSERT INTO
INSERT INTO tbl TEMPORARY PARTITION(tp1, tp2, ...) SELECT ...;
```

```bash
# Stream Load
curl --location-trusted -u root: \
     -H "label:123" \
     -H "temporary_partitions: tp1, tp2, ..." \
     -T testData \
     http://host:port/api/testDb/testTbl/_stream_load
```

```sql
-- Broker Load
LOAD LABEL example_db.label1
(
    DATA INFILE("hdfs://hdfs_host:hdfs_port/user/palo/data/input/file")
    INTO TABLE my_table
    TEMPORARY PARTITION (tp1, tp2, ...)
    ...
)
WITH BROKER hdfs ("username"="hdfs_user", "password"="hdfs_password");

-- Routine Load
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
TEMPORARY PARTITIONS(tp1, tp2, ...),
WHERE k1 > 100
PROPERTIES (...)
FROM KAFKA (...);
```

## 임시 파티션 쿼리 {#query-a-temporary-partition}

일반 SQL로는 임시 파티션에 접근할 수 없습니다. `TEMPORARY PARTITION` 키워드로 명시적으로 지정해야 합니다.

```sql
SELECT ... FROM
    tbl1 TEMPORARY PARTITION(tp1, tp2, ...)
JOIN
    tbl2 TEMPORARY PARTITION(tp1, tp2, ...)
ON ...
WHERE ...;
```

## 정식 파티션 교체 {#replace-a-formal-partition}

`ALTER TABLE REPLACE PARTITION`을 사용하여 정식 파티션을 임시 파티션으로 원자적으로 교체합니다.

```sql
-- Equal-count replacement
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);

-- Many-to-many replacement
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2, tp3);

-- Replace with explicit parameters
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2)
PROPERTIES (
    "strict_range" = "false",
    "use_temp_partition_name" = "true"
);
```

### 교체 매개변수 {#replacement-parameters}

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `strict_range` | `true` | 교체 전후의 파티션 범위 / 열거 값이 일치해야 하는 정도를 제어합니다(아래 참조) |
| `use_temp_partition_name` | `false` | 교체 후 정식 파티션의 이름을 지정하는 방식을 제어합니다 |

#### `strict_range` {#strict_range}

- **Range 파티션**:
    - `true`: 교체할 정식 파티션의 **범위 합집합**이 교체에 사용할 임시 파티션의 범위 합집합과 **정확히 같아야 합니다**.
    - `false`: 교체 후 새 정식 파티션들이 서로 겹치지 않으면 충분합니다.
- **List 파티션**: 항상 `true`입니다. 교체할 정식 파티션의 **열거 값 합집합**이 교체에 사용할 임시 파티션의 열거 값 합집합과 정확히 같아야 합니다.

**예제 1: 범위 합집합이 같은 경우(허용)**

```sql
-- Ranges (=> union) of partitions p1, p2, p3 to be replaced:
[10, 20), [20, 30), [40, 50) => [10, 30), [40, 50)

-- Ranges (=> union) of replacement partitions tp1, tp2:
[10, 30), [40, 45), [45, 50) => [10, 30), [40, 50)

-- The unions are equal, so tp1 and tp2 can replace p1, p2, and p3.
```

**예제 2: 범위 합집합이 다른 경우(strict_range에 따라 결정)**

```sql
-- Range (=> union) of partition p1 to be replaced:
[10, 50) => [10, 50)

-- Ranges (=> union) of replacement partitions tp1, tp2:
[10, 30), [40, 50) => [10, 30), [40, 50)

-- strict_range = true: replacement is rejected.
-- strict_range = false: if the resulting [10, 30) and [40, 50) do not overlap with other formal partitions, the replacement is allowed.
```

**예제 3: List 단일 컬럼 열거 값의 합집합이 같은 경우**

```sql
-- Enumerated values (=> union) of partitions p1, p2 to be replaced:
(1, 2, 3), (4, 5, 6) => (1, 2, 3, 4, 5, 6)

-- Enumerated values (=> union) of replacement partitions tp1, tp2, tp3:
(1, 2, 3), (4), (5, 6) => (1, 2, 3, 4, 5, 6)

-- The unions are equal, so tp1, tp2, and tp3 can replace p1 and p2.
```

**예제 4: List 다중 컬럼 열거 값의 합집합이 같은 경우**

```sql
-- Enumerated values (=> union) of partitions p1, p2, p3 to be replaced:
(("1","beijing"), ("1", "shanghai")),
(("2","beijing"), ("2", "shanghai")),
(("3","beijing"), ("3", "shanghai"))
=> (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- Enumerated values (=> union) of replacement partitions tp1, tp2:
(("1","beijing"), ("1", "shanghai")),
(("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))
=> (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- The unions are equal, so tp1 and tp2 can replace p1, p2, and p3.
```

#### `use_temp_partition_name` {#use_temp_partition_name}

교체 후 정식 파티션의 이름을 지정하는 방식을 제어합니다.

| 시나리오 | `use_temp_partition_name = false`(기본값) | `use_temp_partition_name = true` |
| --- | --- | --- |
| 교체할 파티션 수 = 교체에 사용할 파티션 수 | 기존 정식 파티션 이름을 유지합니다(데이터와 속성만 교체) | 임시 파티션 이름을 새 정식 파티션 이름으로 사용합니다 |
| 교체할 파티션 수 != 교체에 사용할 파티션 수 | 매개변수가 적용되지 않으며, 임시 파티션 이름이 강제로 사용됩니다 | 임시 파티션 이름을 사용합니다 |

**예제 1: 파티션 수가 같은 교체**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);
```

- `use_temp_partition_name = false`(기본값): 교체 후에도 파티션 이름은 `p1`이며, 데이터와 속성은 `tp1`에서 가져옵니다.
- `use_temp_partition_name = true`: 교체 후 파티션 이름이 `tp1`로 변경되고, `p1`은 더 이상 존재하지 않습니다.

**예제 2: 파티션 수가 다른 교체**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1);
```

- 교체할 파티션 수(2)가 교체에 사용할 파티션 수(1)와 다르므로 `use_temp_partition_name`은 적용되지 않습니다.
- 교체 후 파티션 이름은 `tp1`이 되고, 기존 `p1`과 `p2`는 더 이상 존재하지 않습니다.

:::tip 교체 시 유의 사항
교체가 성공하면 **교체된 정식 파티션은 삭제되며 복구할 수 없습니다**. 교체하기 전에 임시 파티션의 데이터가 올바른지 반드시 확인해야 합니다.
:::

## 임시 파티션 삭제 {#drop-a-temporary-partition}

`ALTER TABLE DROP TEMPORARY PARTITION`을 사용하여 더 이상 필요하지 않은 임시 파티션을 삭제합니다.

```sql
ALTER TABLE tbl1 DROP TEMPORARY PARTITION tp1;
```

> 참고: 삭제된 임시 파티션은 **`RECOVER` 명령으로 복구할 수 없습니다**.

---

## 다른 작업과의 관계 {#relationship-with-other-operations}

### DROP 작업 {#drop-operations}

| 작업 | 임시 파티션에 미치는 영향 | 복구 가능 여부 |
| --- | --- | --- |
| `DROP DATABASE` / `DROP TABLE` | 데이터베이스 또는 테이블의 임시 파티션도 함께 삭제됩니다 | 데이터베이스 또는 테이블 자체는 보존 기간 내에 `RECOVER`로 복구할 수 있지만, **임시 파티션은 복구되지 않습니다** |
| `ALTER ... DROP PARTITION`(정식 파티션) | 임시 파티션에 영향을 주지 않습니다 | 정식 파티션은 보존 기간 내에 `RECOVER`로 복구할 수 있습니다 |
| `ALTER ... DROP TEMPORARY PARTITION` | 지정된 임시 파티션을 삭제합니다 | **복구 불가** |

### TRUNCATE 작업 {#truncate-operations}

| 작업 | 영향 |
| --- | --- |
| `TRUNCATE TABLE` | 테이블의 임시 파티션이 **삭제되며 복구할 수 없습니다** |
| `TRUNCATE TABLE ... PARTITION`(정식 파티션의 데이터 비우기) | 임시 파티션에 영향을 주지 않습니다 |
| 임시 파티션에 `TRUNCATE` 실행 | **지원하지 않음** |

### ALTER 작업 {#alter-operations}

- 테이블에 임시 파티션이 있는 동안에는 **스키마 변경, rollup 등의 변경 작업을 실행할 수 없습니다**.
- 테이블에서 변경 작업이 진행 중인 동안에는 **임시 파티션을 추가할 수 없습니다**.

---

## 자주 묻는 질문 {#faq}

**Q1: 일반 `SELECT` 쿼리로 임시 파티션을 조회할 수 있나요?**

아니요. 임시 파티션은 `TEMPORARY PARTITION(...)` 절을 통해 명시적으로만 접근할 수 있습니다. 일반 쿼리, 보고서, 뷰는 임시 파티션의 데이터를 읽지 않습니다.

**Q2: 임시 파티션의 복제본 수와 버킷 수는 정식 파티션과 같아야 하나요?**

아니요. 이는 임시 파티션의 핵심 장점 중 하나입니다. 새 파티션에 서로 다른 `replication_num`과 `BUCKETS`를 지정한 뒤 `REPLACE PARTITION`으로 원자적으로 전환할 수 있습니다.

**Q3: 데이터 공백 없이 파티션 데이터를 다시 작성하려면 어떻게 해야 하나요?**

다음 순서로 진행합니다.

1. `ALTER TABLE ... ADD TEMPORARY PARTITION`을 실행하여 임시 파티션을 생성합니다.
2. `INSERT INTO` 또는 데이터 적재 작업을 사용하여 임시 파티션에 새 데이터를 씁니다.
3. 임시 파티션의 데이터가 올바른지 확인합니다.
4. `ALTER TABLE ... REPLACE PARTITION ... WITH TEMPORARY PARTITION ...`을 실행하여 원자적으로 교체합니다.

전체 과정에서 정식 파티션은 외부에서 계속 읽을 수 있습니다.

**Q4: 교체가 실패하거나 데이터가 잘못된 경우 어떻게 해야 하나요?**

교체 전에는 데이터가 여전히 임시 파티션에 있으며, 정식 파티션에는 영향이 없습니다. 데이터 문제를 발견하면 `ALTER TABLE ... DROP TEMPORARY PARTITION`을 실행하여 임시 파티션을 삭제한 뒤 데이터를 다시 적재합니다. **교체가 성공한 이후에는 기존 정식 파티션의 데이터를 복구할 수 없습니다.**

**Q5: 하나의 테이블에 여러 임시 파티션을 동시에 추가할 수 있나요?**

네. 임시 파티션의 범위나 열거 값이 서로 겹치지 않고 이름이 고유하다면 필요한 만큼 추가할 수 있습니다.

## 일반적인 오류 {#common-errors}

| 오류 / 증상 | 가능한 원인 | 해결 방법 |
| --- | --- | --- |
| 임시 파티션 추가 실패: 파티션이 이미 존재함 | 기존 정식 파티션 또는 임시 파티션과 이름이 충돌합니다 | 임시 파티션 이름을 변경합니다 |
| 임시 파티션 추가 실패: 범위 중복 | 범위 또는 열거 값이 기존 임시 파티션과 겹칩니다 | 범위를 조정하거나 충돌하는 임시 파티션을 먼저 삭제합니다 |
| 교체 실패: `strict_range` 검사 실패 | Range 파티션의 범위 합집합이 같지 않습니다 | 합집합이 일치하는지 확인하거나 `strict_range = false`를 명시적으로 설정합니다 |
| 교체 실패: List 파티션의 열거 값 불일치 | List 파티션에서 `strict_range`는 항상 `true`입니다 | 임시 파티션의 열거 값 합집합이 정식 파티션의 열거 값 합집합과 정확히 일치하도록 조정합니다 |
| 스키마 변경을 실행할 수 없음 | 테이블에 임시 파티션이 있습니다 | 모든 임시 파티션을 먼저 삭제하거나 교체합니다 |
| 임시 파티션을 실수로 삭제함 | `RECOVER`는 임시 파티션 복구를 지원하지 않습니다 | 파티션을 다시 생성하고 데이터를 다시 적재합니다 |

## 관련 문서 {#related-documents}

- [파티션이 없는 테이블의 원자적 덮어쓰기: 테이블 교체](../../data-operate/delete/atomicity-replace)
