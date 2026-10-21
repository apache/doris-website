---
{
    "title": "데이터 적재 기반 일괄 삭제",
    "language": "ko",
    "description": "Doris Unique Key 모델은 데이터 적재 시 삭제 마커를 함께 전달하여 일괄 삭제를 지원합니다. CDC 동기화와 대규모 기본 키 삭제 시나리오에 적합하며, DELETE 문보다 뛰어난 성능을 제공합니다.",
    "keywords": [
        "Doris 일괄 삭제",
        "Unique Key 삭제",
        "삭제 마커",
        "__DORIS_DELETE_SIGN__",
        "CDC 동기화",
        "merge_type DELETE",
        "Stream Load 삭제",
        "Broker Load 삭제",
        "Routine Load 삭제"
    ]
}
---

<!-- Knowledge type: Procedure + Feature description -->
<!-- Applicable scenarios: CDC synchronization / Large-scale primary key deletion / Merged data writes -->

**데이터 적재 기반 일괄 삭제**는 Doris Unique Key 모델에서 제공하는 삭제 방식입니다. 데이터 적재 시 **삭제 마커 컬럼**을 함께 전달하여 삭제할 행에 삭제 표시를 하고, 백그라운드 Compaction이 해당 행을 비동기적으로 정리합니다.

`DELETE` 문에 비해 삭제 마커는 일괄 삭제 및 CDC 시나리오에서 성능과 사용 편의성이 더 뛰어납니다.

### 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
|------|------|
| **CDC 동기화** | OLTP 데이터베이스(예: MySQL)에서 binlog를 통해 Doris로 동기화하면 binlog에 Insert와 Delete 연산이 번갈아 나타납니다. 삭제 마커를 사용하면 두 연산을 동일한 방식으로 처리할 수 있어 코드를 단순화하고 데이터 적재 및 쿼리 성능을 높일 수 있습니다. |
| **기본 키 기반 일괄 삭제** | 대량의 데이터를 기본 키로 삭제해야 할 때 각 `DELETE` 문은 빈 Rowset을 생성하고 새로운 데이터 버전을 만듭니다. 삭제가 빈번하면 쿼리 성능이 크게 저하됩니다. 삭제 마커는 일괄로 기록할 수 있으므로 이 문제를 방지할 수 있습니다. |

### DELETE 문과의 비교 {#comparison-with-the-delete-statement}

| 항목 | 데이터 적재 기반 일괄 삭제 | DELETE 문 |
|------|------|------|
| 적용 모델 | Unique Key | Unique Key / Aggregate Key / Duplicate Key |
| 실행 방식 | 데이터 적재 시 삭제 마커 전달 | SQL 실행 |
| 데이터 버전 | 데이터 적재의 버전을 공유 | 실행할 때마다 새 버전 생성 |
| 대량 일괄 삭제 성능 | 높음 | 낮음 |
| CDC 시나리오 적합성 | 기본 지원 | 추가 처리 필요 |

---

## 동작 방식 {#how-it-works}

<!-- Knowledge type: Concept description -->

### 핵심 메커니즘 {#core-mechanism}

- **숨겨진 컬럼**: 모든 Unique Key 테이블에는 숨겨진 컬럼 `__DORIS_DELETE_SIGN__`이 있습니다. 값이 `1`이면 해당 행에 삭제 표시가 된 것입니다.
- **데이터 적재 시 기록**: 데이터 적재 작업은 매핑 조건을 통해 삭제 표시할 행을 지정할 수 있습니다. 구문은 데이터 적재 방식에 따라 조금씩 다릅니다.
- **쿼리 필터링**: 쿼리 계획을 수립할 때 FE가 필터 조건 `__DORIS_DELETE_SIGN__ != true`를 자동으로 추가하므로 삭제 표시된 행은 사용자에게 보이지 않습니다.
- **백그라운드 정리**: BE Compaction 프로세스는 삭제 표시된 행을 주기적으로 물리적으로 정리합니다.

### 데이터 예시 {#data-example}

#### 1단계: 테이블 생성 {#step-1-create-the-table}

Unique Key 테이블을 생성합니다:

```sql
CREATE TABLE example_table (
    id BIGINT NOT NULL,
    value STRING
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_num" = "3"
);
```

#### 2단계: 숨겨진 컬럼 확인 {#step-2-view-hidden-columns}

세션 변수 `show_hidden_columns`를 사용하여 숨겨진 컬럼을 표시합니다:

```sql
mysql> set show_hidden_columns=true;

mysql> desc example_table;
+-----------------------+---------+------+-------+---------+-------+
| Field                 | Type    | Null | Key   | Default | Extra |
+-----------------------+---------+------+-------+---------+-------+
| id                    | bigint  | No   | true  | NULL    |       |
| value                 | text    | Yes  | false | NULL    | NONE  |
| __DORIS_DELETE_SIGN__ | tinyint | No   | false | 0       | NONE  |
| __DORIS_VERSION_COL__ | bigint  | No   | false | 0       | NONE  |
+-----------------------+---------+------+-------+---------+-------+
```

#### 3단계: 삭제 마커 기록 {#step-3-write-a-delete-marker}

테이블에 다음 데이터가 있다고 가정합니다:

```sql
+------+-------+
| id   | value |
+------+-------+
|    1 | foo   |
|    2 | bar   |
+------+-------+
```

`INSERT INTO`를 사용해 `id = 1`인 행에 삭제 마커를 기록합니다(설명을 위한 예시이며, 운영 환경에서는 해당 데이터 적재 방식을 사용하세요):

```sql
mysql> insert into example_table (id, __DORIS_DELETE_SIGN__) values (1, 1);
```

#### 4단계: 쿼리 결과 확인 {#step-4-verify-query-results}

기본적으로 쿼리는 삭제 표시된 행을 자동으로 필터링합니다:

```sql
mysql> select * from example_table;
+------+-------+
| id   | value |
+------+-------+
|    2 | bar   |
+------+-------+
```

`show_hidden_columns`를 활성화하면 `id = 1`인 행이 여전히 존재하며 삭제 표시만 되어 있음을 확인할 수 있습니다:

```sql
mysql> set show_hidden_columns=true;
mysql> select * from example_table;
+------+-------+-----------------------+-----------------------+
| id   | value | __DORIS_DELETE_SIGN__ | __DORIS_VERSION_COL__ |
+------+-------+-----------------------+-----------------------+
|    1 | NULL  |                     1 |                     3 |
|    2 | bar   |                     0 |                     2 |
+------+-------+-----------------------+-----------------------+
```

---

## 데이터 적재 병합 방식 {#load-merge-methods}

<!-- Knowledge type: Configuration parameter -->

데이터 적재 작업은 `merge_type`으로 데이터 병합 동작을 제어합니다. 다음 세 가지 방식을 지원합니다:

| merge_type | 동작 | 일반적인 용도 |
|------|------|------|
| **APPEND** (기본값) | 모든 데이터를 기존 데이터에 추가 | 일반적인 데이터 기록 |
| **DELETE** | 데이터 적재로 전달된 데이터와 Key 컬럼이 일치하는 모든 행을 삭제 | 기본 키 기반 일괄 삭제 |
| **MERGE** | `DELETE ON` 조건에 따라 각 행에 APPEND 또는 DELETE 수행 | Insert/Delete가 혼재된 CDC 시나리오 |

> 참고: `MERGE`는 `DELETE ON <condition>`과 함께 사용해야 합니다.

---

## 데이터 적재 방식별 구문 {#syntax-for-each-load-method}

<!-- Knowledge type: Procedure -->

데이터 적재 방식마다 삭제 마커를 설정하는 구문이 조금씩 다릅니다. 아래에서 각 방식을 설명합니다.

### Stream Load {#stream-load}

**사용법**: HTTP Header에서 `columns`, `merge_type`, `delete` 필드를 설정합니다.

**예시**:

```bash
-H "columns: k1, k2, label_c3"
-H "merge_type: [MERGE|APPEND|DELETE]"
-H "delete: label_c3=1"
```

**매개변수 설명**:

- `columns`: 데이터 적재 필드 매핑입니다. 삭제 여부를 판단하는 데 사용하는 마커 컬럼을 포함해야 합니다.
- `merge_type`: 병합 방식입니다. 유효한 값은 `APPEND`, `DELETE`, `MERGE`입니다.
- `delete`: `merge_type=MERGE`일 때 적용됩니다. 삭제 조건을 지정합니다.

더 많은 예시는 [Stream Load 매뉴얼](../import/import-way/stream-load-manual.md)의 "Delete 연산을 위한 merge_type 지정" 및 "Merge 연산을 위한 merge_type 지정" 절을 참조하세요.

### Broker Load {#broker-load}

**사용법**: `LOAD` 절에서 `[MERGE|APPEND|DELETE]` 키워드와 `DELETE ON` 절을 사용해 삭제 마커를 지정합니다.

**구문 예시**:

```sql
LOAD LABEL db1.label1
(
    [MERGE|APPEND|DELETE] DATA INFILE("hdfs://abc.com:8888/user/palo/test/ml/file1")
    INTO TABLE tbl1
    COLUMNS TERMINATED BY ","
    (tmp_c1, tmp_c2, label_c3)
    SET
    (
        id = tmp_c2,
        name = tmp_c1
    )
    [DELETE ON label_c3=true]
)
WITH BROKER 'broker'
(
    "username" = "user",
    "password" = "pass"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### Routine Load {#routine-load}

**사용법**: Routine Load 작업을 생성할 때 `WITH [MERGE|APPEND|DELETE]`와 `DELETE ON` 절을 사용해 삭제 마커를 지정합니다.

**구문 예시**:

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
[WITH MERGE|APPEND|DELETE]
COLUMNS(k1, k2, k3, v1, v2, label),
WHERE k1 > 100 and k2 like "%doris%"
[DELETE ON label=true]
PROPERTIES
(
    "desired_concurrent_number" = "3",
    "max_batch_interval" = "20",
    "max_batch_rows" = "300000",
    "max_batch_size" = "209715200",
    "strict_mode" = "false"
)
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic",
    "kafka_partitions" = "0,1,2,3",
    "kafka_offsets" = "101,0,0,200"
);
```

---

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: 데이터 적재 기반 일괄 삭제는 어떤 테이블 모델을 지원하나요?**

Unique Key 모델만 지원합니다. Aggregate Key 및 Duplicate Key 테이블에는 `DELETE` 문을 사용하세요.

**Q2: 삭제 표시된 데이터의 디스크 공간은 실제로 언제 해제되나요?**

BE의 백그라운드 Compaction이 비동기적으로 정리합니다. 정리 시점은 Compaction 스케줄링과 데이터 버전 수에 따라 달라지며, 일반적으로 사용자가 개입할 필요는 없습니다.

**Q3: 행에 삭제 표시가 되어 있는지 어떻게 확인하나요?**

`SET show_hidden_columns=true;`를 실행한 다음 테이블을 쿼리하세요. 숨겨진 컬럼 `__DORIS_DELETE_SIGN__`이 표시됩니다. 값이 `1`이면 해당 행에 삭제 표시가 된 것입니다.

**Q4: CDC 시나리오에서는 어떤 merge_type을 사용해야 하나요?**

`MERGE`를 사용하고, `DELETE ON`으로 삭제 조건을 지정하는 것을 권장합니다. 이렇게 하면 동일한 데이터 적재에서 Insert와 Delete 연산을 함께 처리할 수 있습니다.

**Q5: 삭제 마커가 쿼리 성능에 영향을 주나요?**

일반 쿼리는 삭제 표시된 행을 자동으로 필터링하므로 성능에 미치는 영향은 미미합니다. 백그라운드 Compaction이 완료되면 삭제 표시된 데이터가 물리적으로 정리됩니다.

---

## 관련 링크 {#related-links}

- [Stream Load 매뉴얼](../import/import-way/stream-load-manual.md)
- [Broker Load 매뉴얼](../import/import-way/broker-load-manual.md)
- [Routine Load 매뉴얼](../import/import-way/routine-load-manual.md)
