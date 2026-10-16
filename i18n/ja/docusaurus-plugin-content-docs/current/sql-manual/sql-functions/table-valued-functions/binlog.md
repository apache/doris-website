---
{
    "title": "BINLOG",
    "language": "ja",
    "description": "Row Binlog が有効な内部テーブルの行レベルの変更レコードを生のまま返し、変更内容の確認に使用するテーブル関数です。"
}
---

## 説明

このテーブル関数は、Row Binlog が有効な内部テーブルの行レベルの変更レコードを生のまま返します。各レコードには、ベーステーブルの可視列（変更後の値）、操作種別、コミットタイムスタンプ、トランザクション内のシーケンス番号、および必要に応じて変更前の値が含まれます。

この関数は、保存された生のレコードを統合またはフィルタリングせずに読み取ります。

:::caution
`binlog()` は主に内部デバッグ用であり、本番環境のデータパイプラインでの使用は推奨されません。出力形式とパラメータはバージョン間で変更される可能性があります。実際の増分データの取得には、[Table Stream](../../../data-operate/incremental/table-stream) または [`@incr` 増分クエリ](../../../data-operate/incremental/incremental-query) を使用してください。
:::

この機能はバージョン 5.0.0 以降で利用でき、実験的な機能です。

## 構文

```sql
BINLOG(
    "table" = "<table_name>"
    [, "db" = "<db_name>"]
    [, "partition" = "<partition_name>[, ...]"]
    [, "tablet" = "<tablet_id>[, ...]"]
)
```

## 必須パラメータ

| 項目 | 説明 |
|---|---|
| **`<table_name>`** | テーブル名。`"binlog.enable" = "true"`、`"binlog.format" = "ROW"` を設定して Row Binlog を有効にした内部テーブルである必要があります |

## オプションパラメータ

| 項目 | 説明 |
|---|---|
| **`<db_name>`** | データベース名。省略時は現在のデータベース |
| **`<partition_name>`** | 読み取るパーティションをカンマ区切りで指定します。省略時はすべてのパーティション |
| **`<tablet_id>`** | 読み取るタブレットをカンマ区切りで指定します。省略時はすべてのタブレット |

## 戻り値

| 項目 | 型 | 説明 |
|---|---|---|
| ベーステーブルの可視列 | ベーステーブルと同じ | 変更後の値。削除レコードでは、`binlog.need_historical_value` が有効な場合は削除前の値が入り、それ以外の場合はキー列にのみ値が入ります |
| `__DORIS_BINLOG_OP__` | TINYINT | 操作種別：`0` は挿入、`1` は更新、`2` は削除 |
| `__DORIS_BINLOG_TSO__` | BIGINT | コミットタイムスタンプ（TSO） |
| `__DORIS_BINLOG_LSN__` | BIGINT | トランザクション内のシーケンス番号 |
| `__BEFORE__<column>__` | 元の列と同じ | 変更前の値。キー列以外の各列に対応します。ベーステーブルで `binlog.need_historical_value` が有効な場合にのみ存在し、挿入レコードでは NULL になります |

## 使用例

`demo.orders` の注文 1 の変更履歴全体を表示します。

```sql
SELECT __DORIS_BINLOG_OP__ AS op, __DORIS_BINLOG_TSO__ AS tso,
       order_id, status, amount, __BEFORE__status__, __BEFORE__amount__
FROM BINLOG("db" = "demo", "table" = "orders")
WHERE order_id = 1
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__;
```

```text
+------+--------------------+----------+---------+--------+--------------------+--------------------+
| op   | tso                | order_id | status  | amount | __BEFORE__status__ | __BEFORE__amount__ |
+------+--------------------+----------+---------+--------+--------------------+--------------------+
|    0 | 469067680972800000 |        1 | created | 100.00 | NULL               |               NULL |
|    1 | 469067681287372800 |        1 | paid    | 100.00 | created            |             100.00 |
|    2 | 469067681628160003 |        1 | paid    | 100.00 | paid               |             100.00 |
+------+--------------------+----------+---------+--------+--------------------+--------------------+
```

特定のパーティションの変更件数だけを集計します。

```sql
SELECT __DORIS_BINLOG_OP__, COUNT(*)
FROM BINLOG("table" = "orders", "partition" = "p20260914")
GROUP BY __DORIS_BINLOG_OP__;
```

Row Binlog が有効でないテーブルでは、次のエラーが発生します。

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = binlog<row> is not enabled for table=orders
```
