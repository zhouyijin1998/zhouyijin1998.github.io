"use strict";
(() => {
  const profile = window.PROFILE;
  let lang = "zh";
  try { lang = localStorage.getItem("yijin-profile-language") === "en" ? "en" : "zh"; } catch (_) {}
  let filter = "all";
  let citationPaper = null;
  let citationFormat = "text";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const escape = (value) => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const t = key => profile.translations[lang][key] ?? key;
  const bilingual = pair => pair[lang === "zh" ? 0 : 1];
  const external = 'target="_blank" rel="noopener noreferrer"';
  const tags = values => `<div class="research-tags">${values.map(value => `<span>${escape(value)}</span>`).join("")}</div>`;

  function renderResearch() {
    $("#research-list").innerHTML = profile.research.map((item, index) => `<article class="research-item"><span class="research-index">0${index+1}</span><div class="research-icon"><svg viewBox="0 0 64 48" aria-hidden="true">${item.icon}</svg></div><h3>${escape(bilingual(item.title))}</h3><p class="en-label">${escape(item.en)}</p><p class="description">${escape(bilingual(item.description))}</p>${tags(item.tags)}</article>`).join("");
  }
  function renderPapers() {
    const query = $("#paper-search").value.toLocaleLowerCase().trim();
    const papers = profile.papers.filter(paper => {
      const matchesFilter = filter === "all" || (filter === "first" && paper.first) || (filter === "collaboration" && !paper.first) || (filter === "preprint" && paper.preprint);
      return matchesFilter && `${paper.title} ${paper.authors} ${paper.venue} ${paper.year}`.toLocaleLowerCase().includes(query);
    });
    $("#papers-list").innerHTML = papers.length ? papers.map(paper => `<article class="paper"><div class="paper-year">${paper.year}</div><div class="paper-content"><h3 class="paper-title" lang="en"><a href="${paper.url}" ${external}>${escape(paper.title)}</a></h3><p class="paper-authors" lang="en">${escape(paper.authors).replace(/Zhou Y/g,"<strong>Zhou Y</strong>")}</p><div class="paper-meta"><em lang="en">${escape(paper.venue)}</em>${paper.details ? `<span>${escape(paper.details)}</span>` : ""}${paper.earlyAccess ? `<span>${t("online")}</span>` : ""}${paper.preprint ? `<span class="badge preprint">${t("underReview")}</span>` : paper.first ? `<span class="badge">${t("firstAuthor")}</span>` : ""}</div></div><div class="paper-links"><a href="${paper.url}" ${external}>${t("paperLink")} <span aria-hidden="true">↗</span></a>${paper.pdf ? `<a href="${paper.pdf}" ${external}>PDF <span aria-hidden="true">↗</span></a>` : ""}<button data-cite="${paper.id}" aria-label="${escape(t("cite")+": "+paper.title)}">${t("cite")} <span aria-hidden="true">＋</span></button></div></article>`).join("") : `<p class="empty-result">${t("noResults")}</p>`;
  }
  function renderCV() {
    $("#education-list").innerHTML = `<article class="timeline-item"><div class="timeline-date">${t("current")}</div><h4>${t("position")}</h4><p>${t("university")}</p></article><article class="timeline-item"><div class="timeline-date">${t("started")}</div><h4>${t("phd")}</h4><p>${t("schoolAI")}</p><p>${t("gradProgram")}</p><p>${t("supervisor")}</p></article><article class="timeline-item"><div class="timeline-date">2016.09 — 2020.06</div><h4>${t("bachelor")}</h4><p>${t("schoolEE")}</p></article>`;
    $("#honors-list").innerHTML = profile.honors.map(item => `<li><time>${item.dateKey ? t(item.dateKey) : item.date}</time><span>${escape(bilingual(item.text))}</span></li>`).join("");
    $("#grants-list").innerHTML = profile.grants.map(item => `<article class="grant"><div class="grant-header"><span>${item.year}</span><span class="badge">${t(item.role)}</span>${item.complete ? `<span>${t("complete")}</span>` : ""}</div><h4>${escape(bilingual(item.title))}</h4><p>${escape(bilingual(item.fund))}</p></article>`).join("");
    $("#patents-list").innerHTML = profile.patents.map(item => `<article class="patent"><h4>${escape(bilingual(item.title))}</h4><p>${escape(item.number)} <span class="badge">${t(item.status)}</span></p></article>`).join("");
    const openProjects = $$(".project[open]").map(node => node.dataset.index);
    $("#projects-list").innerHTML = profile.projects.map((item, index) => `<details class="project" data-index="${index}" ${openProjects.includes(String(index)) ? "open" : ""}><summary><span class="project-index">0${index+1}</span><span>${escape(bilingual(item.title))}</span><span class="project-plus" aria-hidden="true">+</span></summary><div class="project-body"><p>${escape(bilingual(item.body))}</p>${tags(item.tags)}</div></details>`).join("");
  }
  function renderLanguage() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = lang === "zh" ? "周祎瑾 Yijin Zhou · 学术主页" : "Yijin Zhou · Academic Profile";
    $("meta[name=description]").content = lang === "zh" ? "周祎瑾，西安建筑科技大学准聘副教授。研究方向包括脑电情感识别、图神经网络、Transformer、情感计算与脑机接口。" : "Yijin Zhou, tenure-track Associate Professor at Xi’an University of Architecture and Technology. Research in EEG emotion recognition, graph learning, Transformers, and brain–computer interfaces.";
    $$("[data-i18n]").forEach(node => { node.innerHTML = t(node.dataset.i18n); });
    $$("[data-label]").forEach(node => { node.setAttribute("aria-label", t(node.dataset.label)); });
    $$("[data-alt]").forEach(node => { node.alt = t(node.dataset.alt); });
    $$("[data-placeholder]").forEach(node => { node.placeholder = t(node.dataset.placeholder); });
    $("#language").innerHTML = `${lang === "zh" ? "EN" : "中文"} <span aria-hidden="true">↗</span>`;
    $("#language").setAttribute("aria-label", lang === "zh" ? "Switch to English" : "切换到中文");
    renderResearch(); renderPapers(); renderCV();
    if(citationPaper) renderCitation();
  }
  function citationText(paper) {
    if(citationFormat === "text") return `${paper.authors} ${paper.title}. ${paper.venue}${paper.details ? ", " + paper.details : ""}, ${paper.year}.${paper.earlyAccess ? " (Early access)" : ""}${paper.doi ? " https://doi.org/" + paper.doi : " " + paper.url}`;
    return `@${paper.bibType || "article"}{${paper.id},\n  title = {${paper.title}},\n  author = {${paper.bibAuthors}},\n  year = {${paper.year}},\n${paper.preprint ? paper.bibExtra : `  journal = {${paper.venue}},\n  doi = {${paper.doi}}`},\n  url = {${paper.url}}\n}`;
  }
  function renderCitation() {
    $("#citation-paper").textContent = citationPaper.title;
    $("#citation-text").textContent = citationText(citationPaper);
    $("#copy-status").textContent = "";
    $$("[data-citation]").forEach(button => { button.classList.toggle("active",button.dataset.citation === citationFormat); button.setAttribute("aria-pressed",String(button.dataset.citation === citationFormat)); });
  }
  $("#language").addEventListener("click", () => {lang = lang === "zh" ? "en" : "zh";try {localStorage.setItem("yijin-profile-language",lang);}catch(_){}renderLanguage();});
  $("#menu").addEventListener("click", () => {const expanded = $("#menu").getAttribute("aria-expanded") === "true";$("#menu").setAttribute("aria-expanded",String(!expanded));$("#mobile-nav").hidden = expanded;});
  $$("#mobile-nav a").forEach(link => link.addEventListener("click", () => {$("#menu").setAttribute("aria-expanded","false");$("#mobile-nav").hidden = true;}));
  document.addEventListener("keydown", event => {if(event.key === "Escape"){$("#menu").setAttribute("aria-expanded","false");$("#mobile-nav").hidden = true;}});
  $$("[data-filter]").forEach(button => button.addEventListener("click", () => {filter = button.dataset.filter;$$("[data-filter]").forEach(node => {const active = node === button;node.classList.toggle("active",active);node.setAttribute("aria-pressed",String(active));});renderPapers();}));
  $("#paper-search").addEventListener("input",renderPapers);
  $("#papers-list").addEventListener("click",event => {const trigger = event.target.closest("[data-cite]");if(!trigger)return;citationPaper = profile.papers.find(paper => paper.id === trigger.dataset.cite);citationFormat = "text";renderCitation();$("#citation-dialog").showModal();});
  $("#close-dialog").addEventListener("click",() => $("#citation-dialog").close());
  $("#citation-dialog").addEventListener("click",event => {const bounds = event.currentTarget.getBoundingClientRect();if(event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom))event.currentTarget.close();});
  $$("[data-citation]").forEach(button => button.addEventListener("click",() => {citationFormat = button.dataset.citation;renderCitation();}));
  $("#copy-citation").addEventListener("click",async () => {try {await navigator.clipboard.writeText(citationText(citationPaper));$("#copy-status").textContent = t("copied");}catch(_){const range = document.createRange();range.selectNodeContents($("#citation-text"));const selection = window.getSelection();selection.removeAllRanges();selection.addRange(range);$("#copy-status").textContent = t("copyFallback");}});
  const printState = {filter:null,query:null,open:[]};
  function preparePrint() {printState.filter = filter;printState.query = $("#paper-search").value;printState.open = $$(".project[open]").map(node => node.dataset.index);filter = "all";$("#paper-search").value = "";renderPapers();$$(".project").forEach(node => {node.open = true;});}
  function restorePrint() {if(printState.filter === null)return;filter = printState.filter;$("#paper-search").value = printState.query;renderPapers();$$(".project").forEach(node => {node.open = printState.open.includes(node.dataset.index);});printState.filter = null;}
  window.addEventListener("beforeprint",preparePrint);window.addEventListener("afterprint",restorePrint);
  $("#print").addEventListener("click",() => window.print());
  const nodes = [[175,55],[110,73],[240,73],[62,126],[127,125],[221,125],[288,126],[45,185],[106,185],[175,185],[244,185],[305,185],[62,244],[127,245],[221,245],[288,244],[110,297],[240,297],[175,315]];
  $("#neural-nodes").innerHTML = nodes.map(([x,y],index) => `<circle cx="${x}" cy="${y}" r="${index % 4 === 0 ? 4 : 2.6}" fill="${index % 4 === 0 ? "#ae694a" : "#58795f"}"/>`).join("");
  $("#year").textContent = new Date().getFullYear();
  if("IntersectionObserver" in window){const observer = new IntersectionObserver(entries => {entries.forEach(entry => {if(entry.isIntersecting){$$(".nav a").forEach(link => {if(link.hash === "#"+entry.target.id)link.setAttribute("aria-current","location");else link.removeAttribute("aria-current");});}});},{rootMargin:"-10% 0px -65% 0px"});$$("main section[id]").forEach(section => observer.observe(section));}
  renderLanguage();
})();
