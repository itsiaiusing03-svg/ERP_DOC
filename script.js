(function () {
  const modules = window.ERP_MODULES || [];
  const imageSets = window.ERP_IMAGE_SETS || [];
  const deepGuide = window.ERP_DEEP_GUIDE || {};
  const executionFlows = window.ERP_EXECUTION_FLOWS || {};
  const glossaryTerms = window.ERP_TERM_GLOSSARY || [];
  const isDeepPage = document.body.dataset.page === "deep";

  const simpleImages = document.querySelector("#simpleImages");
  const quickModuleSelect = document.querySelector("#quickModuleSelect");
  const moduleSelect = document.querySelector("#moduleSelect");
  const moduleDetail = document.querySelector("#moduleDetail");
  const lightbox = document.querySelector("#imageLightbox");
  const lightboxImage = document.querySelector("#lightboxImage");
  const lightboxCaption = document.querySelector("#lightboxCaption");
  const lightboxClose = document.querySelector(".lightbox-close");
  const pageLinks = Array.from(document.querySelectorAll("[data-page-link]"));
  const quickImageIndexes = new Map();
  const activeFlowStepIndexes = new Map();
  let activeTermTrigger = null;
  let activeTermPinned = false;
  let termPopover = null;

  const moduleIconFallbacks = {
    overview: "compass",
    sales: "receipt",
    bom: "puzzle",
    mrp: "calculator",
    procurement: "cart",
    receiving: "inbox",
    inventory: "package",
    production: "factory",
    shipping: "truck",
    "accounts-receivable": "accounting-ar",
    "accounts-payable": "accounting-ap",
    "general-ledger": "accounting-gl",
    finance: "cash",
    "foreign-trade": "globe"
  };

  const moduleIconSvgs = {
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z"></path></svg>',
    receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3Z"></path><path d="M9 8h6"></path><path d="M9 12h6"></path><path d="M9 16h4"></path></svg>',
    puzzle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h4a2 2 0 1 0 4 0h4v6a2 2 0 1 0 0 4v6h-6a2 2 0 1 1-4 0H4v-4a2 2 0 1 0 0-4V8h4V4Z"></path></svg>',
    calculator: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"></rect><path d="M8 7h8"></path><path d="M8 12h.01"></path><path d="M12 12h.01"></path><path d="M16 12h.01"></path><path d="M8 16h.01"></path><path d="M12 16h.01"></path><path d="M16 16h.01"></path></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h2l2.2 10.5a2 2 0 0 0 2 1.5h7.3a2 2 0 0 0 2-1.6L21 8H7"></path><circle cx="10" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13h4l2 3h4l2-3h4"></path><path d="M5 13 7 5h10l2 8v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6Z"></path><path d="M12 5v7"></path><path d="m9 9 3 3 3-3"></path></svg>',
    package: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7 9-4 9 4-9 4-9-4Z"></path><path d="M3 7v10l9 4 9-4V7"></path><path d="M12 11v10"></path><path d="m7.5 5 9 4"></path></svg>',
    factory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l5 3V9l5 3V6h8v15H3Z"></path><path d="M7 17h2"></path><path d="M12 17h2"></path><path d="M17 17h2"></path><path d="M16 6V3h4v3"></path></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3V6Z"></path><path d="M14 10h4l3 3v3h-7v-6Z"></path><circle cx="7" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle></svg>',
    ledger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2Z"></path><path d="M8 4v17"></path><path d="M11 9h5"></path><path d="M11 13h5"></path></svg>',
    "accounting-ar": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"></path><path d="M6 21v-2a4 4 0 0 1 4 -4h3"></path><path d="M21 15h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5"></path><path d="M19 21v1m0 -8v1"></path></svg>',
    "accounting-ap": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M14 3v4a1 1 0 0 0 1 1h4"></path><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2"></path><path d="M14 11h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5"></path><path d="M12 17v1m0 -8v1"></path></svg>',
    "accounting-gl": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 5a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -14"></path><path d="M9 5a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -14"></path><path d="M5 8h4"></path><path d="M9 16h4"></path><path d="M13.803 4.56l2.184 -.53c.562 -.135 1.133 .19 1.282 .732l3.695 13.418a1.02 1.02 0 0 1 -.634 1.219l-.133 .041l-2.184 .53c-.562 .135 -1.133 -.19 -1.282 -.732l-3.695 -13.418a1.02 1.02 0 0 1 .634 -1.219l.133 -.041"></path><path d="M14 9l4 -1"></path><path d="M16 16l3.923 -.98"></path></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"></rect><circle cx="12" cy="12" r="3"></circle><path d="M6 9h.01"></path><path d="M18 15h.01"></path></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3a13.6 13.6 0 0 1 0 18"></path><path d="M12 3a13.6 13.6 0 0 0 0 18"></path></svg>'
  };

  const moduleAliases = {
    overview: ["ERP 總覽", "ERP 是什麼"],
    sales: ["銷售訂單", "銷售"],
    bom: ["BOM與製程資料", "BOM 與製程資料", "BOM（產品用料清單）", "產品用料清單", "製程資料", "製程路線", "BOM"],
    mrp: ["MRP 材料需求計算", "MRP", "材料需求計算", "Material Requirements Planning"],
    procurement: ["採購"],
    receiving: ["驗收與入庫", "驗收入庫", "驗收", "入庫"],
    inventory: ["庫存"],
    production: ["生產與 MES", "生產 MES", "生產", "MES"],
    shipping: ["出貨"],
    "accounts-receivable": ["應收帳款", "應收", "AR"],
    "accounts-payable": ["應付帳款", "應付", "AP"],
    "general-ledger": ["總帳", "GL", "會計"],
    finance: ["財務與現金流", "現金流", "財務"],
    "foreign-trade": ["國外訂單作業", "外銷", "Foreign Trade"]
  };

  const moduleMetaById = new Map();
  [...imageSets, ...modules].forEach((item) => {
    if (!moduleMetaById.has(item.id) || item.name) {
      moduleMetaById.set(item.id, item);
    }
  });

  const glossaryById = new Map(glossaryTerms.map((item) => [item.id, item]));
  const moduleTermRules = Object.entries(moduleAliases).flatMap(([id, terms]) =>
    terms.map((term) => ({ type: "module", id, term }))
  );
  const glossaryTermRules = glossaryTerms.flatMap((item) =>
    [item.term, ...(item.aliases || [])]
      .filter(Boolean)
      .map((term) => ({ type: "glossary", id: item.id, term }))
  );
  const moduleDecorationConfig = buildDecorationConfig(moduleTermRules);
  const deepDecorationConfig = buildDecorationConfig([...glossaryTermRules, ...moduleTermRules]);

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      return entities[char];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function buildDecorationConfig(rules) {
    const rulesByTerm = new Map();

    rules
      .filter((rule) => rule.term)
      .forEach((rule) => {
        const mergedRule = rulesByTerm.get(rule.term) || { term: rule.term };
        if (rule.type === "glossary" && !mergedRule.glossaryId) {
          mergedRule.glossaryId = rule.id;
        }
        if (rule.type === "module" && !mergedRule.moduleId) {
          mergedRule.moduleId = rule.id;
        }
        rulesByTerm.set(rule.term, mergedRule);
      });

    const mergedRules = Array.from(rulesByTerm.values()).sort((a, b) => {
      const lengthDiff = b.term.length - a.term.length;
      if (lengthDiff) return lengthDiff;
      if (a.glossaryId && !b.glossaryId) return -1;
      if (!a.glossaryId && b.glossaryId) return 1;
      return 0;
    });

    return {
      lookup: new Map(mergedRules.map((rule) => [rule.term, rule])),
      pattern: mergedRules.length ? new RegExp(mergedRules.map((rule) => escapeRegExp(rule.term)).join("|"), "g") : null
    };
  }

  function getModuleIconKey(id) {
    return moduleMetaById.get(id)?.icon || moduleIconFallbacks[id] || "";
  }

  function getModuleAbbreviation(module) {
    if (!module || !module.englishName) return "";
    // englishName 格式：「ABBR · Full Name」或「ABBR1 · Full1 + ABBR2 · Full2」
    return module.englishName
      .split(" + ")
      .map((part) => part.split(" · ")[0].trim())
      .filter(Boolean)
      .join(" + ");
  }

  function getModuleDisplayName(module) {
    if (!module) return "";
    const abbr = getModuleAbbreviation(module);
    return abbr ? `${module.name}（${abbr}）` : module.name;
  }

  function renderModuleIcon(id) {
    const iconKey = getModuleIconKey(id);
    const svg = moduleIconSvgs[iconKey];
    if (!svg) return "";
    return `<span class="module-icon" aria-hidden="true">${svg}</span>`;
  }

  function renderModuleLabel(id, text, extraClass = "") {
    const icon = renderModuleIcon(id);
    const className = `module-label${extraClass ? ` ${extraClass}` : ""}`;
    const safeText = escapeHtml(text);
    if (!icon) return `<span class="${className}">${safeText}</span>`;
    return `
      <span class="${className}">
        ${icon}
        <span>${safeText}</span>
      </span>
    `;
  }

  function updateSelectIcon(selectElement) {
    if (!selectElement) return;
    const iconSlot = selectElement.parentElement?.querySelector(".select-module-icon");
    if (!iconSlot) return;
    iconSlot.innerHTML = renderModuleIcon(selectElement.value);
  }

  function setupSelectIcon(selectElement) {
    if (!selectElement || selectElement.parentElement?.querySelector(".select-module-icon")) return;
    selectElement.classList.add("with-module-icon");
    selectElement.insertAdjacentHTML("beforebegin", '<span class="select-module-icon" aria-hidden="true"></span>');
    updateSelectIcon(selectElement);
  }

  function renderTermTrigger(id, label, options = {}) {
    const term = glossaryById.get(id);
    if (!term) return escapeHtml(label);
    const safeLabel = escapeHtml(label);
    const icon = options.moduleId ? renderModuleIcon(options.moduleId) : "";
    const className = `term-trigger${icon ? " term-trigger--module module-mention" : ""}`;
    const content = icon ? `${icon}<span>${safeLabel}</span>` : safeLabel;
    return `<span class="${className}" role="button" tabindex="0" aria-haspopup="dialog" aria-expanded="false" aria-label="${escapeAttr(`${label}：查看名詞解釋`)}" data-term-id="${escapeAttr(id)}">${content}</span>`;
  }

  function decorateModuleMentions(value, options = {}) {
    if (value == null) return "";
    const text = String(value);
    const useGlossary = options.glossary ?? isDeepPage;
    const config = useGlossary ? deepDecorationConfig : moduleDecorationConfig;
    if (!config.pattern) return escapeHtml(text);

    let result = "";
    let lastIndex = 0;

    text.replace(config.pattern, (match, offset) => {
      const rule = config.lookup.get(match);
      result += escapeHtml(text.slice(lastIndex, offset));

      if (rule?.glossaryId) {
        result += renderTermTrigger(rule.glossaryId, match, { moduleId: rule.moduleId });
      } else if (rule?.moduleId) {
        result += renderModuleLabel(rule.moduleId, match, "module-mention");
      } else {
        result += escapeHtml(match);
      }

      lastIndex = offset + match.length;
      return match;
    });

    result += escapeHtml(text.slice(lastIndex));
    return result;
  }

  function markActiveNavigation() {
    const activePage = document.body.dataset.page || "home";

    pageLinks.forEach((link) => {
      const target = link.dataset.pageLink || link.dataset.pageTarget;

      if (target === activePage) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function renderList(items = [], className) {
    if (!items.length) return '<p class="empty-note">尚無資料</p>';
    return `<ul class="${className}">${items
      .map((item) => {
        if (typeof item === "string") {
          return `<li>${decorateModuleMentions(item)}</li>`;
        }
        return `
          <li>
            <strong>${decorateModuleMentions(item.term || item.title)}</strong>
            ${item.note ? `<small>${decorateModuleMentions(item.note)}</small>` : ""}
          </li>
        `;
      })
      .join("")}</ul>`;
  }

  function renderStepDefinitions(definitions) {
    if (!definitions || !definitions.length) return "";
    return `
      <dl class="step-definitions">
        ${definitions
        .map((item) => `<div><dt>${decorateModuleMentions(item.term)}</dt><dd>${decorateModuleMentions(item.note)}</dd></div>`)
        .join("")}
      </dl>
    `;
  }

  function renderPositionMap(module) {
    const position = deepGuide[module.id]?.position;
    if (!position) return "";

    return `
      <section class="position-map" aria-label="${module.name} 的流程定位">
        <div class="position-node upstream">
          <span>上游</span>
          <strong>${decorateModuleMentions(position.from)}</strong>
          ${position.fromNote ? `<small>${decorateModuleMentions(position.fromNote)}</small>` : ""}
        </div>
        <div class="position-node current">
          <span>本模組</span>
          <strong>${decorateModuleMentions(position.role)}</strong>
          ${position.roleNote ? `<small>${decorateModuleMentions(position.roleNote)}</small>` : ""}
        </div>
        <div class="position-node downstream">
          <span>下游</span>
          <strong>${decorateModuleMentions(position.to)}</strong>
          ${position.toNote ? `<small>${decorateModuleMentions(position.toNote)}</small>` : ""}
        </div>
      </section>
    `;
  }

  function renderStepSectionTitle(section) {
    if (!section.title) return "";
    return `<h6 class="flow-step-section-title">${decorateModuleMentions(section.title)}</h6>`;
  }

  function renderStepText(section) {
    return `
      <section class="flow-step-section flow-step-section--text">
        ${renderStepSectionTitle(section)}
        ${section.text ? `<p>${decorateModuleMentions(section.text)}</p>` : ""}
      </section>
    `;
  }

  function renderStepColumns(section) {
    const columns = section.columns || [];
    if (!columns.length) return "";
    return `
      <section class="flow-step-section flow-step-section--columns">
        ${renderStepSectionTitle(section)}
        <div class="flow-step-columns">
          ${columns
        .map(
          (column) => `
                <div class="flow-step-column">
                  ${column.title ? `<span class="flow-step-column-title">${decorateModuleMentions(column.title)}</span>` : ""}
                  ${column.text ? `<p>${decorateModuleMentions(column.text)}</p>` : ""}
                  ${column.items && column.items.length ? renderList(column.items, "plain-list compact-list") : ""}
                </div>
              `
        )
        .join("")}
        </div>
      </section>
    `;
  }

  function renderStepList(section) {
    if (!section.items || !section.items.length) return "";
    return `
      <section class="flow-step-section flow-step-section--list">
        ${renderStepSectionTitle(section)}
        ${renderList(section.items, section.listClass || "plain-list compact-list")}
      </section>
    `;
  }

  function renderStepDefinitionsBlock(section) {
    if (!section.items || !section.items.length) return "";
    return `
      <section class="flow-step-section flow-step-section--definitions">
        ${renderStepSectionTitle(section)}
        ${renderStepDefinitions(section.items)}
      </section>
    `;
  }

  function renderStepCallout(section) {
    return `
      <section class="flow-step-section flow-step-section--callout">
        ${renderStepSectionTitle(section)}
        ${section.text ? `<p>${decorateModuleMentions(section.text)}</p>` : ""}
      </section>
    `;
  }

  function renderStepTable(section) {
    const headers = section.headers || [];
    const rows = section.rows || [];
    if (!rows.length) return "";
    return `
      <section class="flow-step-section flow-step-section--table">
        ${renderStepSectionTitle(section)}
        <div class="flow-step-table-wrapper">
          <table class="flow-step-table">
            ${headers.length
        ? `<thead><tr>${headers
          .map((h) => `<th>${decorateModuleMentions(h)}</th>`)
          .join("")}</tr></thead>`
        : ""
      }
            <tbody>
              ${rows
        .map(
          (row) =>
            `<tr>${row
              .map((cell) => `<td>${decorateModuleMentions(cell)}</td>`)
              .join("")}</tr>`
        )
        .join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderStepSection(section) {
    if (!section || typeof section !== "object") return "";
    switch (section.type) {
      case "text":
        return renderStepText(section);
      case "columns":
        return renderStepColumns(section);
      case "list":
        return renderStepList(section);
      case "definitions":
        return renderStepDefinitionsBlock(section);
      case "callout":
        return renderStepCallout(section);
      case "table":
        return renderStepTable(section);
      default:
        return "";
    }
  }

  function renderFlowDetailPanel(module, steps, activeIndex) {
    const step = steps[activeIndex];
    if (!step) return "";

    const heading = `
      <div class="flow-detail-heading">
        <span>步驟 ${String(activeIndex + 1).padStart(2, "0")}</span>
        <h5>${decorateModuleMentions(step.title)}</h5>
        <p>${decorateModuleMentions(step.description)}</p>
      </div>
    `;

    const body = (step.sections || []).map((section) => renderStepSection(section)).join("");
    return `
      <section class="flow-detail-panel sectioned" id="flow-detail-${module.id}" aria-live="polite">
        ${heading}
        ${body}
      </section>
    `;
  }

  function renderExecutionFlow(module, providedSteps) {
    const moduleId = module.id;
    const steps = providedSteps || executionFlows[moduleId] || [];
    if (!steps.length) return "";
    const storedIndex = activeFlowStepIndexes.get(moduleId) || 0;
    const activeIndex = Math.min(Math.max(storedIndex, 0), steps.length - 1);
    activeFlowStepIndexes.set(moduleId, activeIndex);

    return `
      <section class="execution-flow">
        <div class="flow-track">
          ${steps
        .map(
          (step, index) => `
                <article class="flow-step${index === activeIndex ? " active" : " dim"}">
                  <button
                    class="flow-step-button"
                    type="button"
                    data-module-id="${moduleId}"
                    data-step-index="${index}"
                    aria-controls="flow-detail-${moduleId}"
                    aria-pressed="${index === activeIndex ? "true" : "false"}"
                  >
                    <span class="flow-number">${String(index + 1).padStart(2, "0")}</span>
                    <h5>${decorateModuleMentions(step.title, { glossary: false })}</h5>
                    <p>${decorateModuleMentions(step.description, { glossary: false })}</p>
                    <div class="flow-output">
                      <span>產出</span>
                      <strong>${decorateModuleMentions(step.output, { glossary: false })}</strong>
                    </div>
                  </button>
                </article>
              `
        )
        .join("")}
        </div>
        ${renderFlowDetailPanel(module, steps, activeIndex)}
      </section>
    `;
  }

  function renderSectionHeader(section) {
    return `
      <div class="custom-section-heading">
        ${section.eyebrow ? `<p class="eyebrow">${decorateModuleMentions(section.eyebrow)}</p>` : ""}
        ${section.title ? `<h4>${decorateModuleMentions(section.title)}</h4>` : ""}
        ${section.text ? `<p>${decorateModuleMentions(section.text)}</p>` : ""}
      </div>
    `;
  }

  function renderCustomSummary(module, deep, section) {
    const baseHeading = section.heading || module.name;
    const abbr = getModuleAbbreviation(module);
    // 當 heading 為模組預設中文名時自動接上英文簡稱；若資料有刻意客製化的 heading 則保留原樣
    const headingText = abbr && baseHeading === module.name ? `${baseHeading}（${abbr}）` : baseHeading;
    return `
      <section class="module-summary custom-summary" data-section-type="summary">
        ${section.eyebrow ? `<p class="eyebrow">${decorateModuleMentions(section.eyebrow)}</p>` : `<p class="eyebrow">${decorateModuleMentions(module.tagline)}</p>`}
        <h3>${renderModuleLabel(module.id, headingText)}</h3>
        ${module.englishName ? `<p class="module-english">${decorateModuleMentions(module.englishName)}</p>` : ""}
        <p>${decorateModuleMentions(section.text || module.simple)}</p>
        ${section.mission || deep.mission ? `<p class="mission"><strong>核心任務：</strong>${decorateModuleMentions(section.mission || deep.mission)}</p>` : ""}
      </section>
    `;
  }

  function renderCustomListSection(section, defaultClass = "plain-list") {
    return `
      <section class="custom-section custom-list-section ${section.variant || ""}" data-section-type="${section.type || "list"}">
        ${renderSectionHeader(section)}
        ${renderList(section.items || [], section.listClass || defaultClass)}
      </section>
    `;
  }

  function renderCustomTextSection(section) {
    return `
      <section class="custom-section custom-text-section ${section.variant || ""}" data-section-type="${section.type || "text"}">
        ${renderSectionHeader(section)}
        ${section.points && section.points.length
        ? renderList(section.points, section.listClass || "plain-list")
        : ""
      }
      </section>
    `;
  }

  function renderCustomColumnsSection(section) {
    const columns = section.columns || [];
    return `
      <section class="custom-section custom-columns-section ${section.variant || ""}" data-section-type="${section.type || "columns"}">
        ${renderSectionHeader(section)}
        <div class="custom-columns">
          ${columns
        .map(
          (column) => `
                <section class="detail-block custom-column">
                  <h5>${decorateModuleMentions(column.title)}</h5>
                  ${column.text ? `<p>${decorateModuleMentions(column.text)}</p>` : ""}
                  ${renderList(column.items || [], column.listClass || "plain-list compact-list")}
                </section>
              `
        )
        .join("")}
        </div>
      </section>
    `;
  }

  function renderCustomDocumentFlow(section) {
    const items = section.items || [];
    return `
      <section class="custom-section document-flow-section ${section.variant || ""}" data-section-type="${section.type || "document-flow"}">
        ${renderSectionHeader(section)}
        <div class="document-flow">
          ${items
        .map(
          (item, index) => `
                <article class="document-flow-item">
                  <span>${String(index + 1).padStart(2, "0")}</span>
                  <h5>${decorateModuleMentions(item.title)}</h5>
                  <p>${decorateModuleMentions(item.text || item.description || "")}</p>
                  ${item.output ? `<strong>${decorateModuleMentions(item.output)}</strong>` : ""}
                </article>
              `
        )
        .join("")}
        </div>
      </section>
    `;
  }

  function renderCustomScenario(section) {
    return `
      <section class="custom-section scenario-section ${section.variant || ""}" data-section-type="${section.type || "scenario"}">
        ${renderSectionHeader(section)}
        <div class="scenario-panel">
          ${section.situation ? `<p><strong>情境：</strong>${decorateModuleMentions(section.situation)}</p>` : ""}
          ${section.response ? `<p><strong>系統處理：</strong>${decorateModuleMentions(section.response)}</p>` : ""}
          ${section.result ? `<p><strong>結果：</strong>${decorateModuleMentions(section.result)}</p>` : ""}
        </div>
      </section>
    `;
  }

  function renderCustomCompare(section) {
    return `
      <section class="custom-section compare-section ${section.variant || ""}" data-section-type="${section.type || "compare"}">
        ${renderSectionHeader(section)}
        <div class="compare-grid">
          ${(section.items || [])
        .map(
          (item) => `
                <article>
                  <h5>${decorateModuleMentions(item.title)}</h5>
                  <p>${decorateModuleMentions(item.text)}</p>
                </article>
              `
        )
        .join("")}
        </div>
      </section>
    `;
  }

  function renderCustomFlowSection(module, section) {
    const steps = section.steps || executionFlows[module.id] || [];
    if (!steps.length) return "";
    return `
      <section class="custom-section custom-flow-section ${section.variant || ""}" data-section-type="${section.type || "flow"}">
        ${renderSectionHeader(section)}
        ${renderExecutionFlow(module, steps)}
      </section>
    `;
  }

  function renderCustomTableSection(section) {
    const headers = section.headers || [];
    const rows = section.rows || [];
    if (!rows.length) return "";
    return `
      <section class="custom-section custom-table-section ${section.variant || ""}" data-section-type="${section.type || "table"}">
        ${renderSectionHeader(section)}
        <div class="flow-step-table-wrapper">
          <table class="flow-step-table">
            ${headers.length
        ? `<thead><tr>${headers
          .map((h) => `<th>${decorateModuleMentions(h)}</th>`)
          .join("")}</tr></thead>`
        : ""
      }
            <tbody>
              ${rows
        .map(
          (row) =>
            `<tr>${row
              .map((cell) => `<td>${decorateModuleMentions(cell)}</td>`)
              .join("")}</tr>`
        )
        .join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderCustomDefinitionsSection(section) {
    if (!section.items || !section.items.length) return "";
    return `
      <section class="custom-section custom-definitions-section ${section.variant || ""}" data-section-type="${section.type || "definitions"}">
        ${renderSectionHeader(section)}
        ${renderStepDefinitions(section.items)}
      </section>
    `;
  }

  function renderCustomSection(module, deep, section) {
    switch (section.type) {
      case "summary":
        return renderCustomSummary(module, deep, section);
      case "position":
        return renderPositionMap(module);
      case "flow":
        return renderCustomFlowSection(module, section);
      case "document-flow":
        return renderCustomDocumentFlow(section);
      case "risk":
      case "list":
        return renderCustomListSection(section);
      case "columns":
        return renderCustomColumnsSection(section);
      case "scenario":
        return renderCustomScenario(section);
      case "compare":
        return renderCustomCompare(section);
      case "table":
        return renderCustomTableSection(section);
      case "definitions":
        return renderCustomDefinitionsSection(section);
      case "callout":
        return `
          <section class="custom-section detail-callout custom-callout" data-section-type="callout">
            <h4>${decorateModuleMentions(section.title)}</h4>
            <p>${decorateModuleMentions(section.text)}</p>
          </section>
        `;
      default:
        return renderCustomTextSection(section);
    }
  }

  function renderCustomSections(module, deep, sections = []) {
    return sections.map((section) => renderCustomSection(module, deep, section)).join("");
  }

  function renderCustomModuleDetail(module, deep) {
    return `
      <div class="custom-module-detail ${deep.deepLayout || deep.layout || "sectioned"}" data-layout="${deep.deepLayout || deep.layout || "sectioned"}">
        ${renderCustomSections(module, deep, deep.sections || [])}
      </div>
    `;
  }

  function setupQuickModuleSelect() {
    if (!quickModuleSelect) return;
    quickModuleSelect.innerHTML = imageSets
      .map((set) => `<option value="${set.id}">${set.title}</option>`)
      .join("");
    setupSelectIcon(quickModuleSelect);
    quickModuleSelect.addEventListener("change", () => {
      updateSelectIcon(quickModuleSelect);
      renderSimpleImages(quickModuleSelect.value);
    });
  }

  function getNextImageSet(setId) {
    if (!imageSets.length) return null;
    const currentSetIndex = imageSets.findIndex((set) => set.id === setId);
    if (currentSetIndex === -1) return imageSets[0];
    return imageSets[(currentSetIndex + 1) % imageSets.length];
  }

  function getPreviousImageSet(setId) {
    if (!imageSets.length) return null;
    const currentSetIndex = imageSets.findIndex((set) => set.id === setId);
    if (currentSetIndex === -1) return imageSets[0];
    return imageSets[(currentSetIndex - 1 + imageSets.length) % imageSets.length];
  }

  function updateQuickModule(setId) {
    if (quickModuleSelect) {
      quickModuleSelect.value = setId;
      updateSelectIcon(quickModuleSelect);
    }
    renderSimpleImages(setId);
  }

  function renderSimpleImages(setId) {
    if (!simpleImages) return;
    const selectedSet = imageSets.find((set) => set.id === setId) || imageSets[0];
    if (!selectedSet) {
      simpleImages.innerHTML = "";
      return;
    }
    const storedIndex = quickImageIndexes.get(selectedSet.id) || 0;
    const activeIndex = Math.min(Math.max(storedIndex, 0), selectedSet.images.length - 1);
    quickImageIndexes.set(selectedSet.id, activeIndex);
    const [activeSrc, activeCaption] = selectedSet.images[activeIndex];
    const isFirstImage = activeIndex === 0;
    const isLastImage = activeIndex === selectedSet.images.length - 1;
    const previousSet = getPreviousImageSet(selectedSet.id);
    const nextSet = getNextImageSet(selectedSet.id);
    const previousLabel = previousSet ? `上一章：${previousSet.title}` : "上一章";
    const previousButtonText = "上一章";
    const previousButtonLabel = isFirstImage ? previousLabel : "上一張";
    const nextLabel = nextSet ? `下一章：${nextSet.title}` : "下一章";
    const nextButtonText = "下一章";
    const nextButtonLabel = isLastImage ? nextLabel : "下一張";

    simpleImages.innerHTML = `
      <section class="quick-folder" aria-labelledby="quick-${selectedSet.id}">
        <div class="quick-folder-header">
          <h3 id="quick-${selectedSet.id}">${renderModuleLabel(selectedSet.id, selectedSet.title)}</h3>
          <span>${activeIndex + 1} / ${selectedSet.images.length}</span>
        </div>

        <div class="quick-thumbs" aria-label="${selectedSet.title} 圖片縮圖">
          ${selectedSet.images
        .map(
          ([src, caption], index) => `
                <button
                  class="thumb-button${index === activeIndex ? " active" : ""}"
                  type="button"
                  data-set-id="${selectedSet.id}"
                  data-index="${index}"
                  aria-label="切換到 ${caption}"
                  aria-pressed="${index === activeIndex ? "true" : "false"}"
                >
                  <img src="${src}" alt="" loading="lazy">
                  <span>${index + 1}</span>
                </button>
              `
        )
        .join("")}
        </div>

        <div class="quick-viewer${isFirstImage ? " has-prev-chapter" : ""}${isLastImage ? " has-next-chapter" : ""}">
          <button class="gallery-nav prev${isFirstImage ? " prev-chapter" : ""}" type="button" data-set-id="${selectedSet.id}" data-direction="-1" aria-label="${previousButtonLabel}">
            ${isFirstImage ? `<strong aria-hidden="true">‹</strong><span>${previousButtonText}</span>` : "‹"}
          </button>
          <figure class="readable-card quick-main-card">
            <button class="image-open" type="button" data-src="${activeSrc}" data-caption="${activeCaption}">
              <img src="${activeSrc}" alt="${activeCaption}" loading="eager">
            </button>
            <figcaption>${renderModuleLabel(selectedSet.id, selectedSet.title)}：${decorateModuleMentions(activeCaption)}</figcaption>
          </figure>
          <button class="gallery-nav next${isLastImage ? " next-chapter" : ""}" type="button" data-set-id="${selectedSet.id}" data-direction="1" aria-label="${nextButtonLabel}">
            ${isLastImage ? `<span>${nextButtonText}</span><strong aria-hidden="true">›</strong>` : "›"}
          </button>
        </div>
      </section>
    `;
  }

  function setupModuleSelect() {
    if (!moduleSelect) return;
    moduleSelect.innerHTML = modules
      .map((module) => `<option value="${module.id}">${escapeHtml(getModuleDisplayName(module))}</option>`)
      .join("");
    setupSelectIcon(moduleSelect);
    moduleSelect.addEventListener("change", () => {
      updateSelectIcon(moduleSelect);
      renderModuleDetail(moduleSelect.value);
    });
  }

  function renderOverviewHub(module) {
    const others = modules.filter((item) => item.id !== module.id);
    const storySteps = [
      { title: "客戶下單", text: "銷售訂單先記下品項、數量、價格、交期與信用條件。" },
      { title: "確認能不能交", text: "庫存先看可用量，不夠就交給採購補料或生產安排。" },
      { title: "採購入庫", text: "採購下單，供應商到貨後由驗收確認品質，正式增加庫存，應付帳款依驗收與發票建立公司欠款。" },
      { title: "生產完工", text: "BOM 與製程資料告訴現場怎麼做，MES 回報進度與良率，變壓器完工後還要通過變壓器測試才會轉成可出貨庫存。" },
      { title: "出貨收款", text: "依出貨單從庫存取出指定序號的變壓器，出貨扣庫存，應收帳款建立客戶欠款並追蹤收款沖帳。" },
      { title: "看帳與現金", text: "總帳產出正式報表，財務預估何時收錢、付錢與是否有資金缺口。" }
    ];
    const misconceptions = [
      "ERP 不是只給會計用；業務、採購、倉庫、生產、財務都會共用同一份資料。",
      "ERP 不是模組越多越好；真正重要的是資料是否一致、流程是否接得起來。",
      "ERP 不是上線後就自動變準；主檔、權限、異常處理與日常紀律都要一起管理。",
      "ERP 不是每個部門各做各的表；它的價值在於讓一張訂單一路影響庫存、生產、出貨與帳務。"
    ];
    const cards = others
      .map(
        (item) => `
          <button
            type="button"
            class="overview-card"
            data-overview-target="${item.id}"
            aria-label="切換到「${item.name}」模組"
          >
            <span class="overview-card-icon">${renderModuleIcon(item.id)}</span>
            <span class="overview-card-body">
              <strong>${escapeHtml(getModuleDisplayName(item))}</strong>
              <small>${decorateModuleMentions(item.tagline || "", { glossary: false })}</small>
            </span>
            <span class="overview-card-arrow" aria-hidden="true">›</span>
          </button>
        `
      )
      .join("");

    return `
      <section class="overview-hub" aria-labelledby="overview-hub-title">
        <div class="overview-hub-intro">
          <p class="eyebrow">ERP 總覽</p>
          <h3 id="overview-hub-title">${decorateModuleMentions(module.simple || module.tagline || "ERP 把所有部門的資料串成同一份。")}</h3>
          <p class="overview-hub-hint">點下方任一模組，看它的上下游、流程與控管重點。</p>
        </div>
        <section class="overview-story" aria-labelledby="overview-story-title">
          <div class="overview-story-heading">
            <p class="eyebrow">一日故事</p>
            <h4 id="overview-story-title">從客戶下單到公司真的收到錢</h4>
          </div>
          <ol class="overview-story-steps">
            ${storySteps
        .map(
          (step) => `
                  <li>
                    <strong>${decorateModuleMentions(step.title)}</strong>
                    <span>${decorateModuleMentions(step.text)}</span>
                  </li>
                `
        )
        .join("")}
          </ol>
        </section>
        <figure class="overview-flow-figure">
          <img src="ERP是什麼說明圖文/06-ERP全流程總覽圖.png" alt="ERP 全流程總覽圖，從銷售訂單串接庫存、採購、生產、出貨、應收帳款、應付帳款、總帳與財務。">
          <figcaption>ERP 全流程總覽：一張圖看資料如何從訂單一路流到庫存、生產、帳務與現金流。</figcaption>
        </figure>
        <div class="overview-card-grid">
          ${cards}
        </div>
        <details class="overview-misconceptions">
          <summary>常見誤解</summary>
          <ul>
            ${misconceptions.map((item) => `<li>${decorateModuleMentions(item)}</li>`).join("")}
          </ul>
        </details>
      </section>
    `;
  }

  function renderModuleDetail(moduleId) {
    if (!moduleDetail) return;
    const module = modules.find((item) => item.id === moduleId) || modules[0];
    if (!module) return;
    hideTermPopover();

    if (module.id === "overview") {
      moduleDetail.innerHTML = renderOverviewHub(module);
      return;
    }

    const deep = deepGuide[module.id] || {};

    moduleDetail.innerHTML = renderCustomModuleDetail(module, deep);
  }

  function openLightbox(src, caption) {
    if (!lightbox || !lightboxImage || !lightboxCaption) return;
    lightboxImage.src = src;
    lightboxImage.alt = caption;
    lightboxCaption.textContent = caption;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox || !lightboxImage) return;
    lightbox.hidden = true;
    lightboxImage.src = "";
    document.body.style.overflow = "";
  }

  function getTermPopover() {
    if (termPopover) return termPopover;

    termPopover = document.createElement("div");
    termPopover.id = "termPopover";
    termPopover.className = "term-popover";
    termPopover.setAttribute("role", "tooltip");
    termPopover.hidden = true;
    termPopover.innerHTML = `
      <strong class="term-popover-title"></strong>
      <p class="term-popover-body"></p>
    `;
    document.body.appendChild(termPopover);
    return termPopover;
  }

  function setTermTriggerExpanded(trigger, expanded) {
    if (!trigger) return;
    trigger.setAttribute("aria-expanded", expanded ? "true" : "false");
    if (expanded) {
      trigger.setAttribute("aria-describedby", "termPopover");
    } else {
      trigger.removeAttribute("aria-describedby");
    }
  }

  function positionTermPopover(trigger) {
    const popover = getTermPopover();
    if (!trigger || popover.hidden) return;

    const margin = 12;
    const offset = 8;
    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let top = triggerRect.bottom + offset;
    let placement = "bottom";
    let left = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;

    if (top + popoverRect.height > viewportHeight - margin) {
      top = triggerRect.top - popoverRect.height - offset;
      placement = "top";
    }

    if (top < margin) {
      top = margin;
      placement = "bottom";
    }

    left = Math.min(Math.max(left, margin), viewportWidth - popoverRect.width - margin);
    const arrowLeft = Math.min(Math.max(triggerRect.left + triggerRect.width / 2 - left, 16), popoverRect.width - 16);

    popover.dataset.placement = placement;
    popover.style.setProperty("--term-arrow-left", `${Math.round(arrowLeft)}px`);
    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  }

  function showTermPopover(trigger, { pinned = false } = {}) {
    const term = glossaryById.get(trigger?.dataset.termId);
    if (!term) return;

    const popover = getTermPopover();
    if (activeTermTrigger && activeTermTrigger !== trigger) {
      setTermTriggerExpanded(activeTermTrigger, false);
    }

    popover.querySelector(".term-popover-title").textContent = term.term;
    popover.querySelector(".term-popover-body").textContent = term.description;
    popover.hidden = false;
    popover.style.visibility = "hidden";
    activeTermTrigger = trigger;
    activeTermPinned = pinned;
    setTermTriggerExpanded(trigger, true);
    positionTermPopover(trigger);
    popover.style.visibility = "";
  }

  function hideTermPopover() {
    if (activeTermTrigger) {
      setTermTriggerExpanded(activeTermTrigger, false);
    }
    activeTermTrigger = null;
    activeTermPinned = false;
    if (termPopover) {
      termPopover.hidden = true;
    }
  }

  function togglePinnedTermPopover(trigger) {
    if (activeTermTrigger === trigger && activeTermPinned) {
      hideTermPopover();
      return;
    }
    showTermPopover(trigger, { pinned: true });
  }

  function updateActiveTermPopoverPosition() {
    if (activeTermTrigger) {
      positionTermPopover(activeTermTrigger);
    }
  }

  document.addEventListener("pointerover", (event) => {
    const trigger = event.target.closest(".term-trigger");
    if (!trigger || event.pointerType !== "mouse" || activeTermPinned) return;
    showTermPopover(trigger);
  });

  document.addEventListener("pointerout", (event) => {
    const trigger = event.target.closest(".term-trigger");
    if (!trigger || event.pointerType !== "mouse" || activeTermPinned) return;
    if (!trigger.contains(event.relatedTarget)) {
      hideTermPopover();
    }
  });

  document.addEventListener("focusin", (event) => {
    const trigger = event.target.closest(".term-trigger");
    if (!trigger || activeTermPinned) return;
    showTermPopover(trigger);
  });

  document.addEventListener("focusout", (event) => {
    const trigger = event.target.closest(".term-trigger");
    if (!trigger || activeTermPinned) return;
    window.setTimeout(() => {
      if (!document.activeElement?.closest?.(".term-trigger")) {
        hideTermPopover();
      }
    }, 0);
  });

  document.addEventListener("click", (event) => {
    const termTrigger = event.target.closest(".term-trigger");
    if (termTrigger) {
      event.preventDefault();
      event.stopPropagation();
      togglePinnedTermPopover(termTrigger);
      return;
    }

    if (termPopover && !termPopover.hidden && !event.target.closest(".term-popover")) {
      hideTermPopover();
    }

    const overviewCard = event.target.closest("[data-overview-target]");
    if (overviewCard) {
      const targetId = overviewCard.dataset.overviewTarget;
      if (moduleSelect) {
        moduleSelect.value = targetId;
        updateSelectIcon(moduleSelect);
      }
      renderModuleDetail(targetId);
      const detailSection = document.querySelector("#deep");
      if (detailSection) {
        detailSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    const flowButton = event.target.closest(".flow-step-button");
    if (flowButton) {
      activeFlowStepIndexes.set(flowButton.dataset.moduleId, Number(flowButton.dataset.stepIndex));
      renderModuleDetail(flowButton.dataset.moduleId);
      return;
    }

    const thumb = event.target.closest(".thumb-button");
    if (thumb) {
      const index = Number(thumb.dataset.index);
      quickImageIndexes.set(thumb.dataset.setId, index);
      renderSimpleImages(thumb.dataset.setId);
      return;
    }

    const nav = event.target.closest(".gallery-nav");
    if (nav) {
      const set = imageSets.find((item) => item.id === nav.dataset.setId);
      if (!set) return;
      const currentIndex = quickImageIndexes.get(set.id) || 0;
      const direction = Number(nav.dataset.direction);
      const isMovingToPreviousChapter = direction < 0 && currentIndex === 0;
      const isMovingToNextChapter = direction > 0 && currentIndex === set.images.length - 1;
      if (isMovingToPreviousChapter) {
        const previousSet = getPreviousImageSet(set.id);
        if (!previousSet) return;
        quickImageIndexes.set(previousSet.id, previousSet.images.length - 1);
        updateQuickModule(previousSet.id);
        return;
      }
      if (isMovingToNextChapter) {
        const nextSet = getNextImageSet(set.id);
        if (!nextSet) return;
        quickImageIndexes.set(nextSet.id, 0);
        updateQuickModule(nextSet.id);
        return;
      }
      const nextIndex = (currentIndex + direction + set.images.length) % set.images.length;
      quickImageIndexes.set(set.id, nextIndex);
      updateQuickModule(set.id);
      return;
    }

    const trigger = event.target.closest(".image-open");
    if (trigger) {
      openLightbox(trigger.dataset.src, trigger.dataset.caption);
      return;
    }

    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    const termTrigger = event.target.closest(".term-trigger");
    if (termTrigger && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      togglePinnedTermPopover(termTrigger);
      return;
    }

    if (event.key === "Escape" && termPopover && !termPopover.hidden) {
      hideTermPopover();
      return;
    }

    if (event.key === "Escape" && lightbox && !lightbox.hidden) {
      closeLightbox();
    }
  });

  window.addEventListener("resize", updateActiveTermPopoverPosition);
  document.addEventListener("scroll", updateActiveTermPopoverPosition, true);

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }

  setupQuickModuleSelect();
  renderSimpleImages(imageSets[0] && imageSets[0].id);
  setupModuleSelect();
  renderModuleDetail(modules[0] && modules[0].id);
  markActiveNavigation();
  setupIconToggle();

  function setupIconToggle() {
    // ① 注入 CSS 規則：body.hide-term-icons 時隱藏 .term-trigger 內的 .module-icon
    if (!document.getElementById("term-icon-toggle-style")) {
      const style = document.createElement("style");
      style.id = "term-icon-toggle-style";
      // 範圍涵蓋:① .term-trigger 內的 icon(有 tooltip 的詞);② .module-label 內的 icon
      // (沒 tooltip 的純模組名,例如頁面標題、內文裡的模組名)。
      // 保留:.select-module-icon、.overview-card-icon(屬於 UI 元素,非正文)。
      style.textContent =
        "body.hide-term-icons .term-trigger .module-icon," +
        "body.hide-term-icons .module-label .module-icon{display:none;}" +
        "body.hide-term-icons .term-trigger.term-trigger--module>span," +
        "body.hide-term-icons .module-label>span{margin-left:0;}";
      document.head.appendChild(style);
    }

    // ② 從 localStorage 讀初始狀態（預設為「隱藏」）
    const STORAGE_KEY = "hideTermIcons";
    const stored = localStorage.getItem(STORAGE_KEY);
    const initialHidden = stored === null ? true : stored === "1";
    document.body.classList.toggle("hide-term-icons", initialHidden);

    // ③ 在 .main-nav 中插入切換按鈕（在「頂部」之前）
    const nav = document.querySelector(".main-nav");
    if (!nav) return;
    if (nav.querySelector(".term-icon-toggle")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-action term-icon-toggle";

    function refreshLabel() {
      const hidden = document.body.classList.contains("hide-term-icons");
      btn.textContent = hidden ? "顯示模組圖示" : "隱藏模組圖示";
      btn.setAttribute(
        "aria-label",
        hidden ? "顯示內文中模組名詞旁的圖示" : "隱藏模組名詞旁的圖示"
      );
      btn.setAttribute("aria-pressed", String(hidden));
      btn.title = hidden
        ? "目前已隱藏；點此顯示模組圖示"
        : "目前已顯示；點此隱藏模組圖示";
    }

    btn.addEventListener("click", () => {
      const nextHidden = !document.body.classList.contains("hide-term-icons");
      document.body.classList.toggle("hide-term-icons", nextHidden);
      localStorage.setItem(STORAGE_KEY, nextHidden ? "1" : "0");
      refreshLabel();
    });

    refreshLabel();

    const backToTop = nav.querySelector('a[href="#top"]');
    if (backToTop) nav.insertBefore(btn, backToTop);
    else nav.appendChild(btn);
  }
})();
