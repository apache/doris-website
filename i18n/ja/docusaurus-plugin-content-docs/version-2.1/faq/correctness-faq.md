---
{
  "title": "データ整合性FAQ",
  "language": "ja",
  "description": "この文書は主にDorisの使用中に遭遇する一般的なデータ整合性の問題を記録するために使用されます。定期的に更新されます。"
}
---
# データ整合性の問題

このドキュメントは、Dorisの使用中に遭遇する一般的なデータ整合性の問題を記録するために主に使用されます。定期的に更新されます。

「テーブル内の重複キーデータ」という用語は、merge-on-write Uniqueテーブルにおける重複キーデータの出現を指します。merge-on-write Uniqueテーブルの重複キーの問題は、[full compactionをトリガーする](../admin-manual/trouble-shooting/repairing-data)ことで修正できますが、その他のタイプの整合性問題は、状況に基づいた特定のソリューションが必要な場合があります。サポートが必要な場合は、コミュニティサポートにお問い合わせください。

| 問題の説明 | 発生条件 | 影響バージョン | 修正バージョン | 影響範囲 | 修正PR |
|---|---|---|---|---|---|
| merge-on-write Uniqueテーブルでのインポート時の部分カラム更新で、以前削除されたデータが再導入される | 部分カラム更新時に`__DORIS_DELETE_SIGN__`カラムが指定され、履歴データに`__DORIS_DELETE_SIGN__`カラムによって削除マークが付けられた行が含まれている | <2.1.8 | >=2.1.8 | Partial Column Update | [#46194](https://github.com/apache/doris/pull/46194) |
| auto-incrementカラムのシステム生成値が0または重複する | BEとFE間のネットワーク異常 | <2.1.8 | >=2.1.8 | Auto-increment column | [#43774](https://github.com/apache/doris/pull/43774) |
| Stream Loadインポートがmerge-on-write Uniqueテーブルで`delete`条件を満たすデータを削除しない | `merge_type: MERGE`、`partial_columns: true`、および`delete`パラメータを使用したStream Loadインポート | <2.0.15, <2.17 | >=2.0.15, >=2.17 | Partial Column Update | [#40730](https://github.com/apache/doris/pull/40730) |
| 部分カラム更新インポートでauto-incrementカラム値が意図しない更新となる | テーブルのValueカラムにauto-incrementカラムがあり、部分カラム更新インポートでそれらのauto-incrementカラムの値が指定されていない | <2.1.6 | >=2.1.6 | Auto-increment column | [#39996](https://github.com/apache/doris/pull/39996) |
| テーブル内の重複キーデータ | ユーザーがsequenceカラムをサポートしないmerge-on-write Uniqueテーブルに`ALTER TABLE tbl ENABLE FEATURE "SEQUENCE_LOAD" WITH ...`を使用してsequenceカラム機能を追加し、その後新しいインポートを実行 | <2.0.15, <2.1.6 | >=2.0.15, >=2.1.6 |  | [#39958](https://github.com/apache/doris/pull/39958) |
| 部分カラム更新インポートでmerge-on-write Uniqueテーブルのデータ破損が発生 | merge-on-write Uniqueテーブルでの並行部分カラム更新で、インポート処理中にBE再起動 | <2.0.15, <2.1.6 | >=2.0.15, >=2.1.6 | Partial Column Update | [#38331](https://github.com/apache/doris/pull/38331) |
| テーブル内の重複キーデータ | sequenceカラム付きmerge-on-write Uniqueテーブルでの大規模な単一インポートがsegment compactionをトリガー | <2.0.15, <2.1.6 | >=2.0.15, >=2.1.6 |  | [#38369](https://github.com/apache/doris/pull/38369) |
| テーブル内の重複キーデータ | merge-on-write Uniqueテーブルでのfull clone失敗 | <2.0.13, <2.1.5 | >=2.0.13, >=2.1.5 || [#37001](https://github.com/apache/doris/pull/37001) |
| merge-on-write Uniqueテーブルでのマルチレプリカデータの不整合 | merge-on-write Uniqueテーブルで`__DORIS_DELETE_SIGN__`カラムを使用した部分カラム更新インポートで、インポート中にレプリカ間でBase Compactionの進行状況が不整合 | <2.0.15, <2.1.5 | >=2.0.15, >=2.1.5 | Partial Column Update | [#36210](https://github.com/apache/doris/pull/36210) |
| テーブル内の重複キーデータ | merge-on-write Uniqueテーブルでの並行部分カラム更新とインポート中のBE再起動 | <2.0.11, <2.1.4 | >=2.0.11, >=2.1.4 | Partial Column Update | [#35739](https://github.com/apache/doris/pull/35739) |
