---
{
  "title": "CREATE VIEW",
  "language": "ja",
  "description": "この文は、指定されたクエリ文を使用して論理ビューを作成するために使用されます。"
}
---
## 説明

このステートメントは、指定されたクエリステートメントを使用して論理ビューを作成するために使用されます。

## 構文

```sql
CREATE VIEW [IF NOT EXISTS] [<db_name>.]<view_name>
   [(<column_definition>)]
[AS] <query_stmt>
```
各項目の説明：

```sql
column_definition:
    <column_name> [COMMENT '<comment>'] [,...]
```
## 必須パラメータ

**1. `<view_name>`**
> ビューの識別子（名前）。ビューが作成されるデータベース内で一意である必要があります。  
> 識別子は文字で始まる必要があり（Unicode名前サポートが有効な場合、任意の言語の文字が使用可能）、識別子文字列全体がバッククォートで囲まれていない限り（例：`My View`）、スペースや特殊文字を含むことはできません。  
> 識別子は予約キーワードを使用できません。  
> 詳細については、識別子要件と予約キーワードを参照してください。

**2. `<query_stmt>`**
> ビューを定義するSELECTクエリステートメント。

## オプションパラメータ

**1. `<db_name>`**
> ビューが存在するデータベース名。指定されない場合、デフォルトで現在のデータベースが使用されます。

**2. `<column_definition>`**
> ビューのカラム定義。  
> 詳細：  
> **1. `<column_name>`**  
> カラム名。  
> **2. `<comment>`**  
> カラムコメント。

## アクセス制御要件

| 権限        | オブジェクト | 備考                                                                |
|-------------|-------------|---------------------------------------------------------------------|
| CREATE_PRIV | Database    | データベースにCREATE_PRIV権限が必要です。                            |
| SELECT_PRIV | Table, View | クエリ対象のテーブル、ビュー、またはマテリアライズドビューにSELECT_PRIV権限が必要です。 |

## 注意事項

- ビューは論理的なもので、物理的なストレージを持ちません。ビューに対するすべてのクエリは、対応するサブクエリに対するクエリと同等です。
- ビューの作成と削除は、基盤となるテーブルのデータに影響しません。

## 例

1. `example_db`上にビュー`example_view`を作成

    ```sql
    CREATE VIEW example_db.example_view (k1, k2, k3, v1)
    AS
    SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
    WHERE k1 = 20160112 GROUP BY k1,k2,k3;
    ```
2. 列定義を含むビューを作成する

    ```sql
    CREATE VIEW example_db.example_view
    (
        k1 COMMENT "first key",
        k2 COMMENT "second key",
        k3 COMMENT "third key",
        v1 COMMENT "first value"
    )
    COMMENT "my first view"
    AS
    SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
    WHERE k1 = 20160112 GROUP BY k1,k2,k3;
    ```
