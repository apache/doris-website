---
{
  "title": "リリース 2.1.1",
  "language": "ja",
  "description": "コミュニティメンバーの皆様、Apache Doris 2.1.1が2024年4月3日に正式リリースされ、2.1.0をベースとした複数の機能強化とバグ修正が含まれています。"
}
---
コミュニティメンバーの皆様、Apache Doris 2.1.1が2024年4月3日に正式にリリースされました。2.1.0をベースとした複数の機能強化とバグ修正により、よりスムーズなユーザーエクスペリエンスを実現します。

- **クイックダウンロード:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

- **GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)

## 動作変更

1. float型のシリアライゼーション性能向上のため、float型の出力フォーマットを変更。

- https://github.com/apache/doris/pull/32049

2. システムテーブル値関数active_queries()、workload_groups()をシステムテーブルに変更。

- https://github.com/apache/doris/pull/32314

3. show query/load profile文を無効化。使用する開発者が少なく、pipelineとpipelinexエンジンがサポートしていないため。

- https://github.com/apache/doris/pull/32467

4. arrow flightのバージョンを15.0.2にアップグレードしてバグを修正。DorisへのアクセスにはADBC 15.0.2バージョンを使用してください。

- https://github.com/apache/doris/pull/32827.

## アップグレード問題

1. 2.0.xから2.1.xへのローリングアップグレード時にBEがコアダンプする問題

- https://github.com/apache/doris/pull/32672

- https://github.com/apache/doris/pull/32444

- https://github.com/apache/doris/pull/32162

2. 2.0.xから2.1.xへのローリングアップグレード時にJDBC Catalogでクエリエラーが発生する問題。

- https://github.com/apache/doris/pull/32618

## 新機能

1. カラム認証をデフォルトで有効化。

- https://github.com/apache/doris/pull/32659

2. dockerまたはk8s内で実行時にpipelineとpipelinexエンジンの正しいコア数を取得。

- https://github.com/apache/doris/pull/32370

3. parquet int96型の読み取りをサポート。

- https://github.com/apache/doris/pull/32394

4. IP透過性をサポートするproxy protocolを有効化。このプロトコルを使用することで、ロードバランシングのIP透過性を実現でき、ロードバランシング後もDorisがクライアントの実際のIPを取得してホワイトリストなどの権限制御を実装可能。

- https://github.com/apache/doris/pull/32338/files

5. active_queriesシステムテーブルにworkload groupキュー関連カラムを追加。ユーザーはこのシステムでworkloadキューの使用状況を監視可能。

- https://github.com/apache/doris/pull/32259

6. 各BE上のリアルタイムクエリ統計を監視する新しいシステムテーブルbackend_active_tasksを追加。

- https://github.com/apache/doris/pull/31945

7. spark-dorisコネクタにipv4とipv6サポートを追加。

- https://github.com/apache/doris/pull/32240

8. CCRに転置インデックスサポートを追加。

- https://github.com/apache/doris/pull/32101

9. experimental session variableの選択をサポート。

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

1. be再起動時やアップグレード中のroutine loadの自動再開とroutine loadの安定性維持。

- https://github.com/apache/doris/pull/32239

2. Routine Load: ロードバランスのためのbeアルゴリズムへのタスク割り当てを最適化。

- https://github.com/apache/doris/pull/32021

3. Spark Load: CVE問題解決のためspark loadのsparkバージョンを更新。

- https://github.com/apache/doris/pull/30368

4. タブレットが削除された場合のcooldownをスキップ。

- https://github.com/apache/doris/pull/32079

5. routine load管理でのworkload groupの使用をサポート。

- https://github.com/apache/doris/pull/31671

6. [MTMV] マテリアライズドビューによるクエリリライトの性能向上。

- https://github.com/apache/doris/pull/31886

7. BrokerLoadJobのプロファイルによるjvmヒープメモリ消費を削減。

- https://github.com/apache/doris/pull/31985

8. PartitionPrunnerの高速化により高QPSクエリを改善。

- https://github.com/apache/doris/pull/31970

9. スキーマキャッシュでのカラム名とカラムパスの重複メモリ消費を削減。

- https://github.com/apache/doris/pull/31141

10. マテリアライズドビューによるクエリリライトでINNER JOIN、LEFT OUTER JOIN、RIGHT OUTER JOIN、FULL OUTER JOIN、LEFT SEMI JOIN、RIGHT SEMI JOIN、LEFT ANTI JOIN、RIGHT ANTI JOINなどのより多くの結合タイプをサポート。

- https://github.com/apache/doris/pull/32909

## バグ修正

1. 最初のorderkeyがnulls firstの場合、right/full outer joinを通じたtopn-filterのプッシュダウンを行わない。

- https://github.com/apache/doris/pull/32633

2. Java UDFのメモリリークを修正

- https://github.com/apache/doris/pull/32630

3. 一部のodbcテーブルが同じリソースを使用し、すべてのodbcテーブルを復元しない場合にリソースを保持しない問題とbackup/restoreの一部の設定チェックを修正

- https://github.com/apache/doris/pull/31989

4. variant型のfold constantでコアダンプする問題を修正。

- https://github.com/apache/doris/pull/32265

5. 一部のケースでトランザクション失敗時にroutine loadが一時停止する問題を修正。

- https://github.com/apache/doris/pull/32638

6. 右側が空のleft semi joinの結果はnullではなくfalseになるよう修正。

- https://github.com/apache/doris/pull/32477

7. データのない新しいカラムで転置インデックス構築時のコアダンプを修正。

- https://github.com/apache/doris/pull/32669

8. null-safe-equal joinによるbeコアダンプを修正。

- https://github.com/apache/doris/pull/32623

9. Partial update: シーケンスカラムを持つテーブルに削除サインデータをロードする際のデータ正確性リスクを修正。

- https://github.com/apache/doris/pull/32574

10. Select outfile: orc/parquetファイル形式でのカラム型マッピングを修正。

- https://github.com/apache/doris/pull/32281

11. 復元段階でのBEコアダンプを修正。

- https://github.com/apache/doris/pull/32489

12. count、sumなどの他のagg関数の後でarray_agg関数を使用するとbeがコアダンプする問題を修正。

- https://github.com/apache/doris/pull/32387

13. Variant型は常にnullableである必要があり、そうでないとバグが発生する問題を修正。

- https://github.com/apache/doris/pull/32248

14. スキーマ変更での空ブロック処理のバグを修正。

- https://github.com/apache/doris/pull/32396

15. 一部のケースでjson_length()使用時にBEがコアダンプする問題を修正。

- https://github.com/apache/doris/pull/32145

16. date cast述語を使用してicebergテーブルクエリ時のエラーを修正

- https://github.com/apache/doris/pull/32194

17. variant型の転置インデックス構築時のバグを修正。

- https://github.com/apache/doris/pull/31992

18. クエリ内の2つ以上のmap_agg関数の誤った結果を修正。

- https://github.com/apache/doris/pull/31928

19. money_format関数の誤った結果を修正。

- https://github.com/apache/doris/pull/31883

20. 接続数過多後の接続ハングを修正。

- https://github.com/apache/doris/pull/31594
