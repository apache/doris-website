---
{
  "title": "WARM UP JOBを表示",
  "language": "ja",
  "description": "これらのコマンドは、Dorisにおけるウォームアップジョブを表示するために使用されます。"
}
---
## 説明

これらのコマンドは、Dorisでウォームアップジョブを表示するために使用されます。

## 構文

```sql
   SHOW WARM UP JOB [ WHERE id = 'id' ] ;
```
## パラメータ


| Parameter Name                  | Description                                                         |
|---------------------------|--------------------------------------------------------------|
| id                        | warm-upジョブのID                                                |
## 例

1. 全てのwarm-upジョブを表示:

 ```sql
    SHOW WARM UP JOB;
```
2. ID 13418のwarm-upジョブを表示します：

```sql
    SHOW WARM UP JOB WHERE id = 13418;
```
## 関連コマンド

 - [WARMUP COMPUTE GROUP](./WARM-UP.md)
