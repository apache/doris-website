---
{
  "title": "統計アクション",
  "language": "ja",
  "description": "クラスターの統計情報、データベースとテーブルの数量などを取得する。"
}
---
# Statistic Action

## Request

`GET /rest/v2/api/cluster_overview`

## Description

クラスター統計情報、データベーステーブル数などを取得します。
    
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
