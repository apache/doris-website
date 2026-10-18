---
{
    "title": "데이터 적재 취소 작업",
    "language": "ko",
    "description": "지정한 레이블의 데이터 적재 트랜잭션을 취소합니다."
}
---

# 데이터 적재 취소 작업 {#cancel-load-action}

## 요청 {#request}

`POST /api/<db>/_cancel`

## 설명 {#description}

지정한 레이블의 데이터 적재 트랜잭션을 취소합니다.
반환 값
    JSON 형식의 문자열을 반환합니다:
    상태:
        성공: 취소 성공
        그 외: 취소 실패
    메시지: 취소에 실패한 경우 오류 메시지

## 경로 매개변수 {#path-parameters}

* `<db>`

    데이터베이스 이름을 지정합니다.

## 쿼리 매개변수 {#query-parameters}

* `<label>`

    데이터 적재 레이블을 지정합니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

* 취소 성공

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```

* 취소 실패

    ```
    {
    	"msg": "Error msg...",
    	"code": 1,
    	"data": null,
    	"count": 0
    }
    ```

## 예시 {#examples}

1. 지정한 레이블의 데이터 적재 트랜잭션 취소

    ```
    POST /api/example_db/_cancel?label=my_label1

    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```
