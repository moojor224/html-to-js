// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { DOMParser, parseHTML } from 'linkedom';
import { NodeStruct } from 'linkedom/types/mixin/parent-node';
import { SerialMonitorApi, PortInformation, Version, getSerialMonitorApi } from '@microsoft/vscode-serial-monitor-api';


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
	async function run(resolve: (arg0: PortInformation[]) => void) {
		console.log("running serial ports");
		let api = await getSerialMonitorApi(Version.latest, context);
		api?.listAvailablePorts().then(function (ports) {
			console.log("ports", ports);
			resolve(ports);
		});
	}
	let disposable = vscode.commands.registerCommand('vscode-micropython-uploader.helloWorld', function () {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from VSCode Micropython Uploader!');
		// run(function (ports: PortInformation[]) { });
		//@ts-ignore
		openUploader(context, vscode.window.activeTextEditor);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }

function getCurrentViewColumn() {
	return vscode.window.activeTextEditor && vscode.window.activeTextEditor.viewColumn
		? vscode.window.activeTextEditor.viewColumn
		: vscode.ViewColumn.One;
}

function gvod(val: any, def: any) {
	if (val === undefined || val === null) {
		return def;
	}
	return val;
}

function openUploader(context: vscode.ExtensionContext, activeTextEditor: vscode.TextEditor | undefined) {
	console.log("openuploader");
	// const uri = activeTextEditor.document?.uri;
	let panel = vscode.window.createWebviewPanel('micropython-uploader', "Micropython Uploader", getCurrentViewColumn(), {
		enableFindWidget: false,
		enableCommandUris: true,
		enableScripts: true,
		retainContextWhenHidden: true
	});
	console.log(panel);

	// vscode.workspace.asRelativePath(gvod(gvod(gvod(activeTextEditor.document, "").uri, "").fsPath, ""));
	panel.webview.html = createEditorHtml(panel.webview, context);
}

function getResourcePath(webview: vscode.Webview, context: vscode.ExtensionContext, filePath: string) {
	//fix for windows because there path.join will use \ as separator and when we inline this string in html/js
	//we get specials strings e.g. c:\n
	// return `vscode-resource:${path.join(context.extensionPath, filePath).replace(/\\/g, '/')}`
	return `${webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, filePath).replace(/\\/g, '/')))}`;
}

function createEditorHtml(webview: vscode.Webview, context: vscode.ExtensionContext) {
	const _getResourcePath = getResourcePath.bind(undefined, webview, context);
	//@ts-ignore
	const { window, document, customElements, HTMLElement, Event, CustomEvent } = parseHTML(`<!doctype html>
<html lang="en">
	<head>
	<title>Hello SSR</title>
	</head>durrr
	<body>
		<button onclick="window.location = window.location">reload</button>
		<script src="${_getResourcePath('uploader_js/test.js')}"></script>
	</body>
</html>`);
	

	console.log("path", _getResourcePath('uploader_js/test.js'));
	return document.body.outerHTML;


	// throw new Error('Function not implemented.');
}