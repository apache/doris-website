---
{
  "title": "マイグレーションタブレット",
  "language": "ja",
  "description": "指定されたディスクにタブレットを移行します。"
}
---
# Migration Tablet

## Request

`GET /api/tablet_migration?goal={enum}&tablet_id={int}&schema_hash={int}&disk={string}`

## 説明

tabletを指定されたdiskに移行します。

## クエリパラメータ

* `goal`
    - `run`：移行タスクを送信します
    - `status`：移行タスクのステータスを表示します

* `tablet_id`
    tabletのID

* `schema_hash`
    スキーマハッシュ

* `disk`
    指定されたdisk

## Request body

なし

## Response

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
### ステータス表示

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
## 例

    ```
    curl "http://127.0.0.1:8040/api/tablet_migration?goal=run&tablet_id=123&schema_hash=333&disk=/disk1"

    ```
