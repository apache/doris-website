---
{
    "title": "데이터 적재 오류 로그 다운로드",
    "language": "ko",
    "description": "데이터 적재 오류 로그 파일 다운로드"
}
---

# 데이터 적재 오류 로그 다운로드 {#download-log-about-load-error}

## 요청 {#request}

`GET /api/_load_error_log?token={string}&file={string}`

## 설명 {#description}

데이터 적재 오류 로그 파일을 다운로드합니다.

## 쿼리 매개변수 {#query-parameters}

* `file`
    로그 경로

* `token`
    토큰

## 요청 본문 {#request-body}

없음

## 응답 {#response}

    File of log

## 예제 {#examples}


    ```
    curl "http://127.0.0.1:8040/api/_load_error_log?file=a&token=1"
    ```
