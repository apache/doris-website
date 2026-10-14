---
{
    "title": "SHOW VIEW",
    "language": "ja",
    "description": "このステートメントは、指定したテーブルを基に作成されたすべてのビューを表示します"
}
---

## 説明

このステートメントは、指定したテーブルを基に作成されたすべてのビューを表示します

## 構文

```sql
  SHOW VIEW { FROM | IN } table [ FROM db ]
```

## 例

1. テーブル testTbl を基に作成されたすべてのビューを表示します

    ```sql
    SHOW VIEW FROM testTbl;
    ```

## キーワード

    SHOW, VIEW

