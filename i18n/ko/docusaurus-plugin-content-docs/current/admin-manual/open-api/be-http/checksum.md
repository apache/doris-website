---
{
    "title": "체크섬",
    "language": "ko",
    "description": "체크섬"
}
---

# 체크섬 {#checksum}

## 요청 {#request}

`GET /api/checksum?tablet_id={int}&version={int}&schema_hash={int}`

## 설명 {#description}

체크섬

## 쿼리 매개변수 {#query-parameters}

* `tablet_id`
    검사할 태블릿의 ID

* `version`
    검증할 태블릿의 버전

* `schema_hash`
    스키마 해시

## 요청 본문 {#request-body}

없음

## 응답 {#response}

    ```
    1843743562
    ```
## 예제 {#examples}


    ```
    curl "http://127.0.0.1:8040/api/checksum?tablet_id=1&version=1&schema_hash=-1"

    ```
