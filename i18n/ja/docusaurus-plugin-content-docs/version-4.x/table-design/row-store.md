---
{
    "title": "行ストア",
    "language": "ja",
    "description": "Doris の行ストアは、列指向ストレージに行形式のデータを追加し、幅の広いテーブルに対するポイントクエリで発生する複数回の IO を 1 回にまとめることで、IOPS とクエリのレイテンシーを大幅に削減します。"
}
---

<!-- Knowledge type: Feature introduction / Configuration parameters -->
<!-- Applicable scenarios: Wide-table point query / TOPN query performance tuning -->

**行ストア（Row Store）**は、列指向ストレージに加え、各行のコンパクトなバイナリ形式のコピーを保存する Doris の機能です。ポイントクエリでは、「列ごとに一回の IO」を「行全体を読み取る一回の IO」に変えられます。この機能は Doris 2.0.0 以降でサポートされています。

デフォルトでは、Doris は各列のデータを連続して保存する列指向ストレージを使用します。列指向ストレージは、必要な列だけを読み取ればよいため、集約、フィルタリング、ソートなどの分析クエリに適しています。一方、`SELECT *` などのポイントクエリではすべての列を読み取る必要があり、列ごとに一回の IO が発生します。列数の多い幅の広いテーブル（たとえば数百列のテーブル）では、IOPS がボトルネックになります。

行ストアを有効にすると、システムは書き込み時に追加の列を保存し、一行のすべての列をコンパクトなバイナリ形式に連結します。ポイントクエリでは一回の IO で行全体のデータを読み取れるため、IOPS が大幅に減り、クエリのレイテンシーが改善します。

## 適用シナリオ

行ストアは、主に次の二種類のクエリを対象としています。有効にするかどうかは、以下の表を参考に判断してください。

| シナリオ | 典型的なクエリパターン | 必要なテーブルモデル | 推奨 |
|------|-------------|-----------|---------|
| 同時実行数の多い主キーのポイントクエリ | `SELECT ... FROM t WHERE pk1 = ? AND pk2 = ?` | Unique Key MOW テーブル | 推奨 |
| 幅の広いテーブルに対する TOPN クエリ | `SELECT * FROM t [WHERE ...] ORDER BY ... LIMIT N` | Duplicate テーブル / Unique Key MOW テーブル | 推奨 |
| 分析クエリ | 少数の列に対する集約や複雑なフィルタリングなど | — | 非推奨（列指向ストレージで十分） |

以降のセクションでは、各シナリオの適用条件、テーブルの作成方法、クエリ例を説明します。

## シナリオ 1：同時実行数の多い主キーのポイントクエリ

Unique Key MOW テーブルで、主キーの全列を指定して特定の行を検索するクエリが同時に多数実行される場合に適しています。条件を満たすと、クエリは Short-Circuit パスを通り、通常の実行パイプラインを経由しません。

### 適用条件

次の条件を**すべて同時に**満たす必要があります。

1. テーブルが Unique Key MOW テーブルであること（`"enable_unique_key_merge_on_write" = "true"`）。
2. `"store_row_column" = "true"` または `"row_store_columns" = "..."` によって行ストアが有効になっていること。
3. `WHERE` 句に、**主キーの全列に対する等価条件**が `AND` で結合されていること。

### テーブル作成例

次の例では、8 列のテーブルを作成し、そのうち 5 列だけで行ストアを有効にします。また、ポイントクエリの性能を最大化するため、`page_size` を 4 KB に設定します。

```sql
CREATE TABLE `tbl_point_query` (
    `k` int(11) NULL,
    `v1` decimal(27, 9) NULL,
    `v2` varchar(30) NULL,
    `v3` varchar(30) NULL,
    `v4` date NULL,
    `v5` datetime NULL,
    `v6` float NULL,
    `v7` datev2 NULL
) ENGINE=OLAP
UNIQUE KEY(`k`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "light_schema_change" = "true",
    "row_store_columns" = "k,v1,v3,v5,v7",
    "row_store_page_size" = "4096"
);
```

### クエリ例

```sql
-- Query all columns
SELECT * FROM tbl_point_query WHERE k = 100;

-- Query a subset of columns
SELECT k, v1, v3, v5, v7 FROM tbl_point_query WHERE k = 100;
```

**一部の列だけを行ストアに保存した場合：** 行ストアに一部の列（たとえば `v1`）だけが含まれ、クエリが行ストアに含まれない列（たとえば `v2`）を要求すると、Doris は不足する列を列指向ストレージから読み取ります。行ストアに含まれる列は効率的に読み取り、残りの列は通常の列指向 IO で読み取ります。

### 確認方法

クエリに対して `EXPLAIN` を実行します。出力に `SHORT-CIRCUIT` マーカーが含まれている必要があります。詳細は[同時実行数の多いポイントクエリ](../query-acceleration/high-concurrent-point-query)を参照してください。

## シナリオ 2：TOPN 遅延実体化クエリ

Duplicate テーブルまたは Unique Key MOW テーブルで、ソート後に少数の行を取得する、幅の広いテーブルに対する `SELECT *` クエリに適しています。条件を満たすと、クエリは Fetch Row Store パスを通り、TOPN の二段階最適化と組み合わせて、実際に該当する行だけを取得します。

### 適用条件

次の条件を**すべて同時に**満たす必要があります。

1. テーブルが Duplicate テーブル、または Unique Key MOW テーブルであること（`"enable_unique_key_merge_on_write" = "true"`）。
2. **すべての列**で行ストアが有効になっていること（`"store_row_column" = "true"`）。
3. クエリが `SELECT * FROM tbl [WHERE ...] ORDER BY ... LIMIT N` のパターンに一致すること。
4. `SELECT *` を使用すること。特定の列を選択するクエリはサポートされません。
5. TOPN 遅延実体化の最適化が適用されること。詳細は[TOPN クエリの最適化](../query-acceleration/optimization-technology-principle/topn-optimization)を参照してください。

### テーブル作成例

```sql
CREATE TABLE `tbl_duplicate` (
    `k` int(11) NULL,
    `v1` string NULL
) ENGINE=OLAP
DUPLICATE KEY(`k`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "light_schema_change" = "true",
    "store_row_column" = "true",
    "row_store_page_size" = "4096"
);
```

:::note
Duplicate テーブルでは `"store_row_column" = "true"` を設定する必要があります。`row_store_columns` で列の一部だけを指定することはできず、すべての列が行ストアに保存されます。
:::

### クエリ例

```sql
SELECT * FROM tbl_duplicate WHERE k < 10 ORDER BY k LIMIT 10;
```

### 確認方法

クエリに対して `EXPLAIN` を実行します。出力に `FETCH ROW STORE` マーカーと `OPT TWO PHASE` マーカーの両方が含まれている必要があります。

## 設定パラメータ {#configuration-parameters}

`PROPERTIES`（`CREATE TABLE` 文内）に次のパラメータを設定します。

| パラメータ | デフォルト値 | 対応バージョン | 説明 |
|------|--------|---------|------|
| `store_row_column` | `false` | 2.0+ | `true` に設定すると、**すべての列**で行ストアが有効になります。 |
| `row_store_columns` | すべての列 | 3.0+ | `"col1,col2,..."` の形式で、**指定した列だけ**で行ストアを有効にします。このパラメータを設定すると、`store_row_column` も暗黙的に有効になります。すべての列を行ストアに保存する場合に比べて、ストレージの使用量を大幅に減らせます。 |
| `row_store_page_size` | `16384`（16 KB） | 2.0+ | 行ストアのページサイズ（バイト単位）。ページは IO の最小単位であり、一行だけを読み取る場合でも一ページ分の IO が発生します。 |

### `row_store_page_size` の調整指針

`row_store_page_size` は、ポイントクエリの性能とストレージの使用量のトレードオフに直接影響します。

| 最適化の目的 | 推奨値 | トレードオフ |
|---------|--------|------|
| ポイントクエリの性能を最大化 | 4096（4 KB）以下 | ストレージの使用量が増加 |
| バランスを取る（デフォルト） | 16384（16 KB） | — |
| ストレージの使用量を最小化 | 65536（64 KB）以上 | ポイントクエリのレイテンシーが増加 |

## 注意事項

1. **ストレージの使用量：** 行ストアを有効にすると、ディスク使用量が増加します。データの特性にもよりますが、追加で必要になるストレージ容量は通常、元のテーブルサイズの 2～10 倍です。実際のデータでテストし、影響を評価してください。
2. **`page_size` がストレージに与える影響：** `row_store_page_size` を小さくするとポイントクエリの性能が向上しますが、ストレージの使用量は増加します。調整指針については、[設定パラメータ](#configuration-parameters)のセクションを参照してください。
3. **ALTER は非対応：** `store_row_column` と `row_store_columns` のプロパティは、`ALTER TABLE` では変更できません。
