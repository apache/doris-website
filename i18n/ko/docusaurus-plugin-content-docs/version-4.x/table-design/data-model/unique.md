---
{
    "title": "Unique Key 모델",
    "language": "ko",
    "description": "Doris Unique Key 모델은 Key 컬럼의 고유성을 보장하며 UPSERT와 중복 제거를 지원합니다. 빈번한 업데이트, 차원 데이터 동기화, 프로필 태깅과 같은 데이터 업데이트 시나리오에 적합합니다."
}
---

Unique Key 모델은 Key 컬럼의 고유성을 유지합니다. 행을 삽입하거나 업데이트하면 새 데이터가 동일한 Key를 가진 기존 행을 덮어쓰므로 테이블에는 항상 최신 버전이 유지됩니다. 기본 키를 기준으로 데이터를 업데이트할 때 사용하세요.

<!-- Knowledge type: Data model -->
<!-- Applicable scenarios: Data update / High-frequency writes / Primary key deduplication -->

## 사용 시나리오 {#when-to-use}

Unique Key 모델은 다음 세 가지 주요 시나리오에 적합합니다.

1. **빈번한 데이터 업데이트**: 업스트림 OLTP 데이터베이스의 차원 테이블을 실시간으로 동기화하는 경우로, 효율적인 UPSERT 연산이 필요합니다.
2. **효율적인 데이터 중복 제거**: 광고 게재, 고객 관계 관리(CRM) 등의 시스템에서 사용자 ID를 기준으로 레코드의 중복을 제거합니다.
3. **일부 컬럼 업데이트**: 동적 태그가 자주 바뀌는 프로필 태깅이나 거래 상태가 바뀌는 주문 처리 시나리오에서 영향을 받는 컬럼만 업데이트할 수 있습니다.

## Unique Key 테이블 생성 {#create-a-unique-key-table}

`UNIQUE KEY` 키워드로 기본 키를 선언합니다. Merge-on-write는 기본적으로 활성화되어 있으며 거의 모든 워크로드에 적합하므로 추가 속성을 지정할 필요가 없습니다.

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    user_id         LARGEINT        NOT NULL,
    user_name       VARCHAR(50)     NOT NULL,
    city            VARCHAR(20),
    age             SMALLINT,
    sex             TINYINT
)
UNIQUE KEY(user_id, user_name)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

각 행은 `(user_id, user_name)`으로 식별됩니다. 이미 존재하는 Key를 가진 행을 쓰면 기존 행을 덮어쓰고, 새로운 Key를 가진 행을 쓰면 삽입합니다.

## 데이터 UPSERT {#upsert-data}

Doris는 어떤 데이터 적재 방식을 사용하든 Key를 기준으로 UPSERT를 수행합니다. 기존 Key를 가진 행은 업데이트하고, 새로운 Key를 가진 행은 삽입합니다. Doris는 정렬과 중복 제거 모두에 Key 컬럼을 사용합니다. 아래 예시에서는 `INSERT`를 사용하며, Stream Load, Broker Load, Routine Load도 동일하게 동작합니다.

![Unique Key 모델 데이터 삽입](/images/table-desigin/unique-key-model-insert.png)

다음 예시에서 원래 테이블에는 4개의 행이 있습니다. 기존 Key를 가진 2개의 행을 다시 삽입하면 해당 행이 업데이트됩니다.

```sql
-- Insert original data
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 26, 1),
(102, 'Jason', 'BJ', 27, 1),
(103, 'Juice', 'SH', 20, 2),
(104, 'Olivia', 'SZ', 22, 2);

-- Re-insert the same Keys with new values
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 27, 1),
(102, 'Jason', 'SH', 28, 1);

-- Query the updated data
SELECT * FROM example_tbl_unique;
+---------+-----------+------+------+------+
| user_id | user_name | city | age  | sex  |
+---------+-----------+------+------+------+
| 101     | Tom       | BJ   |   27 |    1 |
| 102     | Jason     | SH   |   28 |    1 |
| 104     | Olivia    | SZ   |   22 |    2 |
| 103     | Juice     | SH   |   20 |    2 |
+---------+-----------+------+------+------+
```

행 전체를 UPSERT할 때 `INSERT INTO`에 일부 컬럼만 지정하면 Doris가 나머지 컬럼을 NULL 또는 기본값으로 채웁니다.

## 일부 컬럼만 업데이트 {#update-only-some-columns}

행 전체를 다시 쓰지 않고 몇몇 필드만 변경하려면 부분 컬럼 업데이트를 사용하세요. 이 기능에는 기본 설정인 merge-on-write가 필요하며, 매개변수로 활성화합니다. [부분 컬럼 업데이트](../../data-operate/update/update-of-unique-model)를 참고하세요.

## 구현 방식 선택 {#choose-an-implementation}

Unique Key 모델에는 두 가지 스토리지 구현 방식이 있습니다. **merge-on-write**는 기본 방식으로 대부분의 워크로드에 권장되며, **merge-on-read**는 쓰기가 많고 읽기가 적은 파이프라인에 적합합니다. 구현 방식은 테이블을 생성할 때 결정되며, 이후 스키마 변경으로 바꿀 수 없습니다.

각 방식의 동작 원리, 성능상의 장단점, merge-on-read 활성화 방법은 [Merge-on-Write](./merge-on-write)를 참고하세요.

## 유의 사항 {#notes}

Unique Key 모델을 사용할 때는 다음 제약 사항에 유의하세요.

1. **구현 방식은 변경할 수 없음**: merge-on-write 또는 merge-on-read는 테이블을 생성할 때만 설정할 수 있으며, 스키마 변경으로 수정할 수 없습니다.
2. **행 전체 UPSERT 시 기본값으로 채움**: `INSERT INTO`에 일부 컬럼만 지정하더라도 Doris는 지정하지 않은 컬럼을 NULL 또는 기본값으로 채웁니다.
3. **부분 컬럼 업데이트에는 merge-on-write가 필요함**: 일부 컬럼만 업데이트하려면 merge-on-write를 사용하고 매개변수로 부분 컬럼 업데이트를 활성화하세요. [부분 컬럼 업데이트](../../data-operate/update/update-of-unique-model)를 참고하세요.
4. **파티션 키는 Key 컬럼의 부분집합이어야 함**: Doris는 데이터의 고유성을 보장하기 위해 이 조건을 요구합니다.
