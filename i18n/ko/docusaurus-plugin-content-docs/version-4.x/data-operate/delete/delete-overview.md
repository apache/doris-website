---
title: 삭제 작업 개요
language: ko
description: Apache Doris에서 데이터를 삭제하는 방법에는 무엇이 있을까요? 이 문서에서는 DELETE 문, 파티션 삭제, 테이블 전체 삭제, delete sign, 원자적 덮어쓰기를 비교하여 가장 적합한 삭제 방법을 선택할 수 있도록 안내합니다.
keywords:
    - Doris 데이터 삭제
    - DELETE 문
    - TRUNCATE TABLE
    - 파티션 삭제
    - delete sign
    - 일괄 삭제
    - 임시 파티션 교체
    - 원자적 덮어쓰기
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Data cleanup / Data update / Partition management -->

Apache Doris는 조건부 삭제, 파티션 단위 삭제, 테이블 전체 비우기, 기본 키 일괄 삭제, 원자적 덮어쓰기 등 일반적인 시나리오를 지원하는 다양한 삭제 방법을 제공합니다. 이 문서는 사용 시나리오를 바탕으로 가장 적합한 삭제 방법을 빠르게 선택할 수 있도록 안내합니다.

## 빠른 탐색 {#quick-navigation}

사용 시나리오에 맞는 삭제 방법을 선택하세요.

| 사용 사례                                              | 권장 방법                                              | 적용 가능한 모델     | 특징                                |
| ----------------------------------------------------- | --------------------------------------------------------------- | -------------------- | ---------------------------------------------- |
| 조건에 따라 일부 데이터 삭제                  | [DELETE 문](./delete-manual.md)                          | 모든 테이블 모델     | 범용적이고 유연함                      |
| 만료된 파티션 삭제(예: 최근 7일 데이터만 유지) | [파티션 삭제(TRUNCATE)](./truncate-manual.md)         | 파티션 테이블   | 메타데이터만 수정하므로 효율이 가장 높음     |
| 스키마를 유지하면서 테이블 전체 비우기        | [테이블 전체 삭제(TRUNCATE)](./truncate-manual.md)          | 모든 테이블 모델     | 데이터를 빠르게 초기화                            |
| 대량의 기본 키 일괄 삭제(CDC 동기화 등) | [Delete Sign](./batch-delete-manual.md)                   | Unique Key 모델     | 업데이트를 통해 일괄 삭제 구현       |
| 쿼리 중단 없이 파티션 데이터 다시 쓰기   | [임시 파티션을 사용한 원자적 교체](./table-temp-partition.md) | 파티션 테이블 | 원자적 덮어쓰기로 쿼리 공백 방지           |

## 삭제 방법 상세 설명 {#detailed-explanation-of-deletion-methods}

### 1. DELETE 문: 조건부 삭제 {#1-delete-statement-conditional-deletion}

<!-- Knowledge type: Operation steps -->

조건에 따라 일부 데이터를 삭제하는 일반적인 시나리오에 적합하며, 모든 테이블 모델을 지원합니다.

**구문:**

```sql
DELETE FROM table_name WHERE condition;
```

**적용 시 참고 사항:**

- 일상적인 삭제 요구 사항 대부분을 충족합니다.
- 일괄 삭제나 파티션 전체 삭제 시나리오에서는 아래 방법보다 효율이 낮습니다.

자세한 사용법은 [삭제 작업](./delete-manual.md)을 참고하세요.

### 2. 파티션 삭제: 만료된 데이터의 효율적인 정리 {#2-partition-deletion-efficiently-cleaning-up-expired-data}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Data lifecycle management -->

Doris에서는 날짜별 파티션으로 데이터를 관리하는 것이 일반적입니다. 최근 일정 기간(예: 최근 7일)의 데이터만 유지해야 한다면 파티션 삭제(truncate partition)를 권장합니다.

**구문:**

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```

**장점:**

- 파티션 메타데이터만 수정하므로 데이터 스캔이 필요하지 않습니다.
- 만료된 파티션을 정리할 때 권장되는 방법입니다.

자세한 사용법은 [Truncate 작업](./truncate-manual.md)을 참고하세요.

### 3. 테이블 전체 삭제: 테이블을 빠르게 비우기 {#3-full-table-deletion-quickly-empty-a-table}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Offline analysis rerun / Data reset -->

오프라인 분석에서 데이터를 다시 처리하는 경우처럼 스키마를 유지하면서 테이블 전체를 빠르게 비워야 하는 시나리오에 적합합니다.

**구문:**

```sql
TRUNCATE TABLE table_name;
```

자세한 사용법은 [Truncate 작업](./truncate-manual.md)을 참고하세요.

### 4. Delete Sign: 기본 키 일괄 삭제 {#4-delete-sign-bulk-primary-key-deletion}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: CDC data sync / Bulk primary key deletion -->

데이터 삭제는 데이터 업데이트의 특수한 형태로 볼 수 있습니다. 업데이트 기능을 갖춘 기본 키 모델(Unique Key)에서는 delete sign을 사용하여 업데이트 쓰기로 삭제를 수행할 수 있습니다.

**대표적인 시나리오:**

- CDC(Change Data Capture) 데이터 동기화: DELETE 작업의 binlog에 delete sign을 표시하고 Doris에 기록하여 해당 기본 키의 데이터를 삭제합니다.

**장점과 제한 사항:**

- 기본 키 일괄 삭제를 지원하며 DELETE 문보다 효율적입니다.
- 고급 기능으로, 사용법이 비교적 복잡합니다.

자세한 사용법은 [일괄 삭제](./batch-delete-manual.md)를 참고하세요.

### 5. 임시 파티션을 사용한 원자적 교체: 쿼리 중단 없는 덮어쓰기 {#5-atomic-replacement-with-temporary-partitions-overwrite-without-interrupting-queries}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Partition data rewrite / Business continuity -->

파티션 데이터를 다시 써야 할 때 "먼저 삭제한 후 데이터 적재" 방식을 그대로 사용하면 데이터를 쿼리할 수 없는 시간이 발생합니다. 임시 파티션을 사용한 원자적 교체로 이 문제를 방지할 수 있습니다.

**절차:**

1. 대상 파티션에 대응하는 임시 파티션을 생성합니다.
2. 임시 파티션에 새 데이터를 적재합니다.
3. 교체 작업을 통해 원래 파티션을 원자적으로 교체합니다.

자세한 사용법은 [임시 파티션](./table-temp-partition.md)을 참고하세요. 테이블 전체를 원자적으로 교체해야 한다면 [원자적 테이블 교체](./atomicity-replace.md)를 참고하세요.

## 삭제 방법 비교 {#comparison-of-deletion-methods}

| 방법                              | 구문 키워드               | 삭제 단위 | 성능           | 모든 테이블 모델 지원 여부 |
| ----------------------------------- | ---------------------------- | -------------------- | --------------------- | ------------------------- |
| DELETE 문                    | `DELETE FROM`                | 조건에 따라 삭제         | 중간                | 지원                       |
| 파티션 삭제                  | `TRUNCATE PARTITION`         | 파티션 전체     | 높음(메타데이터만 수정)  | 파티션 테이블만 지원   |
| 테이블 전체 삭제                 | `TRUNCATE TABLE`             | 테이블 전체         | 높음                  | 지원                       |
| Delete sign                         | `__DORIS_DELETE_SIGN__` 기록 | 기본 키별      | 높음(일괄 처리)           | Unique Key 모델만 지원     |
| 임시 파티션을 사용한 원자적 교체 | `REPLACE PARTITION`       | 파티션 전체     | 높음                  | 파티션 테이블만 지원   |

## 고려 사항 {#considerations}

- **버전 수에 미치는 영향**: 삭제 작업은 새로운 데이터 버전을 생성합니다. 삭제를 자주 수행하면 버전 수가 늘어나 쿼리 성능에 영향을 줄 수 있습니다.
- **스토리지 공간 반환 지연**: 삭제된 데이터는 Compaction이 완료될 때까지 스토리지 공간을 차지합니다. 삭제 작업 자체로는 스토리지 사용량이 즉시 줄어들지 않습니다.
- **테이블 모델 제한**: Delete sign은 Unique Key 기본 키 모델에만 적용됩니다. 파티션 관련 삭제는 파티션 테이블에만 적용됩니다.

## 자주 묻는 질문(FAQ) {#frequently-asked-questions-faq}

**Q1: DELETE 문과 TRUNCATE의 차이는 무엇인가요?**

DELETE 문은 WHERE 조건에 따라 데이터를 삭제하며 모든 테이블에서 사용할 수 있습니다. TRUNCATE는 메타데이터만 수정하여 테이블 전체나 파티션 전체를 직접 삭제하므로 더 빠르지만 삭제 단위가 더 큽니다.

**Q2: 삭제 후 스토리지 공간이 즉시 반환되지 않는 이유는 무엇인가요?**

삭제된 데이터는 백그라운드 Compaction 병합이 완료된 후에야 스토리지에서 실제로 제거됩니다. 이는 정상적인 동작입니다.

**Q3: CDC 동기화 시나리오에서 DELETE 이벤트를 효율적으로 처리하려면 어떻게 해야 하나요?**

Unique Key 기본 키 모델과 delete sign 방식을 함께 사용하는 것을 권장합니다. 대량의 기본 키 삭제를 일괄 처리할 수 있어 DELETE 문을 하나씩 실행하는 것보다 훨씬 효율적입니다.

**Q4: 파티션 데이터를 다시 쓰는 동안 쿼리가 중단되지 않게 하려면 어떻게 해야 하나요?**

임시 파티션을 사용한 원자적 교체를 사용하세요. 먼저 새 데이터를 임시 파티션에 기록한 다음, 원자적 교체 작업으로 파티션을 전환합니다. 전체 과정은 쿼리에 영향을 주지 않습니다.

## 관련 문서 {#related-documents}

- [삭제 작업](./delete-manual.md)
- [데이터 적재 기반 일괄 삭제](./batch-delete-manual.md)
- [Truncate 작업](./truncate-manual.md)
- [원자적 테이블 교체](./atomicity-replace.md)
- [임시 파티션](./table-temp-partition.md)
