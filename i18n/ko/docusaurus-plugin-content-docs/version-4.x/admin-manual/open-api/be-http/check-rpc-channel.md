---
{
    "title": "Stub Cache 확인",
    "language": "ko",
    "description": "연결 캐시를 사용할 수 있는지 확인합니다"
}
---

# Stub Cache 확인 {#check-stub-cache}

## 요청 {#request}

`GET /api/check_rpc_channel/{host_to_check}/{remot_brpc_port}/{payload_size}`

## 설명 {#description}

연결 캐시를 사용할 수 있는지 확인합니다.

## 경로 매개변수 {#path-parameters}

* `host_to_check`

    확인할 호스트

* `remot_brpc_port`

    원격 brpc 포트

* `payload_size`

    데이터 적재 크기입니다. 단위는 B이며, 허용 범위는 1~1024000입니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

    ```
    {
        "msg":"success",
        "code":0,
        "data": "open brpc connection to {host_to_check}:{remot_brpc_port} success.",
        "count":0
    }
    ```
## 예제 {#examples}


    ```
    curl http://127.0.0.1:8040/api/check_rpc_channel/127.0.0.1/8060/1024000
    ```
