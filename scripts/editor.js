(function () {
  "use strict";
  const store = window.EloData;
  const shell = window.EloShell;
  if (!store || !shell) return;

  const form = document.querySelector("[data-editor-form]");
  const preview = document.querySelector("[data-preview]");
  const history = document.querySelector("[data-briefing-history]");
  const imageInput = document.querySelector("[data-image-upload]");
  let imageDataUrl = "";

  const FORMATS = {
    Feed: { variants: ["Post quadrado"], media: ["Imagem"], dimensions: { "Post quadrado": [1080, 1080, "1:1"] } },
    Story: { variants: ["Story"], media: ["Imagem", "Vídeo"], dimensions: { Story: [1080, 1920, "9:16"] } },
    Reel: { variants: ["Reel", "Capa de reel"], media: ["Vídeo"], dimensions: { Reel: [1080, 1920, "9:16"], "Capa de reel": [420, 654, "aprox. 1:1,55"] } }
  };
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char])); }
  function dataFromForm() { return Object.fromEntries(new FormData(form).entries()); }
  function context(campaignId) {
    const data = store.load(); const campaign = data.campaigns.find((item) => item.id === campaignId);
    return { data, campaign, company: campaign && data.companies.find((item) => item.id === campaign.companyId) };
  }
  function fillCampaigns(selected = "") {
    const data = store.load(); const select = form.elements.campaignId;
    select.innerHTML = '<option value="">Selecione uma campanha</option>';
    data.campaigns.forEach((campaign) => select.add(new Option(shell.campaignLabel(campaign, data), campaign.id)));
    select.value = selected; campaignChanged();
  }
  function campaignChanged() {
    const { data, campaign, company } = context(form.elements.campaignId.value);
    const box = document.querySelector("[data-editor-campaign-summary]");
    const copySelect = document.querySelector("[data-copy-select]");
    copySelect.innerHTML = '<option value="">Selecione uma versão do Copy</option>';
    if (!campaign || !company) { box.innerHTML = "<p>Selecione uma campanha para carregar empresa, produto e objetivo.</p>"; return; }
    box.innerHTML = `<strong>${escapeHtml(company.name)}</strong><span>${escapeHtml(campaign.product)} · ${escapeHtml(campaign.objective)}</span><p>${escapeHtml(company.audienceSummary)}</p>`;
    data.copies.filter((item) => item.campaignId === campaign.id).forEach((copy) => copySelect.add(new Option(`${copy.type} · ${copy.tone} · ${shell.formatDate(copy.updatedAt)}`, copy.id)));
  }
  function setOptions(select, values, selected = "") {
    select.innerHTML = ""; values.forEach((value) => select.add(new Option(value, value))); if (selected) select.value = selected;
  }
  function updateFormat(preserve = {}) {
    const family = form.elements.family.value; const config = FORMATS[family];
    setOptions(form.elements.variant, config.variants, preserve.variant);
    const variant = form.elements.variant.value;
    const media = variant === "Capa de reel" ? ["Imagem"] : config.media;
    setOptions(form.elements.mediaType, media, preserve.mediaType);
    updateDuration(preserve.duration);
  }
  function updateDuration(selected = "") {
    const video = form.elements.mediaType.value === "Vídeo";
    document.querySelector("[data-duration-field]").hidden = !video;
    const durations = form.elements.family.value === "Reel" ? ["15 segundos", "30 segundos", "60 segundos", "90 segundos"] : ["15 segundos", "30 segundos", "60 segundos"];
    setOptions(form.elements.duration, video ? durations : [""], selected);
    updatePreview();
  }
  function dimensions() {
    const format = FORMATS[form.elements.family.value];
    return format.dimensions[form.elements.variant.value] || Object.values(format.dimensions)[0];
  }
  function updatePreview() {
    const [width, height, ratio] = dimensions();
    document.querySelector("[data-preview-dimensions]").textContent = `${width} × ${height} px`;
    document.querySelector("[data-format-info]").textContent = `${form.elements.variant.value} · ${width} × ${height} px · proporção ${ratio}${form.elements.mediaType.value === "Vídeo" ? ` · ${form.elements.duration.value}` : ""}`;
    preview.className = `preview-social ${width === height ? "formato-feed" : width === 420 ? "formato-capa" : "formato-vertical"} position-${form.elements.position.value} align-${form.elements.alignment.value} size-${form.elements.textSize.value}`;
    preview.style.setProperty("--preview-bg", form.elements.bgColor.value);
    preview.style.setProperty("--preview-color", form.elements.textColor.value);
    preview.style.setProperty("--preview-weight", form.elements.textWeight.value);
    document.querySelector("[data-preview-title]").textContent = form.elements.title.value || "Seu título aparece aqui";
    document.querySelector("[data-preview-support]").textContent = form.elements.supportText.value || "Adicione um texto de apoio para contextualizar a peça.";
    document.querySelector("[data-preview-cta]").textContent = form.elements.cta.value || "Saiba mais";
    const image = document.querySelector("[data-preview-image]"); image.hidden = !imageDataUrl; if (imageDataUrl) image.src = imageDataUrl;
  }
  function clearErrors() { form.querySelectorAll("[data-error-for]").forEach((item) => { item.textContent = ""; }); document.querySelector("[data-editor-message]").textContent = ""; }
  function validate() {
    clearErrors(); let valid = true;
    ["campaignId", "title"].forEach((name) => { if (!form.elements[name].value.trim()) { valid = false; form.querySelector(`[data-error-for="${name}"]`).textContent = "Preencha este campo."; } });
    if (!valid) { document.querySelector("[data-editor-message]").textContent = "Revise os campos obrigatórios."; form.querySelector("[data-error-for]:not(:empty)")?.closest("label")?.querySelector("input,select")?.focus(); }
    return valid;
  }
  function reset() {
    form.reset(); form.elements.id.value = ""; imageDataUrl = ""; imageInput.value = "";
    document.querySelector("[data-image-status]").textContent = "Opcional. A imagem não será salva no localStorage.";
    document.querySelector("[data-save-briefing]").textContent = "Salvar briefing"; clearErrors(); fillCampaigns(); updateFormat(); updatePreview();
  }

  function renderHistory() {
    const data = store.load(); document.querySelector("[data-briefing-count]").textContent = data.briefings.length;
    history.innerHTML = data.briefings.slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).map((brief) => {
      const campaign = data.campaigns.find((item) => item.id === brief.campaignId); const company = campaign && data.companies.find((item) => item.id === campaign.companyId);
      return `<article class="cartao-historico cartao-briefing"><div class="miniatura-briefing" style="--mini-bg:${escapeHtml(brief.bgColor)};--mini-color:${escapeHtml(brief.textColor)}"><span>${escapeHtml(brief.family)}</span><strong>${escapeHtml(brief.title)}</strong></div><div class="topo-historico"><span class="selo-editor">${escapeHtml(brief.variant)}</span><time>${shell.formatDate(brief.updatedAt)}</time></div><h3>${escapeHtml(campaign?.product || "Campanha removida")}</h3><p class="meta-historico">${escapeHtml(company?.name || "Empresa removida")} · ${escapeHtml(brief.mediaType)}${brief.duration ? ` · ${escapeHtml(brief.duration)}` : ""}</p><div class="acoes-linha"><button type="button" data-edit-brief="${brief.id}">Editar</button><button type="button" data-duplicate-brief="${brief.id}">Duplicar</button><button class="acao-perigo" type="button" data-delete-brief="${brief.id}">Excluir</button></div></article>`;
    }).join("");
    document.querySelector("[data-briefing-empty]").hidden = data.briefings.length > 0;
  }
  function loadBrief(brief, duplicate = false) {
    reset(); form.elements.family.value = brief.family; updateFormat({ variant: brief.variant, mediaType: brief.mediaType, duration: brief.duration });
    Object.entries(brief).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value ?? ""; });
    if (duplicate) form.elements.id.value = "";
    fillCampaigns(brief.campaignId); campaignChanged(); imageDataUrl = "";
    document.querySelector("[data-image-status]").textContent = brief.imageName ? `A imagem “${brief.imageName}” não foi armazenada. Selecione-a novamente.` : "Nenhuma imagem foi salva neste briefing.";
    document.querySelector("[data-save-briefing]").textContent = duplicate ? "Salvar como nova peça" : "Atualizar briefing";
    updatePreview(); scrollTo({ top: 0, behavior: "smooth" }); shell.toast(duplicate ? "Briefing duplicado. Ajuste e salve a nova peça." : "Briefing carregado para edição.");
  }

  function wrapLines(ctx, text, maxWidth) {
    const paragraphs = String(text || "").split("\n"); const lines = [];
    paragraphs.forEach((paragraph) => {
      const words = paragraph.split(/\s+/).filter(Boolean); let line = "";
      words.forEach((word) => { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test; });
      if (line) lines.push(line);
    }); return lines;
  }
  async function drawImageCover(ctx, src, width, height) {
    if (!src) return;
    const image = new Image(); image.src = src; await image.decode();
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight); const w = image.naturalWidth * scale; const h = image.naturalHeight * scale;
    ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h); ctx.fillStyle = "rgba(11,16,32,.38)"; ctx.fillRect(0, 0, width, height);
  }
  async function downloadPng() {
    const [width, height] = dimensions(); const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; const ctx = canvas.getContext("2d");
    ctx.fillStyle = form.elements.bgColor.value; ctx.fillRect(0, 0, width, height); await drawImageCover(ctx, imageDataUrl, width, height);
    const gradient = ctx.createLinearGradient(0, 0, width, height); gradient.addColorStop(0, "rgba(37,99,235,.2)"); gradient.addColorStop(1, "rgba(236,72,153,.25)"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = .2; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(width * .82, height * .14, width * .2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    const align = form.elements.alignment.value; ctx.textAlign = align; ctx.textBaseline = "top"; ctx.fillStyle = form.elements.textColor.value;
    const x = align === "left" ? width * .09 : align === "right" ? width * .91 : width * .5; const maxWidth = width * .82;
    const titleSize = Math.round(width * ({ small: .065, medium: .085, large: .105 }[form.elements.textSize.value] || .085));
    ctx.font = `${form.elements.textWeight.value} ${titleSize}px Manrope, sans-serif`; const titleLines = wrapLines(ctx, form.elements.title.value || "Seu título aparece aqui", maxWidth);
    ctx.font = `500 ${Math.round(titleSize * .38)}px Inter, sans-serif`; const supportLines = wrapLines(ctx, form.elements.supportText.value, maxWidth);
    const totalHeight = titleLines.length * titleSize * 1.05 + supportLines.length * titleSize * .5 + titleSize * .75;
    let y = form.elements.position.value === "top" ? height * .15 : form.elements.position.value === "bottom" ? height * .8 - totalHeight : (height - totalHeight) / 2;
    ctx.font = `${form.elements.textWeight.value} ${titleSize}px Manrope, sans-serif`; titleLines.forEach((line) => { ctx.fillText(line, x, y); y += titleSize * 1.05; });
    ctx.font = `500 ${Math.round(titleSize * .38)}px Inter, sans-serif`; y += titleSize * .18; supportLines.forEach((line) => { ctx.fillText(line, x, y); y += titleSize * .5; });
    const cta = form.elements.cta.value || "Saiba mais"; ctx.font = `700 ${Math.round(titleSize * .32)}px Inter, sans-serif`; y += titleSize * .25; ctx.fillText(cta, x, y);
    canvas.toBlob((blob) => { const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `elo-digital-${form.elements.variant.value.toLowerCase().replaceAll(" ", "-")}.png`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); shell.toast("Prévia PNG exportada."); }, "image/png");
  }

  form.elements.campaignId.addEventListener("change", campaignChanged);
  form.elements.family.addEventListener("change", () => updateFormat());
  form.elements.variant.addEventListener("change", () => { const family = form.elements.family.value; setOptions(form.elements.mediaType, form.elements.variant.value === "Capa de reel" ? ["Imagem"] : FORMATS[family].media); updateDuration(); });
  form.elements.mediaType.addEventListener("change", () => updateDuration());
  form.addEventListener("input", updatePreview);
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0]; if (!file) { imageDataUrl = ""; updatePreview(); return; }
    if (file.size > 8 * 1024 * 1024) { shell.toast("Escolha uma imagem de até 8 MB para a prévia.", "error"); imageInput.value = ""; return; }
    const reader = new FileReader(); reader.addEventListener("load", () => { imageDataUrl = reader.result; document.querySelector("[data-image-status]").textContent = `${file.name} disponível somente nesta sessão.`; updatePreview(); }); reader.readAsDataURL(file);
  });
  document.querySelector("[data-import-copy]").addEventListener("click", () => {
    const copy = store.load().copies.find((item) => item.id === document.querySelector("[data-copy-select]").value);
    if (!copy) { shell.toast("Selecione uma versão salva na mesma campanha.", "error"); return; }
    const lines = copy.text.split(/\n+/).filter(Boolean); form.elements.title.value = lines.shift()?.replace(/^Assunto:\s*/i, "").slice(0, 90) || ""; form.elements.supportText.value = lines.join(" ").slice(0, 280); updatePreview(); shell.toast("Texto importado do Copy. Revise a composição.");
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault(); if (!validate()) return; const config = dataFromForm(); const current = store.load().briefings.find((item) => item.id === config.id);
    const saved = store.saveBriefing({ ...current, ...config, imageName: imageInput.files[0]?.name || current?.imageName || "", copyId: document.querySelector("[data-copy-select]").value || current?.copyId || "", demo: current?.demo || false });
    form.elements.id.value = saved.id; document.querySelector("[data-save-briefing]").textContent = "Atualizar briefing"; renderHistory(); shell.toast(current ? "Briefing atualizado." : "Briefing salvo.");
  });
  document.querySelector("[data-download-png]").addEventListener("click", downloadPng);
  document.querySelector("[data-clear-editor]").addEventListener("click", reset);
  history.addEventListener("click", (event) => {
    const button = event.target.closest("button"); if (!button) return; const data = store.load();
    if (button.dataset.editBrief) loadBrief(data.briefings.find((item) => item.id === button.dataset.editBrief));
    if (button.dataset.duplicateBrief) loadBrief(data.briefings.find((item) => item.id === button.dataset.duplicateBrief), true);
    if (button.dataset.deleteBrief) { const brief = data.briefings.find((item) => item.id === button.dataset.deleteBrief); if (brief && confirm("Excluir este briefing? Esta ação não pode ser desfeita.")) { store.removeBriefing(brief.id); renderHistory(); shell.toast("Briefing excluído."); } }
  });

  fillCampaigns(new URLSearchParams(location.search).get("campanha") || ""); updateFormat(); updatePreview(); renderHistory();
}());
