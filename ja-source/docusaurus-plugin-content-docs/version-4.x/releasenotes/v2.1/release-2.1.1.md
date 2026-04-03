---
{
  "title": "リリース 2.1.1",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 2.1.1が2024年4月3日に正式リリースされました。2.1.0をベースに複数の機能強化とバグ修正が行われています。"
}
---
コミュニティメンバーの皆様、Apache Doris 2.1.1が2024年4月3日に正式リリースされました。2.1.0をベースとした複数の機能強化とバグ修正により、よりスムーズなユーザー体験を実現します。

- **クイックダウンロード:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

- **GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)

## 動作変更

1. float型のシリアライゼーションパフォーマンスを向上させるため、float型出力フォーマットを変更。

- https://github.com/apache/doris/pull/32049

2. システムテーブル値関数active_queries()、workload_groups()をシステムテーブルに変更。

- https://github.com/apache/doris/pull/32314

3. show query/load profile stmtを無効化。使用する開発者が少なく、pipelineおよびpipelinexエンジンがサポートしていないため。

- https://github.com/apache/doris/pull/32467

4. arrow flightバージョンを15.0.2にアップグレードしていくつかのバグを修正。Dorisにアクセスする際はADBC 15.0.2バージョンを使用してください。

- https://github.com/apache/doris/pull/32827.

## アップグレード問題

1. 2.0.xから2.1.xへのローリングアップグレード時にBEがクラッシュする問題

- https://github.com/apache/doris/pull/32672

- https://github.com/apache/doris/pull/32444

- https://github.com/apache/doris/pull/32162

2. 2.0.xから2.1.xへのローリングアップグレード時にJDBC カタログでクエリエラーが発生する問題。

- https://github.com/apache/doris/pull/32618

## 新機能

1. カラム認証をデフォルトで有効化。

- https://github.com/apache/doris/pull/32659

2. dockerまたはk8s内で実行時にpipelineおよびpipelinexエンジンの正確なコア数を取得。

- https://github.com/apache/doris/pull/32370

3. parquet int96型の読み取りをサポート。

- https://github.com/apache/doris/pull/32394

4. IP透過性をサポートするproxy protocolを有効化。このプロトコルを使用することで、ロードバランシングのIP透過性を実現でき、ロードバランシング後もDorisがクライアントの実際のIPを取得してホワイトリストなどの権限制御を実装できます。

- https://github.com/apache/doris/pull/32338/files

5. active_queriesシステムテーブルにworkload groupキュー関連のカラムを追加。ユーザーはこのシステムを使用してworkloadキューの使用状況を監視できます。

- https://github.com/apache/doris/pull/32259

6. 各BE上のリアルタイムクエリ統計を監視する新しいシステムテーブルbackend_active_tasksを追加。

- https://github.com/apache/doris/pull/31945

7. spark-doris connectorにipv4およびipv6サポートを追加。

- https://github.com/apache/doris/pull/32240

8. CCRに転置インデックスサポートを追加。

- https://github.com/apache/doris/pull/32101

9. 実験的セッション変数のselectをサポート。

- https://github.com/apache/doris/pull/31837

10. bitmap_union(bitmap_from_array())ケースでのマテリアライズドビューをサポート。

- https://github.com/apache/doris/pull/31962

11. *HIVE_DEFAULT_PARTITION*のパーティションプルーニングをサポート。

- https://github.com/apache/doris/pull/31736

12. set variable文での関数をサポート。

- https://github.com/apache/doris/pull/32492

13. varint型のarrowシリアライゼーションをサポート。

- https://github.com/apache/doris/pull/32809

## 最適化

1. be再起動時またはアップグレード中のroutine load自動再開機能とroutine loadの安定性維持。

- https://github.com/apache/doris/pull/32239

2. Routine Load: ロードバランシングのためのbeアルゴリズムへのタスク割り当てを最適化。

- https://github.com/apache/doris/pull/32021

3. Spark Load: CVE問題を解決するためspark loadのsparkバージョンを更新。

- https://github.com/apache/doris/pull/30368

4. タブレットが削除された場合のクールダウンをスキップ。

- https://github.com/apache/doris/pull/32079

5. routine loadの管理にworkload groupの使用をサポート。

- https://github.com/apache/doris/pull/31671

6. [MTMV ]マテリアライズドビューによるクエリリライトのパフォーマンスを改善。

- https://github.com/apache/doris/pull/31886

7. BrokerLoadJobのプロファイルによるJVMヒープメモリ消費を削減。

- https://github.com/apache/doris/pull/31985

8. PartitionPrunnerの高速化により高QPSクエリを改善。

- https://github.com/apache/doris/pull/31970

9. スキーマキャッシュのカラム名およびカラムパスの重複メモリ消費を削減。

- https://github.com/apache/doris/pull/31141

10. INNER JOIN、LEFT OUTER JOIN、RIGHT OUTER JOIN、FULL OUTER JOIN、LEFT SEMI JOIN、RIGHT SEMI JOIN、LEFT ANTI JOIN、RIGHT ANTI JOINなど、マテリアライズドビューによるクエリリライトでより多くのjoin型をサポート

- https://github.com/apache/doris/pull/32909

## バグ修正

1. 最初のorderkeyがnulls firstの場合、right/full outer joinを通じたtopn-filterのプッシュダウンを実行しないように修正。

- https://github.com/apache/doris/pull/32633

2. Java UDFでのメモリリークを修正

- https://github.com/apache/doris/pull/32630

3. 一部のodbcテーブルが同じリソースを使用し、すべてのodbcテーブルを復元しない場合、リソースが保持されない問題を修正。backup/restore用の設定チェックを追加

- https://github.com/apache/doris/pull/31989

4. variant型での定数フォールドによるクラッシュを修正。

- https://github.com/apache/doris/pull/32265

5. 一部のケースでトランザクション失敗時にroutine loadが一時停止する問題を修正。

- https://github.com/apache/doris/pull/32638

6. 右側が空のleft semi joinの結果はnullではなくfalseであるべき問題を修正。

- https://github.com/apache/doris/pull/32477

7. データのない新しいカラムに転置インデックスを構築する際のクラッシュを修正。

- https://github.com/apache/doris/pull/32669

8. null-safe-equal joinによるbeクラッシュを修正。

- https://github.com/apache/doris/pull/32623

9. Partial update: sequence colを持つテーブルにdelete signデータをロードする際のデータ正確性リスクを修正。

- https://github.com/apache/doris/pull/32574

10. Select outfile: orc/parquetファイル形式でのカラム型マッピングを修正。

- https://github.com/apache/doris/pull/32281

11. restore段階でのBEクラッシュを修正。

- https://github.com/apache/doris/pull/32489

12. count、sumなどの他のagg func後にarray_agg funcを使用するとbeがクラッシュする問題を修正。

- https://github.com/apache/doris/pull/32387

13. Variant型は常にnullableであるべき、そうでないといくつかのバグが発生する問題を修正。

- https://github.com/apache/doris/pull/32248

14. スキーマ変更での空ブロック処理のバグを修正。

- https://github.com/apache/doris/pull/32396

15. 一部のケースでjson_length()使用時にBEがクラッシュするバグを修正。

- https://github.com/apache/doris/pull/32145

16. date cast述語を使用したicebergテーブルクエリ時のエラーを修正

- https://github.com/apache/doris/pull/32194

17. variant型の転置インデックス構築時のいくつかのバグを修正。

- https://github.com/apache/doris/pull/31992

18. クエリ内の2つ以上のmap_agg関数の誤った結果を修正。

- https://github.com/apache/doris/pull/31928

19. money_format関数の誤った結果を修正。

- https://github.com/apache/doris/pull/31883

20. 接続数過多後の接続ハングを修正。

- https://github.com/apache/doris/pull/31594
