// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DOMParser, parseHTML } from 'linkedom';
import { NodeStruct } from 'linkedom/types/mixin/parent-node';

type Kvp = {
	name: string;
	value: string;
};

type HTMLElement = {
	attributes: Kvp[];
	innerHTML: string;
	textContent: string;
	tagName: string;
	children: HTMLElement[];
};

let attributes = {
	class: "classList",
	rowspan: "rowSpan",
};

export function activate(context: vscode.ExtensionContext) {

	let insertFunction = vscode.commands.registerTextEditorCommand('html-to-js.insertFunction', (editor, edit) => {
		editor.selections.forEach((selection, i) => {
			let text = "function createElement(tag = \"span\", data = {}) {\n" +
				"\ttag = typeof(tag) === \"string\" ? document.createElement(tag) : tag;\n" +
				"\tObject.keys(data).forEach(e => {\n" +
				"\t\tif (typeof data[e] === \"object\") {\n" +
				"\t\t\tcreateElement(tag[e] || (tag[e] = {}), data[e]);\n" +
				"\t\t} else {\n" +
				"\t\t\ttag[e] = data[e];\n" +
				"\t\t}\n" +
				"\t});\n" +
				"\treturn tag;\n" +
				"}\n" +
				"window.Element.prototype.add = function(...args) {\n" +
				"\targs.forEach(elem => {\n" +
				"\t\tthis.append(elem);\n" +
				"\t});\n" +
				"\treturn this;\n" +
				"}\n";
			edit.insert(selection.active, text);  // insert at current cursor
		});
	});

	let convert = vscode.commands.registerTextEditorCommand('html-to-js.convert', (editor, edit) => {
		// vscode.window.showInformationMessage('Hello World from HTML to Javascript (createElement)!');
		let sel = vscode.window.activeTextEditor?.selection;
		if (!sel) {
			vscode.window.showInformationMessage('Open a text editor and make a selection first');
			return;
		}
		let selText = editor.document.getText(new vscode.Range(sel.start, sel.end));

		const document = (new DOMParser).parseFromString(`<!DOCTYPE html><body>${selText}</body>`, 'text/html');

		// const dom = new JSDOM(`<!DOCTYPE html><body>${selText}</body>`);

		function setAttribute(data: any, name: string, value: string) {
			let keys = {
				class: "classList",
				rowspan: "rowSpan",
				colspan: "colSpan",
			};
			// @ts-ignore
			name = keys[name] || name;
			data[name] = value;
		}
		function recurse(element: HTMLElement, arr: string[], tabs: number) {
			if (element.children.length < 1) {
				// arr.push(new Array(tabs).fill("\t").join("") + "),");
				return arr;
			}
			arr.push(new Array(tabs).fill("\t").join("") + ".add(");
			[...element.children].forEach((e: HTMLElement) => {
				var data = {};
				[...e.attributes].forEach((a: Kvp) => {
					setAttribute(data, a.name, a.value);
				});

				if (e.innerHTML === e.textContent && e.textContent.length > 0) {
					// @ts-ignore
					data.innerHTML = e.textContent;
				}
				arr.push(new Array(tabs + 1).fill("\t").join("") + `createElement("${e.tagName.toLowerCase()}"${(() => {
					var d = JSON.stringify(data).replaceAll(/data\.[a-zA-Z$_]([a-zA-Z0-9]+)?/g, function (s: string): string {
						return `"+${s}+"`;
					}).replaceAll("+\"\"", "").replaceAll("\"\"+", "");
					return d.length > 2 ? ", " + d : "";
				})()})`);
				if (["(", ")", ","].includes(`${arr[arr.length - 2].split("").pop()}`)) {
					arr[arr.length - 1] += ",";
				}
				recurse(e, arr, tabs + 1);
			});
			arr.push(new Array(tabs).fill("\t").join("") + "),");
			return arr;
		}
		function makeTree(element: NodeStruct) {
			var arr = [`\tcreateElement("div")`];
			recurse(element, arr, 1).join("\n");
			arr[arr.length - 1] = arr[arr.length - 1].replace(/,$/g, "");
			for (var i = 0; i < arr.length; i++) {
				if (arr[i].trim().charAt(0) === ".") {
					arr[i - 1] = arr[i - 1] + arr[i].trim();
					arr[i - 1] = arr[i - 1].replace(",.", ".");
					arr.splice(i, 1);
					i--;
				}
			}
			return arr.join("\n") + ";";
		}
		let output = makeTree(document.querySelector("body"));
		output = output;
		edit.insert(sel.end, "\n\n<script>\n" + (output) + "\n</script>\n\n");
	});

	context.subscriptions.push(convert);
	context.subscriptions.push(insertFunction);
}

export function deactivate() { }
