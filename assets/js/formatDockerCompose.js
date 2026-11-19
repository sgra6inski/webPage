document.addEventListener("DOMContentLoaded", () => {
  const composeBlocks = document.querySelectorAll(".terminal-code.docker-compose code");

  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Formatowanie pojedynczej linii wewnątrz osadzonego skryptu Shell
  function highlightShellLine(escapedLine) {
    // Jeśli linia jest komentarzem bashowym (# ...)
    if (/^\s*#/.test(escapedLine)) {
      return escapedLine.replace(/^(\s*)(#.*)$/, '$1<span class="dc-comment">$2</span>');
    }

    const shellRegex = /(["'](?:\\.|[^\\])*?["'])|\b(if|then|else|fi|exit)\b|\b(echo|cut|grep|tail|sed|cp|chmod|rm|sh)\b|(\$\$\{?[a-zA-Z0-9_]+\}?)/g;

    return escapedLine.replace(shellRegex, (match, str, keyword, cmd, variable) => {
      if (str) {
        // Wewnątrz stringów kolorujemy dodatkowo zmienne $$VAR oraz słowo ERROR
        const innerStr = str
          .replace(/(\$\$\{?[a-zA-Z0-9_]+\}?)/g, '<span class="sh-var">$1</span>')
          .replace(/\b(ERROR:)/g, '<span class="sh-error">$1</span>');
        return `<span class="dc-string">${innerStr}</span>`;
      }
      if (keyword) return `<span class="sh-keyword">${keyword}</span>`;
      if (cmd) return `<span class="sh-cmd">${cmd}</span>`;
      if (variable) return `<span class="sh-var">${variable}</span>`;
      return match;
    });
  }

  // Formatowanie pojedynczej linii konfiguracji YAML (Docker Compose)
  function highlightYamlLine(escapedLine) {
    // 1. Cała linia jest komentarzem (# ...)
    if (/^\s*#/.test(escapedLine)) {
      return escapedLine.replace(/^(\s*)(#.*)$/, '$1<span class="dc-comment">$2</span>');
    }

    // 2. Linia z kluczem YAML (np. "  image: busybox" lub "services:")
    if (/^(\s*)([a-zA-Z0-9_.-]+)(:)(\s*)(.*)$/.test(escapedLine)) {
      return escapedLine.replace(
        /^(\s*)([a-zA-Z0-9_.-]+)(:)(\s*)(.*)$/,
        (_, indent, key, colon, space, value) => {
          const isRoot = indent.length === 0;
          const keyClass = isRoot ? "dc-root-key" : "dc-key";
          return `${indent}<span class="${keyClass}">${key}</span>${colon}${space}${formatYamlValue(value)}`;
        }
      );
    }

    // 3. Element listy YAML (np. "      - *dtpConfigVolume" lub "      - |")
    if (/^(\s*-\s+)(.*)$/.test(escapedLine)) {
      return escapedLine.replace(/^(\s*-\s+)(.*)$/, (_, dash, value) => {
        return `${dash}${formatYamlValue(value)}`;
      });
    }

    return escapedLine;
  }

  // Pomocnicza: formatowanie wartości po dwukropku lub myślniku w YAML
  function formatYamlValue(val) {
    if (!val) return "";

    // Znak bloku wieloliniowego "|"
    if (val.trim() === "|") {
      return `<span class="dc-bool">${val}</span>`;
    }

    const valRegex = /(#.*$)|(["'](?:\\.|[^\\])*?["'])|([&*][a-zA-Z0-9_-]+)|\b(true|false|no|yes)\b/g;

    return val.replace(valRegex, (match, comment, str, anchor, bool) => {
      if (comment) return `<span class="dc-comment">${comment}</span>`;
      if (str) return `<span class="dc-string">${str}</span>`;
      if (anchor) return `<span class="dc-anchor">${anchor}</span>`;
      if (bool) return `<span class="dc-bool">${bool}</span>`;
      return match;
    });
  }

  // Główna funkcja przetwarzająca cały blok Docker Compose
  function renderDockerCompose(rawCode) {
    const lines = rawCode.split("\n");
    let inScriptBlock = false;
    let scriptBaseIndent = 0;

    return lines
      .map((rawLine) => {
        const escaped = escapeHTML(rawLine);
        const trimmed = rawLine.trim();
        const currentIndent = rawLine.search(/\S|$/);

        // Sprawdzenie, czy wychodzimy z bloku skryptu (gdy linia nie jest pusta i ma mniejsze wcięcie)
        if (inScriptBlock && trimmed.length > 0 && currentIndent <= scriptBaseIndent) {
          inScriptBlock = false;
        }

        // Wykrycie startu bloku skryptu (linia kończąca się na "- |" lub "command: |")
        const startsScript = /^(\s*)(?:-\s*|command:\s*)\|\s*$/.test(rawLine);

        if (inScriptBlock) {
          const formattedShell = highlightShellLine(escaped);
          return `<span class="line dc-script-block">${formattedShell}</span>`;
        }

        const formattedYaml = highlightYamlLine(escaped);

        if (startsScript) {
          inScriptBlock = true;
          scriptBaseIndent = currentIndent;
        }

        return `<span class="line">${formattedYaml}</span>`;
      })
      .join("");
  }

  composeBlocks.forEach((block) => {
    const rawCode = block.textContent
      .replace(/\t/g, "    ")
      .replace(/^\n+|\n\s*$/g, "");

    block.innerHTML = renderDockerCompose(rawCode);
  });
});
