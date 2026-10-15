---
{
    "title": "SHOW WARM UP JOB",
    "language": "ja",
    "description": "Doris のウォームアップジョブを表示するコマンドです。"
}
---

## 説明

このコマンドは、Doris のウォームアップジョブを表示します。

## 構文

```sql
   SHOW WARM UP JOB [ WHERE id = 'id' ] ;
```

## パラメータ


| パラメータ名                  | 説明                                                         |
|---------------------------|--------------------------------------------------------------|
| id                        | ウォームアップジョブの ID                                                |
## 例

1. すべてのウォームアップジョブを表示します。

 ```sql
    SHOW WARM UP JOB;
```

2. ID が 13418 のウォームアップジョブを表示します。

```sql
    SHOW WARM UP JOB WHERE id = 13418;
```

## 関連コマンド

 - [WARMUP COMPUTE GROUP](./WARM-UP.md)
