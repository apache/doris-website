---
{
    "title": "データエクスポートのベストプラクティス",
    "language": "ja",
    "description": "Doris のデータエクスポートでリソース使用率が適切かどうかを判断する方法を説明します。SELECT INTO OUTFILE と EXPORT の並行処理の調整方法と、エクスポート速度の評価方法を取り上げます。",
    "sidebar_label": "ベストプラクティス",
    "keywords": [
        "Doris データエクスポート",
        "SELECT INTO OUTFILE",
        "EXPORT コマンド",
        "並行エクスポート",
        "エクスポート性能の調整",
        "enable_parallel_outfile",
        "並行度",
        "data_consistency",
        "async_task_consumer_thread_num",
        "エクスポート時の帯域幅のボトルネック"
    ]
}
---

<!-- Knowledge type: Performance tuning / Configuration parameters -->
<!-- Applicable scenarios: Export performance bottleneck analysis / Concurrency tuning / Bandwidth utilization evaluation -->

この記事では、Doris のデータエクスポートについて、リソース使用率が適切かどうかを判断し、並行度などのパラメータを調整してエクスポート効率を高める方法を説明します。次の二つの一般的なエクスポート方法を扱います。

| エクスポート方法       | 適したシナリオ                                                      | 並行処理の制御                                  |
| ---------------------- | ------------------------------------------------------------------- | ----------------------------------------------- |
| `SELECT INTO OUTFILE`  | 単一の SQL クエリ結果を柔軟に指定してエクスポートする場合           | セッション変数 `enable_parallel_outfile`        |
| `EXPORT`               | 大きなテーブルやパーティションを、複数の Outfile タスクに自動分割して一括エクスポートする場合 | `parallelism`、`data_consistency` など |

## SELECT INTO OUTFILE の調整

<!-- Knowledge type: Operating procedure -->

`SELECT INTO OUTFILE` は Writer を使用してデータを並行して書き出します。Writer が多いほどエクスポートの並行度は高くなりますが、生成されるファイルも増えます。

### 1. 並行エクスポートを有効にする

**目的**: `SELECT INTO OUTFILE` の並行度を高めます。

**判断方法**: `SELECT INTO OUTFILE` が返す行数は、並行して動作する Writer の数を表します。返された行が 1 行だけ（Writer が一つだけ）の場合は、並行エクスポートを有効にしてみてください。

**コマンド**:

```sql
SET enable_parallel_outfile = true;
```

**注意事項**:

- 有効にすると、`SELECT INTO OUTFILE` はクエリの並行度と同じ数の Writer を生成します。
- クエリの並行度はセッション変数 `parallel_pipeline_task_num` で制御します。デフォルト値は、単一 BE の CPU コア数の半分です。
- 例: BE が 3 ノードあり、各ノードが 8 コアのクラスターでは、並行エクスポートを有効にすると `4 × 3 = 12` 個の Writer が生成されます。

**制限事項**: `enable_parallel_outfile` を有効にしていても、次のクエリは並行してエクスポートできません。

- `SELECT * FROM table ORDER BY id;` のように、グローバルソートを含むクエリ
- `SELECT SUM(cost) FROM table;` のように、グローバル集計のセマンティクスを持つクエリ

### 2. エクスポート速度を評価する

**目的**: エクスポート速度がディスクまたはネットワークの帯域幅による上限に達しているかを判断します。

**手順**:

1. `SELECT INTO OUTFILE` が返す各行で、Writer の書き込み時間（秒）と速度（KB/s）を確認します。
2. 同じノード上の複数の Writer の速度を合計し、そのノードの書き込み速度を求めます。
3. 求めた速度を、ボトルネックとなる帯域幅と比較します。
    - ローカルへのエクスポート: ディスクの帯域幅と比較します。
    - オブジェクトストレージへのエクスポート: ネットワークの帯域幅と比較します。

実際の速度がボトルネックとなる帯域幅に近ければ、リソースはすでに十分に活用されています。そうでなければ、並行度をさらに調整できます。

## EXPORT の調整

<!-- Knowledge type: Operating procedure / Configuration parameters -->

`EXPORT` コマンドは、基本的に一つのエクスポートジョブを複数の `SELECT INTO OUTFILE` 文に分割して実行します。調整するには、まずこの分割の仕組みを理解する必要があります。

### 1. 返された結果から実行状況を確認する

**コマンド**:

```sql
SHOW EXPORT;
```

返された結果には、二次元配列の構造を持つ JSON 文字列が含まれます。

- **一次元目**: 並行して実行される Export スレッドの数、つまり並行して発行される Outfile 文の数。
- **二次元目**: 一つの Outfile 文の戻り値（複数の Writer の書き込み情報）。

**例**:

```json
[
    [
        {
            "fileNumber": "1",
            "totalRows": "640321",
            "fileSize": "350758307",
            "url": "file:///127.0.0.1/mnt/disk2/ftw/tmp/export/exp_59fd917c43874adc-9b1c3e9cd6e655be_*",
            "writeTime": "17.989",
            "writeSpeed": "19041.66"
        },
        {...},
        {...},
        {...}
    ],
    [
        {
            "fileNumber": "1",
            "totalRows": "646609",
            "fileSize": "354228704",
            "url": "file:///127.0.0.1/mnt/disk2/ftw/tmp/export/exp_c75b9d4b59bf4943-92eb94a7b97e46cb_*",
            "writeTime": "17.249",
            "writeSpeed": "20054.64"
        },
        {...},
        {...},
        {...}
    ]
]
```

**説明**: 上の例では、2 つの Outfile コマンドが発行され、それぞれ 4 つの Writer が並行して書き込んでいます。Export コマンドのプロパティ `parallelism` を使用すると、並行して実行する Outfile コマンドの数、ひいては全体の並行度を制御できます。

### 2. 並行度に影響するパラメータ

<!-- Knowledge type: Configuration parameters -->

Export ジョブ全体の並行度は、次のパラメータで決まります。

| パラメータ                       | 適用範囲        | デフォルト値 | 説明                                                                   |
| -------------------------------- | --------------- | ------------ | ---------------------------------------------------------------------- |
| `parallelism`                    | Export コマンド | -            | Export ジョブを分割できる Outfile コマンドの最大数を制御します         |
| `data_consistency`               | Export コマンド | `partition`  | パーティション内で Outfile コマンドをさらに分割するかを制御します     |
| `async_task_consumer_thread_num` | FE 設定         | `64`         | クラスター全体で同時に実行できる Export Task の総数を制御します。すべての Export Task で共有します |

#### parallelism

単一の Export ジョブを分割できる Outfile コマンドの最大数、つまりジョブ内の並行度の上限を制御します。

#### data_consistency

パーティション内で Outfile コマンドをさらに分割するかを制御します。

- `partition`（デフォルト）: パーティションをそれ以上分割しません。Outfile コマンドの数は、対象のパーティション数以下になります。
- `none`: パーティションをさらに分割して並行度を高めます。ただし、パーティションにデータを書き込んでいる場合、エクスポートの一貫性が損なわれる可能性があります（同じパーティションに対する異なる Outfile コマンドが、異なるバージョンのデータをエクスポートする可能性があります）。

詳しくは、[EXPORT コマンドのマニュアル](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md)を参照してください。

#### async_task_consumer_thread_num

現在のクラスターで同時に実行できる Export Task の数の上限を表す FE 設定パラメータです。デフォルト値は `64` です。

- Export Job は、その並行度に基づいて複数の Export Task に分割されます。
- すべての Export Task がこの上限を共有します。
- クラスターで同時に実行できるエクスポートタスクの数を増やすには、このパラメータを増やして FE ノードを再起動します。

## 調整手順の参考例

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenarios: Export performance bottleneck localization -->

エクスポート性能が期待どおりでない場合は、次の順序で調査します。

1. **並行度を確認する**: 返された結果（`SELECT INTO OUTFILE` の行数、または `SHOW EXPORT` の JSON）から、実際に並行して動作する Writer の数を確認します。
2. **帯域幅の使用状況を評価する**: 単一ノード上の Writer の速度を合計し、ディスクまたはネットワークの帯域幅と比較して、上限に達しているかを判断します。
3. **並行度のパラメータを調整する**:
    - `SELECT INTO OUTFILE`: `enable_parallel_outfile` を有効にし、必要に応じて `parallel_pipeline_task_num` を調整します。
    - `EXPORT`: `parallelism` を調整し、必要に応じて `data_consistency` を `none` に設定します。
4. **クラスター全体の上限を調整する**: クラスターで同時に実行される Export タスクが多すぎて制限を受けている場合は、FE の設定パラメータ `async_task_consumer_thread_num` を増やして FE を再起動します。
