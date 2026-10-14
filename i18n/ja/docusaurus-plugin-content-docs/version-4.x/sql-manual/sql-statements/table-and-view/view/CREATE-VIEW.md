---
{
    "title": "CREATE VIEW",
    "language": "ja",
    "description": "指定したクエリ文から論理ビューを作成します。"
}
---

## 説明

指定したクエリ文から論理ビューを作成します。

## 構文

```sql
CREATE VIEW [IF NOT EXISTS] [<db_name>.]<view_name>
   [(<column_definition>)]
[AS] <query_stmt>
```

各要素は次のとおりです。
```sql
column_definition:
    <column_name> [COMMENT '<comment>'] [,...]
```

## 必須パラメータ

**1. `<view_name>`**
> ビューの識別子（名前）。ビューを作成するデータベース内で一意である必要があります。  
> 識別子は英字で始める必要があります（Unicode 名が有効な場合は任意の言語の文字でも可）。全体をバッククォートで囲まない限り、空白や特殊文字は使用できません（例: `My View`）。  
> 識別子には予約語を使用できません。  
> 詳細は識別子の要件と予約語を参照してください。

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

| 権限   | 対象   | 説明                                                                |
|-------------|----------|----------------------------------------------------------------------|
| CREATE_PRIV | Database | データベースに対する CREATE_PRIV 権限が必要です。                   |
| SELECT_PRIV | Table, View | 照会するテーブル、ビュー、マテリアライズドビューに対する SELECT_PRIV 権限が必要です。 |

## 注意事項

- ビューは論理的なもので、物理ストレージを持ちません。ビューに対するクエリは、対応するサブクエリへのクエリと同等です。
- ビューを作成または削除しても、基になるテーブルのデータには影響しません。

## 例

1. ビュー `example_view` を `example_db` に作成します

    ```sql
    CREATE VIEW example_db.example_view (k1, k2, k3, v1)
    AS
    SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
    WHERE k1 = 20160112 GROUP BY k1,k2,k3;
    ```

2. 列定義を指定してビューを作成します

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