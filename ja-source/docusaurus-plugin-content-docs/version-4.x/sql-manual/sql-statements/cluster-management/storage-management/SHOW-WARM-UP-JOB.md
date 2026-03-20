---
{
  "title": "SHOW WARM UP JOB の表示",
  "description": "これらのコマンドはDorisでウォームアップジョブを表示するために使用されます。",
  "language": "ja"
}
---
## 概要

このコマンドはDorisのウォームアップジョブを表示するために使用されます。

## 構文

```sql
   SHOW WARM UP JOB [ WHERE id = 'id' ] ;
```
## パラメータ


| パラメータ名                  | デスクリプション                                                         |
|---------------------------|--------------------------------------------------------------|
| id                        | warm-upジョブのID                                                |
## Examples

1. 全てのwarm-upジョブを表示:

 ```sql
    SHOW WARM UP JOB;
```
2. ID 13418のウォームアップジョブを表示する：

```sql
    SHOW WARM UP JOB WHERE id = 13418;
```
## 関連コマンド

 - [WARMUP COMPUTE GROUP](./WARM-UP.md)
