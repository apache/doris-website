---
{
  "title": "リリース 2.0.15",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.15バージョンでは約157の改善とバグ修正が行われました"
}
---
コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.15バージョンでは約157の改善とバグ修正が行われました

- クイックダウンロード: https://doris.apache.org/download

- GitHub: https://github.com/apache/doris/releases/tag/2.0.15 

## 1 動作変更

なし

## 2 新機能

- Restoreで冗長なタブレットとパーティションオプションの削除がサポートされました。[#39028](https://github.com/apache/doris/pull/39028)

- JSON関数`json_search`がサポートされました。[#40948](https://github.com/apache/doris/pull/40948)

## 3 改善と最適化

### 安定性

- トランザクション中止時間のためのFE設定`abort_txn_after_lost_heartbeat_time_second`を追加しました。[#28662](https://github.com/apache/doris/pull/28662)

- 過度に敏感なトランザクション中止を回避するため、BEがハートビートを失った後のトランザクション中止を5秒ではなく1分以上に変更しました。[#22781](https://github.com/apache/doris/pull/22781)

- 過度に多数の小さなトランザクションを回避するため、routine loadのEOFタスクのスケジューリングを遅延させます。[#39975](https://github.com/apache/doris/pull/39975)

- より堅牢にするため、オンラインディスクサービスからのクエリを優先します。[#39467](https://github.com/apache/doris/pull/39467)

- 行の削除サインがマークされている場合、非厳密モード部分更新で新しく挿入された行のチェックをスキップします。[#40322](https://github.com/apache/doris/pull/40322)

- FE OOMを防ぐため、バックアップタスクのタブレット数を制限し、デフォルト値を300,000に設定しました。[#39987](https://github.com/apache/doris/pull/39987)

### パフォーマンス

- 並行カラム更新とcompactionによって引き起こされる遅いカラム更新を最適化しました。[#38487](https://github.com/apache/doris/pull/38487)

- フィルタ条件にNullLiteralが存在する場合、Falseに折りたたんでさらにEmptySetに変換し、不要なデータスキャンと計算を削減できるようになりました。[#38135](https://github.com/apache/doris/pull/38135)

- `ORDER BY`の並べ替えのパフォーマンスを改善しました。[#38985](https://github.com/apache/doris/pull/38985)

- 転置インデックスでの文字列処理のパフォーマンスを改善しました。[#37395](https://github.com/apache/doris/pull/37395)

### オプティマイザーと統計

- セミコロンで始まるステートメントのサポートを追加しました。[#39399](https://github.com/apache/doris/pull/39399)

- 集計関数シグネチャマッチングを改良しました。[#39352](https://github.com/apache/doris/pull/39352)

- スキーマ変更後にカラム統計を削除し、自動分析をトリガーします。[#39101](https://github.com/apache/doris/pull/39101)

- `DROP CACHED STATS table_name`を使用したキャッシュされた統計の削除をサポートしました。[#39367](https://github.com/apache/doris/pull/39367)

### マルチカタログとその他

- クライアント作成の頻度を減らすためにJDBC カタログのリフレッシュを最適化しました。[#40261](https://github.com/apache/doris/pull/40261)

- 特定の条件下でのJDBC カタログのスレッドリークを修正しました。[#39423](https://github.com/apache/doris/pull/39423)

- ARRAY MAP STRUCT型で`REPLACE_IF_NOT_NULL`がサポートされました。[#38304](https://github.com/apache/doris/pull/38304)

- `DELETE_INVALID_XXX`以外の失敗に対してdeleteジョブを再試行します。[#37834](https://github.com/apache/doris/pull/37834)

**謝辞**

@924060929, @BePPPower, @BiteTheDDDDt, @CalvinKirs, @GoGoWen, @HappenLee, @Jibing-Li, @Johnnyssc, @LiBinfeng-01, @Mryange, @SWJTU-ZhangLei, @TangSiyang2001, @Toms1999, @Vallishp, @Yukang-Lian, @airborne12, @amorynan, @bobhan1, @cambyzju, @csun5285, @dataroaring, @eldenmoon, @englefly, @feiniaofeiafei, @hello-stephen, @htyoung, @hubgeter, @justfortaste, @liaoxin01, @liugddx, @liutang123, @luwei16, @mongo360, @morrySnow, @qidaye, @smallx, @sollhui, @starocean999, @w41ter, @xiaokang, @xzj7019, @yujun777, @zclllyybb, @zddr, @zhangstar333, @zhannngchen, @zy-kkk, @zzzxl1993
