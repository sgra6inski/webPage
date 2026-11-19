document.addEventListener("DOMContentLoaded", () => {
  // Wybiera wyłącznie bloki konsoli
  const consoleBlocks = document.querySelectorAll(".terminal-code.console-output code");

  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatCommand(cmd) {
    // Uwaga: cudzysłów po escapeHTML to &quot;, dlatego regex sprawdza oba warianty
    const cmdRegex = /(\bgit\b)|(\b(?:clone|init|add|commit|status|push|pull|fetch|merge|rebase|checkout|switch|branch|log|diff|reset|stash|remote|tag)\b)|(\b(?:origin|main|master|HEAD)\b)|(git@[^\s]+)|(\s--?[a-zA-Z0-9-]+)|(\$\{?[a-zA-Z0-9_]+\}?)|(&quot;[^&]*&quot;|'[^']*')/g;

    return cmd.replace(cmdRegex, (match, gitCmd, gitSub, gitRef, gitSsh, flag, variable, str) => {
      if (gitCmd) return `<span class="con-git-cmd">${gitCmd}</span>`;
      if (gitSub) return `<span class="con-git-sub">${gitSub}</span>`;
      if (gitRef) return `<span class="con-git-branch">${gitRef}</span>`;
      if (gitSsh) return `<span class="con-url">${gitSsh}</span>`;
      if (flag) return `<span class="con-flag">${flag}</span>`;
      if (variable) return `<span class="con-var">${variable}</span>`;
      if (str) return `<span class="con-quote">${str}</span>`;
      return match;
    });
  }

  function formatOutputText(text) {
    // Obsługa linii diff z Git (+ na zielono, - na czerwono)
    if (/^\+(?!\+\+)/.test(text)) {
      return `<span class="con-git-diff-add">${text}</span>`;
    }
    if (/^-(?!--)/.test(text)) {
      return `<span class="con-git-diff-del">${text}</span>`;
    }

    const outputRegex = /(https?:\/\/[^\s]+|git@[^\s]+)|(&quot;[^&]*&quot;|'[^']*')|(\b(?:modified|new file|deleted|renamed):)|(\bcommit [0-9a-f]{7,40}\b)|\b(HEAD -&gt; [a-zA-Z0-9_./-]+|origin\/[a-zA-Z0-9_./-]+|On branch [a-zA-Z0-9_./-]+)\b|(\/[a-zA-Z0-9_./-]+)|\b(NAME|STATE|VERSION)\b|\b(Welcome to Ubuntu|System information as of)\b|\b(successfully|Running|nothing to commit, working tree clean)\b|(New password:|Retype new password:|=&gt;)/g;

    return text.replace(
      outputRegex,
      (match, url, quote, gitStatus, gitCommit, gitBranchInfo, path, header, banner, success, warn) => {
        if (url) return `<span class="con-url">${url}</span>`;
        if (quote) return `<span class="con-quote">${quote}</span>`;
        if (gitStatus) {
          const isDel = gitStatus.startsWith("deleted");
          return `<span class="${isDel ? "con-git-del" : "con-git-mod"}">${gitStatus}</span>`;
        }
        if (gitCommit) return `<span class="con-git-hash">${gitCommit}</span>`;
        if (gitBranchInfo) return `<span class="con-git-branch">${gitBranchInfo}</span>`;
        if (path) return `<span class="con-path">${path}</span>`;
        if (header) return `<span class="con-header">${header}</span>`;
        if (banner) return `<span class="con-banner">${banner}</span>`;
        if (success) return `<span class="con-success">${success}</span>`;
        if (warn) return `<span class="con-warn">${warn}</span>`;
        return match;
      }
    );
  }

  function renderConsoleOutput(rawCode) {
    const lines = rawCode.split("\n");
    let currentEnv = "win";

    return lines
      .map((rawLine) => {
        const line = escapeHTML(rawLine);

        // Wykrywanie zmiany środowiska na podstawie promptu
        if (/^PS [^&]+&gt;/.test(line)) {
          currentEnv = "win";
        } else if (/^root@[^:]+:[^#]+#/.test(line)) {
          currentEnv = "wsl-root";
        } else if (/^[a-zA-Z0-9_-]+@[^:]+:[^$]+\$/.test(line)) {
          currentEnv = "wsl-user";
        }

        let formattedLine = line;

        // 1. Komentarze zaczynające się od #
        if (/^\s*#/.test(line)) {
          formattedLine = `<span class="con-comment">${line}</span>`;
        }
        // 2. Windows PowerShell
        else if (/^(PS [^&]+&gt;)(.*)$/.test(line)) {
          formattedLine = line.replace(/^(PS [^&]+&gt;)(.*)$/, (_, prompt, cmd) => {
            return `<span class="con-prompt-win">${prompt}</span><span class="con-cmd">${formatCommand(cmd)}</span>`;
          });
        }
        // 3. WSL Root (#)
        else if (/^(root@[^:]+:[^#]+#)(.*)$/.test(line)) {
          formattedLine = line.replace(/^(root@[^:]+:[^#]+#)(.*)$/, (_, prompt, cmd) => {
            return `<span class="con-prompt-root">${prompt}</span><span class="con-cmd">${formatCommand(cmd)}</span>`;
          });
        }
        // 4. WSL User ($)
        else if (/^([a-zA-Z0-9_-]+@[^:]+:[^$]+\$)(.*)$/.test(line)) {
          formattedLine = line.replace(/^([a-zA-Z0-9_-]+@[^:]+:[^$]+\$)(.*)$/, (_, prompt, cmd) => {
            return `<span class="con-prompt-user">${prompt}</span><span class="con-cmd">${formatCommand(cmd)}</span>`;
          });
        }
        // 5. Kontynuacja bloku wieloliniowego (> ...)
        else if (/^(&gt;)(.*)$/.test(line)) {
          formattedLine = line.replace(/^(&gt;)(.*)$/, (_, prompt, rest) => {
            return `<span class="con-prompt-sub">${prompt}</span><span class="con-heredoc">${rest}</span>`;
          });
        }
        // 6. Surowe komendy bez promptu (np. git init, docker, npm, sudo)
        else if (/^\s*(git|docker|npm|npx|yarn|pnpm|sudo|apt|apt-get|cd|ls|mkdir|rm|cp|mv|cat|echo|curl|wget)\b/.test(line)) {
          formattedLine = `<span class="con-cmd">${formatCommand(line)}</span>`;
        }
        // 7. Zwykły tekst outputu
        else {
          formattedLine = formatOutputText(line);
        }

        return `<span class="line env-${currentEnv}">${formattedLine}</span>`;
      })
      .join("");
  }

  consoleBlocks.forEach((block) => {
    const rawCode = block.textContent
      .replace(/\t/g, "    ")
      .replace(/^\n+|\n\s*$/g, "");

    block.innerHTML = renderConsoleOutput(rawCode);
  });
});
