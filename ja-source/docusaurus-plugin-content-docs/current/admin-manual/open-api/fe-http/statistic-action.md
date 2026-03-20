---
{
  "title": "統計アクション",
  "language": "ja",
}
---
# Statistic Action

## Request

`GET /rest/v2/api/cluster_overview`

## 詳細

クラスタの統計情報、データベース・テーブル数などを取得します。
    
## Path parameters

なし

## Query parameters

なし

## Request body

なし

## Response

```
{
    "msg":"success",
    "code":0,
    "data":{"diskOccupancy":0,"remainDisk":5701197971457,"feCount":1,"tblCount":27,"beCount":1,"dbCount":2},
    "count":0
}
```
