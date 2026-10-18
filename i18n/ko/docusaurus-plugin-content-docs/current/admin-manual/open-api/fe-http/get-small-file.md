---
{
    "title": "작은 파일 가져오기 작업",
    "language": "ko",
    "description": "파일 ID를 사용하여 작은 파일 관리자에 있는 파일을 다운로드합니다."
}
---

# 작은 파일 가져오기 {#get-small-file}

## 요청 {#request}

`GET /api/get_small_file`

## 설명 {#description}

파일 ID를 사용하여 작은 파일 관리자에 있는 파일을 다운로드합니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `token`

    클러스터의 토큰입니다. `doris-meta/image/VERSION` 파일에서 확인할 수 있습니다.

* `file_id`

    파일 관리자에 표시되는 파일 ID입니다. `SHOW FILE` 명령으로 파일 ID를 확인할 수 있습니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
< HTTP/1.1 200
< Vary: Origin
< Vary: Access-Control-Request-Method
< Vary: Access-Control-Request-Headers
< Content-Disposition: attachment;fileName=ca.pem
< Content-Type: application/json;charset=UTF-8
< Transfer-Encoding: chunked

... File Content ...
```

오류가 발생하면 다음을 반환합니다:

```
{
	"msg": "File not found or is not content",
	"code": 1,
	"data": null,
	"count": 0
}
```

## 예시 {#examples}

1. 지정된 ID의 파일 다운로드

    ```
    GET /api/get_small_file?token=98e8c0a6-3a41-48b8-a72b-0432e42a7fe5&file_id=11002

    Response:

    < HTTP/1.1 200
    < Vary: Origin
    < Vary: Access-Control-Request-Method
    < Vary: Access-Control-Request-Headers
    < Content-Disposition: attachment;fileName=ca.pem
    < Content-Type: application/json;charset=UTF-8
    < Transfer-Encoding: chunked

    ... File Content ...
    ```
