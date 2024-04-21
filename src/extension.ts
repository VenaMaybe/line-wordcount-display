import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let activeEditor = vscode.window.activeTextEditor;
    let timeout: NodeJS.Timeout | undefined = undefined;  // Adjust the type for Node.js or use `any` or `number` for browser environments

	let disposable = vscode.commands.registerCommand('myExtension.toggleWordCounter', () => {
		const config = vscode.workspace.getConfiguration();
		const currentSetting = config.get<boolean>('myExtension.enableWordCount', true);

		config.update('myExtension.enableWordCount', !currentSetting, vscode.ConfigurationTarget.Global)
			.then(() => {
				updateOrClearDecorations(); // Updates right away
			});
	});

	context.subscriptions.push(disposable);

    const ghostDecorationType = vscode.window.createTextEditorDecorationType({
        after: {
            margin: '0 3em 0 0',
            color: '#808080'
        }
    });

    function updateDecorations() {
		if (!activeEditor) {
			return;
		}
	
		const text = activeEditor.document.lineAt(activeEditor.selection.active.line).text;
		const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
		//const hasContent = text.length > 0;

        

		const spacePrefix = '\u00A0';//hasContent ? ' ' : '\u00A0'; // idk why it trims white space!
		const words = wordCount === 1 ? ' word' : ' words';
	
		const decoration = {
			range: new vscode.Range(activeEditor.selection.active.line, text.length, activeEditor.selection.active.line, text.length + 1),
			renderOptions: { after: { contentText: `${spacePrefix}${wordCount}${words}` } }
		};
	
		activeEditor.setDecorations(ghostDecorationType, [decoration]);
	}
	
	// Function to update or clear decorations
    function updateOrClearDecorations() {
        const config = vscode.workspace.getConfiguration();
        const isEnabled = config.get<boolean>('myExtension.enableWordCount', true);

        if (!isEnabled && activeEditor) {
            // Clear all decorations if the feature is disabled
            activeEditor.setDecorations(ghostDecorationType, []);
            return;
        }

        if (isEnabled) {
            updateDecorations(); // Your existing function to update decorations
        }
    }

    function triggerUpdateDecorations() {
		updateOrClearDecorations();

        //updateDecorations();
		//if (timeout) {
        //    clearTimeout(timeout);
        //    timeout = undefined;
        //}
        //timeout = setTimeout(updateDecorations, 0);
    }

    if (activeEditor) {
        triggerUpdateDecorations();
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    vscode.window.onDidChangeTextEditorSelection(event => {
        if (event.textEditor === vscode.window.activeTextEditor) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
}

export function deactivate() {}
