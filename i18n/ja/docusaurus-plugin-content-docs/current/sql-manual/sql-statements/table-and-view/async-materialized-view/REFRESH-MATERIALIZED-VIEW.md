---
{
    "title": "REFRESH MATERIALIZED VIEW",
    "language": "ja",
    "description": "IVM による行単位の増分更新、パーティション更新、全体更新、または自動選択された更新方式を使用して、非同期マテリアライズドビューを手動で更新します。"
}
---

## 説明

このステートメントは、指定した非同期マテリアライズドビューを手動で更新します。更新タスクは非同期で実行されます。`tasks("type"="mv")` で状態を確認してください。

## 構文

```sql
REFRESH MATERIALIZED VIEW <mv_name>
{
    PARTITIONS (<partition_name> [, <partition_name> [, ... ] ])
  | COMPLETE
  | AUTO
  | PARTITIONS [FALLBACK]
  | INCREMENTAL [FALLBACK]
  | INCREMENTAL WITH DRY RUN [LIMIT <limit> [OFFSET <offset>]]
}
```

更新を実行せずに更新計画を確認するには、次の構文を使用します。

```sql
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL [WITH ALL STREAMS]
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> COMPLETE
```

## 必須パラメータ

**1. `<mv_name>`**

> マテリアライズドビューの名前を指定します。

**2. 更新方式**

| 更新方式 | 説明 |
|---|---|
| `INCREMENTAL` | 増分ビュー保守（Incremental View Maintenance、IVM）を使用して、前回の更新から今回の更新までにベーステーブルで発生した行単位の変更を処理します。IVM を有効にして作成したマテリアライズドビューにのみ適用できます |
| `PARTITIONS` | Doris が変更されたマテリアライズドビューのパーティションを判定し、再計算します |
| `COMPLETE` | パーティションがベーステーブルと同期しているかどうかを確認せずに、マテリアライズドビューの全データを強制的に再計算します |
| `AUTO` | Doris が利用可能な方式を自動的に選択します。IVM をサポートするマテリアライズドビューでは、IVM、パーティション更新、全体更新の順に試行します |
| `PARTITIONS (<partition_name>, ...)` | 指定したマテリアライズドビューのパーティションがベーステーブルと同期しているかどうかを確認せずに、強制的に更新します |

## 任意パラメータ

**1. `FALLBACK`**

優先する方式を安全に実行できない場合に、この更新でフォールバックを許可します。

- `INCREMENTAL FALLBACK` は、デフォルトでは IVM、パーティション更新、全体更新の順に試行します。一部の IVM エラーでは、直接全体更新にフォールバックします。
- `PARTITIONS FALLBACK` は、パーティション更新を実行できない場合に全体更新へフォールバックします。
- `INCREMENTAL` または `PARTITIONS` を `FALLBACK` なしで指定すると厳格モードになります。優先する方式が失敗すると、タスクも失敗します。

**2. `WITH DRY RUN`**

`INCREMENTAL` でのみ使用できます。次回の IVM 更新で使用する差分クエリを実行し、書き込まれる予定の行を返します。マテリアライズドビューのデータ、内部 Table Stream のオフセット、IVM のメタデータは変更しません。

`LIMIT` と `OFFSET` で返される結果を制限できます。返される列には、業務データの列と IVM が使用する内部列が含まれます。

**3. `WITH ALL STREAMS`**

`EXPLAIN ... INCREMENTAL` でのみ使用できます。デフォルトでは、計画に含まれるのは未消費の変更がある内部 Stream のみです。このオプションを指定すると、すでにすべての変更を消費した Stream も含まれるため、複数テーブルの差分計画の全体構造を確認しやすくなります。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 説明 |
|---|---|---|
| ALTER_PRIV | マテリアライズドビュー | `REFRESH` はマテリアライズドビューに対する `ALTER` 操作です |

## 使用上の注意

- `INCREMENTAL` は Doris 5.0.0 以降で利用でき、現時点では実験的な機能です。前提条件、サポート範囲、フォールバックの理由、ベースライン要件については、[増分ビュー保守（IVM）](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view) を参照してください。
- IVM では、`PARTITIONS (<partition_name>, ...)` を指定して特定のパーティションの更新を強制することはできません。パーティション更新にはパーティションのリストを指定しない `PARTITIONS` を、全体更新には `COMPLETE` を使用してください。
- 厳格モードの `INCREMENTAL` 更新が失敗した場合、マテリアライズドビューのデータも内部 Stream の消費オフセットも進みません。
- バージョンの変更を検出できない外部テーブルを使用する通常の非同期マテリアライズドビューでは、`COMPLETE` を指定するか、パーティションを明示的に指定してください。
- `EXPLAIN` も `WITH DRY RUN` も、永続化された状態を変更しません。

## 例

IVM による厳格モードの増分更新：

```sql
REFRESH MATERIALIZED VIEW mv1 INCREMENTAL;
```

増分更新が失敗した場合のフォールバックを許可する：

```sql
REFRESH MATERIALIZED VIEW mv1 INCREMENTAL FALLBACK;
```

次回の増分更新で書き込まれる予定の行を最大 100 行プレビューする：

```sql
REFRESH MATERIALIZED VIEW mv1 INCREMENTAL WITH DRY RUN LIMIT 100;
```

IVM の差分計画全体を確認する：

```sql
EXPLAIN REFRESH MATERIALIZED VIEW mv1 INCREMENTAL WITH ALL STREAMS;
```

Doris に変更されたパーティションを判定させて更新する：

```sql
REFRESH MATERIALIZED VIEW mv1 PARTITIONS FALLBACK;
```

指定したパーティションを更新する：

```sql
REFRESH MATERIALIZED VIEW mv1 PARTITIONS (p_19950801_19950901, p_19950901_19951001);
```

全データの更新を強制する：

```sql
REFRESH MATERIALIZED VIEW mv1 COMPLETE;
```
