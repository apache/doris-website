---
{
  "title": "リリース 2.0.15",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.15バージョンでは約157件の改善とバグ修正が行われました"
}
---
コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.15 バージョンでは約 157 の改善とバグ修正が行われました

- クイックダウンロード: https://doris.apache.org/download

- GitHub: https://github.com/apache/doris/releases/tag/2.0.15 

## 1 動作変更

該当なし

## 2 新機能

- Restore が冗長な tablet の削除と partition オプションをサポートするようになりました。[#39028](https://github.com/apache/doris/pull/39028)

- JSON 関数 `json_search` をサポート。[#40948](https://github.com/apache/doris/pull/40948)

## 3 改善と最適化

### 安定性

- トランザクション中止時間のための FE 設定 `abort_txn_after_lost_heartbeat_time_second` を追加。[#28662](https://github.com/apache/doris/pull/28662)

- BE がハートビートを失った後、過度に敏感なトランザクション中止を避けるため、5 秒ではなく 1 分以上経過してからトランザクションを中止するように変更。[#22781](https://github.com/apache/doris/pull/22781)

- 過剰な数の小さなトランザクションを避けるため、routine load の EOF タスクのスケジューリングを遅延。[#39975](https://github.com/apache/doris/pull/39975)

- より堅牢にするため、オンラインディスクサービスからのクエリを優先。[#39467](https://github.com/apache/doris/pull/39467)

- 非厳密モードの部分更新において、行の削除サインがマークされている場合、新しく挿入された行のチェックをスキップ。[#40322](https://github.com/apache/doris/pull/40322)

- FE OOM を防ぐため、バックアップタスクの tablet 数を制限し、デフォルト値を 300,000 に設定。[#39987](https://github.com/apache/doris/pull/39987)

### パフォーマンス

- 同時列更新と compaction による遅い列更新を最適化。[#38487](https://github.com/apache/doris/pull/38487)

- フィルタ条件に NullLiteral が存在する場合、False に畳み込み、さらに EmptySet に変換して不要なデータスキャンと計算を削減。[#38135](https://github.com/apache/doris/pull/38135)

- `ORDER BY` の順列のパフォーマンスを改善。[#38985](https://github.com/apache/doris/pull/38985)

- 転置インデックスにおける文字列処理のパフォーマンスを改善。[#37395](https://github.com/apache/doris/pull/37395)

### Optimizer と Statistics

- セミコロンで始まる文のサポートを追加。[#39399](https://github.com/apache/doris/pull/39399)

- 集約関数のシグネチャマッチングを改良。[#39352](https://github.com/apache/doris/pull/39352)

- スキーマ変更後に列統計を削除し、自動分析をトリガー。[#39101](https://github.com/apache/doris/pull/39101)

- `DROP CACHED STATS table_name` を使用したキャッシュ統計の削除をサポート。[#39367](https://github.com/apache/doris/pull/39367)

### Multi Catalog とその他

- クライアント作成の頻度を減らすため、JDBC Catalog のリフレッシュを最適化。[#40261](https://github.com/apache/doris/pull/40261)

- 特定の条件下での JDBC Catalog のスレッドリークを修正。[#39423](https://github.com/apache/doris/pull/39423)

- ARRAY MAP STRUCT タイプが `REPLACE_IF_NOT_NULL` をサポート。[#38304](https://github.com/apache/doris/pull/38304)

- `DELETE_INVALID_XXX` 以外の失敗に対して削除ジョブを再試行。[#37834](https://github.com/apache/doris/pull/37834)

**謝辞**

@924060929, @BePPPower, @BiteTheDDDDt, @CalvinKirs, @GoGoWen, @HappenLee, @Jibing-Li, @Johnnyssc, @LiBinfeng-01, @Mryange, @SWJTU-ZhangLei, @TangSiyang2001, @Toms1999, @Vallishp, @Yukang-Lian, @airborne12, @amorynan, @bobhan1, @cambyzju, @csun5285, @dataroaring, @eldenmoon, @englefly, @feiniaofeiafei, @hello-stephen, @htyoung, @hubgeter, @justfortaste, @liaoxin01, @liugddx, @liutang123, @luwei16, @mongo360, @morrySnow, @qidaye, @smallx, @sollhui, @starocean999, @w41ter, @xiaokang, @xzj7019, @yujun777, @zclllyybb, @zddr, @zhangstar333, @zhannngchen, @zy-kkk, @zzzxl1993
