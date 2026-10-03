"use strict";(self.webpackChunkdoris_website=self.webpackChunkdoris_website||[]).push([["372083"],{701161:function(e,i,a){a.r(i),a.d(i,{default:()=>g,frontMatter:()=>l,metadata:()=>r,assets:()=>h,toc:()=>m,contentTitle:()=>c});var r=JSON.parse('{"id":"how-to-contribute/community-badges","title":"Claim Your Apache Doris Community Badge","description":"How Apache Doris contributors claim the digital Contributor Badge on Holopin, how committers and PMC members receive theirs from the PMC, how to show a badge on GitHub and LinkedIn, and how to apply for the physical badge. Overview of all five Apache Doris community badges.","source":"@site/community/how-to-contribute/community-badges.mdx","sourceDirName":"how-to-contribute","slug":"/how-to-contribute/community-badges","permalink":"/community/how-to-contribute/community-badges","draft":false,"unlisted":false,"tags":[],"version":"current","lastUpdatedAt":1790655338000,"frontMatter":{"title":"Claim Your Apache Doris Community Badge","sidebar_label":"Community Badges","language":"en","description":"How Apache Doris contributors claim the digital Contributor Badge on Holopin, how committers and PMC members receive theirs from the PMC, how to show a badge on GitHub and LinkedIn, and how to apply for the physical badge. Overview of all five Apache Doris community badges.","keywords":["Apache Doris","community badge","contributor badge","committer badge","PMC member badge","Holopin","physical badge","contributor recognition","open source contribution"],"last_update":{"date":"2026-09-29T12:15:38+08:00"}},"sidebar":"community","previous":{"title":"Community Contribution Guide","permalink":"/community/how-to-contribute/contribute-to-doris"},"next":{"title":"Pull Request","permalink":"/community/how-to-contribute/pull-request"}}'),o=a("785893"),t=a("250065"),n=a("247902"),s=a("905525"),d=a("132322");let l={title:"Claim Your Apache Doris Community Badge",sidebar_label:"Community Badges",language:"en",description:"How Apache Doris contributors claim the digital Contributor Badge on Holopin, how committers and PMC members receive theirs from the PMC, how to show a badge on GitHub and LinkedIn, and how to apply for the physical badge. Overview of all five Apache Doris community badges.",keywords:["Apache Doris","community badge","contributor badge","committer badge","PMC member badge","Holopin","physical badge","contributor recognition","open source contribution"],last_update:{date:"2026-09-29T12:15:38+08:00"}},c=void 0,h={},m=[{value:"The five community badges",id:"badges",level:2},{value:"Get your digital badge",id:"digital-badge",level:2},{value:"Add the passphrase to your GitHub profile README",id:"step-1",level:3},{value:"Fill out the claim form",id:"step-2",level:3},{value:"Committer or PMC Member? Start here",id:"committer-pmc-badges",level:3},{value:"Claim it on Holopin",id:"step-3",level:3},{value:"Show off your badge",id:"step-4",level:3},{value:"Want the physical badge too? Two more steps",id:"physical-badge",level:2},{value:"Share your badge on LinkedIn",id:"step-5",level:3},{value:"Submit your shipping details",id:"step-6",level:3},{value:"Questions?",id:"questions",level:2}];function p(e){let i={a:"a",admonition:"admonition",blockquote:"blockquote",code:"code",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,t.a)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)("style",{children:`
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
`}),"\n",(0,o.jsxs)("div",{className:"badge-hero",children:[(0,o.jsx)("img",{className:"badge-hero-image",src:"/images/community-badges/badge-contributor.png",alt:"Apache Doris Contributor badge",width:"230",height:"230"}),(0,o.jsxs)("div",{children:[(0,o.jsx)("div",{className:"badge-hero-eyebrow",children:"Apache Doris community badges \xb7 No closing date"}),(0,o.jsx)("div",{className:"badge-hero-lead",children:"Merged a pull request into Apache Doris? Claim your Contributor Badge."}),(0,o.jsx)("div",{className:"badge-hero-desc",children:"A digital badge for people who have contributed to Apache Doris. It lives on Holopin and costs nothing to claim. Post about it on LinkedIn afterwards and we'll mail you the physical version as well."}),(0,o.jsxs)("div",{className:"badge-eligibility",children:[(0,o.jsx)("span",{className:"badge-eligibility-tick","aria-hidden":"true",children:"\u2713"}),(0,o.jsxs)("div",{children:[(0,o.jsx)("strong",{children:"You qualify with a single merged pull request in the Apache Doris project."}),(0,o.jsx)("span",{children:"It doesn't matter how many PRs you have or how long ago they were merged. A docs fix from three years back counts."})]})]}),(0,o.jsxs)("div",{className:"badge-hero-cta",children:[(0,o.jsx)("a",{className:"badge-button button button--primary button--lg",href:"#step-1",children:"Claim your digital badge \u2192"}),(0,o.jsxs)("span",{className:"badge-hero-note",children:["Already received a Holopin invitation from us? Jump straight to ",(0,o.jsx)("a",{href:"#step-3",children:"step 3"}),"."]})]})]}),(0,o.jsxs)("div",{className:"badge-journey","aria-label":"How the program works",children:[(0,o.jsxs)("span",{className:"badge-journey-stage",children:[(0,o.jsx)("i",{children:"Steps 1-3"})," Digital badge"]}),(0,o.jsx)("span",{className:"badge-journey-arrow","aria-hidden":"true",children:"\u2192"}),(0,o.jsxs)("span",{className:"badge-journey-stage",children:[(0,o.jsx)("i",{children:"Step 4"})," Show it off"]}),(0,o.jsx)("span",{className:"badge-journey-arrow","aria-hidden":"true",children:"\u2192"}),(0,o.jsxs)("span",{className:"badge-journey-stage",children:[(0,o.jsx)("i",{children:"Steps 5-6"})," Physical badge"]}),(0,o.jsx)("span",{className:"badge-journey-hint",children:"Steps 5 and 6 are optional and come after you've claimed the digital badge."})]})]}),"\n",(0,o.jsx)(i.h2,{id:"badges",children:"The five community badges"}),"\n",(0,o.jsx)(i.p,{children:"Each badge recognizes a different kind of contribution. You can claim the Contributor badge today. The Committer and PMC Member badges are sent out by the PMC, so there is nothing to apply for. The two 2026 badges are awarded by the community, and we'll add the criteria and the process for each one to this page once they're settled."}),"\n",(0,o.jsxs)("div",{className:"badge-family",children:[(0,o.jsxs)("a",{className:"badge-card badge-card--open",href:"#digital-badge",children:[(0,o.jsx)("img",{src:"/images/community-badges/badge-contributor.png",alt:"Apache Doris Contributor badge",width:"104",height:"104"}),(0,o.jsx)("strong",{children:"Contributor"}),(0,o.jsx)("span",{children:"Code, docs, ideas or other work, with at least one PR merged."}),(0,o.jsx)("em",{className:"badge-chip badge-chip--open",children:"Open now"})]}),(0,o.jsxs)("a",{className:"badge-card badge-card--open",href:"#committer-pmc-badges",children:[(0,o.jsx)("img",{src:"/images/community-badges/badge-committer.png",alt:"Apache Doris Committer badge",width:"104",height:"104"}),(0,o.jsx)("strong",{children:"Committer"}),(0,o.jsx)("span",{children:"Commit access, earned through sustained and trusted contributions."}),(0,o.jsx)("em",{className:"badge-chip badge-chip--open",children:"Open now"})]}),(0,o.jsxs)("a",{className:"badge-card badge-card--open",href:"#committer-pmc-badges",children:[(0,o.jsx)("img",{src:"/images/community-badges/badge-pmc-member.png",alt:"Apache Doris PMC Member badge",width:"104",height:"104"}),(0,o.jsx)("strong",{children:"PMC Member"}),(0,o.jsx)("span",{children:"Guides the project's technical direction and community governance."}),(0,o.jsx)("em",{className:"badge-chip badge-chip--open",children:"Open now"})]}),(0,o.jsxs)("div",{className:"badge-card",children:[(0,o.jsx)("img",{src:"/images/community-badges/badge-active-contributor-2026.png",alt:"Apache Doris Active Contributor 2026 badge",width:"104",height:"104"}),(0,o.jsx)("strong",{children:"Active Contributor 2026"}),(0,o.jsx)("span",{children:"Consistent and impactful contributions during the year."}),(0,o.jsx)("em",{className:"badge-chip",children:"Coming soon"})]}),(0,o.jsxs)("div",{className:"badge-card",children:[(0,o.jsx)("img",{src:"/images/community-badges/badge-community-champion-2026.png",alt:"Apache Doris Community Champion 2026 badge",width:"104",height:"104"}),(0,o.jsx)("strong",{children:"Community Champion 2026"}),(0,o.jsx)("span",{children:"Major features, user stories, talks, events or other community initiatives."}),(0,o.jsx)("em",{className:"badge-chip",children:"Coming soon"})]})]}),"\n","\n",(0,o.jsx)(i.h2,{id:"digital-badge",children:"Get your digital badge"}),"\n",(0,o.jsxs)(i.p,{children:["Contributors go through all four steps. We check every claim by hand before Holopin sends the invitation, so the first two prove the GitHub account is yours. Committers and PMC members skip those two: the PMC sends your invitation, so you ",(0,o.jsx)(i.a,{href:"#committer-pmc-badges",children:"join at step 3"}),"."]}),"\n",(0,o.jsxs)("div",{className:"badge-steps",children:[(0,o.jsxs)("div",{className:"badge-step",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"1"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)("span",{className:"badge-step-scope",children:"Contributor badge only"}),(0,o.jsx)(i.h3,{id:"step-1",children:"Add the passphrase to your GitHub profile README"}),(0,o.jsxs)(i.p,{children:["Temporarily add this line anywhere in your profile README (the ",(0,o.jsx)(i.code,{children:"username/username"})," repository):"]}),(0,o.jsx)(i.pre,{children:(0,o.jsx)(i.code,{className:"language-text",children:"Apache Doris Community Badge\n"})}),(0,o.jsxs)("div",{className:"badge-step-why",children:[(0,o.jsx)("strong",{children:"Why?"})," Anyone can type a GitHub ID into a form, so we need proof that the account is yours. Once you have your badge, delete the line and put the badge there instead."]})]})]}),(0,o.jsxs)("div",{className:"badge-step",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"2"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)("span",{className:"badge-step-scope",children:"Contributor badge only"}),(0,o.jsx)(i.h3,{id:"step-2",children:"Fill out the claim form"}),(0,o.jsx)(i.p,{children:"We need two things: your GitHub ID, so we can find the merged PR, and an email address for the badge invitation."}),(0,o.jsxs)("div",{className:"badge-step-action",children:[(0,o.jsx)("a",{className:"badge-button button button--primary",href:"https://forms.gle/xTcnWLqDuBeFfnAD8",target:"_blank",rel:"noopener noreferrer",children:"Open the claim form \u2192"}),(0,o.jsx)("span",{children:"Takes about a minute."})]})]})]}),(0,o.jsxs)("div",{className:"badge-step badge-step--entry",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"PMC"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)(i.h3,{id:"committer-pmc-badges",children:"Committer or PMC Member? Start here"}),(0,o.jsxs)(i.p,{children:["You don't apply for these two badges. The Doris PMC goes through the official ",(0,o.jsx)(i.a,{href:"https://people.apache.org/committers-by-project.html#doris",children:"committer"})," and ",(0,o.jsx)(i.a,{href:"https://projects.apache.org/committee.html?doris",children:"PMC member"})," lists and sends everyone on them a Holopin invitation directly. Committers receive the Committer badge; PMC members receive both the PMC Member and the Committer badge. When the email arrives, continue from step 3. From there on, showing the badge off and applying for the physical one work the same as for the Contributor badge."]}),(0,o.jsx)(i.p,{children:"Want the Contributor badge as well? You qualify like anyone with a merged pull request, so claim it through steps 1 and 2."}),(0,o.jsxs)("div",{className:"badge-step-why",children:["Nothing in your inbox yet? Check your Promotions tab and Spam folder first, then ask us in ",(0,o.jsx)("a",{href:"#questions",children:"Slack"}),"."]})]})]}),(0,o.jsxs)("div",{className:"badge-step",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"3"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)(i.h3,{id:"step-3",children:"Claim it on Holopin"}),(0,o.jsxs)(i.p,{children:["Holopin will email you an invitation: for the Contributor badge once we've checked your PR, and for the Committer and PMC Member badges once the PMC has sent it. Click ",(0,o.jsx)(i.strong,{children:"Claim Badge"}),". Creating a Holopin account is free."]}),(0,o.jsx)(d.Z,{type:"tip",title:"Sign in with email",children:(0,o.jsx)("p",{children:"We recommend registering and signing in to Holopin with your own email address because signing in directly with GitHub currently has issues."})}),(0,o.jsx)(i.p,{children:"Can't find the email? Check your Promotions tab or Spam folder, since Holopin's invitations sometimes end up there."}),(0,o.jsxs)("figure",{className:"badge-shot badge-shot--narrow",children:[(0,o.jsx)("img",{src:"/images/community-badges/holopin-claim.jpg",alt:"Holopin claim screen showing the Apache Doris badge and a Claim button"}),(0,o.jsx)("figcaption",{children:"The Holopin claim screen"})]}),(0,o.jsx)("div",{className:"badge-step-why",children:"The badge then sits on your Holopin credential page, which anyone can open to check it, so you can link to it from wherever you like."})]})]}),(0,o.jsxs)("div",{className:"badge-step",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"4"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)(i.h3,{id:"step-4",children:"Show off your badge"}),(0,o.jsx)(i.p,{children:"The badge is the community's way of saying your work mattered. Put it wherever you like."}),(0,o.jsxs)(n.Z,{groupId:"badge-showoff",children:[(0,o.jsxs)(s.Z,{value:"github",label:"GitHub profile",default:!0,children:[(0,o.jsx)("div",{className:"badge-ministeps",children:(0,o.jsxs)(i.ol,{children:["\n",(0,o.jsxs)(i.li,{children:["On Holopin, open ",(0,o.jsx)(i.strong,{children:"Your Profile"}),"."]}),"\n",(0,o.jsxs)(i.li,{children:["Add your Apache Doris badge to your ",(0,o.jsx)(i.strong,{children:"Board"}),". Move, resize, or rotate it if you have several badges."]}),"\n",(0,o.jsx)(i.li,{children:"Copy the code shown under your Board and paste it into your GitHub profile README."}),"\n"]})}),(0,o.jsxs)(i.p,{children:["The code is a single line of Markdown. Here is the one for the ",(0,o.jsx)(i.code,{children:"morningman"})," account; yours will carry your own username:"]}),(0,o.jsx)(i.pre,{children:(0,o.jsx)(i.code,{className:"language-markdown",children:"[![An image of @morningman's Holopin badges, which is a link to view their full Holopin profile](https://holopin.me/morningman)](https://holopin.io/@morningman)\n"})}),(0,o.jsxs)(i.p,{children:["To see it in place, open ",(0,o.jsx)(i.a,{href:"https://github.com/morningman",children:"github.com/morningman"})," and the ",(0,o.jsx)(i.a,{href:"https://github.com/morningman/morningman/blob/main/README.md",children:"README behind it"}),"."]}),(0,o.jsxs)("div",{className:"badge-shots",children:[(0,o.jsxs)("figure",{className:"badge-shot",children:[(0,o.jsx)("img",{src:"/images/community-badges/holopin-board-embed-code.jpg",alt:"Holopin board with the embed code shown below it"}),(0,o.jsx)("figcaption",{children:"Copy the embed code under your Board"})]}),(0,o.jsxs)("figure",{className:"badge-shot",children:[(0,o.jsx)("img",{src:"/images/community-badges/github-profile-badge.jpg",alt:"GitHub profile README showing the Apache Doris Contributor badge"}),(0,o.jsx)("figcaption",{children:"The badge on a GitHub profile"})]})]})]}),(0,o.jsxs)(s.Z,{value:"linkedin",label:"LinkedIn",children:[(0,o.jsxs)(i.p,{children:["Add it under ",(0,o.jsx)(i.strong,{children:"Licenses & Certifications"})," on your LinkedIn profile:"]}),(0,o.jsxs)(i.ul,{children:["\n",(0,o.jsx)(i.li,{children:"Name: Apache Doris Contributor (or Committer / PMC Member, whichever badge you hold)"}),"\n",(0,o.jsx)(i.li,{children:"Issuing organization: Apache Doris"}),"\n",(0,o.jsx)(i.li,{children:"Credential URL: your Holopin badge link"}),"\n"]}),(0,o.jsxs)("figure",{className:"badge-shot",children:[(0,o.jsx)("img",{src:"/images/community-badges/linkedin-certification.jpg",alt:"LinkedIn Licenses and Certifications entry for the Apache Doris Contributor badge"}),(0,o.jsx)("figcaption",{children:"Licenses & Certifications on LinkedIn"})]}),(0,o.jsx)(i.p,{children:"You can also post about it. A single line with the badge image attached is enough, for example:"}),(0,o.jsxs)(i.blockquote,{children:["\n",(0,o.jsxs)(i.p,{children:["Happy to have received my Contributor Badge from the ",(0,o.jsx)("a",{className:"badge-linkedin",href:"https://www.linkedin.com/company/doris-apache",children:"@Apache Doris"})," community. ",(0,o.jsx)("span",{className:"badge-linkedin",children:"#ApacheDoris"})," ",(0,o.jsx)("span",{className:"badge-linkedin",children:"#ApacheDorisCommunityBadge"})]}),"\n"]}),(0,o.jsxs)(i.p,{children:["Swap in Committer or PMC Member if that's the badge you received. If you want the physical badge as well, this is the post ",(0,o.jsx)(i.a,{href:"#step-5",children:"step 5"})," asks for."]})]}),(0,o.jsxs)(s.Z,{value:"anywhere",label:"Anywhere else",children:[(0,o.jsx)(i.p,{children:"Your Holopin credential page is a stable link that anyone can check. Add it wherever a record of your contribution helps:"}),(0,o.jsxs)("ul",{className:"badge-where",children:[(0,o.jsx)("li",{children:"R\xe9sum\xe9 / CV"}),(0,o.jsx)("li",{children:"Personal website or portfolio"}),(0,o.jsx)("li",{children:"Other developer & community profiles"}),(0,o.jsx)("li",{children:"Conference speaker bios"})]})]})]})]})]})]}),"\n",(0,o.jsx)(i.h2,{id:"physical-badge",children:"Want the physical badge too? Two more steps"}),"\n",(0,o.jsx)(i.p,{children:"You can apply as soon as you've claimed your digital badge, since the LinkedIn post in step 5 needs to show it. Everyone who holds a digital badge is eligible, whether it's the Contributor, Committer, or PMC Member badge. We ship one physical badge per person, even if you hold more than one digital badge."}),"\n",(0,o.jsxs)("div",{className:"badge-steps badge-steps--optional",children:[(0,o.jsxs)("div",{className:"badge-step",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"5"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)(i.h3,{id:"step-5",children:"Share your badge on LinkedIn"}),(0,o.jsxs)(i.p,{children:["Write a LinkedIn post about your new badge. Say whatever you like: what you built or fixed, or how you ended up in the community in the first place. The only requirements are the three below. If you'd rather keep it short, the sample post under the LinkedIn tab in ",(0,o.jsx)(i.a,{href:"#step-4",children:"step 4"})," plus the badge image is enough."]}),(0,o.jsxs)("ul",{className:"badge-checklist",children:[(0,o.jsx)("li",{className:"badge-checklist-label",children:"Your post must include"}),(0,o.jsx)("li",{children:(0,o.jsxs)("span",{children:["A mention of the official ",(0,o.jsx)("a",{className:"badge-linkedin",href:"https://www.linkedin.com/company/doris-apache",children:"@Apache Doris"})," LinkedIn page"]})}),(0,o.jsx)("li",{children:(0,o.jsxs)("span",{children:["The hashtag ",(0,o.jsx)("span",{className:"badge-linkedin",children:"#ApacheDorisCommunityBadge"})]})}),(0,o.jsx)("li",{children:(0,o.jsx)("span",{children:"Your badge image or Holopin badge link"})})]}),(0,o.jsxs)("div",{className:"badge-shots",children:[(0,o.jsxs)("figure",{className:"badge-shot",children:[(0,o.jsx)("img",{src:"/images/community-badges/holopin-share.jpg",alt:"Holopin badge page with a Share on LinkedIn button"}),(0,o.jsx)("figcaption",{children:"Share straight from Holopin\u2026"})]}),(0,o.jsxs)("figure",{className:"badge-shot",children:[(0,o.jsx)("img",{src:"/images/community-badges/linkedin-post.jpg",alt:"LinkedIn post composer with the badge attached"}),(0,o.jsx)("figcaption",{children:"\u2026or write your own post"})]})]})]})]}),(0,o.jsxs)("div",{className:"badge-step",children:[(0,o.jsx)("span",{className:"badge-step-number","aria-hidden":"true",children:"6"}),(0,o.jsxs)("div",{className:"badge-step-body",children:[(0,o.jsx)(i.h3,{id:"step-6",children:"Submit your shipping details"}),(0,o.jsx)(i.p,{children:"After publishing your post, fill in the physical badge form with the post link and your shipping address."}),(0,o.jsx)("div",{className:"badge-step-action",children:(0,o.jsx)("a",{className:"badge-button button button--primary",href:"https://forms.gle/cqG5SchErhoMDDB87",target:"_blank",rel:"noopener noreferrer",children:"Apply for the physical badge \u2192"})}),(0,o.jsx)("div",{className:"badge-step-why",children:"We'll check the post, then email you when we start preparing your shipment."})]})]})]}),"\n",(0,o.jsx)(i.admonition,{title:"Shipping is worldwide, but not guaranteed",type:"info",children:(0,o.jsx)(i.p,{children:"Delivery times vary a lot by country, and in some places customs rules or carrier restrictions can stop a package altogether. We'll do our best to get the badge to you, but we can't promise it will reach every address."})}),"\n",(0,o.jsx)(i.h2,{id:"questions",children:"Questions?"}),"\n",(0,o.jsxs)("div",{className:"badge-questions",children:[(0,o.jsxs)("div",{children:[(0,o.jsx)("span",{className:"badge-questions-title",children:"Join the Apache Doris Slack and ask us there."}),(0,o.jsx)("p",{className:"badge-questions-text",children:"The community team answers badge questions in Slack, including anything about the form or shipping."})]}),(0,o.jsx)("a",{className:"badge-button button button--primary",href:"https://doris.apache.org/slack?utm_source=website&utm_medium=docs&utm_content=community_badge",children:"Join the Slack community \u2192"})]}),"\n",(0,o.jsxs)("div",{className:"badge-closing",children:[(0,o.jsx)("p",{className:"badge-closing-text",children:"Some contributions are large and visible. Others are small fixes that quietly make someone's day a little easier. All of them are part of open source, and these badges are our way of saying thank you."}),(0,o.jsx)("p",{className:"badge-closing-text",children:"The program has no end date. Contribute whenever you like, and claim your badge once your pull request is merged."}),(0,o.jsx)("p",{className:"badge-closing-signature",children:"The Apache Doris Community"})]})]})}function g(e={}){let{wrapper:i}={...(0,t.a)(),...e.components};return i?(0,o.jsx)(i,{...e,children:(0,o.jsx)(p,{...e})}):p(e)}},905525:function(e,i,a){a.d(i,{Z:()=>t});var r=a("785893");a("667294");var o=a("74904");function t(e){let{children:i,hidden:a,className:t}=e;return(0,r.jsx)("div",{role:"tabpanel",className:(0,o.Z)("tabItem_Ymn6",t),hidden:a,children:i})}},247902:function(e,i,a){a.d(i,{Z:()=>x});var r=a("785893"),o=a("667294"),t=a("74904"),n=a("69599"),s=a("616550"),d=a("232000"),l=a("4520"),c=a("38341"),h=a("876009");function m(e){return o.Children.toArray(e).filter(e=>"\n"!==e).map(e=>{if(!e||o.isValidElement(e)&&function(e){let{props:i}=e;return!!i&&"object"==typeof i&&"value"in i}(e))return e;throw Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)})?.filter(Boolean)??[]}function p(e){let{value:i,tabValues:a}=e;return a.some(e=>e.value===i)}var g=a("7227");function u(e){let{className:i,block:a,selectedValue:o,selectValue:s,tabValues:d}=e,l=[],{blockElementScrollPositionUntilNextRender:c}=(0,n.o5)(),h=e=>{let i=e.currentTarget,a=d[l.indexOf(i)].value;a!==o&&(c(i),s(a))},m=e=>{let i=null;switch(e.key){case"Enter":h(e);break;case"ArrowRight":{let a=l.indexOf(e.currentTarget)+1;i=l[a]??l[0];break}case"ArrowLeft":{let a=l.indexOf(e.currentTarget)-1;i=l[a]??l[l.length-1]}}i?.focus()};return(0,r.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,t.Z)("tabs",{"tabs--block":a},i),children:d.map(e=>{let{value:i,label:a,attributes:n}=e;return(0,r.jsx)("li",{role:"tab",tabIndex:o===i?0:-1,"aria-selected":o===i,ref:e=>l.push(e),onKeyDown:m,onClick:h,...n,className:(0,t.Z)("tabs__item","tabItem_LNqP",n?.className,{"tabs__item--active":o===i}),children:a??i},i)})})}function b(e){let{lazy:i,children:a,selectedValue:n}=e,s=(Array.isArray(a)?a:[a]).filter(Boolean);if(i){let e=s.find(e=>e.props.value===n);return e?(0,o.cloneElement)(e,{className:(0,t.Z)("margin-top--md",e.props.className)}):null}return(0,r.jsx)("div",{className:"margin-top--md",children:s.map((e,i)=>(0,o.cloneElement)(e,{key:i,hidden:e.props.value!==n}))})}function f(e){let i=function(e){let{defaultValue:i,queryString:a=!1,groupId:r}=e,t=function(e){let{values:i,children:a}=e;return(0,o.useMemo)(()=>{let e=i??m(a).map(e=>{let{props:{value:i,label:a,attributes:r,default:o}}=e;return{value:i,label:a,attributes:r,default:o}});return!function(e){let i=(0,c.lx)(e,(e,i)=>e.value===i.value);if(i.length>0)throw Error(`Docusaurus error: Duplicate values "${i.map(e=>e.value).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e},[i,a])}(e),[n,g]=(0,o.useState)(()=>(function(e){let{defaultValue:i,tabValues:a}=e;if(0===a.length)throw Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(i){if(!p({value:i,tabValues:a}))throw Error(`Docusaurus error: The <Tabs> has a defaultValue "${i}" but none of its children has the corresponding value. Available values are: ${a.map(e=>e.value).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return i}let r=a.find(e=>e.default)??a[0];if(!r)throw Error("Unexpected error: 0 tabValues");return r.value})({defaultValue:i,tabValues:t})),[u,b]=function(e){let{queryString:i=!1,groupId:a}=e,r=(0,s.k6)(),t=function(e){let{queryString:i=!1,groupId:a}=e;if("string"==typeof i)return i;if(!1===i)return null;if(!0===i&&!a)throw Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return a??null}({queryString:i,groupId:a});return[(0,l._X)(t),(0,o.useCallback)(e=>{if(!t)return;let i=new URLSearchParams(r.location.search);i.set(t,e),r.replace({...r.location,search:i.toString()})},[t,r])]}({queryString:a,groupId:r}),[f,x]=function(e){let{groupId:i}=e,a=i?`docusaurus.tab.${i}`:null,[r,t]=(0,h.Nk)(a);return[r,(0,o.useCallback)(e=>{a&&t.set(e)},[a,t])]}({groupId:r}),y=(()=>{let e=u??f;return p({value:e,tabValues:t})?e:null})();return(0,d.Z)(()=>{y&&g(y)},[y]),{selectedValue:n,selectValue:(0,o.useCallback)(e=>{if(!p({value:e,tabValues:t}))throw Error(`Can't select invalid tab value=${e}`);g(e),b(e),x(e)},[b,x,t]),tabValues:t}}(e);return(0,r.jsxs)("div",{className:(0,t.Z)("tabs-container","tabList__CuJ"),children:[(0,r.jsx)(u,{...i,...e}),(0,r.jsx)(b,{...i,...e})]})}function x(e){let i=(0,g.Z)();return(0,r.jsx)(f,{...e,children:m(e.children)},String(i))}},561116:function(e,i,a){a.d(i,{X:function(){return t}});var r=a(785893),o=a(667294);function t(e){let{mdxAdmonitionTitle:i,rest:a}=function(e){let i=o.Children.toArray(e),a=i.find(e=>o.isValidElement(e)&&"mdxAdmonitionTitle"===e.type),t=i.filter(e=>e!==a);return{mdxAdmonitionTitle:a?.props.children,rest:t.length>0?(0,r.jsx)(r.Fragment,{children:t}):null}}(e.children),t=e.title??i;return{...e,...t&&{title:t},children:a}}},38341:function(e,i,a){function r(e){let i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:(e,i)=>e===i;return e.filter((a,r)=>e.findIndex(e=>i(e,a))!==r)}function o(e){return Array.from(new Set(e))}function t(e,i){let a={},r=0;for(let o of e){let e=i(o,r);a[e]??=[],a[e].push(o),r+=1}return a}a.d(i,{jj:function(){return o},lx:function(){return r},vM:function(){return t}})},132322:function(e,i,a){a.d(i,{Z:()=>C});var r=a("785893");a("667294");var o=a("561116"),t=a("386010"),n=a("96025"),s=a("784681");let d={admonition:"admonition_Gfwi",admonitionHeading:"admonitionHeading_f1Ed",admonitionContent:"admonitionContent_UjKb"};function l(e){let{type:i,className:a,children:o}=e;return(0,r.jsx)("div",{className:(0,t.Z)(s.k.common.admonition,s.k.common.admonitionType(i),d.admonition,a),children:o})}function c(e){let{icon:i,title:a}=e;return(0,r.jsx)("div",{className:d.admonitionHeading,children:a})}function h(e){let{children:i}=e;return i?(0,r.jsx)("div",{className:d.admonitionContent,children:i}):null}function m(e){let{type:i,icon:a,title:o,children:t,className:n}=e;return(0,r.jsxs)(l,{type:i,className:n,children:[o||a?(0,r.jsx)(c,{title:o,icon:a}):null,(0,r.jsx)(h,{children:t})]})}let p={icon:(0,r.jsx)(function(e){return(0,r.jsx)("svg",{viewBox:"0 0 14 16",...e,children:(0,r.jsx)("path",{fillRule:"evenodd",d:"M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"})})},{}),title:(0,r.jsx)(n.Z,{id:"theme.admonition.note",description:"The default label used for the Note admonition (:::note)",children:"note"})};function g(e){return(0,r.jsx)(m,{...p,...e,className:(0,t.Z)("alert alert--secondary",e.className),children:e.children})}let u={icon:(0,r.jsx)(function(e){return(0,r.jsx)("svg",{viewBox:"0 0 12 16",...e,children:(0,r.jsx)("path",{fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"})})},{}),title:(0,r.jsx)(n.Z,{id:"theme.admonition.tip",description:"The default label used for the Tip admonition (:::tip)",children:"tip"})};function b(e){return(0,r.jsx)(m,{...u,...e,className:(0,t.Z)("alert alert--success",e.className),children:e.children})}let f={icon:(0,r.jsx)(function(e){return(0,r.jsx)("svg",{viewBox:"0 0 14 16",...e,children:(0,r.jsx)("path",{fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"})})},{}),title:(0,r.jsx)(n.Z,{id:"theme.admonition.info",description:"The default label used for the Info admonition (:::info)",children:"info"})};function x(e){return(0,r.jsx)(m,{...f,...e,className:(0,t.Z)("alert alert--info",e.className),children:e.children})}function y(e){return(0,r.jsx)("svg",{viewBox:"0 0 16 16",...e,children:(0,r.jsx)("path",{fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"})})}let j={icon:(0,r.jsx)(y,{}),title:(0,r.jsx)(n.Z,{id:"theme.admonition.warning",description:"The default label used for the Warning admonition (:::warning)",children:"warning"})},v={icon:(0,r.jsx)(function(e){return(0,r.jsx)("svg",{viewBox:"0 0 12 16",...e,children:(0,r.jsx)("path",{fillRule:"evenodd",d:"M5.05.31c.81 2.17.41 3.38-.52 4.31C3.55 5.67 1.98 6.45.9 7.98c-1.45 2.05-1.7 6.53 3.53 7.7-2.2-1.16-2.67-4.52-.3-6.61-.61 2.03.53 3.33 1.94 2.86 1.39-.47 2.3.53 2.27 1.67-.02.78-.31 1.44-1.13 1.81 3.42-.59 4.78-3.42 4.78-5.56 0-2.84-2.53-3.22-1.25-5.61-1.52.13-2.03 1.13-1.89 2.75.09 1.08-1.02 1.8-1.86 1.33-.67-.41-.66-1.19-.06-1.78C8.18 5.31 8.68 2.45 5.05.32L5.03.3l.02.01z"})})},{}),title:(0,r.jsx)(n.Z,{id:"theme.admonition.danger",description:"The default label used for the Danger admonition (:::danger)",children:"danger"})},w={icon:(0,r.jsx)(y,{}),title:(0,r.jsx)(n.Z,{id:"theme.admonition.caution",description:"The default label used for the Caution admonition (:::caution)",children:"caution"})},k={note:g,tip:b,info:x,warning:function(e){return(0,r.jsx)(m,{...j,...e,className:(0,t.Z)("alert alert--warning",e.className),children:e.children})},danger:function(e){return(0,r.jsx)(m,{...v,...e,className:(0,t.Z)("alert alert--danger",e.className),children:e.children})},secondary:e=>(0,r.jsx)(g,{title:"secondary",...e}),important:e=>(0,r.jsx)(x,{title:"important",...e}),success:e=>(0,r.jsx)(b,{title:"success",...e}),caution:function(e){return(0,r.jsx)(m,{...w,...e,className:(0,t.Z)("alert alert--warning",e.className),children:e.children})}};function C(e){let i=(0,o.X)(e),a=function(e){let i=k[e];return i||(console.warn(`No admonition component found for admonition type "${e}". Using Info as fallback.`),k.info)}(i.type);return(0,r.jsx)(a,{...i})}},250065:function(e,i,a){a.d(i,{Z:function(){return s},a:function(){return n}});var r=a(667294);let o={},t=r.createContext(o);function n(e){let i=r.useContext(t);return r.useMemo(function(){return"function"==typeof e?e(i):{...i,...e}},[i,e])}function s(e){let i;return i=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:n(e.components),r.createElement(t.Provider,{value:i},e.children)}}}]);