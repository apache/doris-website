---
{
    "title": "Stub 캐시 초기화",
    "language": "ko",
    "description": "brpc 연결 캐시를 초기화합니다"
}
---

# Stub 캐시 초기화 {#reset-stub-cache}

## 요청 {#request}

`GET /api/reset_rpc_channel/{endpoints}`

## 설명 {#description}

brpc 연결 캐시를 초기화합니다.

## 경로 매개변수 {#path-parameters}

* `endpoints`
    - `all`: 모든 캐시 삭제
    - `host1:port1,host2:port2`: 지정한 대상의 캐시 삭제

## 요청 본문 {#request-body}

없음

## 응답 {#response}

    ```
    {
        "msg":"success",
        "code":0,
        "data": "no cached channel.",
        "count":0
    }
    ```
## 예제 {#examples}


    ```
    curl http://127.0.0.1:8040/api/reset_rpc_channel/all
    ```

    ```
    curl http://127.0.0.1:8040/api/reset_rpc_channel/1.1.1.1:8080,2.2.2.2:8080
    ```
