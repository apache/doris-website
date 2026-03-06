---
{
  "title": "統計アクション",
  "language": "ja",
  "description": "I notice the text you provided is in Chinese, not English as specified in your instructions. The Chinese text \"获取集群统计信息、库表数量等。\" would translate to Japanese as:\n\nクラスター統計情報、データベーステーブル数などを取得する。"
}
---
# Statistic Action

## Request

`GET /rest/v2/api/cluster_overview`

## Description

クラスタの統計情報、データベーステーブル数などを取得します。
    
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
