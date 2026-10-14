---
{
    "title": "統計情報の取得",
    "language": "ja",
    "description": "データベース数やテーブル数など、クラスタの統計情報を取得します。"
}
---

# 統計情報の取得

## リクエスト

`GET /rest/v2/api/cluster_overview`

## 説明

データベース数やテーブル数など、クラスタの統計情報を取得します。
    
## パスパラメータ

なし

## クエリパラメータ

なし

## リクエストボディ

なし

## レスポンス

```
{
    "msg":"success",
    "code":0,
    "data":{"diskOccupancy":0,"remainDisk":5701197971457,"feCount":1,"tblCount":27,"beCount":1,"dbCount":2},
    "count":0
}
```
