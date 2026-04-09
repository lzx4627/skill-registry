const state = {
  filter: "all",
  query: "",
  payload: null,
  lang: resolveInitialLanguage(),
};

const els = {
  generatedAt: document.getElementById("generatedAt"),
  keyPoints: document.getElementById("keyPoints"),
  total: document.getElementById("metricTotal"),
  system: document.getElementById("metricSystem"),
  custom: document.getElementById("metricCustom"),
  customLabel: document.getElementById("metricCustomLabel"),
  newlyInstalled: document.getElementById("metricNew"),
  newlyInstalledLabel: document.getElementById("metricNewLabel"),
  summaryNote: document.getElementById("summaryNote"),
  legendRow: document.getElementById("legendRow"),
  scenarioList: document.getElementById("scenarioList"),
  usageList: document.getElementById("usageList"),
  auditSummary: document.getElementById("auditSummary"),
  skippedList: document.getElementById("skippedList"),
  warningList: document.getElementById("warningList"),
  newInstallStrip: document.getElementById("newInstallStrip"),
  filters: document.getElementById("filters"),
  search: document.getElementById("searchInput"),
  resultMeta: document.getElementById("resultMeta"),
  skillGroups: document.getElementById("skillGroups"),
  groupTemplate: document.getElementById("groupTemplate"),
  skillTemplate: document.getElementById("skillTemplate"),
  langSwitch: document.getElementById("langSwitch"),
};

const copy = {
  en: {
    htmlLang: "en",
    title: "Skill Registry",
    metaDescription:
      "Browse and audit installed Codex and agent skills from local skill roots.",
    brand: "Skill Registry",
    eyebrow: "Global Skill Directory",
    heroTitle: "Understand your local skills at a glance",
    heroLead:
      "Start with the scan roots and totals, then review which skills create issues, install packages, or manipulate git state. Finally, browse by root or risk.",
    quickStartKicker: "Quick Start",
    quickStartTitle: "How to read this catalog",
    usageKicker: "How To Use",
    usageTitle: "How to invoke a skill",
    notesKicker: "Catalog Notes",
    notesTitle: "Catalog notes",
    scanRootsTitle: "Scan roots",
    warningsTitle: "Usage warnings",
    autoDiscoveryKicker: "Auto Discovery",
    autoDiscoveryTitle: "Discovery rules",
    autoDiscoveryNote:
      "As soon as a new skill lands in one of the configured roots, the page will pick it up automatically.",
    browseKicker: "Browse Skills",
    browseTitle: "Browse by source and risk",
    browseNote:
      "Search supports names, usage hints, paths, and extra resource filenames.",
    searchLabel: "Search",
    searchPlaceholder: "For example: tdd, ui, github, issue, plan, imagegen",
    resultLoading: "Loading skill catalog…",
    totalLabel: "Total skills",
    systemLabel: "Built-in system skills",
    rootFallback1: "Root 1",
    rootFallback2: "Root 2",
    loadingSummary: "Loading catalog summary…",
    filters: {
      all: "All",
      system: "Built-in",
      duplicates: "Duplicates",
      warnings: "High risk",
    },
    guides: [
      {
        title: "Start with roots",
        description:
          "If you know where a skill was installed from, filter by scan root first to cut the list down quickly.",
      },
      {
        title: "Then inspect risk",
        description:
          "If you care about side effects, jump straight to the high-risk view to inspect issue creation, pushes, worktrees, or package installs.",
      },
      {
        title: "Short queries are stricter",
        description:
          "Short terms like `ui`, `qa`, or `pr` use token-prefix matching so you don't get noisy hits from words like `build`.",
      },
      {
        title: "Results auto-refresh",
        description:
          "If a new skill appears in a configured root, the page will refresh itself on the configured interval.",
      },
    ],
    generatedAt: (roots, time) =>
      `Scanning ${roots.join(" + ")}. Last refresh: ${time}`,
    summaryNote: (total, system, refreshSeconds, hiddenRoots) =>
      `Found ${total} skills in total, including ${system} built-in system skills. The catalog refreshes every ${refreshSeconds} seconds${
        hiddenRoots > 0 ? `, with ${hiddenRoots} additional configured roots` : ""
      }.`,
    keyPoints: {
      roots:
        "The catalog reflects the skill roots configured on this machine instead of a hardcoded repository list.",
      auto:
        "If you install a new skill into any configured root, it will appear automatically.",
      heuristic:
        "Risk badges are derived heuristically from `SKILL.md` text, not from a curated allowlist.",
      duplicates: (names) => `Duplicate skill names detected: ${names.join(", ")}.`,
      noDuplicates: "No duplicate skill names were detected.",
    },
    legend: {
      builtIn: "Built-in",
      issues: "Creates issues",
      worktree: "Creates worktrees",
      duplicate: "Duplicate name",
    },
    discoveryTags: {
      path: (index, root) => `Scan root ${index}: ${root}`,
      marker: "Discovery rule: directory contains SKILL.md",
      refresh: (seconds) => `Refresh: every ${seconds}s`,
    },
    resultMeta: (visible, total, filter) =>
      `Showing ${visible} / ${total} skills. Filter: ${filter}`,
    noMatches: "No matching skills. Try another query or switch back to All.",
    duplicateGroupTitle: "Duplicate skills",
    duplicateGroupNote:
      "These skill names appear more than once across the configured roots.",
    duplicateGroupKicker: "Duplicates",
    warningGroupTitle: "Higher-risk skills",
    warningGroupNote:
      "These skills have more obvious side effects or environment assumptions. Check the badges and notes first.",
    warningGroupKicker: "High Side Effects",
    systemGroupTitle: "Built-in system skills",
    systemGroupNote: "Skills discovered from the built-in system area.",
    systemGroupKicker: "System Built-In",
    groupRootKicker: (key) => `Root: ${key}`,
    groupRootNote: (label) => `Skills discovered from ${label}.`,
    detailsExpand: "Show details",
    matchReasonPrefix: "Matched fields:",
    matchReasonJoiner: ", ",
    infoLabels: {
      whenToUse: "When to use",
      howToSay: "How to ask for it",
      path: "Path",
      extraFiles: "Extra files",
      headings: "Document sections",
      warnings: "Warnings",
    },
    usageHint: {
      direct: (name) => `Say “use ${name} for this task”, or call it explicitly as $${name}.`,
      withUseWhen: (direct, useWhen) =>
        `${direct} You can also describe the scenario naturally: ${useWhen}.`,
      fallback: (direct) =>
        `${direct} Since the trigger description is incomplete, explicit invocation is safer.`,
    },
    fallbackText: {
      noDescription: "No frontmatter description provided.",
      noUseWhen:
        "This skill does not clearly describe its `Use when ...` trigger, so explicit invocation is safer.",
      noExtraFiles: "Only `SKILL.md` is present; there are no extra resource files.",
      noHeadings: "No explicit document headings were found; this skill is mostly driven by its short description.",
      noWarnings:
        "No obvious automatic side effects or hardcoded environment assumptions were detected.",
    },
    matchFields: {
      name: "Name",
      description: "Description",
      useWhen: "Usage hint",
      path: "Path",
      relativePath: "Relative path",
      extraFiles: "Extra files",
    },
    badges: {
      system: "Built-in",
      duplicate: "Duplicate",
      writesIssues: "Creates issues",
      createsCommit: "Suggests commits",
      installsPackages: "Installs packages",
      createsWorktree: "Creates worktrees",
      pushesOrPrs: "Push / PR",
      needsSubagents: "Needs subagents",
    },
    warningLabels: {
      writesIssues: "Creates issues",
      pushesOrPrs: "Pushes or opens PRs",
      createsCommit: "Suggests commits",
      installsPackages: "Installs packages",
      createsWorktree: "Creates worktrees",
      needsSubagents: "Needs subagents",
      hardcodedPath: "Hardcoded paths",
      claudeOnly: "Claude-specific",
      repoSpecific: "Repo-specific tooling",
      nicheTooling: "Niche tooling",
      duplicateName: "Duplicate name",
      note: "Extra note",
    },
  },
  zh: {
    htmlLang: "zh-CN",
    title: "Skill Registry",
    metaDescription: "从本地 skill 根目录浏览和审计已安装的 Codex 与 agent skills。",
    brand: "Skill Registry",
    eyebrow: "技能目录",
    heroTitle: "一眼看懂你本机上的 skills",
    heroLead:
      "先看扫描目录和总数，再看哪些 skill 会建 Issue、装依赖或操作 git，最后按来源和风险筛选。",
    quickStartKicker: "快速开始",
    quickStartTitle: "怎么读这个目录",
    usageKicker: "如何使用",
    usageTitle: "怎么触发 skill",
    notesKicker: "目录说明",
    notesTitle: "目录说明",
    scanRootsTitle: "扫描路径",
    warningsTitle: "使用提醒",
    autoDiscoveryKicker: "自动发现",
    autoDiscoveryTitle: "自动发现规则",
    autoDiscoveryNote:
      "只要新的 skill 被安装到任一配置好的扫描目录里，这个页面就会自动把它显示出来。",
    browseKicker: "浏览 Skills",
    browseTitle: "按来源和风险浏览",
    browseNote: "搜索支持 skill 名、用途提示、路径和附加资源文件名。",
    searchLabel: "搜索",
    searchPlaceholder: "例如：tdd, ui, github, issue, plan, imagegen",
    resultLoading: "正在加载 skill 目录…",
    totalLabel: "总数",
    systemLabel: "系统内置",
    rootFallback1: "根目录 1",
    rootFallback2: "根目录 2",
    loadingSummary: "正在汇总目录概览…",
    filters: {
      all: "全部",
      system: "系统内置",
      duplicates: "重名",
      warnings: "高副作用",
    },
    guides: [
      {
        title: "先按目录看",
        description: "如果你知道 skill 是怎么安装的，先按扫描根目录过滤，缩小范围最快。",
      },
      {
        title: "再按风险看",
        description:
          "如果你担心副作用，直接看“高副作用”分组，先排查会建 Issue、推分支、建 worktree 或装依赖的 skill。",
      },
      {
        title: "短词搜索更严格",
        description:
          "像 `ui`、`qa`、`pr` 这类短词会按词前缀匹配，避免把 `build` 这种误伤结果算进去。",
      },
      {
        title: "结果会自动刷新",
        description: "只要新的 skill 最终落到扫描目录里，页面会按设定周期自动刷新。",
      },
    ],
    generatedAt: (roots, time) =>
      `自动扫描 ${roots.join(" + ")}，最后刷新：${time}`,
    summaryNote: (total, system, refreshSeconds, hiddenRoots) =>
      `当前共 ${total} 个 skill，其中 ${system} 个是系统内置；页面每 ${refreshSeconds} 秒自动重新扫描一次${
        hiddenRoots > 0 ? `，另外还有 ${hiddenRoots} 个附加根目录` : ""
      }。`,
    keyPoints: {
      roots: "页面扫描的是当前机器配置的 skill 目录，不依赖硬编码的仓库名单。",
      auto: "如果你从命令行把新 skill 装进任一扫描目录，页面会自动显示出来。",
      heuristic: "风险标签来自 `SKILL.md` 文本启发式分析，不是白名单。",
      duplicates: (names) => `当前存在重名 skill：${names.join("、")}。`,
      noDuplicates: "当前没有重名 skill。",
    },
    legend: {
      builtIn: "系统内置",
      issues: "会建 Issue",
      worktree: "建 worktree",
      duplicate: "重名",
    },
    discoveryTags: {
      path: (index, root) => `扫描路径 ${index}：${root}`,
      marker: "识别条件：目录内存在 SKILL.md",
      refresh: (seconds) => `更新方式：每 ${seconds} 秒自动同步`,
    },
    resultMeta: (visible, total, filter) =>
      `当前显示 ${visible} / ${total} 个 skill，过滤条件：${filter}`,
    noMatches: "没有匹配项。换个关键词，或者切回“全部”再看。",
    duplicateGroupTitle: "重名 skill",
    duplicateGroupNote: "这些 skill 名在全局目录里出现了不止一次。",
    duplicateGroupKicker: "重名",
    warningGroupTitle: "高副作用 skill",
    warningGroupNote:
      "这组 skill 带有较明显的自动动作或环境依赖，使用前先看匹配字段和提醒。",
    warningGroupKicker: "高副作用",
    systemGroupTitle: "系统内置",
    systemGroupNote: "从系统内置区域发现的 skill。",
    systemGroupKicker: "系统内置",
    groupRootKicker: (key) => `根目录：${key}`,
    groupRootNote: (label) => `来自 ${label} 的 skill。`,
    detailsExpand: "展开详情",
    matchReasonPrefix: "匹配字段：",
    matchReasonJoiner: "、",
    infoLabels: {
      whenToUse: "什么时候用",
      howToSay: "怎么直接说",
      path: "路径",
      extraFiles: "附加文件",
      headings: "文档章节",
      warnings: "提醒",
    },
    usageHint: {
      direct: (name) => `直接说“用 ${name} 做这个任务”，或者写“$${name}”。`,
      withUseWhen: (direct, useWhen) =>
        `${direct} 如果不点名，也可以直接描述这类场景：${useWhen}。`,
      fallback: (direct) => `${direct} 由于它的触发描述不完整，点名使用更稳。`,
    },
    fallbackText: {
      noDescription: "没有 frontmatter 描述。",
      noUseWhen: "这个 skill 没有写清楚 `Use when ...`，建议点名使用。",
      noExtraFiles: "只有 `SKILL.md`，没有额外资源文件。",
      noHeadings: "没有显式章节，主要依赖短说明。",
      noWarnings: "没有发现明显的自动副作用或硬编码环境依赖。",
    },
    matchFields: {
      name: "名称",
      description: "描述",
      useWhen: "适用场景",
      path: "路径",
      relativePath: "相对路径",
      extraFiles: "附加文件",
    },
    badges: {
      system: "系统内置",
      duplicate: "重名",
      writesIssues: "会建 Issue",
      createsCommit: "会提交",
      installsPackages: "装依赖",
      createsWorktree: "建 worktree",
      pushesOrPrs: "推分支 / PR",
      needsSubagents: "依赖子代理",
    },
    warningLabels: {
      writesIssues: "会直接建 Issue",
      pushesOrPrs: "会推分支或开 PR",
      createsCommit: "会建议直接提交",
      installsPackages: "会装依赖",
      createsWorktree: "会创建 worktree",
      needsSubagents: "依赖子代理",
      hardcodedPath: "硬编码路径",
      claudeOnly: "Claude 专用",
      repoSpecific: "项目特定工具",
      nicheTooling: "窄场景工具",
      duplicateName: "名字重复",
      note: "补充提醒",
    },
  },
};

const filterLabelKeys = {
  all: "all",
  system: "system",
  duplicates: "duplicates",
  warnings: "warnings",
};

const fieldKeyMap = {
  名称: "name",
  描述: "description",
  适用场景: "useWhen",
  路径: "path",
  相对路径: "relativePath",
  附加文件: "extraFiles",
  Name: "name",
  Description: "description",
  "Usage hint": "useWhen",
  Path: "path",
  "Relative path": "relativePath",
  "Extra files": "extraFiles",
};

async function boot() {
  applyLanguageChrome();
  await refreshPayload();
  bindEvents();
  renderSkills();
  window.setInterval(() => {
    refreshPayload().catch((error) => console.error(error));
  }, getRefreshMs());
}

function resolveInitialLanguage() {
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang === "en" || urlLang === "zh") {
    localStorage.setItem("skill-registry-lang", urlLang);
    return urlLang;
  }
  return localStorage.getItem("skill-registry-lang") || "en";
}

function currentCopy() {
  return copy[state.lang] || copy.en;
}

function pickLocalized(value) {
  if (value && typeof value === "object" && "en" in value && "zh" in value) {
    return value[state.lang] || value.en || value.zh || "";
  }
  return value ?? "";
}

function setLanguage(lang) {
  state.lang = lang === "zh" ? "zh" : "en";
  localStorage.setItem("skill-registry-lang", state.lang);
  const url = new URL(window.location.href);
  url.searchParams.set("lang", state.lang);
  window.history.replaceState({}, "", url);
  applyLanguageChrome();
  if (state.payload) {
    renderChrome(state.payload);
    renderSkills();
  }
}

function applyLanguageChrome() {
  const c = currentCopy();
  document.documentElement.lang = c.htmlLang;
  document.title = c.title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.setAttribute("content", c.metaDescription);
  }

  document.querySelector(".brand").textContent = c.brand;
  document.querySelector(".eyebrow").textContent = c.eyebrow;
  document.querySelector(".intro h1").textContent = c.heroTitle;
  document.querySelector(".lede").textContent = c.heroLead;

  setSectionText(".panel:nth-of-type(1) .panel-kicker", c.quickStartKicker);
  setSectionText(".panel:nth-of-type(1) h2", c.quickStartTitle);
  setSectionText(".panel:nth-of-type(2) .panel-kicker", c.usageKicker);
  setSectionText(".panel:nth-of-type(2) h2", c.usageTitle);
  setSectionText(".panel:nth-of-type(3) .panel-kicker", c.notesKicker);
  setSectionText(".panel:nth-of-type(3) h2", c.notesTitle);
  setSectionText(".panel:nth-of-type(3) .subpanel:nth-of-type(2) h3", c.scanRootsTitle);
  setSectionText(".panel:nth-of-type(3) .subpanel:nth-of-type(3) h3", c.warningsTitle);

  setSectionText(".content .section:nth-of-type(1) .panel-kicker", c.autoDiscoveryKicker);
  setSectionText(".content .section:nth-of-type(1) h2", c.autoDiscoveryTitle);
  setSectionText(".content .section:nth-of-type(1) .section-note", c.autoDiscoveryNote);
  setSectionText(".content .section:nth-of-type(2) .panel-kicker", c.browseKicker);
  setSectionText(".content .section:nth-of-type(2) h2", c.browseTitle);
  setSectionText(".content .section:nth-of-type(2) .section-note", c.browseNote);
  setSectionText(".search span", c.searchLabel);
  els.search.placeholder = c.searchPlaceholder;
  if (!state.payload) {
    els.resultMeta.textContent = c.resultLoading;
  }

  els.total.previousElementSibling.textContent = c.totalLabel;
  els.system.previousElementSibling.textContent = c.systemLabel;
  els.customLabel.textContent = c.rootFallback1;
  els.newlyInstalledLabel.textContent = c.rootFallback2;
  els.summaryNote.textContent = c.loadingSummary;

  for (const button of els.langSwitch.querySelectorAll(".lang-button")) {
    button.classList.toggle("is-active", button.dataset.lang === state.lang);
  }
}

function setSectionText(selector, text) {
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
}

function getRefreshMs() {
  return state.payload?.config?.refreshMs ?? 15000;
}

async function refreshPayload() {
  const response = await fetch("/api/catalog", { cache: "no-store" });
  const payload = await response.json();
  state.payload = payload;
  ensureValidFilter(payload);
  renderChrome(payload);
  renderSkills();
}

function ensureValidFilter(payload) {
  const valid = new Set([
    "all",
    "system",
    "duplicates",
    "warnings",
    ...Object.keys(payload.audit.catalog.roots),
  ]);
  if (!valid.has(state.filter)) {
    state.filter = "all";
  }
}

function bindEvents() {
  els.search.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderSkills();
  });

  els.filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    state.filter = button.dataset.filter;
    syncActiveFilterButtons();
    renderSkills();
  });

  els.langSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lang]");
    if (!button) return;
    setLanguage(button.dataset.lang);
  });
}

function renderChrome(payload) {
  const c = currentCopy();
  const { summary, usage, audit, config, generatedAt } = payload;
  const rootEntries = getRootEntries(payload);
  const formatter = new Intl.DateTimeFormat(state.lang === "zh" ? "zh-CN" : "en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  });

  els.generatedAt.textContent = c.generatedAt(
    rootEntries.map((entry) => entry.label),
    formatter.format(new Date(generatedAt)),
  );

  els.total.textContent = summary.total;
  els.system.textContent = summary.system;

  const firstRoot = rootEntries[0];
  const secondRoot = rootEntries[1];
  els.customLabel.textContent = firstRoot ? firstRoot.label : c.rootFallback1;
  els.custom.textContent = firstRoot ? firstRoot.count : 0;
  els.newlyInstalledLabel.textContent = secondRoot ? secondRoot.label : c.rootFallback2;
  els.newlyInstalled.textContent = secondRoot ? secondRoot.count : 0;

  const hiddenRoots = rootEntries.length > 2 ? rootEntries.length - 2 : 0;
  els.summaryNote.textContent = c.summaryNote(
    summary.total,
    summary.system,
    Math.round(config.refreshMs / 1000),
    hiddenRoots,
  );

  const keyPoints = [
    c.keyPoints.roots,
    c.keyPoints.auto,
    c.keyPoints.heuristic,
    summary.duplicates.length > 0
      ? c.keyPoints.duplicates(summary.duplicates)
      : c.keyPoints.noDuplicates,
  ];
  els.keyPoints.replaceChildren(...keyPoints.map(makeListItem));

  const legendItems = [
    ...rootEntries.slice(0, 2).map((entry, index) =>
      makeBadge(entry.label, index === 0 ? "accent" : "muted"),
    ),
    makeBadge(c.legend.builtIn, "system"),
    makeBadge(c.legend.issues, "warn"),
    makeBadge(c.legend.worktree, "warn"),
    makeBadge(c.legend.duplicate, "danger"),
  ];
  els.legendRow.replaceChildren(...legendItems);

  const usageEntries = [usage.direct, usage.natural, usage.safety].map((item) =>
    makeListItem(pickLocalized(item)),
  );
  els.usageList.replaceChildren(...usageEntries);

  els.auditSummary.innerHTML = audit.catalog.assessment
    .map((line) => `<p>${escapeHtml(pickLocalized(line))}</p>`)
    .join("");

  els.skippedList.replaceChildren(
    ...rootEntries.map((entry) => makeListItem(`${entry.key}: ${entry.label}`)),
  );

  els.warningList.replaceChildren(
    ...audit.globalWarnings.map((line) => makeListItem(pickLocalized(line))),
  );

  els.newInstallStrip.replaceChildren(
    ...rootEntries.map((entry, index) =>
      makeTag(
        c.discoveryTags.path(index + 1, entry.label),
        index === 0 ? "accent" : "muted",
      ),
    ),
    makeTag(c.discoveryTags.marker, "system"),
    makeTag(c.discoveryTags.refresh(Math.round(config.refreshMs / 1000)), "warn"),
  );

  renderGuides();
  renderFilters(payload);
}

function renderGuides() {
  const c = currentCopy();
  const fragment = document.createDocumentFragment();

  for (const block of c.guides) {
    const article = document.createElement("article");
    article.className = "scenario-card";

    const title = document.createElement("h3");
    title.textContent = block.title;

    const desc = document.createElement("p");
    desc.textContent = block.description;

    article.append(title, desc);
    fragment.appendChild(article);
  }

  els.scenarioList.replaceChildren(fragment);
}

function renderFilters(payload) {
  const c = currentCopy();
  const rootEntries = getRootEntries(payload);
  const buttons = [
    makeFilterButton("all", c.filters.all),
    ...rootEntries.map((entry) => makeFilterButton(entry.key, entry.label)),
    makeFilterButton("system", c.filters.system),
    makeFilterButton("duplicates", c.filters.duplicates),
    makeFilterButton("warnings", c.filters.warnings),
  ];
  els.filters.replaceChildren(...buttons);
  syncActiveFilterButtons();
}

function syncActiveFilterButtons() {
  for (const current of els.filters.querySelectorAll(".filter")) {
    current.classList.toggle("is-active", current.dataset.filter === state.filter);
  }
}

function getRootEntries(payload) {
  return Object.entries(payload.audit.catalog.roots).map(([key, label]) => ({
    key,
    label,
    count: payload.summary.byRoot[key] ?? 0,
  }));
}

function getFilterLabel(filter) {
  const c = currentCopy();
  if (filterLabelKeys[filter]) {
    return c.filters[filterLabelKeys[filter]];
  }
  const root = getRootEntries(state.payload).find((entry) => entry.key === filter);
  return root ? root.label : filter;
}

function renderSkills() {
  const c = currentCopy();
  const payload = state.payload;
  if (!payload) return;

  const visible = payload.skills.filter(matchesFilter).filter(matchesQuery);
  els.resultMeta.textContent = c.resultMeta(
    visible.length,
    payload.skills.length,
    getFilterLabel(state.filter),
  );

  if (visible.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = c.noMatches;
    els.skillGroups.replaceChildren(empty);
    return;
  }

  const groups = buildGroups(visible);
  const fragment = document.createDocumentFragment();

  groups.forEach((group) => {
    if (group.items.length === 0) return;
    fragment.appendChild(renderGroup(group));
  });

  els.skillGroups.replaceChildren(fragment);
}

function buildGroups(skills) {
  const c = currentCopy();
  const payload = state.payload;

  if (state.filter === "duplicates") {
    return [
      {
        kicker: c.duplicateGroupKicker,
        title: c.duplicateGroupTitle,
        note: c.duplicateGroupNote,
        items: sortSkills(skills),
      },
    ];
  }

  if (state.filter === "warnings") {
    return [
      {
        kicker: c.warningGroupKicker,
        title: c.warningGroupTitle,
        note: c.warningGroupNote,
        items: sortSkills(skills),
      },
    ];
  }

  const groups = [
    ...getRootEntries(payload).map((entry) => ({
      key: entry.key,
      kicker: c.groupRootKicker(entry.key),
      title: entry.label,
      note: c.groupRootNote(entry.label),
      items: [],
    })),
    {
      key: "system",
      kicker: c.systemGroupKicker,
      title: c.systemGroupTitle,
      note: c.systemGroupNote,
      items: [],
    },
  ];

  for (const skill of skills) {
    const match = groups.find((group) => {
      if (group.key === "system") return skill.source === "system";
      return skill.discoveryRoot === group.key;
    });
    if (match) {
      match.items.push(skill);
    }
  }

  return groups.map((group) => ({ ...group, items: sortSkills(group.items) }));
}

function renderGroup(group) {
  const node = els.groupTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".group-kicker").textContent = group.kicker;
  node.querySelector(".group-title").textContent = group.title;
  node.querySelector(".group-note").textContent = group.note;

  const list = node.querySelector(".group-list");
  const fragment = document.createDocumentFragment();
  group.items.forEach((skill, index) => fragment.appendChild(renderSkill(skill, index === 0)));
  list.replaceChildren(fragment);

  return node;
}

function renderSkill(skill, openByDefault = false) {
  const c = currentCopy();
  const node = els.skillTemplate.content.firstElementChild.cloneNode(true);
  const details = node;
  if (openByDefault && !state.query) {
    details.open = true;
  }

  const titleEl = node.querySelector(".skill-title");
  const purposeEl = node.querySelector(".skill-purpose");
  const matchReasonEl = node.querySelector(".match-reason");
  const useWhenEl = node.querySelector(".use-when");
  const pathEl = node.querySelector(".info-path");
  const extraFilesEl = node.querySelector(".extra-files");
  const expandText = node.querySelector(".expand-text");

  setHighlightedText(titleEl, skill.name, state.query);
  setHighlightedText(
    purposeEl,
    skill.purpose || skill.description || c.fallbackText.noDescription,
    state.query,
  );
  setHighlightedText(
    useWhenEl,
    skill.useWhen || c.fallbackText.noUseWhen,
    state.query,
  );
  node.querySelector(".usage-hint").textContent = buildUsageHint(skill);
  setHighlightedText(pathEl, skill.path, state.query);
  setHighlightedText(
    extraFilesEl,
    skill.extraFiles.length > 0
      ? skill.extraFiles.join("，")
      : c.fallbackText.noExtraFiles,
    state.query,
  );
  expandText.textContent = c.detailsExpand;

  const matchReasons = getMatchReasons(skill, state.query);
  if (state.query && matchReasons.length > 0) {
    matchReasonEl.textContent = `${c.matchReasonPrefix} ${matchReasons.join(c.matchReasonJoiner)}`;
    matchReasonEl.hidden = false;
  } else {
    matchReasonEl.textContent = "";
    matchReasonEl.hidden = true;
  }

  const infoLabels = node.querySelectorAll(".info-label");
  infoLabels[0].textContent = c.infoLabels.whenToUse;
  infoLabels[1].textContent = c.infoLabels.howToSay;
  infoLabels[2].textContent = c.infoLabels.path;
  infoLabels[3].textContent = c.infoLabels.extraFiles;
  infoLabels[4].textContent = c.infoLabels.headings;
  infoLabels[5].textContent = c.infoLabels.warnings;

  const headings = node.querySelector(".headings");
  headings.replaceChildren(
    ...(skill.headings.length > 0
      ? skill.headings.map((heading) => makeListItem(heading))
      : [makeListItem(c.fallbackText.noHeadings)]),
  );

  const warnings = node.querySelector(".warnings");
  warnings.replaceChildren(
    ...(skill.warnings.length > 0
      ? skill.warnings.map((warning) =>
          makeListItem(
            `${localizeWarningLabel(warning.id, warning.label)}: ${pickLocalized(warning.detail)}`,
          ),
        )
      : [makeListItem(c.fallbackText.noWarnings)]),
  );

  const badgeWrap = node.querySelector(".skill-badges");
  badgeWrap.replaceChildren(
    ...collectBadges(skill).map((badge) => makeBadge(badge.label, badge.tone)),
  );

  return node;
}

function matchesFilter(skill) {
  const rootKeys = Object.keys(state.payload?.audit?.catalog?.roots ?? {});
  if (rootKeys.includes(state.filter)) {
    return skill.discoveryRoot === state.filter;
  }

  switch (state.filter) {
    case "system":
      return skill.source === "system";
    case "duplicates":
      return skill.duplicateName;
    case "warnings":
      return skill.warnings.length >= 2;
    default:
      return true;
  }
}

function matchesQuery(skill) {
  if (!state.query) return true;
  return getMatchReasons(skill, state.query).length > 0;
}

function sortSkills(skills) {
  return skills.slice().sort((a, b) => a.name.localeCompare(b.name));
}

function collectBadges(skill) {
  const c = currentCopy();
  const badges = [];

  if (skill.source === "system") {
    badges.push({ label: c.badges.system, tone: "system" });
  } else {
    const root = getRootEntries(state.payload).find((entry) => entry.key === skill.discoveryRoot);
    badges.push({
      label: root ? root.label : skill.discoveryRoot,
      tone: skill.discoveryRoot === "codex" ? "accent" : "muted",
    });
  }

  if (skill.duplicateName) {
    badges.push({ label: c.badges.duplicate, tone: "danger" });
  }

  if (skill.warnings.some((warning) => warning.id === "writes-issues")) {
    badges.push({ label: c.badges.writesIssues, tone: "warn" });
  }

  if (skill.warnings.some((warning) => warning.id === "creates-commit")) {
    badges.push({ label: c.badges.createsCommit, tone: "warn" });
  }

  if (skill.warnings.some((warning) => warning.id === "installs-packages")) {
    badges.push({ label: c.badges.installsPackages, tone: "warn" });
  }

  if (skill.warnings.some((warning) => warning.id === "creates-worktree")) {
    badges.push({ label: c.badges.createsWorktree, tone: "warn" });
  }

  if (skill.warnings.some((warning) => warning.id === "pushes-or-prs")) {
    badges.push({ label: c.badges.pushesOrPrs, tone: "danger" });
  }

  if (skill.warnings.some((warning) => warning.id === "needs-subagents")) {
    badges.push({ label: c.badges.needsSubagents, tone: "info" });
  }

  return badges;
}

function buildUsageHint(skill) {
  const c = currentCopy();
  const direct = c.usageHint.direct(skill.name);
  if (skill.useWhen) {
    return c.usageHint.withUseWhen(direct, skill.useWhen);
  }
  return c.usageHint.fallback(direct);
}

function getMatchReasons(skill, query) {
  const c = currentCopy();
  if (!query) return [];

  const fields = [
    [c.matchFields.name, skill.name],
    [c.matchFields.description, skill.purpose || skill.description],
    [c.matchFields.useWhen, skill.useWhen],
    [c.matchFields.path, skill.path],
    [c.matchFields.relativePath, skill.relativePath],
    [c.matchFields.extraFiles, skill.extraFiles.join(" ")],
  ];

  return fields
    .filter(([, value]) => fieldMatchesQuery(value || "", query))
    .map(([label]) => label);
}

function fieldMatchesQuery(text, query) {
  const normalizedText = (text || "").toLowerCase();
  const normalizedQuery = (query || "").toLowerCase();
  if (!normalizedText || !normalizedQuery) return false;

  if (isShortAsciiQuery(normalizedQuery)) {
    return tokenizeSearchText(normalizedText).some((token) =>
      token.startsWith(normalizedQuery),
    );
  }

  return normalizedText.includes(normalizedQuery);
}

function isShortAsciiQuery(query) {
  return /^[a-z0-9]{1,2}$/.test(query);
}

function tokenizeSearchText(text) {
  return text.split(/[^a-z0-9]+/).filter(Boolean);
}

function setHighlightedText(element, text, query) {
  const content = text || "";
  if (!query || !content) {
    element.textContent = content;
    return;
  }

  const normalizedQuery = query.toLowerCase();
  const normalizedText = content.toLowerCase();

  if (!normalizedText.includes(normalizedQuery)) {
    element.textContent = content;
    return;
  }

  const escapedQuery = escapeRegExp(query);
  element.innerHTML = escapeHtml(content).replace(
    new RegExp(escapedQuery, "gi"),
    (match) => `<mark class="search-hit">${match}</mark>`,
  );
}

function localizeWarningLabel(id, fallback) {
  const key = idToCopyKey(id);
  const mapped = currentCopy().warningLabels[key];
  return mapped || pickLocalized(fallback) || id;
}

function idToCopyKey(id) {
  return {
    "writes-issues": "writesIssues",
    "pushes-or-prs": "pushesOrPrs",
    "creates-commit": "createsCommit",
    "installs-packages": "installsPackages",
    "creates-worktree": "createsWorktree",
    "needs-subagents": "needsSubagents",
    "hardcoded-path": "hardcodedPath",
    "claude-only": "claudeOnly",
    "repo-specific": "repoSpecific",
    "niche-tooling": "nicheTooling",
    "duplicate-name": "duplicateName",
    note: "note",
  }[id] || id;
}

function makeListItem(text) {
  const li = document.createElement("li");
  li.textContent = text;
  return li;
}

function makeTag(text, tone) {
  const span = document.createElement("span");
  span.className = `tag tag-${tone}`;
  span.textContent = text;
  return span;
}

function makeBadge(text, tone) {
  const span = document.createElement("span");
  span.className = `badge badge-${tone}`;
  span.textContent = text;
  return span;
}

function makeFilterButton(filter, label) {
  const button = document.createElement("button");
  button.className = "filter";
  button.dataset.filter = filter;
  button.textContent = label;
  return button;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

boot().catch((error) => {
  console.error(error);
  els.resultMeta.textContent =
    state.lang === "zh" ? "加载失败，请检查服务端日志。" : "Failed to load the catalog. Check the server logs.";
});
