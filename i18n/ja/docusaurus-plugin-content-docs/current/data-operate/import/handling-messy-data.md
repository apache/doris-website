---
{
    "title": "異常データの処理",
    "language": "ja",
    "description": "データのインポート時に、型変換の失敗、フィールド長の超過、精度のオーバーフローをどう処理するか。strict_mode と max_filter_ratio を使って異常データを柔軟に制御します。",
    "keywords": [
        "Doris 異常データの処理",
        "strict_mode",
        "max_filter_ratio",
        "インポート時のデータ型変換の失敗",
        "異常データのフィルタリング",
        "Stream Load 異常データ",
        "Broker Load データのフィルタリング",
        "Routine Load strict_mode",
        "Insert Into enable_insert_strict"
    ]
}
---

<!-- Knowledge type: Configuration parameters + Operational steps -->
<!-- Applicable scenarios: Data import / Dirty data governance / Troubleshooting -->

インポート時には、ソース列とターゲット列のデータ型が一致しないことがあります。Doris はインポート時に型を変換しますが、その過程で次の問題が発生すると、一部のデータを正しくロードできません。

- フィールドの型の不一致（例：文字列 `"abc"` を `TinyInt` 列に書き込む）
- フィールド長の超過（例：11 文字を `char(10)` 列に書き込む）
- 精度の不一致や数値のオーバーフロー（例：`10` を `Decimal(1,0)` 列に書き込む）

このような例外を処理するため、Doris はインポートを制御する主要なパラメータを二つ提供しています。

| パラメータ | 役割 | デフォルト値 |
| --- | --- | --- |
| `strict_mode` | 列の型変換に失敗したデータ行をフィルタリングするかどうかを制御する | `false` |
| `max_filter_ratio` | 異常データの割合について、許容する上限を設定する | `0` |

> この二つのパラメータを組み合わせることで、「データ品質を厳格に保証する」か「少量の異常データを許容する」かを柔軟に調整できます。

## 厳格モード（strict_mode） {#strict-mode-strict_mode}

<!-- Knowledge type: Configuration parameter description -->

厳格モード（`strict_mode`）の主な役割は、インポート時に**列の型変換に失敗した**データ行をフィルタリングすることです。

### 列の型変換に失敗した場合のフィルタリング方法 {#filtering-strategy-for-column-type-conversion-failures}

厳格モードの設定に応じて、システムは次のように処理します。

- **厳格モードが無効**：変換に失敗したフィールドは `NULL` になり、その `NULL` を含む異常なデータ行も、正常なデータ行とともにインポートされます。
- **厳格モードが有効**：変換に失敗したデータ行はフィルタリングされ、正常なデータ行のみがインポートされます。ここでいう「変換の失敗」とは、元のデータが `NULL` ではないのに、列の型変換後に `NULL` になることを指します。関数の計算結果として生じた `NULL` は、ここでいう列の型変換には含まれません。
- **NULL 値の処理**：正常なデータ行にも異常なデータ行にも `NULL` が含まれる場合があります。ターゲット列が `NULL` を許可しない場合、`NULL` を含むデータ行はフィルタリングされます。

以下の三つの代表的な列型の例で、厳格モードの有効時と無効時の動作の違いを示します。

#### 例 1：TinyInt 型の列 {#example-1-column-type-tinyint}

| ソースデータの種類 | ソースデータの例 | TinyInt への変換後の値 | 厳格モード | 結果 |
| ------------ | ---------------- | --------------------- | ------------ | ---------------- |
| NULL 値 | `\N` | `NULL` | 有効・無効のいずれも | `NULL` |
| NULL 以外の値 | `"abc"` または `2000` | `NULL` | 有効 | 無効な値（フィルタリングされる） |
| NULL 以外の値 | `"abc"` または `2000` | `NULL` | 無効 | `NULL` |
| NULL 以外の値 | `1` | `1` | 有効・無効のいずれも | 正しくインポートされる |

:::tip
1. 表の列は NULL 値のインポートを許可しています。
2. `TinyInt` に変換すると、`abc` と `2000` は型または精度の問題によって `NULL` になります。厳格モードが有効な場合、これらのデータはフィルタリングされます。無効な場合は `NULL` がインポートされます。
:::

#### 例 2：Decimal(1,0) 型の列 {#example-2-column-type-decimal10}

| ソースデータの種類 | ソースデータの例 | Decimal への変換後の値 | 厳格モード | 結果 |
| ------------ | ------------ | --------------------- | ------------ | ---------------- |
| NULL 値 | `\N` | `NULL` | 有効・無効のいずれも | `NULL` |
| NULL 以外の値 | `aaa` | `NULL` | 有効 | 無効な値（フィルタリングされる） |
| NULL 以外の値 | `aaa` | `NULL` | 無効 | `NULL` |
| NULL 以外の値 | `10` | `NULL`（オーバーフロー） | 有効 | フィルタリングされる |
| NULL 以外の値 | `10` | `NULL`（オーバーフロー） | 無効 | `NULL` |

:::tip
1. 表の列は NULL 値のインポートを許可しています。
2. `Decimal` に変換すると、`aaa` は型の問題によって `NULL` になります。厳格モードが有効な場合、このデータはフィルタリングされます。無効な場合は `NULL` がインポートされます。
3. `10` は `Decimal(1, 0)` の範囲を超えるため、`NULL` に変換されます。厳格モードが有効な場合はフィルタリングされ、無効な場合は `NULL` がインポートされます。
:::

#### 例 3：char(10) 型の列 {#example-3-column-type-char10}

| ソースデータの種類 | ソースデータの例 | char(10) への変換後の値 | 厳格モード | 結果 |
| ------------ | -------------- | ---------------------- | -------- | ------------------- |
| NULL 値 | `\N` | `NULL` | 有効・無効のいずれも | `NULL` |
| NULL 以外の値 | `a1234567890` | `a1234567890` | 有効 | 長さの上限を超えるため、フィルタリングされる |
| NULL 以外の値 | `a1234567890` | `a1234567890` | 無効 | `a123456789`（切り詰められる） |

:::tip
表の列は NULL 値のインポートを許可しています。
:::

### 厳格モードの有効化 {#enabling-strict-mode}

`strict_mode` のデフォルト値は `false` です。各インポート方法で厳格モードを有効にする例を示します。

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

## 最大フィルタリング比率（max_filter_ratio） {#maximum-filter-ratio-max_filter_ratio}

<!-- Knowledge type: Configuration parameter description -->

最大フィルタリング比率（`max_filter_ratio`）は、インポート時に異常データが全データに占める割合について、許容する上限を定める重要な制御パラメータです。

- 実際のフィルタリング比率が設定した上限を**下回る**場合、インポートジョブは続行され、異常データは無視されます。
- 実際のフィルタリング比率が設定した上限を**超える**場合、インポートジョブは失敗します。

### フィルタリング比率の計算方法 {#how-the-filter-ratio-is-calculated}

インポート時、データ行は次の三つに分類されます。

| 区分 | 説明 |
| --- | --- |
| **Filtered Rows（フィルタリングされた行）** | データ品質の問題によってフィルタリングされた行。型や精度のエラー、文字列長の超過、ファイル内の列数の不一致などのデータ形式の問題に加え、対応するパーティションが存在しないためにフィルタリングされた行も含みます。 |
| **Unselected Rows（選択されなかった行）** | [事前フィルタリング](./load-data-convert.md#pre-filtering)または[事後フィルタリング](./load-data-convert.md#post-filtering)の条件によって除外されたデータ行。 |
| **Loaded Rows（ロードされた行）** | 正しくインポートされたデータ行。 |

フィルタリング比率は次の式で計算します。

```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```

つまり、`Unselected Rows` はフィルタリング比率の計算に含まれません。

### 最大フィルタリング比率の設定 {#setting-the-maximum-filter-ratio}

`max_filter_ratio` のデフォルト値は `0` で、異常データを許容しません。各インポート方法での設定例を示します。

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
CREATE TABLE insert_filter_ratio_example (id INT NOT NULL)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

SET enable_insert_strict = false;
SET insert_max_filter_ratio = 0.5;
INSERT INTO insert_filter_ratio_example VALUES (1), (NULL);
SELECT * FROM insert_filter_ratio_example;
```

```text
+------+
| id   |
+------+
|    1 |
+------+
```

`id` は NULL を許可しないため、二つ目の行はフィルタリングされます。フィルタリング比率は `1 / (1 + 1) = 0.5` で、しきい値を超えないため、ロードは成功します。

:::tip
INSERT INTO 文では、`insert_max_filter_ratio` は `enable_insert_strict = false` の場合にのみ有効で、デフォルト値は `1.0` です。VALUES と SELECT に適用され、Doris テーブル、外部テーブル、ファイル TVF も対象です。実際のフィルタリング比率がしきい値を超えると INSERT は失敗しますが、しきい値と等しい場合は許可されます。このパラメータは、その他の実行エラーを抑制しません。
:::

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: `strict_mode` と `max_filter_ratio` はどのように併用すればよいですか？**

- **厳格なデータ品質**が必要な場合：`strict_mode = true` を有効にし、`max_filter_ratio` を小さい値（`0` など）に設定します。変換に失敗すると、インポートは失敗します。
- **少量の異常データを許容**したい場合：`strict_mode` を無効にするかデフォルト値のままにし、`max_filter_ratio` を許容できる比率（`0.1` など）に設定します。異常データはフィルタリングされ、インポート全体には影響しません。

**Q2: 関数の計算結果として生じた `NULL` は、厳格モードでフィルタリングされますか？**

いいえ。厳格モードの対象は、「元のデータは NULL ではないが、列の型変換後に NULL になる」場合だけです。関数の計算結果として生じた `NULL` は該当しません。

**Q3: 事前フィルタリングまたは事後フィルタリングの条件で除外されたデータ行は、`max_filter_ratio` の計算に含まれますか？**

いいえ。`Unselected Rows` はフィルタリング比率の計算に含まれません。計算には `Filtered Rows` と `Loaded Rows` のみを使用します。

**Q4: Insert Into では、`enable_insert_strict` と `insert_max_filter_ratio` はどのような関係にありますか？**

`insert_max_filter_ratio` は `enable_insert_strict = false` の場合にのみ有効です。デフォルト値は `1.0` で、異常データをすべてフィルタリングすることを許容します。

**Q5: `char(10)` 列に長さの上限を超えるデータを入力した場合、厳格モードの有効時と無効時で動作はどう異なりますか？**

- 厳格モードが有効：長さの上限を超えるデータはフィルタリングされます。
- 厳格モードが無効：長さの上限を超えるデータは切り詰められてからインポートされます（例：`a1234567890` は `a123456789` に切り詰められます）。
