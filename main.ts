import {
  Editor,
  MarkdownView,
  Plugin
} from "obsidian";

export default class HotkeysPlus extends Plugin {
  onInit() { }

  onload() {
    console.log("Loading Hotkeys++ plugin");

    this.addCommand({
      id: "better-toggle-todo",
      name: "Toggle to-do lists",
      callback: () => this.toggleTodos(),
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: "m",
        },
      ],
    });

    this.addCommand({
      id: "toggle-bullet-number",
      name: "Toggle line to bulleted or numbered lists",
      callback: () => this.toggleLists(),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "m",
        },
      ],
    });

    this.addCommand({
      id: "toggle-block-quote",
      name: "Toggle line to block quote",
      callback: () => this.toggleBlockQuote(),
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: "<",
        },
      ],
    });

    this.addCommand({
      id: "toggle-embed",
      name: "Toggle line to embed internal links",
      callback: () => this.toggleEmbed(),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "1",
        },
      ],
    });

    this.addCommand({
      id: "duplicate-lines-down",
      name: "Copy line(s) down",
      callback: () => this.duplicateLines("down"),
    });

    this.addCommand({
      id: "duplicate-lines-up",
      name: "Copy line(s) up",
      callback: () => this.duplicateLines("up"),
    });

    this.addCommand({
      id: "clean-selected",
      name: "Trims selected text and removes new line characters.",
      callback: () => this.cleanSelected(),
    });

    this.addCommand({
      id: 'insert-line-above',
      name: 'Insert line above current line',
      callback: () => this.insertLine("above"),
    });
    this.addCommand({
      id: 'insert-line-below',
      name: 'Insert line below current line',
      callback: () => this.insertLine("below"),
    });

    this.addCommand({
      id: 'clear-current-line',
      name: 'Clear current line',
      callback: () => this.clearCurrentLine(),
    });
  }

  clearCurrentLine(): void{
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    const editor = view.editor;
    const lineNumber = editor.getCursor().line;
    editor.setLine(lineNumber, "")
  }

  insertLine(mode: "above" | "below"): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    const editor = view.editor;
    const lineNumber = editor.getCursor().line;
    const currentLineText = editor.getLine(lineNumber);
    let newLineText = "";
    if (currentLineText.trim().startsWith("- ")) {
      newLineText = currentLineText.substring(0, currentLineText.indexOf("- ") + 2);
    }
    for (let i = 1; i < 30; i++) {
      if (currentLineText.trim().startsWith(i.toString() + ". ")) {
        let correction: number;
        if (mode == "above")
          correction = -1;
        else
          correction = 1;
        newLineText = currentLineText.substring(0, currentLineText.indexOf(i.toString() + ". ")) + (i + correction).toString() + ". ";
      }
    }
    if (mode == "above") {
      editor.replaceRange(newLineText + "\n", { line: lineNumber, ch: 0 });
      editor.setSelection({ line: lineNumber, ch: newLineText.length });
    } else {
      editor.replaceRange("\n" + newLineText, { line: lineNumber, ch: currentLineText.length });
      editor.setSelection({ line: lineNumber + 1, ch: newLineText.length });
    }
  }

  duplicateLines(mode: "up" | "down"): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    const editor = view.editor;
    const selectedText = this.getSelectedText(editor);
    const newString = selectedText.content + "\n";

    console.log(selectedText);
    if (mode === "down") {
      editor.replaceRange(newString, selectedText.start, selectedText.start);
    }
    else {
      const nextLineStart = {
        line: selectedText.end.line + 1,
        ch: 0
      }
      editor.replaceRange(newString, nextLineStart, nextLineStart);
    }
  }
  cleanSelected(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    const editor = view.editor;
    const selectedText = this.getSelectedText(editor);
    let newString = selectedText.content.trim().replace(/(\r\n|\n|\r)/gm, ' ');
    newString = newString.replace(/  +/gm, ' ');
    editor.replaceRange(newString, selectedText.start, selectedText.end);
  }

  onunload() {
    console.log("Unloading Hotkeys++ plugin");
  }

  getSelectedText(editor: Editor) {
    if (editor.somethingSelected()) {
      // Toggle to-dos under the selection
      const cursorStart = editor.getCursor("from");
      const cursorEnd = editor.getCursor("to");
      const content = editor.getRange(
        { line: cursorStart.line, ch: 0 },
        { line: cursorEnd.line, ch: editor.getLine(cursorEnd.line).length }
      );

      return {
        start: { line: cursorStart.line, ch: 0 },
        end: {
          line: cursorEnd.line,
          ch: editor.getLine(cursorEnd.line).length,
        },
        content: content,
      };
    } else {
      // Toggle the todo in the line
      const lineNr = editor.getCursor().line;
      const contents = editor.getDoc().getLine(lineNr);
      const cursorStart = {
        line: lineNr,
        ch: 0,
      };
      const cursorEnd = {
        line: lineNr,
        ch: contents.length,
      };
      const content = editor.getRange(cursorStart, cursorEnd);
      return { start: cursorStart, end: cursorEnd, content: content };
    }
  }

  toggleElement(re: RegExp, subst: any) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    const editor = view.editor;
    const selection = editor.somethingSelected();
    const selectedText = this.getSelectedText(editor);

    const newString = selectedText.content.replace(re, subst);
    editor.replaceRange(newString, selectedText.start, selectedText.end);

    // Keep cursor in the same place
    if (selection) {
      editor.setSelection(selectedText.start, {
        line: selectedText.end.line,
        ch: editor.getLine(selectedText.end.line).length,
      });
    }
  }

  toggleTodos() {
    const re = /(^\s*|^\t*)(-\s\[ \]\s|-\s\[x\]\s|\*\s|-\s|\d*\.\s|\*\s|\b|^)([^\n\r]*)/gim;
    return this.toggleElement(re, this.replaceTodoElement);
  }

  toggleLists() {
    const re = /(^\s*|^\t*)(-\s\[ \]\s|-\s\[x\]\s|\*\s|-\s|\d*\.\s|\*\s|\b|^)([^\n\r]*)/gim;
    return this.toggleElement(re, this.replaceListElement);
  }

  toggleBlockQuote() {
    const re = />\s|^/gim;
    return this.toggleElement(re, this.replaceBlockQuote);
  }

  toggleEmbed() {
    const re = /\S*\[\[/gim;
    return this.toggleElement(re, this.replaceEmbed);
  }

  replaceListElement(match: string, spaces: string, startText: string, sentence: string) {
    if (startText === "- ") {
      return spaces + "1. " + sentence;
    } else if (startText === "") {
      return spaces + "- " + sentence;
    } else if (startText === "1. ") {
      return spaces + "" + sentence;
    } else {
      return spaces + "- " + sentence;
    }
  }

  replaceBlockQuote(startText: string) {
    if (startText === "> ") {
      return "";
    } else if (startText === "") {
      return "> ";
    } else {
      return "> ";
    }
  }

  replaceEmbed(startText: string) {
    if (startText === "![[") {
      return "[[";
    }
    else if (startText === "[[") {
      return "![[";
    }
    else {
      return "";
    }
  }

  replaceTodoElement(match: string, spaces: string, startText: string, sentence: string) {
    if (startText === "- [ ] ") {
      return spaces + "- [x] " + sentence;
    } else if (startText === "- [x] ") {
      return spaces + "- " + sentence;
    } else {
      return spaces + "- [ ] " + sentence;
    }
  }
}
