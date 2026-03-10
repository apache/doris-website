---
{
  "title": "ALTER VIEW",
  "language": "ja",
  "description": "この文は論理ビューの定義を変更するために使用されます。"
}
---
## 説明

このステートメントは論理ビューの定義を変更するために使用されます。

## 構文

```sql
ALTER VIEW [<db_name>.]<view_name> 
 [(<column_definition>)]
AS <query_stmt>
```
ここで：

```sql
column_definition:
    <column_name> [COMMENT '<comment>'] [,...]
```
## 必須パラメータ

**1. `<view_name>`**
> 変更するビューの識別子（名前）。

**2. `<query_stmt>`**
> ビューを定義するSELECTクエリステートメント。

## オプションパラメータ

**1. `<db_name>`**
> ビューが存在するデータベースの名前。指定されない場合、デフォルトで現在のデータベースが使用される。

**2. `<column_definition>`**
> ビューのカラム定義。  
> 詳細：  
> **1. `<column_name>`**  
> カラム名。  
> **2. `<comment>`**  
> カラムコメント。

## アクセス制御要件

| 権限         | オブジェクト   | 備考                                                                 |
|---------------|----------|-----------------------------------------------------------------------|
| ALTER_PRIV   | View     | 変更するビューにALTER_PRIV権限が必要。         |
| SELECT_PRIV  | Table, View | クエリ対象のテーブル、ビュー、またはマテリアライズドビューにSELECT_PRIV権限が必要。 |

## 例

1. `example_db`上の`example_view`ビューを変更する

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
