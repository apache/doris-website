---
{
    "title": "SHOW CREATE VIEW",
    "language": "ja",
    "description": "指定したビューの作成に使用された CREATE VIEW 文を表示します。"
}
---

## 説明

指定したビューの作成に使用された CREATE VIEW 文を表示します。

## 構文

```sql
SHOW CREATE VIEW <name>
```

## 必須パラメータ

`**<name>**`  表示するビューの名前。

## 結果の説明

- View: 照会したビューの名前。
- Create View: データベースに保存されている SQL 文。
- character_set_client: ビューの作成時に使用されたセッションの character_set_client システム変数の値。
- collation_connection: ビューの作成時に使用されたセッションの collation_connection システム変数の値。

## アクセス権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限             | オブジェクト | 備考 |
| ---------------- | ------------ | ---- |
| SHOW_VIEW_PRIV   | テーブル     |      |

ビューの情報は、INFORMATION_SCHEMA.VIEWS テーブルからも照会できます。

## 例

```sql
CREATE VIEW vtest AS SELECT 1, 'test';
SHOW CREATE VIEW vtest;
```

クエリ結果:

```sql
+-------+------------------------------------------+----------------------+----------------------+
| View  | Create View                              | character_set_client | collation_connection |
+-------+------------------------------------------+----------------------+----------------------+
| vtest | CREATE VIEW `vtest` AS SELECT 1, 'test'; | utf8mb4              | utf8mb4_0900_bin     |
+-------+------------------------------------------+----------------------+----------------------+
```
