---
{
    "title": "스냅샷 생성",
    "language": "ko",
    "description": "tablet의 스냅샷 생성"
}
---

# 스냅샷 생성 {#make-snapshot}

## 요청 {#request}

`GET /api/snapshot?tablet_id={int}&schema_hash={int}"`

## 설명 {#description}

 tablet의 스냅샷을 생성합니다.

## 쿼리 매개변수 {#query-parameters}

* `tablet_id`
    tablet의 ID

* `schema_hash`
    스키마 해시


## 요청 본문 {#request-body}

없음

## 응답 {#response}

    ```
    /path/to/snapshot
    ```
## 예제 {#examples}


    ```
    curl "http://127.0.0.1:8040/api/snapshot?tablet_id=123456&schema_hash=1111111"

    ```
