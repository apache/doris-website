---
{
    "title": "WAL 크기 조회",
    "language": "ko",
    "description": "이 HTTP 인터페이스를 통해 지정한 BE의 WAL 파일 수를 조회할 수 있습니다. BE를 지정하지 않으면 기본적으로 모든 BE의 WAL 파일 수가 반환됩니다."
}
---

## 요청 {#request}

`GET fe_host:fe_http_port/api/get_wal_size?host_ports=host1:port1,host2:port2...`

## 설명 {#description}

이 HTTP 인터페이스를 통해 지정한 BE의 WAL 파일 수를 조회할 수 있습니다. BE를 지정하지 않으면 기본적으로 모든 BE의 WAL 파일 수가 반환됩니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `host_ports`

    BE의 IP 주소와 HTTP 포트입니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
"msg": "OK",
"code": 0,
"data": ["192.168.10.11:9050:1", "192.168.10.11:9050:0"],
"count": 0
}
```

## 예제 {#examples}

1. 모든 BE의 WAL 파일 수를 조회합니다.

    ```
    curl -u root: "127.0.0.1:8038/api/get_wal_size"

    Response:
    {
    "msg": "OK",
    "code": 0,
    "data": ["192.168.10.11:9050:1", "192.168.10.11:9050:0"],
    "count": 0
    }
    ```

    반환된 결과에서 각 BE 뒤에 오는 숫자는 해당 BE의 WAL 파일 수입니다.

2. 지정한 BE의 WAL 파일 수를 조회합니다.

    ```
    curl -u root: "127.0.0.1:8038/api/get_wal_size?host_ports=192.168.10.11:9050"

    Response:
    {
    "msg": "OK",
    "code": 0,
    "data": ["192.168.10.11:9050:1"],
    "count": 0
    }
    ```

    반환된 결과에서 각 BE 뒤에 오는 숫자는 해당 BE의 WAL 파일 수입니다.
