import {
  App,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";

export default class HotkeysPlus extends Plugin {
  onInit() {}

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
  }

  onunload() {
    console.log("Unloading Hotkeys++ plugin");
  }

  getSelectedText(editor: any) {
    if (editor.somethingSelected()) {
      // Toggle to-dos under the selection
      let cursorStart = editor.getCursor(true);
      let cursorEnd = editor.getCursor(false);
      let content = editor.getRange(
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
      var lineNr = editor.getCursor().line;
      var contents = editor.getDoc().getLine(lineNr);
      let cursorStart = {
        line: lineNr,
        ch: 0,
      };
      let cursorEnd = {
        line: lineNr,
        ch: contents.length,
      };
      let content = editor.getRange(cursorStart, cursorEnd);
      return { start: cursorStart, end: cursorEnd, content: content };
    }
  }

  toggleElement(re: RegExp, subst: any) {
    var activeLeaf: any = this.app.workspace.activeLeaf;
    var editor = activeLeaf.view.sourceMode.cmEditor;
    var selection = editor.somethingSelected();
    var selectedText = this.getSelectedText(editor);

    var newString = selectedText.content.replace(re, subst);
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
    var re = /-\s\[ \]\s|-\s\[x\]\s|\*\s|-\s|\d+\.\s|^/gim;
    return this.toggleElement(re, this.replaceTodoElement);
  }

  toggleLists() {
    var re = /-\s\[ \]\s|-\s\[x\]\s|\*\s|-\s|\d+\.\s|^/gim;
    return this.toggleElement(re, this.replaceListElement);
  }

  toggleBlockQuote() {
    var re = />\s|^/gim;
    return this.toggleElement(re, this.replaceBlockQuote);
  }

  toggleEmbed() {
    var re = /\S*\[\[/gim;
      return this.toggleElement(re, this.replaceEmbed);
  }

  replaceListElement(startText: string) {
    if (startText === "- ") {
      return "1. ";
    } else if (startText === "") {
      return "- ";
    } else if (startText === "1. ") {
      return "";
    } else {
      return "- ";
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

  replaceTodoElement(startText: string) {
    if (startText === "- [ ] ") {
      return "- [x] ";
    } else if (startText === "- [x] ") {
      return "- ";
    } else {
      return "- [ ] ";
    }
  }
}
