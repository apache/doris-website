---
{
    "title": "タブレットの移行",
    "language": "ja",
    "description": "タブレットを指定したディスクに移行します。"
}
---

# タブレットの移行

## リクエスト

`GET /api/tablet_migration?goal={enum}&tablet_id={int}&schema_hash={int}&disk={string}`

## 説明

タブレットを指定したディスクに移行します。

## クエリパラメータ

* `goal`
    - `run`：移行タスクを送信します。
    - `status`：移行タスクのステータスを表示します。

* `tablet_id`
    タブレットの ID。

* `schema_hash`
    スキーマハッシュ。

* `disk`
    移行先として指定するディスク。

## リクエストボディ

なし

## レスポンス

### タスクの送信

```
    {
        status: "Success",
        msg: "migration task is successfully submitted."
    }
```
または
```
    {
        status: "Fail",
        msg: "Migration task submission failed"
    }
```

### ステータスの表示

```
    {
        status: "Success",
        msg: "migration task is running",
        dest_disk: "xxxxxx"
    }
```

または

```
    {
        status: "Success",
        msg: "migration task has finished successfully",
        dest_disk: "xxxxxx"
    }
```

または

```
    {
        status: "Success",
        msg: "migration task failed.",
        dest_disk: "xxxxxx"
    }
```

## 使用例


    ```
    curl "http://127.0.0.1:8040/api/tablet_migration?goal=run&tablet_id=123&schema_hash=333&disk=/disk1"

    ```
