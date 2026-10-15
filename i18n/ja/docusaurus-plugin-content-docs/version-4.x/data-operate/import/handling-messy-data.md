---
{
    "title": "ダーティデータの処理",
    "language": "ja",
    "description": "データインポート時の型変換エラー、フィールド長の超過、精度のオーバーフローに対処する方法。strict_mode と max_filter_ratio を使ってダーティデータを柔軟に制御します。",
    "keywords": [
        "Doris のダーティデータ処理",
        "strict_mode",
        "max_filter_ratio",
        "インポート時のデータ型変換エラー",
        "ダーティデータのフィルタリング",
        "Stream Load のダーティデータ",
        "Broker Load のデータフィルタリング",
        "Routine Load の strict_mode",
        "Insert Into の enable_insert_strict"
    ]
}
---

<!-- Knowledge type: Configuration parameters + Operational steps -->
<!-- Applicable scenarios: Data import / Dirty data governance / Troubleshooting -->

インポート時には、ソース列とターゲット列のデータ型が一致しないことがあります。Doris はインポート中に型変換を行いますが、変換時に次のような問題が発生すると、一部のデータを正しくロードできません。

- フィールドの型が一致しない（例：文字列 `"abc"` を `TinyInt` 列に書き込む）
- フィールドが長すぎる（例：`char(10)` 列に 11 文字を書き込む）
- 精度の不一致または数値のオーバーフロー（例：`10` を `Decimal(1,0)` 列に書き込む）

これらの例外に対処するため、Doris にはインポートを制御する二つの主要なパラメータがあります。

| パラメータ | 機能 | デフォルト値 |
| --- | --- | --- |
| `strict_mode` | 列の型変換に失敗したデータ行を除外するかどうかを制御する | `false` |
| `max_filter_ratio` | 異常データの総データに対する許容比率の上限を設定する | `0` |

> この二つを組み合わせると、「データ品質を厳格に保証する」ことと「少量のダーティデータを許容する」ことの間で柔軟に調整できます。

## ストリクトモード（strict_mode）

<!-- Knowledge type: Configuration parameter description -->

ストリクトモード（`strict_mode`）の主な役割は、インポート中に**列の型変換に失敗した**データ行を除外することです。

### 列の型変換に失敗した場合のフィルタリング方針

ストリクトモードの設定によって、処理方法が異なります。

- **ストリクトモードが無効な場合**：変換に失敗したフィールドを `NULL` に設定し、その `NULL` を含む異常なデータ行も正常なデータ行とともにインポートします。
- **ストリクトモードが有効な場合**：変換に失敗したデータ行を除外し、正常なデータ行だけをインポートします。ここでいう「変換失敗」とは、元のデータが `NULL` ではないのに、列の型変換後の結果が `NULL` になることです。関数の計算によって生じた `NULL` は、ここでいう列の型変換には含まれません。
- **NULL 値の扱い**：正常なデータ行にも異常なデータ行にも `NULL` が含まれる場合があります。ターゲット列が `NULL` を許可しない場合、`NULL` を含むデータ行は除外されます。

以下の三つの列型の例で、ストリクトモードの有効時と無効時の動作の違いを示します。

#### 例 1：TinyInt 型の列

| ソースデータの種類 | ソースデータの例 | TinyInt への変換後の値 | ストリクトモード | 結果 |
| ------------ | ---------------- | --------------------- | ------------ | ---------------- |
| NULL 値 | `\N` | `NULL` | 有効・無効のどちらでも | `NULL` |
| NULL 以外の値 | `"abc"` または `2000` | `NULL` | 有効 | 無効な値（除外） |
| NULL 以外の値 | `"abc"` または `2000` | `NULL` | 無効 | `NULL` |
| NULL 以外の値 | `1` | `1` | 有効・無効のどちらでも | 正常にインポート |

:::tip
1. この表の列は NULL 値のインポートを許可しています。
2. `TinyInt` に変換すると、`abc` と `2000` は型または精度の問題によって `NULL` になります。ストリクトモードが有効な場合、このようなデータは除外されます。無効な場合は `NULL` がインポートされます。
:::

#### 例 2：Decimal(1,0) 型の列

| ソースデータの種類 | ソースデータの例 | Decimal への変換後の値 | ストリクトモード | 結果 |
| ------------ | ------------ | --------------------- | ------------ | ---------------- |
| NULL 値 | `\N` | `NULL` | 有効・無効のどちらでも | `NULL` |
| NULL 以外の値 | `aaa` | `NULL` | 有効 | 無効な値（除外） |
| NULL 以外の値 | `aaa` | `NULL` | 無効 | `NULL` |
| NULL 以外の値 | `10` | `NULL`（オーバーフロー） | 有効 | 除外 |
| NULL 以外の値 | `10` | `NULL`（オーバーフロー） | 無効 | `NULL` |

:::tip
1. この表の列は NULL 値のインポートを許可しています。
2. `Decimal` に変換すると、`aaa` は型の問題によって `NULL` になります。ストリクトモードが有効な場合、このようなデータは除外されます。無効な場合は `NULL` がインポートされます。
3. `10` は `Decimal(1, 0)` の範囲を超えるため、`NULL` に変換されます。ストリクトモードが有効な場合は除外され、無効な場合は `NULL` がインポートされます。
:::

#### 例 3：char(10) 型の列

| ソースデータの種類 | ソースデータの例 | char(10) への変換後の値 | ストリクトモード | 結果 |
| ------------ | -------------- | ---------------------- | -------- | ------------------- |
| NULL 値 | `\N` | `NULL` | 有効・無効のどちらでも | `NULL` |
| NULL 以外の値 | `a1234567890` | `a1234567890` | 有効 | 長すぎるため除外 |
| NULL 以外の値 | `a1234567890` | `a1234567890` | 無効 | `a123456789`（切り詰め） |

:::tip
この表の列は NULL 値のインポートを許可しています。
:::

### ストリクトモードの有効化

`strict_mode` のデフォルト値は `false` です。インポート方法ごとに、ストリクトモードを有効にする例を示します。

**Stream Load**

```shell
curl --location-trusted -u user:passwd \
    -H "strict_mode: true" \
    -T data.txt \
    http://host:port/api/example_db/test_table/_stream_load
```

**Broker Load**

```sql
LOAD LABEL example_db.label_1
(
    DATA INFILE("s3://bucket/data.txt")
    INTO TABLE test_table
)
WITH S3 (...)
PROPERTIES
(
    "strict_mode" = "true"
);
```

**Routine Load**

```sql
CREATE ROUTINE LOAD example_db.job1 ON test_table
PROPERTIES
(
    "strict_mode" = "true"
)
FROM KAFKA (...);
```

**MySQL Load**

```sql
LOAD DATA LOCAL INFILE 'data.txt'
INTO TABLE test_table
PROPERTIES
(
    "strict_mode" = "true"
);
```

**Insert Into**

```sql
SET enable_insert_strict = true;
INSERT INTO test_table ...;
```

## 最大フィルタリング比率（max_filter_ratio）

<!-- Knowledge type: Configuration parameter description -->

最大フィルタリング比率（`max_filter_ratio`）は、インポート中に許容する異常データの総データに対する比率の上限を定める、重要なインポート制御パラメータです。

- 実際のフィルタリング比率が設定された上限を**下回る**場合、異常データを無視してインポートジョブを続行します。
- 実際のフィルタリング比率が設定された上限を**超える**場合、インポートジョブは失敗します。

### フィルタリング比率の計算方法

インポート時、データ行は次の三種類に分けられます。

| 種類 | 説明 |
| --- | --- |
| **除外された行（Filtered Rows）** | データ品質の問題によって除外された行です。データ品質の問題には、型エラー、精度エラー、文字列長の超過、ファイル内の列数の不一致、その他のデータ形式の問題のほか、対応するパーティションが存在しないために除外されるデータ行も含まれます。 |
| **選択されなかった行（Unselected Rows）** | [事前フィルタリング](./load-data-convert.md#pre-filtering)または[事後フィルタリング](./load-data-convert.md#post-filtering)の条件によって除外されたデータ行です。 |
| **ロードされた行（Loaded Rows）** | 正常にインポートされたデータ行です。 |

フィルタリング比率は次のように計算します。

```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```

つまり、`Unselected Rows`（選択されなかった行）はフィルタリング比率の計算に含まれません。

### 最大フィルタリング比率の設定

`max_filter_ratio` のデフォルト値は `0` で、異常データを許容しないことを意味します。インポート方法ごとの設定例を示します。

**Stream Load**

```shell
curl --location-trusted -u user:passwd \
    -H "max_filter_ratio: 0.1" \
    -T data.txt \
    http://host:port/api/example_db/my_table/_stream_load
```

**Broker Load**

```sql
LOAD LABEL example_db.label_1
(
    DATA INFILE("s3://bucket/data.txt")
    INTO TABLE test_table
)
WITH S3 (...)
PROPERTIES
(
    "max_filter_ratio" = "0.1"
);
```

**Routine Load**

```sql
CREATE ROUTINE LOAD example_db.job1 ON test_table
PROPERTIES
(
    "max_filter_ratio" = "0.1"
)
FROM KAFKA (...);
```

**MySQL Load**

```sql
LOAD DATA LOCAL INFILE 'data.txt'
INTO TABLE test_table
PROPERTIES
(
    "max_filter_ratio" = "0.1"
);
```

**Insert Into**

```sql
SET insert_max_filter_ratio = 0.1;
INSERT INTO test_table FROM S3/HDFS/LOCAL();
```

:::tip
Insert Into 文では、`insert_max_filter_ratio` は `enable_insert_strict = false` の場合にのみ有効です。デフォルト値は `1.0` で、すべての異常データを除外することが許容されます。
:::

## FAQ

<!-- Knowledge type: FAQ -->

**Q1：`strict_mode` と `max_filter_ratio` はどのように併用すればよいですか？**

- **厳格なデータ品質が必要な場合**：`strict_mode = true` を有効にし、`max_filter_ratio` を小さい値（`0` など）に設定します。変換に失敗すると、インポートが失敗します。
- **少量のダーティデータを許容したい場合**：`strict_mode` を無効にする（またはデフォルト値のままにする）とともに、`max_filter_ratio` を許容できる比率（`0.1` など）に設定します。異常データは除外され、インポート全体には影響しません。

**Q2：関数の計算によって生じた `NULL` 値は、ストリクトモードで除外されますか？**

いいえ。ストリクトモードの対象は、「元のデータが NULL ではないのに、列の型変換後の結果が NULL になる」場合だけです。関数の計算によって生じた `NULL` は対象外です。

**Q3：事前フィルタリングまたは事後フィルタリングの条件で除外されたデータ行は、`max_filter_ratio` の計算に含まれますか？**

いいえ。`Unselected Rows`（選択されなかった行）はフィルタリング比率の計算に含まれません。この比率は `Filtered Rows`（除外された行）と `Loaded Rows`（ロードされた行）だけに基づきます。

**Q4：Insert Into における `enable_insert_strict` と `insert_max_filter_ratio` の関係は何ですか？**

`insert_max_filter_ratio` は `enable_insert_strict = false` の場合にのみ有効です。デフォルト値は `1.0` で、すべての異常データを除外することが許容されます。

**Q5：`char(10)` 列に長すぎるデータが入力されたとき、ストリクトモードの有効時と無効時で動作はどう違いますか？**

- ストリクトモードが有効な場合：長すぎるデータは除外されます。
- ストリクトモードが無効な場合：長すぎるデータは切り詰められてからインポートされます（例：`a1234567890` は `a123456789` に切り詰められます）。
