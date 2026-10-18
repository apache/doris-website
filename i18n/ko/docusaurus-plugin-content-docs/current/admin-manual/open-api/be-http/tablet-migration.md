---
{
    "title": "Tablet 마이그레이션",
    "language": "ko",
    "description": "tablet을 지정한 디스크로 마이그레이션합니다."
}
---

# Tablet 마이그레이션 {#migration-tablet}

## 요청 {#request}

`GET /api/tablet_migration?goal={enum}&tablet_id={int}&schema_hash={int}&disk={string}`

## 설명 {#description}

tablet을 지정한 디스크로 마이그레이션합니다.

## 쿼리 매개변수 {#query-parameters}

* `goal`
    - `run`：마이그레이션 작업 제출
    - `status`：마이그레이션 작업 상태 조회

* `tablet_id`
    tablet의 ID

* `schema_hash`
    Schema hash

* `disk`
    지정한 디스크입니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

### 작업 제출 {#submit-task}

```
    {
        status: "Success",
        msg: "migration task is successfully submitted."
    }
```
또는
```
    {
        status: "Fail",
        msg: "Migration task submission failed"
    }
```

### 상태 조회 {#show-status}

```
    {
        status: "Success",
        msg: "migration task is running",
        dest_disk: "xxxxxx"
    }
```

또는

```
    {
        status: "Success",
        msg: "migration task has finished successfully",
        dest_disk: "xxxxxx"
    }
```

또는

```
    {
        status: "Success",
        msg: "migration task failed.",
        dest_disk: "xxxxxx"
    }
```

## 예제 {#examples}


    ```
    curl "http://127.0.0.1:8040/api/tablet_migration?goal=run&tablet_id=123&schema_hash=333&disk=/disk1"

    ```
