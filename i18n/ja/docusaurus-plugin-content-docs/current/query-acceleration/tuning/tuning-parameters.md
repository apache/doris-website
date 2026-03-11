---
{
  "title": "共通チューニングパラメータ",
  "language": "ja",
  "description": "クエリ実行の最適化、バージョンアップグレードの管理、およびSQLデータベースにおける適応的並列処理戦略の実装のために、enable_nereids_planner、parallel_pipeline_task_num、runtime_filter_modeを含む主要なデータベースパフォーマンスチューニングパラメータを習得する。"
}
---
| Parameter                  | 詳細                | Default Value | Usage シナリオ                                               |
| -------------------------- | -------------------------- | ------------- | ------------------------------------------------------------ |
| enable_nereids_planner     | 新しいオプティマイザーを有効にするかどうか | TRUE          | 低バージョンからのアップグレードなどのシナリオでは、最初はfalseに設定し、アップグレード後にtrueに設定することができます |
| enable_nereids_dml         | 新しいオプティマイザーのDMLサポートを有効にするかどうか | TRUE          | 低バージョンからのアップグレードなどのシナリオでは、最初はfalseに設定し、アップグレード後にtrueに設定することができます |
| parallel_pipeline_task_num | Pipelineの並列性 | 0             | 低バージョンからのアップグレードなどのシナリオでは、この値は以前固定値に設定されていました。アップグレード後は0に設定することができ、システムの適応戦略が並列性を決定することを示します |
| runtime_filter_mode        | Runtime Filterタイプ | GLOBAL        | 低バージョンからのアップグレードなどのシナリオでは、この値はNONEで、Runtime Filterが有効になっていないことを示していました。アップグレード後はGLOBALに設定することができ、Runtime Filterがデフォルトで有効になることを示します |
