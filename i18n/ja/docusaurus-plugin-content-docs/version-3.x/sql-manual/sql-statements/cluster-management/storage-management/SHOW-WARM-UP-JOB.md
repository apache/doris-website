---
{
  "title": "SHOW WARM UP JOB",
  "description": "コマンドはDorisでウォームアップジョブを表示するために使用されます。",
  "language": "ja"
}
---
## 説明

これらのコマンドはDorisでウォームアップジョブを表示するために使用されます。

## 構文

```sql
   SHOW WARM UP JOB [ WHERE id = 'id' ] ;
```
## パラメータ


| パラメータ名                  | デスクリプション                                                         |
|---------------------------|--------------------------------------------------------------|
| id                        | warm-upジョブのID                                                |
## Examples

1. 全てのwarm-upジョブを表示する：

 ```sql
    SHOW WARM UP JOB;
```
2. ID 13418のwarm-upジョブを表示します：

```sql
   SHOW WARM UP JOB WHERE id = 13418;
```
## 関連コマンド

 - [WARMUP COMPUTE GROUP](./WARM-UP.md)
