---
{
  "title": "VIEW を表示",
  "language": "ja",
  "description": "このステートメントは、指定されたテーブルに基づくすべてのviewを表示するために使用されます"
}
---
## 説明

この文は、指定されたテーブルに基づくすべてのビューを表示するために使用されます

文法:

```sql
SHOW VIEW { FROM | IN } table [ FROM db ]
```
## 例

1. テーブル testTbl に基づいて作成されたすべてのビューを表示する

    ```sql
    SHOW VIEW FROM testTbl;
    ```
## キーワード

SHOW、VIEW
