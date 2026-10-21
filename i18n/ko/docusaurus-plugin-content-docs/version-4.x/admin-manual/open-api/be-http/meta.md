---
{
    "title": "메타데이터 조회",
    "language": "ko",
    "description": "tablet의 메타데이터 조회"
}
---

# 메타데이터 조회 {#view-meta}

## 요청 {#request}

`GET /api/meta/header/{tablet_id}?byte_to_base64={bool}`

## 설명 {#description}

 tablet의 메타데이터를 조회합니다.

## 경로 매개변수 {#path-parameters}

* `tablet_id`
    tablet의 ID

## 쿼리 매개변수 {#query-parameters}

* `byte_to_base64`
    base64로 인코딩할지 여부입니다. 선택 사항이며 기본값은 `false`입니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
    "table_id": 148107,
    "partition_id": 148104,
    "tablet_id": 148193,
    "schema_hash": 2090621954,
    "shard_id": 38,
    "creation_time": 1673253868,
    "cumulative_layer_point": -1,
    "tablet_state": "PB_RUNNING",
    ...
}
```
## 예시 {#examples}


```
curl "http://127.0.0.1:8040/api/meta/header/148193?byte_to_base64=true"

```
