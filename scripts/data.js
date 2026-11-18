(function () {
  "use strict";

  const STORAGE_KEY = "eloDigital.dados.v2";
  const STATUS = ["Novo contato", "Em análise", "Proposta", "Cliente", "Inativo"];
  const OBJETIVOS = ["Alcance", "Reconhecimento de marca", "Engajamento", "Tráfego", "Geração de contatos", "Vendas"];
  const DEMO_IDS = Object.freeze({
    company: "demo-company-cafe",
    campaign: "demo-campaign-combo",
    copy: "demo-copy-story",
    briefing: "demo-brief-story"
  });

  function agora() { return new Date().toISOString(); }
  function id(prefix) {
    const value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${value}`;
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function vazio() { return { version: 2, companies: [], campaigns: [], copies: [], briefings: [] }; }

  function normalizar(data) {
    const base = data && typeof data === "object" ? data : {};
    return {
      version: 2,
      companies: Array.isArray(base.companies) ? base.companies : [],
      campaigns: Array.isArray(base.campaigns) ? base.campaigns : [],
      copies: Array.isArray(base.copies) ? base.copies : [],
      briefings: Array.isArray(base.briefings) ? base.briefings : []
    };
  }

  function load() {
    try { return normalizar(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")); }
    catch (_error) { return vazio(); }
  }
  function save(data) {
    const next = normalizar(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("elo:datachange", { detail: clone(next) }));
    return next;
  }

  function demoRecords() {
    const createdAt = "2026-11-04T12:00:00.000Z";
    return {
      company: {
        id: DEMO_IDS.company, name: "Café do Bairro", segment: "Cafeteria e alimentação",
        region: "Comércio local", audienceSummary: "Pessoas que trabalham ou estudam na região e buscam uma opção prática de café da manhã.",
        description: "Cafeteria fictícia de bairro com atendimento acolhedor e produtos artesanais.",
        products: "Cafés, pães artesanais, bolos e combos de café da manhã", channels: "Instagram e WhatsApp",
        ageRange: "20 a 55 anos", location: "Bairro e regiões próximas", interests: "Café, gastronomia e praticidade",
        needs: "Economizar tempo sem abrir mão de uma boa refeição", behavior: "Costuma pesquisar opções e preços antes de comprar.",
        preferredChannel: "WhatsApp", interactionFrequency: "Semanal", interestLevel: "Alto", status: "Proposta",
        lastContact: new Date().toISOString().slice(0, 10), createdAt, updatedAt: createdAt, demo: true
      },
      campaign: {
        id: DEMO_IDS.campaign, companyId: DEMO_IDS.company, product: "Combo de café da manhã",
        objective: "Vendas", notes: "Divulgar o combo nos canais digitais e estimular pedidos no período da manhã.",
        createdAt, updatedAt: createdAt, demo: true
      },
      copy: {
        id: DEMO_IDS.copy, campaignId: DEMO_IDS.campaign, type: "Story", objective: "Vendas",
        tone: "Acolhedor", trigger: "Benefício concreto", length: "Curto", price: "R$ 19,90",
        discount: "", deadline: "", conditions: "Enquanto houver disponibilidade no dia", socialProof: "", quantity: "",
        instructions: "Destacar praticidade e sabor.",
        text: "Comece o dia com sabor e praticidade. ☕\nNosso combo de café da manhã reúne café fresquinho e acompanhamentos por R$ 19,90.\nPeça pelo WhatsApp.",
        prompt: "Crie um texto curto para story, com tom acolhedor e foco em vendas do combo de café da manhã do Café do Bairro. Destaque praticidade, use apenas a oferta informada de R$ 19,90 e finalize com uma chamada para pedir pelo WhatsApp.",
        createdAt, updatedAt: createdAt, demo: true
      },
      briefing: {
        id: DEMO_IDS.briefing, campaignId: DEMO_IDS.campaign, family: "Story", variant: "Story",
        mediaType: "Imagem", duration: "", title: "Seu café da manhã está pronto",
        supportText: "Sabor e praticidade para começar bem o dia.", cta: "Peça pelo WhatsApp",
        bgColor: "#7c3aed", textColor: "#ffffff", alignment: "center", position: "center",
        textSize: "medium", textWeight: "800", copyId: DEMO_IDS.copy, imageName: "",
        createdAt, updatedAt: createdAt, demo: true
      }
    };
  }

  function ensureDemoData() {
    const data = load();
    const demo = demoRecords();
    let changed = false;
    [["companies", demo.company], ["campaigns", demo.campaign], ["copies", demo.copy], ["briefings", demo.briefing]].forEach(([collection, record]) => {
      if (!data[collection].some((item) => item.id === record.id)) { data[collection].push(record); changed = true; }
    });
    return changed ? save(data) : data;
  }

  function upsert(collection, record, prefix) {
    const data = load();
    const stamp = agora();
    const next = { ...record, id: record.id || id(prefix), updatedAt: stamp, createdAt: record.createdAt || stamp };
    const index = data[collection].findIndex((item) => item.id === next.id);
    if (index >= 0) data[collection][index] = next; else data[collection].push(next);
    save(data);
    return clone(next);
  }

  function remove(collection, recordId) {
    const data = load();
    data[collection] = data[collection].filter((item) => item.id !== recordId);
    save(data);
  }

  function removeCompany(companyId) {
    const data = load();
    const campaignIds = data.campaigns.filter((item) => item.companyId === companyId).map((item) => item.id);
    data.companies = data.companies.filter((item) => item.id !== companyId);
    data.campaigns = data.campaigns.filter((item) => item.companyId !== companyId);
    data.copies = data.copies.filter((item) => !campaignIds.includes(item.campaignId));
    data.briefings = data.briefings.filter((item) => !campaignIds.includes(item.campaignId));
    save(data);
  }

  function removeCampaign(campaignId) {
    const data = load();
    data.campaigns = data.campaigns.filter((item) => item.id !== campaignId);
    data.copies = data.copies.filter((item) => item.campaignId !== campaignId);
    data.briefings = data.briefings.filter((item) => item.campaignId !== campaignId);
    save(data);
  }

  function potential(company) {
    if (company.status === "Cliente") return { kind: "converted", label: "Convertido", value: 100 };
    if (company.status === "Inativo") return { kind: "inactive", label: "Sem priorização", value: 0 };
    const base = { "Novo contato": 25, "Em análise": 45, "Proposta": 70 }[company.status] || 25;
    const contact = company.lastContact ? new Date(`${company.lastContact}T12:00:00`) : null;
    const days = contact && !Number.isNaN(contact.getTime()) ? Math.max(0, Math.floor((Date.now() - contact.getTime()) / 86400000)) : 999;
    const adjustment = days <= 7 ? 15 : days <= 30 ? 5 : days <= 60 ? -10 : -20;
    const value = Math.max(0, Math.min(100, base + adjustment));
    return { kind: "score", label: `${value} pontos`, value, days };
  }

  function importBackup(value) {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || !Array.isArray(parsed.companies) || !Array.isArray(parsed.campaigns) || !Array.isArray(parsed.copies) || !Array.isArray(parsed.briefings)) {
      throw new Error("O arquivo não contém um backup completo da Agência Elo Digital.");
    }
    return save(parsed);
  }

  window.EloData = Object.freeze({
    STORAGE_KEY, STATUS, OBJETIVOS, DEMO_IDS, load, save, ensureDemoData, demoRecords, potential, importBackup,
    saveCompany: (record) => upsert("companies", record, "company"),
    saveCampaign: (record) => upsert("campaigns", record, "campaign"),
    saveCopy: (record) => upsert("copies", record, "copy"),
    saveBriefing: (record) => upsert("briefings", record, "briefing"),
    removeCompany, removeCampaign,
    removeCopy: (recordId) => remove("copies", recordId),
    removeBriefing: (recordId) => remove("briefings", recordId),
    newId: id
  });
}());
