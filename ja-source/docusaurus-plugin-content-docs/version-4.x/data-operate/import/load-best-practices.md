---
{
  "title": "ロードのベストプラクティス",
  "description": "重複キーモデルの使用を優先することが推奨されます。",
  "language": "ja"
}
---
## table Model選択

Duplicate Keyモデルの使用を優先することを推奨します。このモデルは、他のモデルと比較してデータロードとクエリパフォーマンスの両方で利点があります。詳細については、[Data Model](../../table-design/data-model/overview)を参照してください。

## パーティションとバケット設定

tabletのサイズを1-10GBの間に保つことを推奨します。tabletが小さすぎると集約パフォーマンスの低下やメタデータ管理のオーバーヘッド増加を招く可能性があります。tabletが大きすぎるとレプリカの移行や修復が阻害される可能性があります。詳細については、[Data Distribution](../../table-design/data-partitioning/data-distribution)を参照してください。

## Random Bucketing

Random bucketingを使用する場合、load_to_single_tabletをtrueに設定することで単一tabletロードモードを有効にできます。このモードは大規模データロード時にデータロードの同時実行性とスループットを向上させ、書き込み増幅を削減できます。詳細については、[Random Bucketing](../../table-design/data-partitioning/data-bucketing#random-bucketing)を参照してください。

## Batch Loading

クライアント側バッチ処理：ロードする前にクライアント側でデータをバッチ処理（数MBからGBサイズ）することを推奨します。高頻度の小さなロードは頻繁なcompactionを引き起こし、深刻な書き込み増幅問題を引き起こします。
サーバー側バッチ処理：高並行性の小容量データロードについては、[Group Commit](group-commit-manual.md)を有効にしてサーバー側でバッチ処理を実装することを推奨します。

## パーティション Loading

一度に少数のpartitionからのみデータをロードすることを推奨します。同時に多数のpartitionからロードするとメモリ使用量が増加し、パフォーマンス問題を引き起こす可能性があります。Dorisの各tabletはメモリ内にアクティブなMemtableを持っており、一定のサイズに達するとディスクにフラッシュされます。プロセスOOMを防ぐため、アクティブなMemtableのメモリ使用量が高すぎる場合、早期フラッシュがトリガーされ、多くの小さなファイルが生成されてロードパフォーマンスに影響します。

## 大規模データBatch Loading

大量のファイルや大容量データを扱う場合、ロード失敗時の高いリトライコストを回避し、システムリソースへの影響を削減するため、バッチでロードすることを推奨します。Broker Loadについては、1バッチあたり100GBを超えないことを推奨します。大きなローカルデータファイルについては、自動的にバッチロードを実行するDorisのstreamloaderツールを使用できます。

## Broker Load並行性

圧縮ファイル/Parquet/ORCファイル：より高い並行性を実現するため、ファイルを複数の小さなファイルに分割してロードすることを推奨します。

非圧縮のCSVとJSONファイル：Dorisは自動的にファイルを分割し、並行してロードします。

並行性戦略については、[Broker Load 構成 パラメータ](./import-way/broker-load-manual#Related-Configurations)を参照してください。

## Stream Load並行性

BE毎のStream load並行性を128以下に保つことを推奨します（BEのwebserver_num_workersパラメータで制御）。高い並行性はwebserverスレッドの枯渇を引き起こし、ロードパフォーマンスに影響する可能性があります。特に単一BEの並行性が512を超える場合（doris_max_remote_scanner_thread_pool_thread_numパラメータ）、BEプロセスのハングを引き起こす可能性があります。
