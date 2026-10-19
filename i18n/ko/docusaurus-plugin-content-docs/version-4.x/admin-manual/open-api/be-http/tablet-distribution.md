---
{
    "title": "Tablet 분포 조회",
    "language": "ko",
    "description": "BE 노드의 디스크별로 각 파티션에 속한 Tablet의 분포를 조회합니다."
}
---

# Tablet 분포 조회 {#view-tablet-distribution}

## 요청 {#request}

`GET /api/tablets_distribution?group_by={enum}&partition_id={int}`

## 설명 {#description}

BE 노드의 디스크별로 각 파티션에 속한 Tablet의 분포를 조회합니다.

## 쿼리 매개변수 {#query-parameters}

* `group_by`
    `partition`만 지원합니다.

* `partition_id`
    조회할 파티션의 ID입니다. 선택 사항이며, 생략하면 모든 파티션을 조회합니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

    ```
    {
        msg: "OK",
        code: 0,
        data: {
            host: "***",
            tablets_distribution: [
                {
                    partition_id:***,
                    disks:[
                        {
                            disk_path:"***",
                            tablets_num:***,
                            tablets:[
                                {
                                    tablet_id:***,
                                    schema_hash:***,
                                    tablet_size:***
                                },

                                ...

                            ]
                        },

                        ...

                    ]
                }
            ]
        },
        count: ***
    }
    ```
## 예제 {#examples}


    ```
    curl "http://127.0.0.1:8040/api/tablets_distribution?group_by=partition&partition_id=123"

    ```
