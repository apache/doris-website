---
{
    "title": "Compaction",
    "language": "ja",
    "description": "Doris は LSM-Tree に似た構造を通じてデータを書き込みます。"
}
---

# Compaction {#compaction}

Doris は LSM-Tree に似た構造を通じてデータを書き込み、バックグラウンドで compaction により小さなファイルを大きく順序付けられたファイルへ継続的にマージします。Compaction は削除や更新などの操作を処理します。

compaction 戦略を適切に調整すると、データロードとクエリの効率を大幅に向上できます。Doris はチューニング用に次の compaction 戦略を提供します。


## Vertical compaction {#vertical-compaction}

Vertical compaction は Doris 1.2.2 で実装された新しい compaction アルゴリズムで、大規模かつワイドなテーブルのシナリオにおける compaction の実行効率とリソースオーバーヘッドを最適化するために使用されます。compaction のメモリオーバーヘッドを効果的に削減し、実行速度を向上できます。テスト結果では、Vertical compaction のメモリ消費量は従来の compaction アルゴリズムの 1/10 にすぎず、compaction 速度は 15% 向上しました。

Vertical compaction では、行単位のマージを列グループ単位のマージに変更します。各マージの粒度が列グループに変更されるため、個々の compaction に関与するデータ量と compaction 中のメモリ使用量を削減できます。

BE の設定：
- `enable_vertical_compaction = true` で Vertical compaction を有効にします
- `vertical_compaction_num_columns_per_group = 5` は各列グループに含める列数です。テストでは、デフォルトの 5 列単位が効率とメモリ使用量の面で扱いやすいことが確認されています
- `vertical_compaction_max_segment_size` は Vertical compaction 後のディスクファイルのサイズを設定します。デフォルト値は 268435456（バイト）です


## Segment compaction {#segment-compaction}

Segment compaction は主に大規模なデータロードを処理します。Segment compaction はデータロード中に動作し、ジョブ内のセグメントを compact します。これは通常の compaction や Vertical compaction とは異なります。この仕組みにより、生成されるセグメント数を効果的に削減し、-238（OLAP_ERR_TOO_MANY_SEGMENTS）エラーを回避できます。

Segment compaction には次の特徴があります：
- データロードで生成されるセグメント数を削減します
- compact 処理はデータロード処理と並行して実行されるため、データロード時間は増加しません
- データロード中はメモリ消費量と計算リソースが増加しますが、データロード処理全体に均等に分散されるため、増加幅は比較的小さいです
- Segment compaction 後のデータは、後続のクエリや通常の compaction でリソースと性能上の利点があります

BE の設定：
- `enable_segcompaction=true` で有効にします
- `segcompaction_batch_size` はマージ間隔を設定します。デフォルト値 10 は、セグメントファイルが 10 個生成されるたびに Segment compaction をトリガーすることを意味します。10 - 30 の範囲に設定することを推奨します。大きい値にすると Segment compaction のメモリ使用量が増加します。

Segment compaction の有効化を推奨する状況：

- 大量のデータロードが OLAP_ ERR_ TOO_ MANY_ SEGMENTS (errcode - 238) エラーで失敗する場合。データロード中のセグメント数を減らすため、Segment compaction を有効にすることを推奨します。
- データロード中に小さなファイルが大量に生成される場合。データロード量が妥当でも、低カーディナリティやメモリ制約によって memtable が早期にフラッシュされ、大量の小さなセグメントファイルが生成されると、データロードジョブが失敗することがあります。この場合は、この機能を有効にすることを推奨します。
- データロード直後にクエリを実行する場合。データロードが完了した直後で標準 compaction がまだ完了していないと、セグメントファイルが大量にあるため、後続クエリの効率に影響します。データロード直後にクエリを実行する必要がある場合は、この機能を有効にすることを推奨します。
- データロード後の通常の compaction の負荷が高い場合。Segment compaction は通常の compaction の負荷の一部をデータロード処理中に均等に処理します。この場合は、この機能を有効にすることを推奨します。

Segment compaction を推奨しない状況：
- データロード操作自体がすでにメモリリソースを使い果たしている場合は、メモリプレッシャーをさらに増加させてデータロードジョブを失敗させないよう、Segment compaction の使用を推奨しません。

Segment compaction の実装とテスト結果については、[このリンク](https://github.com/apache/doris/pull/12866)を参照してください。

## Compaction 戦略 {#compaction-strategy}

Compaction 戦略は、どの小さなファイルをいつ大きなファイルにマージするかを決定します。Doris は現在、二つの compaction 戦略を提供しており、テーブルプロパティの `compaction_policy` パラメータで指定します。

### size_based compaction 戦略 {#size-based-compaction-strategy}

size_based compaction 戦略はデフォルトの戦略で、ほとんどのシナリオに適しています。
```
"compaction_policy" = "size_based"
```

### time_series compaction 戦略 {#time-series-compaction-strategy}

time_series compaction 戦略は、ログや時系列データなどのシナリオ向けに最適化されています。時系列データの時間的局所性を利用し、隣接する時刻に書き込まれた小さなファイルを大きなファイルにマージします。各ファイルが compaction に参加するのは一度だけで、繰り返しの compaction による書き込み増幅を抑えます。

```
"compaction_policy" = "time_series"
```

time_series compaction 戦略は、次の条件のいずれかを満たすとトリガーされます：
- マージされていないファイルのサイズが `time_series_compaction_goal_size_mbytes` を超える（デフォルトは 1 GB）。
- マージされていないファイル数が `time_series_compaction_file_count_threshold` を超える（デフォルトは 2000）。
- 前回の compaction からの経過時間が `time_series_compaction_time_threshold_seconds` を超える（デフォルトは 1 時間）。

これらのパラメータはテーブルの PROPERTIES に設定し、テーブル作成時に指定するか、後から次の文で変更できます：
```
ALTER TABLE table_name SET("name" = "value");
```

## Compaction の並行性制御 {#compaction-concurrency-control}

Compaction はバックグラウンドで実行され、CPU と IO リソースを消費します。並行 compaction スレッド数を調整することで、リソース消費を制御できます。

並行 compaction スレッド数は BE の設定ファイルで設定し、次のパラメータが含まれます：
- `max_base_compaction_threads`：base compaction のスレッド数。デフォルトは 4 です。
- `max_cumu_compaction_threads`：cumulative compaction のスレッド数。デフォルトは -1 で、ディスクごとに 1 スレッドを意味します。

## 大規模 MOW Tablet における Compaction のメモリオーバーヘッド {#mow-compaction-memory}

merge-on-write（MOW）を使用する Unique Key テーブルは、Compaction 中にメモリ内の rowid conversion map を保持します。この map は入力 rowset の行位置を出力 rowset の新しい位置に対応付け、delete bitmap を更新できるようにします。行数の多い Tablet、特に大量の履歴データを含む Base Compaction では、この map が大きなメモリを消費し、メモリ不足時に Compaction が失敗する可能性があります。

### 行数に伴うメモリ使用量の増加 {#how-memory-usage-grows-with-row-count}

この map は、マージ対象の入力セグメントにある各物理行についてエントリを一つ事前に確保します。各エントリは出力先セグメントの位置と行 ID という二つの 32-bit 整数を記録するため、主要ストレージは行あたり約 8 バイトです。メモリは次のように見積もれます：

```text
Main mapping storage ≈ Total physical input rows participating in this compaction × 8 bytes
```

入力物理行には、Compaction でまだ削除されていない履歴バージョンが含まれます。古い行が削除済みとマークされ、出力 rowset に書き込まれない場合でも、事前確保されたエントリはメモリを占有します。そのため、クエリが返す有効行数を、この見積もりで物理入力行数の代わりに直接使用することはできません。この map は compaction タスクが完了するまで保持され、各読み取りバッチの後に解放されることはありません。

この見積もりが対象とするのは map の主要ストレージだけです。実際の Compaction メモリには、コンテナオーバーヘッド、読み取りバッファ、書き込みバッファ、インデックスも含まれます。Tablet の圧縮データサイズと物理行数の間に固定比率はありません。そのため、狭いテーブルや圧縮率の高いテーブルでは、ディスク上のサイズが比較的小さくても大きな map が必要になることがあります。

### 計算例 {#calculation-example}

ある MOW Tablet の base rowset に 1 billion の物理行が含まれ、この Base Compaction でさらに 100 million の物理行を含む増分 rowset をマージするとします。100 million の増分行がすべて既存キーを更新し、出力に含まれる有効行が 1 billion だけであっても、map は 1.1 billion の物理入力行分確保されます：

```text
Physical input rows = 1 billion + 100 million = 1.1 billion
Main mapping storage ≈ 1.1 billion × 8 bytes = 8.8 × 10^9 bytes ≈ 8.2 GiB
```

同じ BE で同じ入力サイズの compaction タスクを四つ同時に実行すると、これらの map の主要ストレージだけで約 32.8 GiB を使用します。これは他の Compaction メモリや、クエリ、データロード、その他のタスクが使用するメモリを含みません。これは計算例であり、実際の使用量は各タスクの入力サイズと並行数によって異なります。

### トラブルシューティングと対策 {#troubleshooting-and-mitigation}

- テーブルを作成したりパーティションを追加したりするときは、圧縮後のデータサイズだけでなく予想される行数に基づいてパーティション数とバケット数を選択します。データを均等に分散するバケットキーを選び、単一の Tablet に行が過度に蓄積しないようにします。[データバケット](../../table-design/data-partitioning/data-bucketing.md)を参照してください。既存パーティションのバケット数は直接変更できません。既存の過大な Tablet については、テーブルを再作成してデータを移行することを検討してください。
- メモリが限られている場合は、各タスクで利用できるメモリを増やすため、Base Compaction の並行数を減らすことを検討してください。これは同じ BE 上で複数のタスクが重なることによるメモリピークを減らすだけで、個々のタスクの map は小さくなりません。単一の map がすでに利用可能なメモリを超えている場合、並行数を減らすだけでは不十分なことがあります。
- Vertical compaction、より小さい `compaction_batch_size`、または `vertical_compaction_num_columns_per_group` の列数を減らすことで、列グループの読み取りと処理に使用されるメモリを削減できますが、完全な rowid map のサイズは削減できません。`compaction_memory_bytes_limit` は読み取りバッチサイズの推定に使用され、rowid map や compaction タスク全体に対するハード上限ではありません。
