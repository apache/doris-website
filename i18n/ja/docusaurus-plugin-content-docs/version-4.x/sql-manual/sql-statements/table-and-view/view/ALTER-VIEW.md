---
{
    "title": "ALTER VIEW",
    "language": "ja",
    "description": "論理ビューの定義を変更します。"
}
---

## 説明

論理ビューの定義を変更します。

## 構文

```sql
ALTER VIEW [<db_name>.]<view_name> 
 [(<column_definition>)]
AS <query_stmt>
```

各要素は次のとおりです。
```sql
column_definition:
    <column_name> [COMMENT '<comment>'] [,...]
```

## 必須パラメータ

**1. `<view_name>`**
> 変更するビューの識別子（名前）。

**2. `<query_stmt>`**
> ビューを定義する SELECT クエリ文。

## 任意パラメータ

**1. `<db_name>`**
> ビューが属するデータベース名。省略すると現在のデータベースを使用します。

**2. `<column_definition>`**
> ビューの列定義。  
> 各要素は次のとおりです。  
> **1. `<column_name>`**  
> 列名。  
> **2. `<comment>`**  
> 列のコメント。

## 必要な権限

| 権限     | 対象   | 説明                                                                 |
|---------------|----------|-----------------------------------------------------------------------|
| ALTER_PRIV   | View     | 変更するビューに対する ALTER_PRIV 権限が必要です。         |
| SELECT_PRIV  | Table, View | 照会するテーブル、ビュー、マテリアライズドビューに対する SELECT_PRIV 権限が必要です。 |

## 例

1. ビュー `example_view` を `example_db` で変更します

  ```sql
  ALTER VIEW example_db.example_view
  (
    c1 COMMENT "column 1",
    c2 COMMENT "column 2",
    c3 COMMENT "column 3"
  )
  AS SELECT k1, k2, SUM(v1) FROM example_table 
  GROUP BY k1, k2
  ```