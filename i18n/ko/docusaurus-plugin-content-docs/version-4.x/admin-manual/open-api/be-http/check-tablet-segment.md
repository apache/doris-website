---
{
    "title": "모든 tablet의 segment 유실 여부 확인",
    "language": "ko",
    "description": "일부 예외 상황으로 인해 BE 노드에서 segment가 유실될 수 있습니다. 하지만 메타데이터에는 tablet이 정상으로 표시됩니다."
}
---

# 모든 tablet의 segment 유실 여부 확인 {#check-all-tablet-segment-lost}

## 요청 {#request}

`GET /api/check_tablet_segment_lost?repair={bool}`

## 설명 {#description}

일부 예외 상황으로 인해 BE 노드에서 segment가 유실될 수 있습니다. 하지만 메타데이터에는 tablet이 정상으로 표시됩니다. FE는 이러한 비정상 복제본을 감지하지 못하므로 자동으로 복구할 수 없습니다. 쿼리가 실행되면 데이터 파일을 열지 못했다는 오류가 발생하며, 오류 메시지에 `tablet=<tablet_id>`와 `backend=<be_ip>`가 추가됩니다. 이 인터페이스는 현재 BE 노드에서 segment가 유실된 모든 tablet을 확인하는 데 사용됩니다.

:::info 버전 참고

4.0.8 이전 버전에서는 이러한 오류에 `failed to initialize storage reader` 접두사가 붙었습니다. 4.0.8부터는 이 접두사가 제거되고 오류 메시지에 실제 근본 원인이 표시되므로, 이 접두사로 해당 상황을 식별해서는 안 됩니다.

:::

## 쿼리 매개변수 {#query-parameters}

* `repair`
    - `true`: segment가 유실된 tablet은 SHUTDOWN 상태로 설정되고 불량 복제본으로 처리되므로, FE가 이를 감지하고 복구할 수 있습니다. 
    - `false`: segment가 누락된 모든 tablet을 반환하며 다른 작업은 수행하지 않습니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

    The return is all tablets on the current BE node that have lost segment:

    ```
    {
        status: "Success",
        msg: "Succeed to check all tablet segment",
        num: 3,
        bad_tablets: [
            11190,
            11210,
            11216
        ],
        set_bad: true,
        host: "172.3.0.101"
    }
    ```

## 예제 {#examples}


    ```
    curl http://127.0.0.1:8040/api/check_tablet_segment_lost?repair=false
    ```
