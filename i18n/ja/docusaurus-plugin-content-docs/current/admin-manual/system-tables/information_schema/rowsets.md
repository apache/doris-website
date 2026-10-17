---
{
    "title": "rowsets",
    "language": "ja",
    "description": "Rowset の基本情報を返します。"
}
---

## 概要 {#overview}

Rowset の基本情報を返します。

## データベース {#database}


`information_schema`


## テーブル情報 {#table-information}

| カラム名               | 型          | 説明                                                         |
| ---------------------- | ----------- | ------------------------------------------------------------ |
| BACKEND_ID             | bigint      | Backend を一意に識別する ID。                                 |
| ROWSET_ID              | varchar(64) | Rowset を一意に識別する ID。                                  |
| TABLET_ID              | bigint      | Tablet を一意に識別する ID。                                  |
| ROWSET_NUM_ROWS        | bigint      | Rowset に含まれるデータ行の数。                               |
| TXN_ID                 | bigint      | Rowset に書き込んだトランザクションの ID。                    |
| NUM_SEGMENTS           | bigint      | Rowset に含まれる Segment の数。                              |
| START_VERSION          | bigint      | Rowset の開始バージョン番号。                                 |
| END_VERSION            | bigint      | Rowset の終了バージョン番号。                                 |
| INDEX_DISK_SIZE        | bigint      | Rowset 内のインデックスが占めるストレージ容量。               |
| DATA_DISK_SIZE         | bigint      | Rowset 内のデータが占めるストレージ容量。                     |
| CREATION_TIME          | datetime    | Rowset の作成日時。                                           |
| NEWEST_WRITE_TIMESTAMP | datetime    | Rowset への直近の書き込み日時。                               |
| SCHEMA_VERSION         | int         | Rowset のデータに対応するテーブルの Schema バージョン番号。  |
| COMMIT_TSO | varchar(64) | Rowset の TSO 範囲。`[start_tso-end_tso]` の形式で表します（開発環境のみ）。範囲が記録されていない場合のデフォルト値は `[-1--1]` です。 |

## COMMIT_TSO の使用方法 {#commit_tso-usage}

このカラムは文字列です。単一の BIGINT としてソートしたり、数値の `-1` と直接比較したりしないでください。範囲が記録されていない場合は `[-1--1]` と表示されます。単一のコミット値も開始値と終了値の範囲として表示されます。

```sql
SELECT BACKEND_ID, ROWSET_ID, COMMIT_TSO
FROM information_schema.rowsets
WHERE COMMIT_TSO <> '[-1--1]'
LIMIT 20;
```

結果には範囲が記録されている Rowset が表示されます。範囲が記録されていない場合、結果は空になります。状態の確認と設定については、[TSO](../../cluster-management/tso.md) を参照してください。
