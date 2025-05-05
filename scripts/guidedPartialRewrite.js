import { extension_settings } from '../../../../extensions.js'; // Import settings
import { getPreviousImpersonateInput, setPreviousImpersonateInput } from '../index.js';

const extensionName = 'GuidedGenerations-Extension';

const guidedPartialRewrite = async () => {
  const textarea = document.getElementById('send_textarea');
  if (!textarea) {
    console.error(`[${extensionName}][PartialRewrite] Textarea #send_textarea not found.`);
    return;
  }
  const originalInput = textarea.value;
  // Save input state
  setPreviousImpersonateInput(originalInput);

  // --- Get Setting ---
  const promptTemplate =
    extension_settings[extensionName]?.promptGuidedPartialRewrite ??
    '[Rewrite the story based on the following input: {{input}}]';
  let commandInput = originalInput;
  if (promptTemplate && promptTemplate.includes('{{input}}')) {
    commandInput = promptTemplate.replace('{{input}}', originalInput);
    console.log(`[${extensionName}][PartialRewrite] Using prompt override.`);
  } else if (promptTemplate) {
    // If template exists but doesn't have placeholder, use it directly
    // (This might be less common for 'continue' but allows flexibility)
    commandInput = promptTemplate;
    console.log(`[${extensionName}][PartialRewrite] Using prompt override (without {{input}}).`);
  }

  // Build impersonation command
  const stscriptCommand = `/continue await=true ${commandInput} |`;

  // Execute command using SillyTavern context
  if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
    const context = SillyTavern.getContext();
    try {
      await context.executeSlashCommandsWithOptions(stscriptCommand);
      console.log(`[${extensionName}][PartialRewrite] Executed Command:`, stscriptCommand);
    } catch (error) {
      console.error(`[${extensionName}][PartialRewrite] Error executing Guided Partial Rewrite stscript: ${error}`);
    } finally {
      // Restore input field
      const restoredInput = getPreviousImpersonateInput();
      textarea.value = restoredInput;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } else {
    console.error(`[${extensionName}][PartialRewrite] SillyTavern context is not available.`);
    // Restore input field regardless
    const restoredInput = getPreviousImpersonateInput();
    textarea.value = restoredInput;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
};

export { guidedPartialRewrite };
