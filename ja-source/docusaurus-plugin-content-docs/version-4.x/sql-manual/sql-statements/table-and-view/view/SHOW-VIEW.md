---
{
  "title": "SHOW VIEW",
  "description": "この文は、指定されたtableに基づくすべてのviewを表示するために使用されます",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、指定されたtableに基づくすべてのビューを表示するために使用されます

grammar:

```sql
  SHOW VIEW { FROM | IN } table [ FROM db ]
```
## Example

1. Table testTbl に基づいて作成されたすべてのビューを表示する

    ```sql
    SHOW VIEW FROM testTbl;
    ```
## Keywords

    SHOW, VIEW

## Best Practice
