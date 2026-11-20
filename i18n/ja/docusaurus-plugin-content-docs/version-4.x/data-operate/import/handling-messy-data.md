---
{
    "title": "異常データの処理",
    "language": "ja",
    "description": "データのインポート時に発生する型変換の失敗、フィールド長の超過、精度のオーバーフローへの対処方法。strict_mode と max_filter_ratio を使用して異常データを柔軟に制御します。",
    "keywords": [
        "Doris の異常データ処理",
        "strict_mode",
        "max_filter_ratio",
        "インポート時のデータ型変換失敗",
        "異常データのフィルタリング",
        "Stream Load の異常データ",
        "Broker Load のデータフィルタリング",
        "Routine Load strict_mode",
        "Insert Into enable_insert_strict"
    ]
}
---

<!-- Knowledge type: Configuration parameters + Operational steps -->
<!-- Applicable scenarios: Data import / Dirty data governance / Troubleshooting -->

インポート時には、ソース列とターゲット列のデータ型が一致しない場合があります。Doris はインポート時に型変換を行いますが、その過程で次の問題が発生し、一部のデータを正しくロードできないことがあります。

- フィールドの型の不一致（たとえば、文字列 `"abc"` を `TinyInt` 列に書き込む場合）
- フィールド長の超過（たとえば、11 文字を `char(10)` 列に書き込む場合）
- 精度の不一致や数値のオーバーフロー（たとえば、`10` を `Decimal(1,0)` 列に書き込む場合）

このような例外に対処するため、Doris にはインポートを制御する主なパラメータが二つあります。

| パラメータ | 機能 | デフォルト値 |
| --- | --- | --- |
| `strict_mode` | 列の型変換に失敗したデータ行をフィルタリングするかどうかを制御する | `false` |
| `max_filter_ratio` | データ全体に占める異常データの許容上限比率を設定する | `0` |

> これらのパラメータを組み合わせることで、「データ品質を厳格に保証する」か「少量の異常データを許容する」かを柔軟に調整できます。

## 厳格モード（strict_mode） {#strict-mode-strict_mode}

<!-- Knowledge type: Configuration parameter description -->

厳格モード（`strict_mode`）の主な役割は、インポート時に**列の型変換に失敗した**データ行をフィルタリングすることです。

### 列の型変換に失敗した場合のフィルタリング方法 {#filtering-strategy-for-column-type-conversion-failures}

厳格モードの設定に応じて、次のように処理されます。

- **厳格モードが無効の場合**：変換に失敗したフィールドは `NULL` に設定され、その `NULL` を含む異常データ行も正常なデータ行とともにインポートされます。
- **厳格モードが有効の場合**：変換に失敗したデータ行はフィルタリングされ、正常なデータ行だけがインポートされます。ここでいう「変換の失敗」とは、元のデータが `NULL` ではないのに、列の型変換後の結果が `NULL` になることを指します。関数の計算結果として生じた `NULL` は、ここでいう列の型変換には含まれません。
- **NULL 値の扱い**：正常なデータ行にも異常なデータ行にも `NULL` が含まれる場合があります。ターゲット列で `NULL` が許可されていない場合、`NULL` を含むデータ行はフィルタリングされます。

次の三つの列の型を例に、厳格モードの有効時と無効時の動作の違いを示します。

#### 例 1：TinyInt 型の列 {#example-1-column-type-tinyint}

| ソースデータの種類 | ソースデータの例 | TinyInt への変換後の値 | 厳格モード | 結果 |
| ------------ | ---------------- | --------------------- | ------------ | ---------------- |
| NULL 値 | `\N` | `NULL` | 有効・無効のいずれも | `NULL` |
| NULL 以外の値 | `"abc"` または `2000` | `NULL` | 有効 | 無効な値（フィルタリングされる） |
| NULL 以外の値 | `"abc"` または `2000` | `NULL` | 無効 | `NULL` |
| NULL 以外の値 | `1` | `1` | 有効・無効のいずれも | 正常にインポートされる |

:::tip
1. この表の列には NULL 値をインポートできます。
2. `TinyInt` に変換すると、`abc` と `2000` は型または精度の問題により `NULL` になります。厳格モードが有効な場合、このようなデータはフィルタリングされます。無効な場合は `NULL` がインポートされます。
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
1. この表の列には NULL 値をインポートできます。
2. `Decimal` に変換すると、`aaa` は型の問題により `NULL` になります。厳格モードが有効な場合、このようなデータはフィルタリングされます。無効な場合は `NULL` がインポートされます。
3. `10` は `Decimal(1, 0)` の範囲を超えるため、`NULL` に変換されます。厳格モードが有効な場合はフィルタリングされ、無効な場合は `NULL` がインポートされます。
:::

#### 例 3：char(10) 型の列 {#example-3-column-type-char10}

| ソースデータの種類 | ソースデータの例 | char(10) への変換後の値 | 厳格モード | 結果 |
| ------------ | -------------- | ---------------------- | -------- | ------------------- |
| NULL 値 | `\N` | `NULL` | 有効・無効のいずれも | `NULL` |
| NULL 以外の値 | `a1234567890` | `a1234567890` | 有効 | 長すぎるためフィルタリングされる |
| NULL 以外の値 | `a1234567890` | `a1234567890` | 無効 | `a123456789`（切り詰められる） |

:::tip
この表の列には NULL 値をインポートできます。
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

最大フィルタリング比率（`max_filter_ratio`）は、インポート時にデータ全体に占める異常データをどの程度まで許容するかを定める重要なパラメータです。

- 実際のフィルタリング比率が設定された最大フィルタリング比率より**低い**場合、インポートジョブは続行され、異常データは無視されます。
- 実際のフィルタリング比率が設定された最大フィルタリング比率を**超える**場合、インポートジョブは失敗します。

### フィルタリング比率の計算方法 {#how-the-filter-ratio-is-calculated}

インポート時、データ行は次の三つに分類されます。

| 分類 | 説明 |
| --- | --- |
| **Filtered Rows（フィルタリングされた行）** | データ品質の問題によりフィルタリングされた行。データ品質の問題には、型や精度のエラー、文字列長の超過、ファイル内の列数の不一致などのデータ形式の問題に加え、対応するパーティションが存在しないためにフィルタリングされたデータ行も含まれます。 |
| **Unselected Rows（選択されなかった行）** | [プレフィルタリング](./load-data-convert.md#pre-filtering)または[ポストフィルタリング](./load-data-convert.md#post-filtering)の条件によってフィルタリングされたデータ行。 |
| **Loaded Rows（ロードされた行）** | 正常にインポートされたデータ行。 |

フィルタリング比率は次の式で計算します。

```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```

つまり、`Unselected Rows` はフィルタリング比率の計算に含まれません。

### 最大フィルタリング比率の設定 {#setting-the-maximum-filter-ratio}

`max_filter_ratio` のデフォルト値は `0` で、異常データを一切許容しません。各インポート方法での設定例を示します。

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

`id` は NULL を許可しないため、二行目がフィルタリングされます。フィルタリング比率は `1 / (1 + 1) = 0.5` で、しきい値を超えないため、データロードは成功します。

:::tip
INSERT INTO 文では、`insert_max_filter_ratio` は `enable_insert_strict = false` の場合にのみ有効で、デフォルト値は `1.0` です。Doris のテーブル、外部テーブル、ファイル TVF を含む VALUES と SELECT に適用されます。実際のフィルタリング比率がしきい値を超えると INSERT は失敗します。しきい値と等しい場合は許容されます。このパラメータによって、ほかの実行エラーが抑制されることはありません。
:::

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

**Q1：`strict_mode` と `max_filter_ratio` はどのように組み合わせて使用しますか？**

- **厳格なデータ品質**が必要な場合：`strict_mode = true` を有効にし、`max_filter_ratio` を小さい値（`0` など）に設定します。変換に一件でも失敗すると、インポートは失敗します。
- **少量の異常データを許容**したい場合：`strict_mode` を無効にするか、デフォルト値のままにし、`max_filter_ratio` を許容できる比率（`0.1` など）に設定します。異常データはフィルタリングされ、インポート全体には影響しません。

**Q2：関数の計算結果として生じた `NULL` は厳格モードでフィルタリングされますか？**

いいえ。厳格モードの対象は、元のデータが NULL ではないのに、列の型変換後の結果が NULL になる場合だけです。関数の計算結果として生じた `NULL` は対象外です。

**Q3：プレフィルタリングまたはポストフィルタリングの条件によって除外されたデータ行は、`max_filter_ratio` の計算に含まれますか？**

いいえ。`Unselected Rows` はフィルタリング比率の計算に含まれません。計算に使用するのは `Filtered Rows` と `Loaded Rows` だけです。

**Q4：Insert Into では、`enable_insert_strict` と `insert_max_filter_ratio` はどのような関係にありますか？**

`insert_max_filter_ratio` は `enable_insert_strict = false` の場合にのみ有効です。デフォルト値は `1.0` で、すべての異常データをフィルタリングすることを許容します。

**Q5：`char(10)` 列に長すぎるデータが入力された場合、厳格モードの有効時と無効時で動作はどう違いますか？**

- 厳格モードが有効な場合：長すぎるデータはフィルタリングされます。
- 厳格モードが無効な場合：長すぎるデータは切り詰めてからインポートされます（たとえば、`a1234567890` は `a123456789` に切り詰められます）。
