---
{
  "title": "リリース 2.1.1",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 2.1.1が2024年4月3日に正式リリースされました。2.1.0をベースに複数の機能強化とバグ修正が行われています。"
}
---
コミュニティメンバーの皆様へ、Apache Doris 2.1.1 が2024年4月3日に正式にリリースされました。2.1.0をベースとした複数の機能強化とバグ修正により、よりスムーズなユーザーエクスペリエンスを提供します。

- **クイックダウンロード:** https://doris.apache.org/download/

- **GitHub:** https://github.com/apache/doris/releases

## 動作変更

1. float型のシリアライゼーションパフォーマンスを向上させるため、float型の出力フォーマットを変更しました。

- https://github.com/apache/doris/pull/32049

2. システムテーブル値関数 active_queries()、workload_groups() をシステムテーブルに変更しました。

- https://github.com/apache/doris/pull/32314

3. show query/load profile文を無効化しました。これを使用する開発者が少なく、pipelineおよびpipelinexエンジンがサポートしていないためです。

- https://github.com/apache/doris/pull/32467

4. いくつかのバグを修正するためarrow flightのバージョンを15.0.2にアップグレードしました。DorisへのアクセスにはADBC 15.0.2バージョンをご使用ください。

- https://github.com/apache/doris/pull/32827.

## アップグレード問題

1. 2.0.xから2.1.xへのローリングアップグレード時にBEでコアダンプが発生する問題

- https://github.com/apache/doris/pull/32672

- https://github.com/apache/doris/pull/32444

- https://github.com/apache/doris/pull/32162

2. 2.0.xから2.1.xへのローリングアップグレード時にJDBC Catalogでクエリエラーが発生する問題

- https://github.com/apache/doris/pull/32618

## 新機能

1. カラム認証をデフォルトで有効化しました。

- https://github.com/apache/doris/pull/32659

2. dockerまたはk8s内で実行時にpipelineおよびpipelinexエンジンの正しいコア数を取得できるようになりました。

- https://github.com/apache/doris/pull/32370

3. parquet int96型の読み取りをサポートしました。

- https://github.com/apache/doris/pull/32394

4. IP透過性をサポートするproxy protocolを有効化しました。このプロトコルを使用することで、ロードバランシングでのIP透過性を実現でき、ロードバランシング後でもDorisがクライアントの実際のIPを取得し、ホワイトリストなどの権限制御を実装できます。

- https://github.com/apache/doris/pull/32338/files

5. active_queriesシステムテーブルにworkload groupキュー関連カラムを追加しました。ユーザーはこのシステムを使用してworkloadキューの使用状況を監視できます。

- https://github.com/apache/doris/pull/32259

6. 各BEでのリアルタイムクエリ統計を監視する新しいシステムテーブル backend_active_tasks を追加しました。

- https://github.com/apache/doris/pull/31945

7. spark-doris connectorにipv4およびipv6サポートを追加しました。

- https://github.com/apache/doris/pull/32240

8. CCRに転置インデックスサポートを追加しました。

- https://github.com/apache/doris/pull/32101

9. 実験的セッション変数の選択をサポートしました。

- https://github.com/apache/doris/pull/31837

10. bitmap_union(bitmap_from_array())ケースでのマテリアライズドビューをサポートしました。

- https://github.com/apache/doris/pull/31962

11. *HIVE_DEFAULT_PARTITION*のパーティション刈り込みをサポートしました。

- https://github.com/apache/doris/pull/31736

12. set variable文での関数をサポートしました。

- https://github.com/apache/doris/pull/32492

13. varint型のarrowシリアライゼーションをサポートしました。

- https://github.com/apache/doris/pull/32809

## 最適化

1. BE再起動時またはアップグレード中にroutine loadを自動再開し、routine loadを安定化しました。

- https://github.com/apache/doris/pull/32239

2. Routine Load: ロードバランスのためのbeアルゴリズムへのタスク割り当てを最適化しました。

- https://github.com/apache/doris/pull/32021

3. Spark Load: CVE問題を解決するためspark loadのsparkバージョンを更新しました。

- https://github.com/apache/doris/pull/30368

4. タブレットがドロップされた場合のクールダウンをスキップするようになりました。

- https://github.com/apache/doris/pull/32079

5. routine loadを管理するためのworkload group使用をサポートしました。

- https://github.com/apache/doris/pull/31671

6. [MTMV ]マテリアライズドビューによるクエリリライトのパフォーマンスを向上させました。

- https://github.com/apache/doris/pull/31886

7. BrokerLoadJobのプロファイルによるJVMヒープメモリ消費を削減しました。

- https://github.com/apache/doris/pull/31985

8. PartitionPrunnerを高速化して高QPSクエリを改善しました。

- https://github.com/apache/doris/pull/31970

9. スキーマキャッシュのカラム名とカラムパスの重複メモリ消費を削減しました。

- https://github.com/apache/doris/pull/31141

10. INNER JOIN、LEFT OUTER JOIN、RIGHT OUTER JOIN、FULL OUTER JOIN、LEFT SEMI JOIN、RIGHT SEMI JOIN、LEFT ANTI JOIN、RIGHT ANTI JOINなど、マテリアライズドビューによるクエリリライトでより多くの結合タイプをサポートしました。

- https://github.com/apache/doris/pull/32909

## バグ修正

1. 最初のorderkeyがnulls firstの場合、right/full outer joinを通してtopn-filterをプッシュダウンしないようにしました。

- https://github.com/apache/doris/pull/32633

2. Java UDFのメモリリークを修正しました。

- https://github.com/apache/doris/pull/32630

3. 一部のodbcテーブルが同じリソースを使用し、すべてのodbcテーブルをリストアしない場合、リソースが保持されない問題を修正し、backup/restoreの設定確認を追加しました。

- https://github.com/apache/doris/pull/31989

4. variant型でのFold constantによるコアダンプを修正しました。

- https://github.com/apache/doris/pull/32265

5. 一部のケースでトランザクションが失敗した際にroutine loadが停止する問題を修正しました。

- https://github.com/apache/doris/pull/32638

6. 右側が空のleft semi joinの結果はnullではなくfalseになるべきであることを修正しました。

- https://github.com/apache/doris/pull/32477

7. データのない新しいカラムで転置インデックスを構築する際のコアダンプを修正しました。

- https://github.com/apache/doris/pull/32669

8. null-safe-equal joinによるBEコアダンプを修正しました。

- https://github.com/apache/doris/pull/32623

9. Partial update: sequence colを持つテーブルにdelete signデータをロードする際のデータ正確性リスクを修正しました。

- https://github.com/apache/doris/pull/32574

10. Select outfile: orc/parquetファイル形式でのカラム型マッピングを修正しました。

- https://github.com/apache/doris/pull/32281

11. リストア段階でのBEコアダンプを修正しました。

- https://github.com/apache/doris/pull/32489

12. count、sumなど他の集約関数の後にarray_agg関数を使用するとBEコアダンプが発生する問題を修正しました。

- https://github.com/apache/doris/pull/32387

13. Variant型は常にnullableであるべきで、そうでないとバグが発生することを修正しました。

- https://github.com/apache/doris/pull/32248

14. スキーマ変更での空ブロック処理のバグを修正しました。

- https://github.com/apache/doris/pull/32396

15. 一部のケースでjson_length()使用時にBEがコアダンプする問題を修正しました。

- https://github.com/apache/doris/pull/32145

16. date cast predicateを使用してicebergテーブルをクエリする際のエラーを修正しました。

- https://github.com/apache/doris/pull/32194

17. variant型で転置インデックスを構築する際のいくつかのバグを修正しました。

- https://github.com/apache/doris/pull/31992

18. クエリで2つ以上のmap_agg関数使用時の間違った結果を修正しました。

- https://github.com/apache/doris/pull/31928

19. money_format関数の間違った結果を修正しました。

- https://github.com/apache/doris/pull/31883

20. 接続数過多後の接続ハングアップを修正しました。

- https://github.com/apache/doris/pull/31594
