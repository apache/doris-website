---
{
    "title": "메트릭",
    "language": "ko",
    "description": "prometheus용으로 제공됩니다"
}
---

# 메트릭 {#metrics}

## 요청 {#request}

`GET /metrics?type={enum}&with_tablet={bool}`

## 설명 {#description}

prometheus용으로 제공됩니다

## 쿼리 매개변수 {#query-parameters}

* `type`
    출력 형식입니다. 선택 사항이며 기본값은 `all`입니다. 다음 값을 사용할 수 있습니다:
    - `core`: 핵심 항목만 출력
    - `json`: JSON 형식

* `with_tablet`
    tablet 관련 항목의 출력 여부입니다. 선택 사항이며 기본값은 `false`입니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

    ```
    doris_be__max_network_receive_bytes_rate LONG 60757
    doris_be__max_network_send_bytes_rate LONG 16232
    doris_be_process_thread_num LONG 1120
    doris_be_process_fd_num_used LONG 336
    ...

    ```
## 예제 {#examples}


    ```
        curl "http://127.0.0.1:8040/metrics?type=json&with_tablet=true"
    ```
