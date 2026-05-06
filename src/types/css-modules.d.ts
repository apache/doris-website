// Ambient declaration for SCSS Modules (`*.module.scss`).
// Docusaurus's `@docusaurus/module-type-aliases` only declares `*.module.css`,
// so without this file TS reports TS2307 on every `import styles from './X.module.scss'`.
declare module '*.module.scss' {
    const classes: { [key: string]: string };
    export default classes;
}
