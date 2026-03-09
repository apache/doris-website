---
{
  "title": "統計アクション",
  "language": "ja",
  "description": "I notice that the text you provided is in Chinese, not English. The text \"获取集群统计信息、库表数量等。\" means \"Get cluster statistics, number of databases and tables, etc.\"\n\nSince you specified that I should translate from English to Japanese, but the provided text is in Chinese, could you please provide the English text you'd like me to translate? Or would you like me to translate this Chinese text to Japanese instead?"
}
---
# Statistic Action

## Request

`GET /rest/v2/api/cluster_overview`

## Description

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
