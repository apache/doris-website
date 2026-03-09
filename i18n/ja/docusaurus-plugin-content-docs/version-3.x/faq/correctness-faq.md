---
{
  "title": "データ整合性FAQ",
  "language": "ja",
  "description": "この文書は主にDorisの使用中に発生する一般的なデータ整合性の問題を記録するために使用されます。定期的に更新されます。"
}
---
# データ整合性の問題

このドキュメントは主にDorisの使用中に遭遇する一般的なデータ整合性の問題を記録するために使用されます。定期的に更新されます。

「テーブル内の重複キーデータ」という用語は、merge-on-write Uniqueテーブルに重複キーデータが現れることを指します。merge-on-write Uniqueテーブルの重複キー問題は[フルcompactionのトリガー](../admin-manual/trouble-shooting/repairing-data)によって修正できますが、その他のタイプの整合性問題は状況に基づいて特定の解決策が必要な場合があります。サポートについては、コミュニティサポートにお問い合わせください。

| 問題の説明 | 発生条件 | 影響バージョン | 修正バージョン | 影響範囲 | 修正PR |
|---|---|---|---|---|---|
| merge-on-write Uniqueテーブルの部分カラム更新により、以前削除されたデータが再導入される | 部分カラム更新中に`__DORIS_DELETE_SIGN__`カラムが指定され、履歴データに`__DORIS_DELETE_SIGN__`カラムによって削除マークされた行が含まれている | <2.1.8, <3.0.4 | >=2.1.8, >=3.0.4 | compute-storage結合モード、compute-storage分離モード、部分カラム更新 | [#46194](https://github.com/apache/doris/pull/46194) |
| テーブル内の重複キーデータ | compute-storage分離モードのmerge-on-write Uniqueテーブルでの並行インポート | <3.0.4 | >=3.0.4 | compute-storage分離モード | [#46039](https://github.com/apache/doris/pull/46039) |
| テーブル内の重複キーデータ | compute-storage分離モードのmerge-on-write Uniqueテーブルでのインポート間およびインポートとcompaction間の並行インポート | <3.0.4 | >=3.0.4 | compute-storage分離モード | [#44975](https://github.com/apache/doris/pull/44975) |
| auto-incrementカラムのシステム生成値が0または重複 | BEとFE間のネットワーク異常 | <2.1.8, <3.0.3 | >=2.1.8, >=3.0.3 | compute-storage結合モード、compute-storage分離モード、auto-incrementカラム | [#43774](https://github.com/apache/doris/pull/43774) |
| Stream Loadインポートがmerge-on-write Uniqueテーブルで`delete`条件を満たすデータを削除しない | `merge_type: MERGE`、`partial_columns: true`、および`delete`パラメータを指定したStream Loadインポート | <2.0.15, <2.17, <3.0.3 | >=2.0.15, >=2.17, >=3.0.3 | compute-storage結合モード、compute-storage分離モード、部分カラム更新 | [#40730](https://github.com/apache/doris/pull/40730) |
| 部分カラム更新によりauto-incrementカラム値の意図しない更新が発生 | テーブルのValueカラムにauto-incrementカラムがあり、部分カラム更新インポートでそれらのauto-incrementカラムの値が指定されていない | <2.1.6, <3.0.2 | >=2.1.6, >=3.0.2 | compute-storage結合モード、compute-storage分離モード、auto-incrementカラム | [#39996](https://github.com/apache/doris/pull/39996) |
| テーブル内の重複キーデータ | ユーザーが`ALTER TABLE tbl ENABLE FEATURE "SEQUENCE_LOAD" WITH ...`を使用してsequenceカラムをサポートしていないmerge-on-write Uniqueテーブルにsequenceカラム機能を追加し、その後新しいインポートを実行 | <2.0.15, <2.1.6, <3.0.2 | >=2.0.15, >=2.1.6, >=3.0.2 | compute-storage結合モード、compute-storage分離モード | [#39958](https://github.com/apache/doris/pull/39958) |
| テーブル内の重複キーデータ | compute-storage分離モードのmerge-on-write Uniqueテーブルでの並行インポートまたは並行インポートとcompaction | <3.0.1 | >=3.0.1 | compute-storage分離モード | [#39018](https://github.com/apache/doris/pull/39018) |
| 部分カラム更新インポートによりmerge-on-write Uniqueテーブルでデータ破損が発生 | merge-on-write Uniqueテーブルでの並行部分カラム更新で、インポートプロセス中にBEが再起動 | <2.0.15, <2.1.6, <3.0.2 | >=2.0.15, >=2.1.6, >=3.0.2 | compute-storage結合モード、compute-storage分離モード、部分カラム更新 | [#38331](https://github.com/apache/doris/pull/38331) |
| テーブル内の重複キーデータ | compute-storage分離モードのmerge-on-write Uniqueテーブルでの並行インポートとcompaction | <3.0.2 | >=3.0.2 | compute-storage分離モード | [#37670](https://github.com/apache/doris/pull/37670), [#41309](https://github.com/apache/doris/pull/41309), [#39791](https://github.com/apache/doris/pull/39791) |
| テーブル内の重複キーデータ | sequenceカラムを持つmerge-on-write Uniqueテーブルでの大規模単一インポートがsegment compactionをトリガー | <2.0.15, <2.1.6, <3.0.2 | >=2.0.15, >=2.1.6, >=3.0.2 | compute-storage結合モード、compute-storage分離モード | [#38369](https://github.com/apache/doris/pull/38369) |
| テーブル内の重複キーデータ | compute-storage結合モードのmerge-on-write Uniqueテーブルでの失敗したフルクローン | <2.0.13, <2.1.5, <3.0.0 | >=2.0.13, >=2.1.5, >=3.0.0 | compute-storage結合モード | [#37001](https://github.com/apache/doris/pull/37001) |
| テーブル内の重複キーデータ | compute-storage分離モードのmerge-on-write Uniqueテーブルでの内部リトライプロセスを持つStream Loadインポート | <3.0.0 | >=3.0.0 | compute-storage分離モード | [#36670](https://github.com/apache/doris/pull/36670) |
| merge-on-write Uniqueテーブルでの不整合なマルチレプリカデータ | merge-on-write Uniqueテーブルでの`__DORIS_DELETE_SIGN__`カラムを指定した部分カラム更新インポート、およびインポート中のレプリカ間でのBase Compactionの進行状況の不整合 | <2.0.15, <2.1.5, <3.0.0 | >=2.0.15, >=2.1.5, >=3.0.0 | compute-storage結合モード、compute-storage分離モード、部分カラム更新 | [#36210](https://github.com/apache/doris/pull/36210) |
| テーブル内の重複キーデータ | merge-on-write Uniqueテーブルでの並行部分カラム更新とインポート中のBE再起動 | <2.0.11, <2.1.4, <3.0.0 | >=2.0.11, >=2.1.4, >=3.0.0 | compute-storage結合モード、compute-storage分離モード、部分カラム更新 | [#35739](https://github.com/apache/doris/pull/35739) |
