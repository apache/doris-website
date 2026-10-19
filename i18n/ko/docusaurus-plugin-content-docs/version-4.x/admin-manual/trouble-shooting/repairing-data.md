---
{
    "title": "데이터 복구",
    "language": "ko",
    "description": "Unique Key Merge on Write 테이블의 경우 일부 Doris 버전에 버그가 있어 시스템이 delete bitmap을 계산할 때 오류가 발생할 수 있습니다."
}
---

# 데이터 복구 {#repairing-data}

Unique Key Merge on Write 테이블의 경우 일부 Doris 버전에 버그가 있어 시스템이 delete bitmap을 계산할 때 오류가 발생하고, 이로 인해 기본 키가 중복될 수 있습니다. 이때 full compaction 기능을 사용하여 데이터를 복구할 수 있습니다. Unique Key Merge on Write 방식이 아닌 테이블에는 이 기능을 사용할 수 없습니다.

이 기능을 사용하려면 Doris 버전이 2.0+여야 합니다.

이 기능을 사용하려면 가능한 한 데이터 적재를 중단해야 합니다. 그렇지 않으면 데이터 적재 시간 초과 등의 문제가 발생할 수 있습니다.

## 동작 원리 요약 {#brief-principle-explanation}

full compaction을 실행하면 delete bitmap을 다시 계산하고 잘못된 delete bitmap 데이터를 삭제하여 데이터를 복구합니다.

## 사용 방법 {#instructions-for-use}

`POST /api/compaction/run?tablet_id={int}&compact_type=full`

또는

`POST /api/compaction/run?table_id={int}&compact_type=full`

tablet_id와 table_id 중 하나만 지정할 수 있으며, 둘을 동시에 지정할 수는 없습니다. table_id를 지정하면 해당 테이블에 속한 모든 tablet에 대해 full_compaction이 자동으로 실행됩니다.

## 사용 예시 {#example-of-use}

```
curl -X POST "http://127.0.0.1:8040/api/compaction/run?tablet_id=10015&compact_type=full"
curl -X POST "http://127.0.0.1:8040/api/compaction/run?table_id=10104&compact_type=full"
```
