---
{
  "title": "負荷のベストプラクティス",
  "language": "ja",
  "description": "Duplicate Keyモデルの使用を優先することが推奨されます。"
}
---
## テーブルモデル選択

データロードとクエリパフォーマンスの両方において他のモデルと比較して優位性を提供するDuplicate Keyモデルの使用を優先することを推奨します。詳細については以下を参照してください：[Data Model](../../table-design/data-model/overview)

## パーティションとバケット設定

tabletのサイズを1-10GB間に保つことを推奨します。小さすぎるtabletは集約パフォーマンスの低下とメタデータ管理オーバーヘッドの増加を招く可能性があり、大きすぎるtabletはレプリカマイグレーションと修復を阻害する可能性があります。詳細については以下を参照してください：[Data Distribution](../../table-design/data-partitioning/data-distribution)。

## Random Bucketing

Random bucketingを使用する場合、load_to_single_tabletをtrueに設定することでsingle-tabletロードモードを有効にできます。このモードは大規模データロード時にデータロードの並行性とスループットを向上させ、書き込み増幅を削減できます。詳細については以下を参照してください：[Random Bucketing](../../table-design/data-partitioning/data-bucketing#random-bucketing)

## バッチロード

クライアント側バッチ処理：ロード前にクライアント側でデータをバッチ化する（数MBからGBサイズ）ことを推奨します。高頻度の小さなロードは頻繁なcompactionを引き起こし、深刻な書き込み増幅問題を引き起こします。
サーバー側バッチ処理：高並行性の小データ量ロードについては、[Group Commit](group-commit-manual.md)を有効にしてサーバー側でのバッチ処理を実装することを推奨します。

## パーティションロード

一度に少数のパーティションからのみデータをロードすることを推奨します。同時に多くのパーティションからロードするとメモリ使用量が増加し、パフォーマンス問題を引き起こす可能性があります。DorisのtabletはメモリにactiveなMemtableを持っており、一定サイズに達するとディスクにフラッシュされます。プロセスOOMを防ぐため、activeなMemtableのメモリ使用量が高すぎる場合は早期フラッシュがトリガーされ、多くの小ファイルが生成されロードパフォーマンスに影響します。

## 大規模データバッチロード

大量のファイルまたは大きなデータ量を扱う場合、ロード失敗時の高い再試行コストを避け、システムリソースへの影響を削減するため、バッチでロードすることを推奨します。Broker Loadについては、1バッチあたり100GBを超えないことを推奨します。大きなローカルデータファイルについては、自動的にバッチロードを実行するDorisのstreamloaderツールを使用できます。

## Broker Load並行性

圧縮ファイル/Parquet/ORCファイル：より高い並行性を実現するため、ファイルを複数の小さなファイルに分割してロードすることを推奨します。

非圧縮CSVとJSONファイル：Dorisは自動的にファイルを分割し、並行してロードします。

並行性戦略については以下を参照してください：[Broker Load Configuration Parameters](./import-way/broker-load-manual#Related-Configurations)

## Stream Load並行性

BE あたりのStream load並行性を128以下に保つことを推奨します（BEのwebserver_num_workersパラメータで制御）。高並行性はwebserverスレッドの枯渇を引き起こし、ロードパフォーマンスに影響する可能性があります。特に単一BEの並行性が512を超える場合（doris_max_remote_scanner_thread_pool_thread_numパラメータ）、BEプロセスがハングする可能性があります。
