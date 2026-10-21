---
{
    "title": "Tablet 정보 조회",
    "language": "ko",
    "description": "ID와 schema hash를 포함한 Tablet 정보를 조회합니다."
}
---

# Tablet 정보 조회 {#view-tablet-info}

## 요청 {#request}

`GET /tablets_json?limit={int}`

## 설명 {#description}

ID와 schema hash를 포함한 Tablet 정보를 조회합니다.

## 쿼리 매개변수 {#query-parameters}

* `limit`
    출력할 Tablet 수입니다. 선택 사항이며 기본값은 1000입니다. 모든 Tablet을 출력하려면 `all`을 지정합니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

    ```
    {
        msg: "OK",
        code: 0,
        data: {
            host: "10.38.157.107",
            tablets: [
                {
                    tablet_id: 11119,
                    schema_hash: 714349777
                },

                    ...

                {
                    tablet_id: 11063,
                    schema_hash: 714349777
                }
            ]
        },
        count: 30
    }
    ```
## 예제 {#examples}


    ```
    curl http://127.0.0.1:8040/tablets_json?limit=all

    ```
