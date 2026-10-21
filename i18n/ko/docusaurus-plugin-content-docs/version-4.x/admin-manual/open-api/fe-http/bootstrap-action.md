---
{
    "title": "부트스트랩 작업",
    "language": "ko",
    "description": "FE가 시작되었는지 확인하는 데 사용됩니다. 매개변수를 제공하지 않으면 시작 성공 여부만 반환됩니다."
}
---

# 부트스트랩 작업 {#bootstrap-action}

## 요청 {#request}

`GET /api/bootstrap`

## 설명 {#description}

FE가 시작되었는지 확인하는 데 사용됩니다. 매개변수를 제공하지 않으면 시작 성공 여부만 반환됩니다. `token`과 `cluster_id`를 제공하면 더 자세한 정보가 반환됩니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `cluster_id`

    클러스터 ID입니다. `doris-meta/image/VERSION` 파일에서 확인할 수 있습니다.

* `token`

    클러스터 토큰입니다. `doris-meta/image/VERSION` 파일에서 확인할 수 있습니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

* 매개변수를 제공하지 않은 경우

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```

    코드가 0이면 FE 노드가 성공적으로 시작되었음을 의미합니다. 0이 아닌 오류 코드는 다른 오류가 발생했음을 나타냅니다.

* `token`과 `cluster_id`를 제공한 경우

    ```
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"queryPort": 9030,
    		"rpcPort": 9020,
            "arrowFlightSqlPort": 9040,
    		"maxReplayedJournal": 17287
    	},
    	"count": 0
    }
    ```

    * `queryPort`는 FE 노드의 MySQL 프로토콜 포트입니다.
    * `rpcPort`는 FE 노드의 thrift RPC 포트입니다.
    * `maxReplayedJournal`은 FE 노드가 현재까지 재생한 메타데이터 저널의 최대 ID를 나타냅니다.
    * `arrowFlightSqlPort`는 FE 노드의 Arrow Flight SQL 포트입니다.

## 예시 {#examples}

1. 매개변수가 없는 경우

    ```
    GET /api/bootstrap

    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": null,
    	"count": 0
    }
    ```

2. `token`과 `cluster_id`를 제공한 경우

    ```
    GET /api/bootstrap?cluster_id=935437471&token=ad87f6dd-c93f-4880-bcdb-8ca8c9ab3031

    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"queryPort": 9030,
    		"rpcPort": 9020,
            "arrowFlightSqlPort": 9040,
    		"maxReplayedJournal": 17287
    	},
    	"count": 0
    }
    ```
