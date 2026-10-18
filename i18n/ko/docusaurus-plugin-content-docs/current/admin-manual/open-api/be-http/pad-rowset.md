---
{
    "title": "Rowset 채우기",
    "language": "ko",
    "description": "오류가 발생한 replica를 대신할 빈 rowset을 하나 추가합니다."
}
---

# Rowset 채우기 {#pad-rowset}

## 요청 {#request}

`POST /api/pad_rowset?tablet_id={int}&start_version={int}&end_version={int}`

## 설명 {#description}

오류가 발생한 replica를 대신할 빈 rowset을 하나 추가합니다.

## 쿼리 매개변수 {#query-parameters}

* `tablet_id`
    tablet의 ID

* `start_version`
    시작 버전

* `end_version`
    종료 버전


## 요청 본문 {#request-body}

없음

## 응답 {#response}

    ```
    {
        msg: "OK",
        code: 0
    }
    ```
## 예제 {#examples}


    ```
    curl -X POST "http://127.0.0.1:8040/api/pad_rowset?tablet_id=123456&start_version=1111111&end_version=1111112"

    ```
