---
{
    "title": "태블릿 복원",
    "language": "ko",
    "description": "BE의 휴지통 디렉터리에서 태블릿 데이터를 복원합니다."
}
---

# 태블릿 복원 {#restore-tablet}

## 요청 {#request}

`POST /api/restore_tablet?tablet_id={int}&schema_hash={int}"`

## 설명 {#description}

BE의 휴지통 디렉터리에서 태블릿 데이터를 복원합니다.

## 쿼리 매개변수 {#query-parameters}

* `tablet_id`
    태블릿의 ID

* `schema_hash`
    스키마 해시


## 요청 본문 {#request-body}

없음

## 응답 {#response}

    ```
    {
        msg: "OK",
        code: 0
    }
    ```
## 예시 {#examples}


    ```
    curl -X POST "http://127.0.0.1:8040/api/restore_tablet?tablet_id=123456&schema_hash=1111111"

    ```
