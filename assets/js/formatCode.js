/*
const codeBlocks = document.querySelectorAll(".terminal-code code");

  codeBlocks.forEach((block) => {
    // Pobierz tekst i usuń zbędne wcięcia z samego końca (np. tabulatory przed </code>)
    const lines = block.textContent.replace(/\n\s*$/, "").split("\n");

    // Wyczyść oryginalną zawartość bloku
    block.innerHTML = "";

    // Utwórz element <span> dla każdej linii
    lines.forEach((line) => {
      const lineSpan = document.createElement("span");
      lineSpan.className = "line";
      // Jeśli linia jest pusta, wstaw pusty znak, aby zachowała wysokość
      lineSpan.textContent = line === "" ? " " : line;
      block.appendChild(lineSpan);
    });
  });
  */
 document.addEventListener("DOMContentLoaded", () => {
  // Wybiera wszystkie bloki .terminal-code, które NIE są konsolą
  const pipelineBlocks = document.querySelectorAll(".terminal-code:not(.console-output) code");

  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderJenkinsCode(rawCode) {
    const html = escapeHTML(rawCode);
    const regex = /(\/\/.*$)|(["'](?:\\.|[^\\])*?["'])|\b(pipeline|agent|node|environment|stages|stage|steps|dir|script|post|always|success|failure)\b|\b(bat|sh|echo|deleteDir|archiveArtifacts|recordIssues|parasoftFindings)\b/gm;

    const highlighted = html.replace(regex, (match, comment, string, keyword, func) => {
      if (comment) return `<span class="hl-comment">${comment}</span>`;
      if (string) return `<span class="hl-string">${string}</span>`;
      if (keyword) return `<span class="hl-keyword">${keyword}</span>`;
      if (func) return `<span class="hl-func">${func}</span>`;
      return match;
    });

    return highlighted
      .split("\n")
      .map((line) => `<span class="line">${line}</span>`)
      .join("");
  }

  pipelineBlocks.forEach((block) => {
    const rawCode = block.textContent
      .replace(/\t/g, "    ")
      .replace(/^\n+|\n\s*$/g, "");

    block.innerHTML = renderJenkinsCode(rawCode);
  });
});
