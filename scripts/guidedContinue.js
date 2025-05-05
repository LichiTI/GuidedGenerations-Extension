import { setPreviousImpersonateInput, getPreviousImpersonateInput } from '../index.js';
import { extension_settings } from '../../../../extensions.js'; // Import settings

const extensionName = "GuidedGenerations-Extension";

const guidedContinue = async () => {
    const textarea = document.getElementById('send_textarea');
    if (!textarea) {
        console.error(`[${extensionName}][Continue] Textarea #send_textarea not found.`);
        return;
    }
    const originalInput = textarea.value;
    // Save input state
    setPreviousImpersonateInput(originalInput);

    // --- Get Setting --- 
    const promptTemplate = extension_settings[extensionName]?.promptGuidedContinue ?? ''; // Get the override
    let commandInput = originalInput;
    if (promptTemplate && promptTemplate.includes('{{input}}')) {
        commandInput = promptTemplate.replace('{{input}}', originalInput);
        console.log(`[${extensionName}][Continue] Using prompt override.`);
    } else if (promptTemplate) {
        // If template exists but doesn't have placeholder, use it directly
        // (This might be less common for 'continue' but allows flexibility)
        commandInput = promptTemplate;
        console.log(`[${extensionName}][Continue] Using prompt override (without {{input}}).`);
    }

    // Build impersonation command
    const stscriptCommand = `/continue await=true ${commandInput} |`;

    // Execute command using SillyTavern context
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            await context.executeSlashCommandsWithOptions(stscriptCommand);
            console.log(`[${extensionName}][Continue] Executed Command:`, stscriptCommand);
        } catch (error) {
            console.error(`[${extensionName}][Continue] Error executing Guided Continue stscript: ${error}`);
        } finally {
            // Restore input field
            const restoredInput = getPreviousImpersonateInput();
            textarea.value = restoredInput;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else {
        console.error(`[${extensionName}][Continue] SillyTavern context is not available.`);
        // Restore input field regardless
        const restoredInput = getPreviousImpersonateInput();
        textarea.value = restoredInput;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
};

export { guidedContinue };
