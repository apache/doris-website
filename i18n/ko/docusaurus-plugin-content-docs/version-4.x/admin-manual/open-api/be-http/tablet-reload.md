---
{
    "title": "Tablet 다시 로드",
    "language": "ko",
    "description": "Tablet 다시 로드"
}
---

# Tablet 다시 로드 {#reload-tablet}

## 요청 {#request}

`GET /api/reload_tablet?tablet_id={int}&schema_hash={int}&path={string}"`

## 설명 {#description}

Tablet을 다시 로드합니다.

## 쿼리 매개변수 {#query-parameters}

* `tablet_id`
    Tablet의 ID

* `schema_hash`
    스키마 해시

* `path`
    파일 경로


## 요청 본문 {#request-body}

없음

## 응답 {#response}

    ```
    load header succeed
    ```
## 예시 {#examples}


    ```
    curl "http://127.0.0.1:8040/api/reload_tablet?tablet_id=123456&schema_hash=1111111&path=/abc"

    ```
