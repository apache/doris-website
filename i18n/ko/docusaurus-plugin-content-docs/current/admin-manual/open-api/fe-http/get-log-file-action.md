---
{
    "title": "FE 로그 파일 가져오기",
    "language": "ko",
    "description": "HTTP 인터페이스를 통해 FE 로그 파일을 가져올 수 있습니다."
}
---

# FE 로그 파일 가져오기 {#get-fe-log-file}

## 요청 {#request}

`HEAD /api/get_log_file`

`GET /api/get_log_file`

## 설명 {#description}

HTTP 인터페이스를 통해 FE 로그 파일을 가져올 수 있습니다.

HEAD 요청은 지정한 로그 유형의 로그 파일 목록을 가져오는 데 사용됩니다. GET 요청은 지정한 로그 파일을 다운로드하는 데 사용됩니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `type`

    로그 유형을 지정합니다. 다음 유형을 지원합니다.

    * `fe.audit.log`: Frontend의 감사 로그입니다.

* `file`

    파일 이름을 지정합니다.


## 요청 본문 {#request-body}

없음

## 응답 {#response}

* `HEAD`

    ```
    HTTP/1.1 200 OK
    file_infos: {"fe.audit.log":24759,"fe.audit.log.20190528.1":132934}
    content-type: text/html
    connection: keep-alive
    ```

    응답 헤더에는 지정한 유형의 현재 로그 파일 목록과 각 파일의 크기가 표시됩니다.

* `GET`

    지정한 로그 파일을 텍스트 형식으로 다운로드합니다.

## 예제 {#examples}

1. 해당 유형의 로그 파일 목록 가져오기

    ```
    HEAD /api/get_log_file?type=fe.audit.log

    Response:

    HTTP/1.1 200 OK
    file_infos: {"fe.audit.log":24759,"fe.audit.log.20190528.1":132934}
    content-type: text/html
    connection: keep-alive
    ```

    응답 헤더의 `file_infos` 필드에는 파일 목록과 각 파일의 크기(바이트 단위)가 JSON 형식으로 표시됩니다.

2. 로그 파일 다운로드

    ```
    GET /api/get_log_file?type=fe.audit.log&file=fe.audit.log.20190528.1

    Response:

    < HTTP/1.1 200
    < Vary: Origin
    < Vary: Access-Control-Request-Method
    < Vary: Access-Control-Request-Headers
    < Content-Disposition: attachment;fileName=fe.audit.log
    < Content-Type: application/octet-stream;charset=UTF-8
    < Transfer-Encoding: chunked

    ... File Content ...
    ```
