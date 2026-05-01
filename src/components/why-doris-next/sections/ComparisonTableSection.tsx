import React, { JSX } from 'react';
import './ComparisonTableSection.scss';

export interface TableRow {
    label: string;
    doris: string[];
    competitor: string[];
    dorisStrong: boolean[];
}

export interface ComparisonTableSectionProps {
    rows: TableRow[];
    sub: string;
    competitorName: string;
    competitorMark: string;
}

// The `--ch` SCSS modifier was originally the "ClickHouse column" modifier;
// since the page only ever shows one competitor at a time, we reuse it as
// the generic "competitor column" treatment to avoid touching styles.
export function ComparisonTableSection({
    rows,
    sub,
    competitorName,
    competitorMark,
}: ComparisonTableSectionProps): JSX.Element {
    return (
        <section className="cmp-next__card cmp-tbl">
            <div className="cmp-next__card-head">
                <p className="cmp-next__card-sub">{sub}</p>
            </div>

            <div className="cmp-tbl__wrap">
                <div className="cmp-tbl__head">
                    <div className="cmp-tbl__col">
                        <span className="cmp-tbl__col-label">DIMENSION</span>
                    </div>
                    <div className="cmp-tbl__col">
                        <span className="cmp-tbl__col-name cmp-tbl__col-name--doris">
                            <span className="cmp-tbl__col-mark cmp-tbl__col-mark--doris">D</span>
                            Apache Doris
                            <span className="cmp-tbl__col-badge">RECOMMENDED</span>
                        </span>
                    </div>
                    <div className="cmp-tbl__col">
                        <span className="cmp-tbl__col-name cmp-tbl__col-name--ch">
                            <span className="cmp-tbl__col-mark cmp-tbl__col-mark--ch">{competitorMark}</span>
                            {competitorName}
                        </span>
                    </div>
                </div>

                {rows.map((row, i) => (
                    <div key={row.label} className="cmp-tbl__row">
                        <div className="cmp-tbl__cell cmp-tbl__cell--label">
                            <span className="cmp-tbl__label-num">0{i + 1}</span>
                            <span className="cmp-tbl__label-text">{row.label}</span>
                        </div>
                        <div className="cmp-tbl__cell cmp-tbl__cell--doris">
                            <span className="cmp-tbl__cell-tag cmp-tbl__cell-tag--doris" aria-hidden="true">
                                <span className="cmp-tbl__cell-tag-mark">D</span>
                                Apache Doris
                            </span>
                            <ul className="cmp-tbl__bullets">
                                {row.doris.map((b, j) => (
                                    <li key={j}>
                                        {row.dorisStrong[j] ? <strong>{b}</strong> : b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="cmp-tbl__cell cmp-tbl__cell--ch">
                            <span className="cmp-tbl__cell-tag cmp-tbl__cell-tag--ch" aria-hidden="true">
                                <span className="cmp-tbl__cell-tag-mark">{competitorMark}</span>
                                {competitorName}
                            </span>
                            <ul className="cmp-tbl__bullets">
                                {row.competitor.map((b, j) => <li key={j}>{b}</li>)}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
