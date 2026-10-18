---
{
    "title": "Compaction 수동 실행",
    "language": "ko",
    "description": "POST /api/compaction/run?tableid={int}&compacttype=full tableid=xxx는 compacttype=full을 지정한 경우에만 적용됩니다."
}
---

# Compaction 수동 실행 {#manually-trigger-compaction}

## 요청 {#request}

`POST /api/compaction/run?tablet_id={int}&compact_type={enum}`
`POST /api/compaction/run?table_id={int}&compact_type=full` table_id=xxx는 compact_type=full을 지정한 경우에만 적용됩니다.
`GET /api/compaction/run_status?tablet_id={int}`


## 설명 {#description}

비교 작업을 수동으로 실행하고 상태를 표시하는 데 사용합니다.

## 쿼리 매개변수 {#query-parameters}

* `tablet_id`
    - tablet의 ID

* `table_id`
    - 테이블의 ID입니다. table_id=xxx는 compact_type=full을 지정한 경우에만 적용됩니다. tablet_id와 table_id 중 하나만 지정할 수 있으며, 두 매개변수를 동시에 지정할 수는 없습니다. table_id를 지정하면 해당 테이블에 속한 모든 tablet에 대해 full_compaction이 자동으로 실행됩니다.

* `compact_type`
    - 값은 `base`, `cumulative` 또는 `full`입니다. full_compaction의 사용 시나리오는 [데이터 복구](../../trouble-shooting/repairing-data)를 참조하세요.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

### Compaction 실행 {#trigger-compaction}

 tablet이 존재하지 않으면 JSON 형식의 오류가 반환됩니다:

```
{
    "status": "Fail",
    "msg": "Tablet not found"
}
```

 tablet이 존재하지만 실행 중이 아니면 다음과 같은 JSON 응답이 반환됩니다:

```
{
    "status": "Fail",
    "msg": "fail to execute compaction, error = -2000"
}
```

 tablet이 존재하고 실행 중이면 다음과 같은 JSON 응답이 반환됩니다:

```
{
    "status": "Success",
    "msg": "compaction task is successfully triggered."
}
```

결과 설명:

* status: 작업 실행 요청의 상태입니다. 작업이 성공적으로 시작되면 Success를 반환하고, 특정 사유(예: 적절한 버전을 가져오지 못한 경우)로 시작되지 않으면 Fail을 반환합니다.
* msg: 성공 또는 실패에 관한 구체적인 정보를 제공합니다.

### 상태 조회 {#show-status}

 tablet이 존재하지 않으면 JSON 형식의 오류가 반환됩니다:
```
{
    "status": "Fail",
    "msg": "Tablet not found"
}
```
 tablet이 존재하지만 실행 중이 아니면 다음과 같은 JSON 응답이 반환됩니다:

```
{
    "status" : "Success",
    "run_status" : false,
    "msg" : "this tablet_id is not running",
    "tablet_id" : 11308,
    "schema_hash" : 700967178,
    "compact_type" : ""
}
```

 tablet이 존재하고 실행 중이면 다음과 같은 JSON 응답이 반환됩니다:
```
{
    "status" : "Success",
    "run_status" : true,
    "msg" : "this tablet_id is running",
    "tablet_id" : 11308,
    "schema_hash" : 700967178,
    "compact_type" : "cumulative"
}
```

결과 설명:

* run_status: 현재 수동 compaction 작업의 실행 상태를 가져옵니다.

### 예제 {#examples}

```
curl -X POST "http://127.0.0.1:8040/api/compaction/run?tablet_id=10015&compact_type=cumulative"
```
