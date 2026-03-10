---
{
  "title": "コンパクトテーブル",
  "language": "ja",
  "description": "ストレージ・コンピューティング結合モードにおいて、これは指定されたテーブルパーティション配下のすべてのreplicaに対してcompactionをトリガーするために使用されます。"
}
---
## 説明

ストレージ・コンピューティング結合モードにおいて、指定されたテーブルパーティション配下のすべてのレプリカに対してcompactionをトリガーするために使用されます。

このコマンドは、ストレージ・コンピューティング分離モードではサポートされていません。

## 構文

```sql
ADMIN COMPACT TABLE <table_name> 
PARTITION <partition_name> 
WHERE TYPE={ BASE | CUMULATIVE }
```
## 必須パラメータ

<table_name>

> compactionを実行するテーブルの名前。

<partition_name>

> compactionを実行するパーティションの名前。（注：この行はテーブル名の説明を繰り返しているため修正する必要があり、パーティション名を指定するべきです。）

TYPE={ BASE | CUMULATIVE }

> BASEはbase compactionの実行を指し、CUMULATIVEはcumulative compactionの実行を指します。詳細については、COMPACTIONセクションを参照してください。

## アクセス制御要件

このSQLコマンドを正常に実行するための前提条件は、ADMIN_PRIV権限を持つことです。権限ドキュメントを参照してください。

| Privilege  | Object                               | Notes                           |
| :--------- | :----------------------------------- | :------------------------------ |
| ADMIN_PRIV | クラスタ全体の管理権限 | NODE_PRIV以外のすべての権限 |

## 例

1. テーブルtblのパーティションpar01に対してcumulative compactionを実行する。

  ```sql
  ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
  ```
## 使用上の注意

1. このコマンドはストレージ・コンピューティング分離モードではサポートされていません。このモードで実行するとエラーが発生します。例：

  ```sql
  ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
  ```
エラーメッセージは以下の通りです：

  ```sql
  ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported operation
  ```
