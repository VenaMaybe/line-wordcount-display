import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let activeEditor = vscode.window.activeTextEditor;
    //let timeout: NodeJS.Timeout | undefined = undefined;

	let toggleWordCounterDisposable = vscode.commands.registerCommand('myExtension.toggleWordCounter', () => {
		const config = vscode.workspace.getConfiguration();
		const enableWordCount = config.get<boolean>('myExtension.enableWordCount', true);

		config.update('myExtension.enableWordCount', !enableWordCount, vscode.ConfigurationTarget.Global)
			.then(() => {
				updateOrClearDecorations(); // Updates right away
			});
	});
    let toggleDisplayAtTopDisposable = vscode.commands.registerCommand('myExtension.toggleDisplayAtTop', () => {
        const config = vscode.workspace.getConfiguration();
        const displayAtTop = config.get<boolean>('myExtension.displayCountAtSelectionTop', false);
    
        config.update('myExtension.displayCountAtSelectionTop', !displayAtTop, vscode.ConfigurationTarget.Global)
            .then(() => {
                updateOrClearDecorations();
            });
    });

	context.subscriptions.push(toggleWordCounterDisposable);
    context.subscriptions.push(toggleDisplayAtTopDisposable)

    const ghostDecorationType = vscode.window.createTextEditorDecorationType({
        after: {
            margin: '0 3em 0 0'//,
            //color: '#808080'
        }
    });

    function updateDecorations() {
		if (!activeEditor) {
			return;
		}

        //temporary upper most line or bottom line!
        const config = vscode.workspace.getConfiguration();
        let displayOnTopLine = config.get<boolean>('myExtension.displayCountAtSelectionTop', true);

        // obviously text to count lol
        let textToCount = '';
        let decorationRange;
        let decorationColor;

        const colorWhenSelected = 'rgba(182, 128, 128, 1)';
        const colorWhenNotSelected = 'rgba(128, 128, 128, 1)';

		let spacePrefix = '\u00A0'; //hasContent ? ' ' : '\u00A0'; // idk why it trims white space!

        const selection = activeEditor.selection;
        if(!selection.isEmpty) {
            textToCount = activeEditor.document.getText(selection);

            let endLine = selection.end.line;
            let startLine = selection.start.line;
            let endCharacter = selection.end.character;
            
            // Bottom line!
            if (endCharacter === 0 && endLine > startLine && !displayOnTopLine) {
                endLine -= 1;
                endCharacter = activeEditor.document.lineAt(endLine).text.length;
            } else {
                endCharacter = activeEditor.document.lineAt(endLine).text.length;
            }

            if (displayOnTopLine) {
                endLine = startLine;
                endCharacter = activeEditor.document.lineAt(startLine).text.length;
                //if (selection.start.line !== selection.end.line) {
                //    spacePrefix = '\u00A0\u00A0';
                //}
            }
            
            if (selection.start.line !== selection.end.line) {
                spacePrefix = '\u00A0\u00A0';
            }

            decorationRange = new vscode.Range(endLine, endCharacter, endLine, endCharacter);
            decorationColor = colorWhenSelected;
        } else {
            textToCount = activeEditor.document.lineAt(activeEditor.selection.active.line).text;

            const activeLine = activeEditor.selection.active.line;
            const lineLength = activeEditor.document.lineAt(activeLine).text.length;
            decorationRange = new vscode.Range(activeLine, lineLength, activeLine, lineLength);
            decorationColor = colorWhenNotSelected;
        }
	
        // measuring stuffs
		//const text = activeEditor.document.lineAt(activeEditor.selection.active.line).text;
        const words = textToCount.split(/\P{L}+/gu).filter(word => /\p{L}/u.test(word));
        const filteredWords = words.filter(word => word.match(/^\p{L}+$/gu));
        //const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
		//const hasContent = text.length > 0;

        // display stuffs
        const wordCount = filteredWords.length;
		const wordsText = wordCount === 1 ? ' word' : ' words';
	
		const decoration = {
			range: decorationRange,
			renderOptions: {
                after: {
                    contentText: `${spacePrefix}${wordCount}${wordsText}`,
                    color: decorationColor,
                    fontStyle: 'italic'
                }
            }
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
            updateDecorations();
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
