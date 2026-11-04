---
{
    "title": "Compaction",
    "language": "ja",
    "description": "Doris は LSM-Tree に似た構造を通じてデータを書き込みます。"
}
---

# Compaction {#compaction}

Doris は LSM-Tree に似た構造を通じてデータを書き込み、バックグラウンドで compaction により小さなファイルを大きな順序付きファイルへ継続的にマージします。Compaction は削除や更新などの操作を処理します。

compaction 戦略を適切に調整すると、データロードとクエリの効率を大幅に向上できます。Doris では、チューニング用に次の compaction 戦略を提供しています。


## Vertical compaction {#vertical-compaction}

Vertical compaction は Doris 1.2.2 で実装された新しい compaction アルゴリズムで、大規模かつワイドなテーブルのシナリオにおける compaction 実行効率とリソースオーバーヘッドを最適化するために使用されます。Compaction のメモリオーバーヘッドを効果的に削減し、実行速度を向上させます。テスト結果では、Vertical compaction のメモリ消費量は従来の compaction アルゴリズムの 1/10 にすぎず、compaction 速度は 15% 向上しました。

Vertical compaction では、行単位のマージを列グループ単位のマージに変更します。各マージの粒度を列グループに変更することで、compaction に関与するデータ量を減らし、compaction 中のメモリ使用量を削減します。

BE の設定:
- `enable_vertical_compaction = true` で Vertical compaction を有効にします
- `vertical_compaction_num_columns_per_group = 5` は各列グループに含める列数です。テストでは、デフォルトの 5 列グループが効率とメモリ使用量の面でより適しています
- `vertical_compaction_max_segment_size` は Vertical compaction 後のディスクファイルサイズの設定に使用されます。デフォルト値は 268435456（バイト）です


## Segment compaction {#segment-compaction}

Segment compaction は主に大規模なデータロードを扱います。Segment compaction はデータロード中に動作し、ジョブ内のセグメントを compact します。これは通常の compaction や Vertical compaction とは異なります。この仕組みにより生成されるセグメント数を効果的に減らし、-238（OLAP_ERR_TOO_MANY_SEGMENTS）エラーを回避できます。

Segment compaction には次の特徴があります:
- データロードによって生成されるセグメント数を減らします
- compact 処理はデータロード処理と並行して実行されるため、データロード時間は増加しません
- データロード中のメモリ消費量と計算リソースは増加しますが、データロード全体に均等に分散されるため、増加幅は比較的小さくなります
- Segment compaction 後のデータは、後続のクエリと通常の compaction でリソースおよびパフォーマンス上の利点があります

BE の設定:
- `enable_segcompaction=true` で有効にします
- `segcompaction_batch_size` はマージ間隔の設定に使用されます。デフォルト値 10 は、10 個のセグメントファイルごとに Segment compaction がトリガーされることを意味します。10 - 30 の範囲に設定することを推奨します。値を大きくすると Segment compaction のメモリ使用量が増加します

Segment compaction を推奨する状況:

- 大量のデータロードが OLAP_ ERR_ TOO_ MANY_ SEGMENTS (errcode - 238) エラーで失敗する場合。この場合、データロード中のセグメント数を減らすために Segment compaction を有効にすることを推奨します。
- データロード中に小さなファイルが多すぎる場合。データロード量が妥当でも、カーディナリティが低い、またはメモリ制約により memtable が早期にフラッシュされると、多数の小さなセグメントファイルが生成されてデータロードジョブが失敗することがあります。この場合、この機能を有効にすることを推奨します。
- データロード直後にクエリを実行する場合。データロードが終了したばかりで標準 compaction が完了していないと、多数のセグメントファイルが後続クエリの効率に影響します。データロード直後にクエリを実行する必要がある場合は、この機能を有効にすることを推奨します。
- データロード後の通常 compaction の負荷が高い場合: Segment compaction は通常 compaction の負荷の一部をデータロード処理に均等に分散します。この場合、この機能を有効にすることを推奨します。

Segment compaction を推奨しない状況:
- データロード操作自体ですでにメモリリソースを使い切っている場合は、メモリ負荷をさらに増加させてデータロードジョブを失敗させないために、Segment compaction の使用は推奨されません。

実装とテスト結果の詳細は[こちらのリンク](https://github.com/apache/doris/pull/12866)を参照してください。

## Compaction 戦略 {#compaction-strategy}

Compaction 戦略は、いつどの小さなファイルを大きなファイルへマージするかを決定します。Doris では現在、テーブルプロパティの `compaction_policy` パラメータで指定する二つの compaction 戦略を提供しています。

### サイズベースの compaction 戦略 {#size-based-compaction-strategy}

サイズベースの compaction 戦略はデフォルトの戦略であり、ほとんどのシナリオに適しています。
```
"compaction_policy" = "size_based"
```

### 時系列 compaction 戦略 {#time-series-compaction-strategy}

時系列 compaction 戦略は、ログや時系列データなどのシナリオ向けに最適化されています。時系列データの時間的局所性を利用し、近接した時刻に書き込まれた小さなファイルを大きなファイルへマージします。各ファイルは compaction に一度だけ参加して大きなファイルにまとめられるため、繰り返しの compaction による書き込み増幅を削減できます。

```
"compaction_policy" = "time_series"
```

時系列 compaction 戦略は、次の条件のいずれかを満たしたときにトリガーされます:
- 未マージファイルのサイズが `time_series_compaction_goal_size_mbytes` を超える（デフォルト 1 GB）。
- 未マージファイルの数が `time_series_compaction_file_count_threshold` を超える（デフォルト 2000）。
- 前回の compaction からの経過時間が `time_series_compaction_time_threshold_seconds` を超える（デフォルト 1 時間）。

これらのパラメータはテーブルの PROPERTIES に設定します。テーブル作成時に指定することも、後から次の SQL で変更することもできます:
```
ALTER TABLE table_name SET("name" = "value");
```

## Compaction の同時実行制御 {#compaction-concurrency-control}

Compaction はバックグラウンドで実行され、CPU と IO リソースを消費します。リソース消費量は、同時実行する compaction スレッド数を調整して制御できます。

同時実行する compaction スレッド数は BE の設定ファイルで設定します。主なパラメータは次のとおりです:
- `max_base_compaction_threads`: base compaction のスレッド数。デフォルトは 4 です。
- `max_cumu_compaction_threads`: cumulative compaction のスレッド数。デフォルトは -1 で、ディスクごとに 1 スレッドを意味します。

## 大規模 MOW Tablet における Compaction のメモリオーバーヘッド {#mow-compaction-memory}

merge-on-write (MOW) を使用する Unique Key テーブルは、compaction 中にインメモリの rowid 変換マップを維持します。このマップは、入力 rowset 内の行位置を出力 rowset 内の新しい位置に対応付け、delete bitmap を更新できるようにします。多数の行を持つ Tablet、特に大量の履歴データを含む Base Compaction では、このマップが大量のメモリを消費し、メモリ不足時に compaction が失敗する可能性があります。

### 行数に応じたメモリ使用量の増加方法 {#how-memory-usage-grows-with-row-count}

このマップは、マージ対象の入力セグメント内の各物理行に対してエントリを 1 つ事前に割り当てます。各エントリには、出力先セグメントの位置と行 ID が 32 ビット整数として記録されるため、主なストレージは 1 行あたり約 8 バイトです。メモリ量は次のように見積もることができます:

```text
Main mapping storage ≈ Total physical input rows participating in this compaction × 8 bytes
```

入力物理行には、まだ compaction で削除されていない履歴バージョンが含まれます。古い行が削除済みとしてマークされ、出力 rowset に書き込まれない場合でも、事前割り当てされたエントリはメモリを占有します。したがって、クエリが返す有効行数を、この見積もりで物理入力行数の代わりに直接使うことはできません。マップは compaction タスクが完了するまで保持され、各読み取りバッチの後に解放されることはありません。

この見積もりの対象はマップの主なストレージだけです。実際の compaction メモリには、コンテナのオーバーヘッド、読み取りバッファ、書き込みバッファ、インデックスも含まれます。Tablet の圧縮後データサイズと物理行数の間に固定比率はありません。そのため、狭いテーブルや圧縮率の高いテーブルでは、ディスク上のサイズが比較的小さくても大きなマップが必要になる場合があります。

### 計算例 {#calculation-example}

ある MOW Tablet の Base rowset に 1 billion 個の物理行が含まれ、この Base Compaction がさらに 100 million 個の物理行を含む増分 rowset をマージするとします。100 million 個の増分行がすべて既存キーを更新し、出力が 1 billion 個の有効行だけであっても、マップは 1.1 billion 個の物理入力行に対して割り当てられます:

```text
Physical input rows = 1 billion + 100 million = 1.1 billion
Main mapping storage ≈ 1.1 billion × 8 bytes = 8.8 × 10^9 bytes ≈ 8.2 GiB
```

同じ BE でこの入力サイズの compaction タスクを四つ同時に実行すると、これらのマップの主なストレージだけで約 32.8 GiB を使用します。これは、他の compaction メモリや、クエリ、データロード、その他のタスクが使用するメモリを含みません。これは計算例であり、実際の使用量は各タスクの入力サイズと同時実行数によって異なります。

### トラブルシューティングと軽減策 {#troubleshooting-and-mitigation}

- テーブルの作成時やパーティションの追加時は、圧縮後のデータサイズだけでなく予想行数に基づいてパーティション数とバケット数を選択します。データを均等に分散するバケットキーを選び、単一の Tablet に行が過度に蓄積しないようにします。[データバケット](../../table-design/data-partitioning/data-bucketing.md)を参照してください。既存パーティションのバケット数は直接変更できません。既存の大きすぎる Tablet については、テーブルを再作成してデータを移行することを検討してください。
- メモリが限られている場合は、Base Compaction の同時実行数を減らして、各タスクで利用できるメモリを増やすことを検討してください。これにより、同じ BE 上の複数タスクによる合算メモリピークだけが減り、個々のタスクのマップは小さくなりません。単一のマップが利用可能メモリをすでに超えている場合、同時実行数の削減だけでは不十分な可能性があります。
- Vertical compaction、より小さい `compaction_batch_size`、または `vertical_compaction_num_columns_per_group` の列数を減らすことで、列グループの読み取りと処理に使われるメモリを削減できますが、完全な rowid マップのサイズは減りません。`compaction_memory_bytes_limit` は読み取りバッチサイズの見積もりに使われ、rowid マップや compaction タスク全体にハード上限を課しません。
