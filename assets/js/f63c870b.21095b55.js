"use strict";(self.webpackChunkdoris_website=self.webpackChunkdoris_website||[]).push([["372083"],{701161:function(e,a,r){r.r(a),r.d(a,{default:()=>m,frontMatter:()=>d,metadata:()=>i,assets:()=>c,toc:()=>p,contentTitle:()=>l});var i=JSON.parse('{"id":"how-to-contribute/community-badges","title":"Claim Your Apache Doris Community Badge","description":"How Apache Doris contributors claim the digital Contributor Badge on Holopin, how committers and PMC members receive theirs from the PMC, how to show a badge on GitHub and LinkedIn, and how to apply for the physical badge. Overview of all five Apache Doris community badges.","source":"@site/community/how-to-contribute/community-badges.mdx","sourceDirName":"how-to-contribute","slug":"/how-to-contribute/community-badges","permalink":"/community/how-to-contribute/community-badges","draft":false,"unlisted":false,"tags":[],"version":"current","lastUpdatedAt":1789631116000,"frontMatter":{"title":"Claim Your Apache Doris Community Badge","sidebar_label":"Community Badges","language":"en","description":"How Apache Doris contributors claim the digital Contributor Badge on Holopin, how committers and PMC members receive theirs from the PMC, how to show a badge on GitHub and LinkedIn, and how to apply for the physical badge. Overview of all five Apache Doris community badges.","keywords":["Apache Doris","community badge","contributor badge","committer badge","PMC member badge","Holopin","physical badge","contributor recognition","open source contribution"],"last_update":{"date":"2026-09-17T15:45:16+08:00"}},"sidebar":"community","previous":{"title":"Community Contribution Guide","permalink":"/community/how-to-contribute/contribute-to-doris"},"next":{"title":"Pull Request","permalink":"/community/how-to-contribute/pull-request"}}'),o=r("785893"),t=r("250065"),n=r("247902"),s=r("905525");let d={title:"Claim Your Apache Doris Community Badge",sidebar_label:"Community Badges",language:"en",description:"How Apache Doris contributors claim the digital Contributor Badge on Holopin, how committers and PMC members receive theirs from the PMC, how to show a badge on GitHub and LinkedIn, and how to apply for the physical badge. Overview of all five Apache Doris community badges.",keywords:["Apache Doris","community badge","contributor badge","committer badge","PMC member badge","Holopin","physical badge","contributor recognition","open source contribution"],last_update:{date:"2026-09-17T15:45:16+08:00"}},l=void 0,c={},p=[{value:"The five community badges",id:"badges",level:2},{value:"Get your digital badge",id:"digital-badge",level:2},{value:"Add the passphrase to your GitHub profile README",id:"step-1",level:3},{value:"Fill out the claim form",id:"step-2",level:3},{value:"Committer or PMC Member? Start here",id:"committer-pmc-badges",level:3},{value:"Claim it on Holopin",id:"step-3",level:3},{value:"Show off your badge",id:"step-4",level:3},{value:"Want the physical badge too? Two more steps",id:"physical-badge",level:2},{value:"Share your badge on LinkedIn",id:"step-5",level:3},{value:"Submit your shipping details",id:"step-6",level:3},{value:"Questions?",id:"questions",level:2}];function h(e){let a={a:"a",admonition:"admonition",blockquote:"blockquote",code:"code",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,t.a)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)("style",{children:`
/* ---------- hero ---------- */
.badge-hero {
display: grid;
grid-template-columns: 230px minmax(0, 1fr);
gap: 8px 32px;
align-items: center;
margin: 8px 0 32px;
padding: 28px 32px 24px 28px;
border: 1px solid var(--brand-border-soft, #D9EEE8);
border-radius: 12px;
background: linear-gradient(135deg, var(--brand-surface-soft, #F4FBF8), var(--brand-surface-note, #E8FAF5));
}

.badge-hero-image {
width: 230px;
height: auto;
filter: drop-shadow(0 10px 18px rgba(6, 70, 50, 0.18));
}

.badge-hero-eyebrow {
margin: 0 0 8px;
font-size: 0.72rem;
font-weight: 700;
letter-spacing: 0.1em;
text-transform: uppercase;
color: var(--brand-primary-deep, #0B7A58);
}

.badge-hero-lead {
margin: 0 0 10px;
font-size: 1.35rem;
font-weight: 700;
line-height: 1.3;
color: var(--ifm-font-color-base);
}

.badge-hero-desc {
margin: 0 0 16px;
max-width: 52ch;
line-height: 1.6;
}

.badge-eligibility {
display: flex;
gap: 12px;
align-items: flex-start;
margin: 0 0 18px;
padding: 12px 14px;
border: 1px solid var(--brand-border-soft, #D9EEE8);
border-radius: 8px;
background: var(--ifm-background-surface-color);
}

.badge-eligibility-tick {
flex: none;
display: grid;
place-items: center;
width: 26px;
height: 26px;
border-radius: 50%;
background: var(--ifm-color-primary);
color: #fff;
font-size: 0.95rem;
font-weight: 800;
}

.badge-eligibility strong {
display: block;
font-size: 0.95rem;
}

.badge-eligibility span:not(.badge-eligibility-tick) {
font-size: 0.875rem;
color: var(--ifm-color-emphasis-700);
}

.badge-hero-cta {
display: flex;
flex-wrap: wrap;
align-items: center;
gap: 12px;
}

.badge-hero-note {
flex-basis: 100%;
font-size: 0.875rem;
color: var(--ifm-color-emphasis-700);
}

.badge-journey {
grid-column: 1 / -1;
display: flex;
flex-wrap: wrap;
align-items: center;
gap: 8px 10px;
margin-top: 18px;
padding-top: 16px;
border-top: 1px dashed var(--brand-border-soft, #D9EEE8);
font-size: 0.85rem;
}

.badge-journey-stage {
display: inline-flex;
align-items: center;
gap: 8px;
padding: 5px 12px 5px 6px;
border: 1px solid var(--brand-border-soft, #D9EEE8);
border-radius: 999px;
background: var(--ifm-background-surface-color);
}

.badge-journey-stage i {
padding: 2px 8px;
border-radius: 999px;
background: var(--brand-surface-note, #E8FAF5);
color: var(--brand-primary-deep, #0B7A58);
font-style: normal;
font-size: 0.7rem;
font-weight: 700;
letter-spacing: 0.04em;
}

.badge-journey-arrow {
color: var(--ifm-color-primary);
font-weight: 700;
}

.badge-journey-hint {
font-size: 0.75rem;
color: var(--ifm-color-emphasis-700);
}

/* ---------- badge family ---------- */
.badge-family {
display: grid;
grid-template-columns: repeat(5, minmax(0, 1fr));
gap: 12px;
margin: 18px 0 8px;
}

.badge-card {
display: grid;
grid-template-rows: auto auto 1fr auto;
gap: 6px;
justify-items: center;
padding: 16px 10px 14px;
border: 1px solid var(--ifm-color-emphasis-200);
border-radius: 10px;
background: var(--ifm-background-surface-color);
color: var(--ifm-font-color-base);
text-align: center;
text-decoration: none;
}

.markdown a.badge-card,
.markdown a.badge-card:hover {
color: var(--ifm-font-color-base);
text-decoration: none;
}

a.badge-card:hover {
border-color: var(--ifm-color-primary);
}

.badge-card--open {
border-color: var(--ifm-color-primary);
box-shadow: 0 0 0 3px var(--brand-surface-note, #E8FAF5);
}

.badge-card img {
width: 104px;
height: 104px;
}

.badge-card strong {
font-size: 0.9rem;
line-height: 1.25;
}

.badge-card span {
font-size: 0.76rem;
line-height: 1.4;
color: var(--ifm-color-emphasis-700);
}

.badge-chip {
display: inline-block;
margin-top: 4px;
padding: 3px 9px;
border: 1px solid var(--ifm-color-emphasis-300);
border-radius: 999px;
background: var(--ifm-color-emphasis-100);
color: var(--ifm-color-emphasis-700);
font-style: normal;
font-size: 0.68rem;
font-weight: 700;
letter-spacing: 0.04em;
text-transform: uppercase;
}

.badge-chip--open {
border-color: var(--ifm-color-primary);
background: var(--ifm-color-primary);
color: #fff;
}

/* ---------- step cards ---------- */
.badge-steps {
display: grid;
margin: 8px 0 24px;
}

.badge-step {
position: relative;
display: grid;
grid-template-columns: 52px minmax(0, 1fr);
gap: 0 18px;
padding-bottom: 22px;
}

.badge-step::before {
content: "";
position: absolute;
left: 25px;
top: 52px;
bottom: 0;
width: 2px;
background: var(--ifm-color-emphasis-300);
}

.badge-step:last-child {
padding-bottom: 0;
}

.badge-step:last-child::before {
display: none;
}

.badge-step-number {
display: grid;
place-items: center;
width: 52px;
height: 52px;
border-radius: 50%;
background: var(--ifm-color-primary);
color: #fff;
font-size: 1.2rem;
font-weight: 800;
box-shadow: 0 0 0 5px var(--ifm-background-color);
}

.badge-steps--optional .badge-step-number {
border: 3px solid var(--ifm-color-primary);
background: var(--ifm-background-surface-color);
color: var(--ifm-color-primary);
}

.badge-step-body {
padding: 18px 22px 20px;
border: 1px solid var(--ifm-color-emphasis-200);
border-radius: 10px;
background: var(--ifm-background-surface-color);
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.markdown .badge-step-body h3 {
margin-top: 0;
margin-bottom: 0.5rem !important;
font-size: 1.1rem;
}

.markdown .badge-step-body > :last-child {
margin-bottom: 0 !important;
}

.badge-step-action {
display: flex;
flex-wrap: wrap;
align-items: center;
gap: 12px;
margin: 14px 0 0;
}

.badge-step-action span {
font-size: 0.875rem;
color: var(--ifm-color-emphasis-700);
}

.badge-step-why {
margin: 12px 0 0;
font-size: 0.875rem;
line-height: 1.55;
color: var(--ifm-color-emphasis-700);
}

.badge-step-scope {
display: inline-block;
margin: 0 0 10px;
padding: 3px 9px;
border-radius: 999px;
background: var(--brand-surface-note, #E8FAF5);
color: var(--brand-primary-deep, #0B7A58);
font-size: 0.68rem;
font-weight: 700;
letter-spacing: 0.06em;
text-transform: uppercase;
}

/* where committers and PMC members join the timeline */
.badge-step--entry .badge-step-number {
border: 3px solid var(--ifm-color-primary);
background: var(--ifm-background-surface-color);
color: var(--ifm-color-primary);
font-size: 0.72rem;
letter-spacing: 0.04em;
}

.badge-step--entry .badge-step-body {
border-color: var(--brand-border-soft, #D9EEE8);
background: var(--brand-surface-soft, #F4FBF8);
}

/* checklist */
.markdown .badge-checklist {
display: grid;
gap: 6px;
margin: 10px 0 0 !important;
padding: 12px 16px;
border: 1px solid var(--brand-border-soft, #D9EEE8);
border-radius: 8px;
background: var(--brand-surface-soft, #F4FBF8);
list-style: none;
}

.markdown .badge-checklist li {
display: flex;
gap: 10px;
align-items: flex-start;
font-size: 0.95rem;
}

.markdown .badge-checklist li::before {
content: "\u{2713}";
flex: none;
display: grid;
place-items: center;
width: 20px;
height: 20px;
margin-top: 3px;
border-radius: 50%;
background: var(--ifm-color-primary);
color: #fff;
font-size: 0.75rem;
font-weight: 800;
}

.markdown .badge-checklist li.badge-checklist-label {
font-size: 0.72rem;
font-weight: 700;
letter-spacing: 0.08em;
text-transform: uppercase;
color: var(--brand-primary-deep, #0B7A58);
}

.markdown .badge-checklist li.badge-checklist-label::before {
display: none;
}

.markdown .badge-linkedin {
color: #0A66C2;
font-weight: 600;
}

/* screenshots */
.badge-shot {
margin: 14px 0 0;
overflow: hidden;
border: 1px solid var(--ifm-color-emphasis-300);
border-radius: 8px;
background: var(--ifm-background-surface-color);
}

.badge-shot img {
display: block;
width: 100%;
}

.badge-shot figcaption {
padding: 6px 10px;
border-top: 1px solid var(--ifm-color-emphasis-200);
font-size: 0.78rem;
color: var(--ifm-color-emphasis-700);
}

.badge-shot--narrow {
width: 360px;
max-width: 100%;
}

.badge-shots {
display: grid;
grid-template-columns: repeat(2, minmax(0, 1fr));
gap: 12px;
margin: 14px 0 0;
}

.badge-shots .badge-shot {
margin: 0;
}

/* show-off tabs */
.markdown .badge-ministeps ol {
display: grid;
gap: 8px;
padding-left: 0;
list-style: none;
counter-reset: badge-ministep;
}

.markdown .badge-ministeps li {
position: relative;
padding-left: 36px;
counter-increment: badge-ministep;
}

.markdown .badge-ministeps li::before {
content: counter(badge-ministep, lower-alpha);
position: absolute;
left: 0;
top: 0;
display: grid;
place-items: center;
width: 26px;
height: 26px;
border: 2px solid var(--ifm-color-primary);
border-radius: 50%;
color: var(--ifm-color-primary);
font-size: 0.8rem;
font-weight: 700;
}

.markdown .badge-where {
display: flex;
flex-wrap: wrap;
gap: 8px;
margin: 12px 0 0 !important;
padding: 0;
list-style: none;
}

.markdown .badge-where li {
padding: 4px 12px;
border: 1px solid var(--ifm-color-emphasis-300);
border-radius: 999px;
background: var(--ifm-background-surface-color);
font-size: 0.875rem;
}

/* questions */
.badge-questions {
display: grid;
grid-template-columns: minmax(0, 1fr) auto;
gap: 16px;
align-items: center;
margin: 0 0 8px;
padding: 16px 20px;
border-radius: 10px;
}

.badge-questions {
border: 1px solid var(--ifm-color-emphasis-200);
background: var(--ifm-color-emphasis-100);
}

.badge-questions-title {
display: block;
margin: 0 0 4px;
font-size: 1rem;
font-weight: 700;
color: var(--ifm-font-color-base);
}

.badge-questions-text {
margin: 0;
font-size: 0.95rem;
line-height: 1.55;
}

/* buttons: the site's .markdown a rule (markdown.scss) outranks Infima's .button color, so restate it */
.markdown .badge-button,
.markdown .badge-button:hover,
.markdown .badge-button:active {
color: var(--ifm-button-color);
}

/* Infima's primary hover uses --ifm-color-primary-dark, which is a blue leftover on this site */
.badge-button.button--primary:not(.button--outline):hover,
.badge-button.button--primary:not(.button--outline):active {
--ifm-button-background-color: var(--brand-primary-deep, #0B7A58);
--ifm-button-border-color: var(--brand-primary-deep, #0B7A58);
}

.markdown .badge-questions-text,
.markdown .badge-closing-signature {
margin-bottom: 0 !important;
}

.markdown .badge-closing-text {
margin-bottom: 8px !important;
}

/* closing */
.badge-closing {
margin: 40px 0 0;
padding: 6px 0 6px 22px;
border-left: 4px solid var(--ifm-color-primary);
}

.badge-closing-text {
margin: 0 0 8px;
font-size: 1.05rem;
line-height: 1.6;
}

.badge-closing-signature {
margin: 10px 0 0;
font-size: 0.95rem;
font-weight: 700;
color: var(--ifm-font-color-base);
}

@media (max-width: 996px) {
.badge-family {
  display: flex;
  overflow-x: auto;
  padding-bottom: 6px;
  scroll-snap-type: x mandatory;
}

.badge-card {
  flex: 0 0 190px;
  scroll-snap-align: start;
}
}

@media (max-width: 700px) {
.badge-hero {
  grid-template-columns: 1fr;
  justify-items: start;
  padding: 22px 20px;
}

.badge-hero-image {
  width: 170px;
}

.badge-step {
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 0 12px;
}

.badge-step-number {
  width: 40px;
  height: 40px;
  font-size: 1rem;
}

.badge-step::before {
  left: 19px;
  top: 40px;
}

.badge-step-body {
  padding: 14px 16px 16px;
}

.badge-shots,
.badge-questions {
  grid-template-columns: 1fr;
}
}
`}),"\n",(0,o.jsxs)("div",{className:"badge-hero",children:[(0,o.jsx)("img",{className:"badge-hero-image",src:"/images/community-badges/badge-contributor.png",alt:"Apache Doris Contributor badge",width:"230",height:"230"}),(0,o.jsxs)("div",{children:[(0,o.jsx)("div",{className:"badge-hero-eyebrow",children:"Apache Doris community badges \xb7 No closing date"}),(0,o.jsx)("div",{className:"badge-hero-lead",children:"Merged a pull request into Apache Doris? Claim your Contributor Badge."}),(0,o.jsx)("div",{className:"badge-hero-desc",children:"A digital badge for people who have contributed to Apache Doris. It lives on Holopin and costs nothing to claim. Post about it on LinkedIn afterwards and we'll mail you the physical version as well."}),(0,o.jsxs)("div",{className:"badge-eligibility",children:[(0,o.jsx)("span",{className:"badge-eligibility-tick","aria-hidden":"true",children:"\u2713"}),(0,o.jsxs)("div",{children:[(0,o.jsx)("strong",{children:"You qualify with a single merged pull request in the Apache Doris project."}),(0,o.jsx)("span",{children:"It doesn't matter how many PRs you have or how long ago they were merged. A docs fix from three years back counts."})]})]}),(0,o.jsxs)("div",{className:"badge-hero-cta",children:[(0,o.jsx)("a",{className:"badge-button button button--primary button--lg",href:"#step-1",children:"Claim your digital badge \u2192"}),(0,o.jsxs)("span",{className:"badge-hero-note",children:["Already received a Holopin invitation from us? Jump straight to ",(0,o.jsx)("a",{href:"#step-3",children:"step 3"}),"."]})]})]}),(0,o.jsxs)("div",{className:"badge-journey","aria-label":"How the program works",children:[(0,o.jsxs)("span",{className:"badge-journey-stage",children:[(0,o.jsx)("i",{children:"Steps 1-3"})," Digital badge"]}),(0,o.jsx)("span",{className:"badge-journey-arrow","aria-hidden":"true",children:"\u2192"}),(0,o.jsxs)("span",{className:"badge-journey-stage",children:[(0,o.jsx)("i",{children:"Step 4"})," Show it off"]}),(0,o.jsx)("span",{className:"badge-journey-arrow","aria-hidden":"true",children:"\u2192"}),(0,o.jsxs)("span",{className:"badge-journey-stage",children:[(0,o.jsx)("i",{children:"Steps 5-6"})," Physical badge"]}),(0,o.jsx)("span",{className:"badge-journey-hint",children:"Steps 5 and 6 are optional and come after you've claimed the digital badge."})]})]}),"\n",(0,o.jsx)(a.h2,{id:"badges",children:"The five community badges"}),"\n",(0,o.jsx)(a.p,{children:"Each badge recognizes a different kind of contribution. You can claim the Contributor badge today. The Committer and PMC Member badges are sent out by the PMC, so there is nothing to apply for. The two 2026 badges are awarded by the community, and we'll add the criteria and the process for each one to this page once they're settled."}),"\n",(0,o.jsxs)("div",{className:"badge-family",children:[(0,o.jsxs)("a",{className:"badge-card badge-card--open",href:"#digital-badge",children:[(0,o.jsx)("img",{src:"/images/community-badges/badge-contributor.png",alt:"Apache Doris Contributor badge",width:"104",height:"104"}),(0,o.jsx)("strong",{children:"Contributor"}),(0,o.jsx)("span",{children:"Code, docs, ideas or other work, with at least one PR merged."}),(0,o.jsx)("em",{className:"badge-chip badge-chip--open",children:"Open now"})]}),(0,o.jsxs)("a",{className:"badge-card badge-card--open",href:"#committer-pmc-badges",children:[(0,o.jsx)("img",{src:"/images/community-badges/badge-committer.png",alt:"Apache Doris Committer badge",width:"104",height:"104"}),(0,o.jsx)("strong",{children:"Committer"}),(0,o.jsx)("span",{children:"Commit access, earned through sustained and trusted contributions."}),(0,o.jsx)("em",{className:"badge-chip badge-chip--open",children:"Open now"})]}),(0,o.jsxs)("a",{className:"badge-card badge-card--open",href:"#committer-pmc-badges",children:[(0,o.jsx)("img",{src:"/images/community-badges/badge-pmc-member.png",alt:"Apache Doris PMC Member badge",width:"104",height:"104"}),(0,o.jsx)("strong",{children:"PMC Member"}),(0,o.jsx)("span",{children:"Guides the project's technical direction and community governance."}),(0,o.jsx)("em",{className:"badge-chip badge-chip--open",children:"Open now"})]}),(0,o.jsxs)("div",{className:"badge-card",children:[(0,o.jsx)("img",{src:"/images/community-badges/badge-active-contributor-2026.png",alt:"Apache Doris Active Contributor 2026 badge",width:"104",height:"104"}),(0,o.jsx)("strong",{children:"Active Contributor 2026"}),(0,o.jsx)("span",{children:"Consistent and impactful contributions during the year."}),(0,o.jsx)("em",{className:"badge-chip",children:"Coming soon"})]}),(0,o.jsxs)("div",{className:"badge-card",children:[(0,o.jsx)("img",{src:"/images/community-badges/badge-community-champion-2026.png",alt:"Apache Doris Community Champion 2026 badge",width:"104",height:"104"}),(0,o.jsx)("strong",{children:"Community Champion 2026"}),(0,o.jsx)("span",{children:"Major features, user stories, talks, events or other community initiatives."}),(0,o.jsx)("em",{className:"badge-chip",children:"Coming soon"})]})]}),"\n","\n",(0,o.jsx)(a.h2,{id:"digital-badge",children:"Get your digital badge"}),"\n",(0,o.jsxs)(a.p,{children:["Contributors go through all four steps. We check every claim by hand before Holopin sends the invitation, so the first two prove the GitHub account is yours. Committers and PMC members skip those two: the PMC sends your invitation, so you ",(0,o.jsx)(a.a,{href:"#committer-pmc-badges",children:"join at step 3"}),"."]}),"\n",(0,o.jsxs)("div",{className:"badge-steps",children:[(0,o.jsxs)("div",{className:"badge-step",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"1"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)("span",{className:"badge-step-scope",children:"Contributor badge only"}),(0,o.jsx)(a.h3,{id:"step-1",children:"Add the passphrase to your GitHub profile README"}),(0,o.jsxs)(a.p,{children:["Temporarily add this line anywhere in your profile README (the ",(0,o.jsx)(a.code,{children:"username/username"})," repository):"]}),(0,o.jsx)(a.pre,{children:(0,o.jsx)(a.code,{className:"language-text",children:"Apache Doris Community Badge\n"})}),(0,o.jsxs)("div",{className:"badge-step-why",children:[(0,o.jsx)("strong",{children:"Why?"})," Anyone can type a GitHub ID into a form, so we need proof that the account is yours. Once you have your badge, delete the line and put the badge there instead."]})]})]}),(0,o.jsxs)("div",{className:"badge-step",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"2"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)("span",{className:"badge-step-scope",children:"Contributor badge only"}),(0,o.jsx)(a.h3,{id:"step-2",children:"Fill out the claim form"}),(0,o.jsx)(a.p,{children:"We need two things: your GitHub ID, so we can find the merged PR, and an email address for the badge invitation."}),(0,o.jsxs)("div",{className:"badge-step-action",children:[(0,o.jsx)("a",{className:"badge-button button button--primary",href:"https://forms.gle/xTcnWLqDuBeFfnAD8",target:"_blank",rel:"noopener noreferrer",children:"Open the claim form \u2192"}),(0,o.jsx)("span",{children:"Takes about a minute."})]})]})]}),(0,o.jsxs)("div",{className:"badge-step badge-step--entry",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"PMC"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)(a.h3,{id:"committer-pmc-badges",children:"Committer or PMC Member? Start here"}),(0,o.jsxs)(a.p,{children:["You don't apply for these two badges. The Doris PMC goes through the official ",(0,o.jsx)(a.a,{href:"https://people.apache.org/committers-by-project.html#doris",children:"committer"})," and ",(0,o.jsx)(a.a,{href:"https://projects.apache.org/committee.html?doris",children:"PMC member"})," lists and sends everyone on them a Holopin invitation directly. Committers receive the Committer badge; PMC members receive both the PMC Member and the Committer badge. When the email arrives, continue from step 3. From there on, showing the badge off and applying for the physical one work the same as for the Contributor badge."]}),(0,o.jsx)(a.p,{children:"Want the Contributor badge as well? You qualify like anyone with a merged pull request, so claim it through steps 1 and 2."}),(0,o.jsxs)("div",{className:"badge-step-why",children:["Nothing in your inbox yet? Check your Promotions tab and Spam folder first, then ask us in ",(0,o.jsx)("a",{href:"#questions",children:"Slack"}),"."]})]})]}),(0,o.jsxs)("div",{className:"badge-step",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"3"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)(a.h3,{id:"step-3",children:"Claim it on Holopin"}),(0,o.jsxs)(a.p,{children:["Holopin will email you an invitation: for the Contributor badge once we've checked your PR, and for the Committer and PMC Member badges once the PMC has sent it. Click ",(0,o.jsx)(a.strong,{children:"Claim Badge"})," and sign in with GitHub. If you don't have a Holopin account yet, creating one is free."]}),(0,o.jsx)(a.p,{children:"Can't find the email? Check your Promotions tab or Spam folder, since Holopin's invitations sometimes end up there."}),(0,o.jsxs)("figure",{className:"badge-shot badge-shot--narrow",children:[(0,o.jsx)("img",{src:"/images/community-badges/holopin-claim.jpg",alt:"Holopin claim screen showing the Apache Doris badge and a Claim button"}),(0,o.jsx)("figcaption",{children:"The Holopin claim screen"})]}),(0,o.jsx)("div",{className:"badge-step-why",children:"The badge then sits on your Holopin credential page, which anyone can open to check it, so you can link to it from wherever you like."})]})]}),(0,o.jsxs)("div",{className:"badge-step",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"4"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)(a.h3,{id:"step-4",children:"Show off your badge"}),(0,o.jsx)(a.p,{children:"The badge is the community's way of saying your work mattered. Put it wherever you like."}),(0,o.jsxs)(n.Z,{groupId:"badge-showoff",children:[(0,o.jsxs)(s.Z,{value:"github",label:"GitHub profile",default:!0,children:[(0,o.jsx)("div",{className:"badge-ministeps",children:(0,o.jsxs)(a.ol,{children:["\n",(0,o.jsxs)(a.li,{children:["On Holopin, open ",(0,o.jsx)(a.strong,{children:"Your Profile"}),"."]}),"\n",(0,o.jsxs)(a.li,{children:["Add your Apache Doris badge to your ",(0,o.jsx)(a.strong,{children:"Board"}),". Move, resize, or rotate it if you have several badges."]}),"\n",(0,o.jsx)(a.li,{children:"Copy the code shown under your Board and paste it into your GitHub profile README."}),"\n"]})}),(0,o.jsxs)(a.p,{children:["The code is a single line of Markdown. Here is the one for the ",(0,o.jsx)(a.code,{children:"morningman"})," account; yours will carry your own username:"]}),(0,o.jsx)(a.pre,{children:(0,o.jsx)(a.code,{className:"language-markdown",children:"[![An image of @morningman's Holopin badges, which is a link to view their full Holopin profile](https://holopin.me/morningman)](https://holopin.io/@morningman)\n"})}),(0,o.jsxs)(a.p,{children:["To see it in place, open ",(0,o.jsx)(a.a,{href:"https://github.com/morningman",children:"github.com/morningman"})," and the ",(0,o.jsx)(a.a,{href:"https://github.com/morningman/morningman/blob/main/README.md",children:"README behind it"}),"."]}),(0,o.jsxs)("div",{className:"badge-shots",children:[(0,o.jsxs)("figure",{className:"badge-shot",children:[(0,o.jsx)("img",{src:"/images/community-badges/holopin-board-embed-code.jpg",alt:"Holopin board with the embed code shown below it"}),(0,o.jsx)("figcaption",{children:"Copy the embed code under your Board"})]}),(0,o.jsxs)("figure",{className:"badge-shot",children:[(0,o.jsx)("img",{src:"/images/community-badges/github-profile-badge.jpg",alt:"GitHub profile README showing the Apache Doris Contributor badge"}),(0,o.jsx)("figcaption",{children:"The badge on a GitHub profile"})]})]})]}),(0,o.jsxs)(s.Z,{value:"linkedin",label:"LinkedIn",children:[(0,o.jsxs)(a.p,{children:["Add it under ",(0,o.jsx)(a.strong,{children:"Licenses & Certifications"})," on your LinkedIn profile:"]}),(0,o.jsxs)(a.ul,{children:["\n",(0,o.jsx)(a.li,{children:"Name: Apache Doris Contributor (or Committer / PMC Member, whichever badge you hold)"}),"\n",(0,o.jsx)(a.li,{children:"Issuing organization: Apache Doris"}),"\n",(0,o.jsx)(a.li,{children:"Credential URL: your Holopin badge link"}),"\n"]}),(0,o.jsxs)("figure",{className:"badge-shot",children:[(0,o.jsx)("img",{src:"/images/community-badges/linkedin-certification.jpg",alt:"LinkedIn Licenses and Certifications entry for the Apache Doris Contributor badge"}),(0,o.jsx)("figcaption",{children:"Licenses & Certifications on LinkedIn"})]}),(0,o.jsx)(a.p,{children:"You can also post about it. A single line with the badge image attached is enough, for example:"}),(0,o.jsxs)(a.blockquote,{children:["\n",(0,o.jsxs)(a.p,{children:["Happy to have received my Contributor Badge from the ",(0,o.jsx)("a",{className:"badge-linkedin",href:"https://www.linkedin.com/company/doris-apache",children:"@Apache Doris"})," community. ",(0,o.jsx)("span",{className:"badge-linkedin",children:"#ApacheDoris"})," ",(0,o.jsx)("span",{className:"badge-linkedin",children:"#ApacheDorisCommunityBadge"})]}),"\n"]}),(0,o.jsxs)(a.p,{children:["Swap in Committer or PMC Member if that's the badge you received. If you want the physical badge as well, this is the post ",(0,o.jsx)(a.a,{href:"#step-5",children:"step 5"})," asks for."]})]}),(0,o.jsxs)(s.Z,{value:"anywhere",label:"Anywhere else",children:[(0,o.jsx)(a.p,{children:"Your Holopin credential page is a stable link that anyone can check. Add it wherever a record of your contribution helps:"}),(0,o.jsxs)("ul",{className:"badge-where",children:[(0,o.jsx)("li",{children:"R\xe9sum\xe9 / CV"}),(0,o.jsx)("li",{children:"Personal website or portfolio"}),(0,o.jsx)("li",{children:"Other developer & community profiles"}),(0,o.jsx)("li",{children:"Conference speaker bios"})]})]})]})]})]})]}),"\n",(0,o.jsx)(a.h2,{id:"physical-badge",children:"Want the physical badge too? Two more steps"}),"\n",(0,o.jsx)(a.p,{children:"You can apply as soon as you've claimed your digital badge, since the LinkedIn post in step 5 needs to show it. Everyone who holds a digital badge is eligible, whether it's the Contributor, Committer, or PMC Member badge. We ship one physical badge per person, even if you hold more than one digital badge."}),"\n",(0,o.jsxs)("div",{className:"badge-steps badge-steps--optional",children:[(0,o.jsxs)("div",{className:"badge-step",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"5"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)(a.h3,{id:"step-5",children:"Share your badge on LinkedIn"}),(0,o.jsxs)(a.p,{children:["Write a LinkedIn post about your new badge. Say whatever you like: what you built or fixed, or how you ended up in the community in the first place. The only requirements are the three below. If you'd rather keep it short, the sample post under the LinkedIn tab in ",(0,o.jsx)(a.a,{href:"#step-4",children:"step 4"})," plus the badge image is enough."]}),(0,o.jsxs)("ul",{className:"badge-checklist",children:[(0,o.jsx)("li",{className:"badge-checklist-label",children:"Your post must include"}),(0,o.jsx)("li",{children:(0,o.jsxs)("span",{children:["A mention of the official ",(0,o.jsx)("a",{className:"badge-linkedin",href:"https://www.linkedin.com/company/doris-apache",children:"@Apache Doris"})," LinkedIn page"]})}),(0,o.jsx)("li",{children:(0,o.jsxs)("span",{children:["The hashtag ",(0,o.jsx)("span",{className:"badge-linkedin",children:"#ApacheDorisCommunityBadge"})]})}),(0,o.jsx)("li",{children:(0,o.jsx)("span",{children:"Your badge image or Holopin badge link"})})]}),(0,o.jsxs)("div",{className:"badge-shots",children:[(0,o.jsxs)("figure",{className:"badge-shot",children:[(0,o.jsx)("img",{src:"/images/community-badges/holopin-share.jpg",alt:"Holopin badge page with a Share on LinkedIn button"}),(0,o.jsx)("figcaption",{children:"Share straight from Holopin\u2026"})]}),(0,o.jsxs)("figure",{className:"badge-shot",children:[(0,o.jsx)("img",{src:"/images/community-badges/linkedin-post.jpg",alt:"LinkedIn post composer with the badge attached"}),(0,o.jsx)("figcaption",{children:"\u2026or write your own post"})]})]})]})]}),(0,o.jsxs)("div",{className:"badge-step",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"6"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)(a.h3,{id:"step-6",children:"Submit your shipping details"}),(0,o.jsx)(a.p,{children:"After publishing your post, fill in the physical badge form with the post link and your shipping address."}),(0,o.jsx)("div",{className:"badge-step-action",children:(0,o.jsx)("a",{className:"badge-button button button--primary",href:"https://forms.gle/cqG5SchErhoMDDB87",target:"_blank",rel:"noopener noreferrer",children:"Apply for the physical badge \u2192"})}),(0,o.jsx)("div",{className:"badge-step-why",children:"We'll check the post, then email you when we start preparing your shipment."})]})]})]}),"\n",(0,o.jsx)(a.admonition,{title:"Shipping is worldwide, but not guaranteed",type:"info",children:(0,o.jsx)(a.p,{children:"Delivery times vary a lot by country, and in some places customs rules or carrier restrictions can stop a package altogether. We'll do our best to get the badge to you, but we can't promise it will reach every address."})}),"\n",(0,o.jsx)(a.h2,{id:"questions",children:"Questions?"}),"\n",(0,o.jsxs)("div",{className:"badge-questions",children:[(0,o.jsxs)("div",{children:[(0,o.jsx)("span",{className:"badge-questions-title",children:"Join the Apache Doris Slack and ask us there."}),(0,o.jsx)("p",{className:"badge-questions-text",children:"The community team answers badge questions in Slack, including anything about the form or shipping."})]}),(0,o.jsx)("a",{className:"badge-button button button--primary",href:"https://doris.apache.org/slack?utm_source=website&utm_medium=docs&utm_content=community_badge",children:"Join the Slack community \u2192"})]}),"\n",(0,o.jsxs)("div",{className:"badge-closing",children:[(0,o.jsx)("p",{className:"badge-closing-text",children:"Some contributions are large and visible. Others are small fixes that quietly make someone's day a little easier. All of them are part of open source, and these badges are our way of saying thank you."}),(0,o.jsx)("p",{className:"badge-closing-text",children:"The program has no end date. Contribute whenever you like, and claim your badge once your pull request is merged."}),(0,o.jsx)("p",{className:"badge-closing-signature",children:"The Apache Doris Community"})]})]})}function m(e={}){let{wrapper:a}={...(0,t.a)(),...e.components};return a?(0,o.jsx)(a,{...e,children:(0,o.jsx)(h,{...e})}):h(e)}},905525:function(e,a,r){r.d(a,{Z:()=>t});var i=r("785893");r("667294");var o=r("74904");function t(e){let{children:a,hidden:r,className:t}=e;return(0,i.jsx)("div",{role:"tabpanel",className:(0,o.Z)("tabItem_Ymn6",t),hidden:r,children:a})}},247902:function(e,a,r){r.d(a,{Z:()=>x});var i=r("785893"),o=r("667294"),t=r("74904"),n=r("69599"),s=r("616550"),d=r("232000"),l=r("4520"),c=r("38341"),p=r("876009");function h(e){return o.Children.toArray(e).filter(e=>"\n"!==e).map(e=>{if(!e||o.isValidElement(e)&&function(e){let{props:a}=e;return!!a&&"object"==typeof a&&"value"in a}(e))return e;throw Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)})?.filter(Boolean)??[]}function m(e){let{value:a,tabValues:r}=e;return r.some(e=>e.value===a)}var g=r("7227");function b(e){let{className:a,block:r,selectedValue:o,selectValue:s,tabValues:d}=e,l=[],{blockElementScrollPositionUntilNextRender:c}=(0,n.o5)(),p=e=>{let a=e.currentTarget,r=d[l.indexOf(a)].value;r!==o&&(c(a),s(r))},h=e=>{let a=null;switch(e.key){case"Enter":p(e);break;case"ArrowRight":{let r=l.indexOf(e.currentTarget)+1;a=l[r]??l[0];break}case"ArrowLeft":{let r=l.indexOf(e.currentTarget)-1;a=l[r]??l[l.length-1]}}a?.focus()};return(0,i.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,t.Z)("tabs",{"tabs--block":r},a),children:d.map(e=>{let{value:a,label:r,attributes:n}=e;return(0,i.jsx)("li",{role:"tab",tabIndex:o===a?0:-1,"aria-selected":o===a,ref:e=>l.push(e),onKeyDown:h,onClick:p,...n,className:(0,t.Z)("tabs__item","tabItem_LNqP",n?.className,{"tabs__item--active":o===a}),children:r??a},a)})})}function u(e){let{lazy:a,children:r,selectedValue:n}=e,s=(Array.isArray(r)?r:[r]).filter(Boolean);if(a){let e=s.find(e=>e.props.value===n);return e?(0,o.cloneElement)(e,{className:(0,t.Z)("margin-top--md",e.props.className)}):null}return(0,i.jsx)("div",{className:"margin-top--md",children:s.map((e,a)=>(0,o.cloneElement)(e,{key:a,hidden:e.props.value!==n}))})}function f(e){let a=function(e){let{defaultValue:a,queryString:r=!1,groupId:i}=e,t=function(e){let{values:a,children:r}=e;return(0,o.useMemo)(()=>{let e=a??h(r).map(e=>{let{props:{value:a,label:r,attributes:i,default:o}}=e;return{value:a,label:r,attributes:i,default:o}});return!function(e){let a=(0,c.lx)(e,(e,a)=>e.value===a.value);if(a.length>0)throw Error(`Docusaurus error: Duplicate values "${a.map(e=>e.value).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e},[a,r])}(e),[n,g]=(0,o.useState)(()=>(function(e){let{defaultValue:a,tabValues:r}=e;if(0===r.length)throw Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(a){if(!m({value:a,tabValues:r}))throw Error(`Docusaurus error: The <Tabs> has a defaultValue "${a}" but none of its children has the corresponding value. Available values are: ${r.map(e=>e.value).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return a}let i=r.find(e=>e.default)??r[0];if(!i)throw Error("Unexpected error: 0 tabValues");return i.value})({defaultValue:a,tabValues:t})),[b,u]=function(e){let{queryString:a=!1,groupId:r}=e,i=(0,s.k6)(),t=function(e){let{queryString:a=!1,groupId:r}=e;if("string"==typeof a)return a;if(!1===a)return null;if(!0===a&&!r)throw Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return r??null}({queryString:a,groupId:r});return[(0,l._X)(t),(0,o.useCallback)(e=>{if(!t)return;let a=new URLSearchParams(i.location.search);a.set(t,e),i.replace({...i.location,search:a.toString()})},[t,i])]}({queryString:r,groupId:i}),[f,x]=function(e){let{groupId:a}=e,r=a?`docusaurus.tab.${a}`:null,[i,t]=(0,p.Nk)(r);return[i,(0,o.useCallback)(e=>{r&&t.set(e)},[r,t])]}({groupId:i}),y=(()=>{let e=b??f;return m({value:e,tabValues:t})?e:null})();return(0,d.Z)(()=>{y&&g(y)},[y]),{selectedValue:n,selectValue:(0,o.useCallback)(e=>{if(!m({value:e,tabValues:t}))throw Error(`Can't select invalid tab value=${e}`);g(e),u(e),x(e)},[u,x,t]),tabValues:t}}(e);return(0,i.jsxs)("div",{className:(0,t.Z)("tabs-container","tabList__CuJ"),children:[(0,i.jsx)(b,{...a,...e}),(0,i.jsx)(u,{...a,...e})]})}function x(e){let a=(0,g.Z)();return(0,i.jsx)(f,{...e,children:h(e.children)},String(a))}},38341:function(e,a,r){function i(e){let a=arguments.length>1&&void 0!==arguments[1]?arguments[1]:(e,a)=>e===a;return e.filter((r,i)=>e.findIndex(e=>a(e,r))!==i)}function o(e){return Array.from(new Set(e))}function t(e,a){let r={},i=0;for(let o of e){let e=a(o,i);r[e]??=[],r[e].push(o),i+=1}return r}r.d(a,{jj:function(){return o},lx:function(){return i},vM:function(){return t}})},250065:function(e,a,r){r.d(a,{Z:function(){return s},a:function(){return n}});var i=r(667294);let o={},t=i.createContext(o);function n(e){let a=i.useContext(t);return i.useMemo(function(){return"function"==typeof e?e(a):{...a,...e}},[a,e])}function s(e){let a;return a=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:n(e.components),i.createElement(t.Provider,{value:a},e.children)}}}]);