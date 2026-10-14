---
{
    "title": "COMPACT TABLE",
    "language": "ja",
    "description": "テーブルのパーティション（ADMIN COMPACT TABLE）または単一のタブレット（ADMIN COMPACT TABLET）のコンパクションを手動で開始します。"
}
---

## 説明 {#description}

コンパクションを手動で開始します。Doris では、次の二つの単位で実行できます。

- `ADMIN COMPACT TABLE`: 指定したテーブルパーティションに属するすべてのレプリカのコンパクションを開始します。ストレージ・コンピュート一体型モードでのみサポートされます。
- `ADMIN COMPACT TABLET`: 指定したタブレットのすべてのレプリカのコンパクションを開始します。バージョン 4.1.4 以降でサポートされ、ストレージ・コンピュート一体型モードとストレージ・コンピュート分離型モードの両方で使用できます。

## 構文 {#syntax}

```sql
ADMIN COMPACT TABLE <table_name>
PARTITION <partition_name>
WHERE TYPE={ BASE | CUMULATIVE }
```

```sql
ADMIN COMPACT TABLET <tablet_id>
WHERE TYPE={ BASE | CUMULATIVE | FULL }
```

## 必須パラメータ {#required-parameters}

**ADMIN COMPACT TABLE**

<table_name>

> コンパクションを開始するテーブルの名前。

<partition_name>

> コンパクションを開始するパーティションの名前。

TYPE={ BASE | CUMULATIVE }

> BASE はベースコンパクション、CUMULATIVE は累積コンパクションを開始します。詳細は COMPACTION セクションを参照してください。

**ADMIN COMPACT TABLET**

<tablet_id>

> コンパクションを開始するタブレットの ID。内部（OLAP）テーブルのタブレットである必要があります。`SHOW TABLETS FROM <table_name>` で ID を取得できます。

TYPE={ BASE | CUMULATIVE | FULL }

> BASE と CUMULATIVE に加えて、FULL はフルコンパクションを開始します。

## 必要な権限 {#access-control-requirements}

**ADMIN COMPACT TABLE**

この SQL コマンドを正常に実行するには、ADMIN_PRIV 権限が必要です。権限に関するドキュメントを参照してください。

| 権限       | 対象                         | 備考                        |
| :--------- | :----------------------------------- | :------------------------------ |
| ADMIN_PRIV | クラスター全体の管理権限     | NODE_PRIV を除くすべての権限 |

**ADMIN COMPACT TABLET**

この SQL コマンドを正常に実行するには、グローバルな ADMIN_PRIV 権限、またはタブレットが属するテーブルに対する ALTER_PRIV 権限のいずれかが必要です。どちらか一方があれば実行できます。

| 権限       | 対象                         | 備考                                                       |
| :--------- | :----------------------------------- | :----------------------------------------------------------------- |
| ADMIN_PRIV | クラスター全体の管理権限     | NODE_PRIV を除くすべての権限                                |
| ALTER_PRIV | テーブル                     | タブレットが属するテーブルに対する ALTER 権限があれば十分です |

## 例 {#example}

1. テーブル tbl のパーティション par01 で累積コンパクションを開始します。

  ```sql
  ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
  ```

2. タブレット 10086 でフルコンパクションを開始します。

  ```sql
  ADMIN COMPACT TABLET 10086 WHERE TYPE='FULL';
  ```

3. タブレット 10086 でベースコンパクションを開始します。

  ```sql
  ADMIN COMPACT TABLET 10086 WHERE TYPE='BASE';
  ```

## 使用上の注意 {#usage-note}

1. `ADMIN COMPACT TABLE` はストレージ・コンピュート分離型モードではサポートされません。このモードで実行すると、たとえば次のようなエラーになります。

  ```sql
  ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
  ```

  エラーメッセージは次のとおりです。

  ```sql
  ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported operation
  ```

  この場合は、代わりに `ADMIN COMPACT TABLET` を使用してください。

2. `ADMIN COMPACT TABLET` は内部（OLAP）テーブルのタブレットにのみ対応しています。タブレット ID が存在しない場合、タブレットが属するデータベースまたはテーブルが削除されている場合、またはタブレットが属するインデックスが可視でない場合、ステートメントは直接失敗します。たとえば、次のようなエラーになります。

  ```sql
  ERROR 1105 (HY000): errCode = 2, detailMessage = Unknown tablet: 10086
  ```

3. どちらのステートメントも、コンパクションタスクを BE に送信するだけです。正常に応答が返っても、コンパクションが完了したとは限りません。[SHOW TABLET](./SHOW-TABLET) でタブレットのバージョン数の変化を確認するか、BE の [compaction-status](../../../../admin-manual/open-api/be-http/compaction-status) API で進行状況を確認してください。
