---
{
  "title": "SHOW VIEW",
  "language": "ja",
  "description": "この文は、指定されたテーブルに基づくすべてのビューを表示するために使用されます"
}
---
## 説明

このステートメントは、指定されたテーブルに基づくすべてのビューを表示するために使用されます

文法:

```sql
  SHOW VIEW { FROM | IN } table [ FROM db ]
```
## 例

1. テーブルtestTblに基づいて作成されたすべてのビューを表示する

    ```sql
    SHOW VIEW FROM testTbl;
    ```
## キーワード

    SHOW, VIEW

## ベストプラクティス
