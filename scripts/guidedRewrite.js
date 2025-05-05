import { extension_settings } from '../../../../extensions.js'; // Import settings
import { setPreviousImpersonateInput } from '../index.js';
import { generateNewSwipe } from './guidedSwipe.js'; // Import the swipe generation function

const extensionName = 'GuidedGenerations-Extension';

const guidedRewrite = async () => {
  const textarea = document.getElementById('send_textarea');
  if (!textarea) {
    console.error(`[${extensionName}][RewriteLastAI via SwipeClick] Textarea #send_textarea not found.`);
    return;
  }
  const instructionInput = textarea.value;

  if (!instructionInput.trim()) {
    toastr.warning('输入为空，请提供重写指令。'); // Input is empty. Provide rewrite instructions.
    return;
  }

  // Save user's instruction input for potential recovery
  setPreviousImpersonateInput(instructionInput);

  // --- Get Setting ---
  const promptTemplate =
    extension_settings[extensionName]?.promptGuidedRewrite ??
    // Default prompt assumes AI understands the task based on structure
    '[Rewrite the following message according to the instructions. Only output the rewritten message content.]\n### Original Message:\n{{last_ai_message}}\n### Instructions:\n{{user_instruction}}';

  // Escape user instruction for setting temp var
  const escapedInstruction = instructionInput.replace(/`/g, '\\`').replace(/\|/g, '\\|');

  // Construct the prompt *template* for /inject using STScript variables
  // Note: We don't need to get {{lastCharMessage}} content into a var first if the prompt template itself handles it
  const injectionPrompt = promptTemplate
    // Assuming {{lastCharMessage}} directly gives content within the prompt context used by /inject
    .replace('{{last_ai_message}}', '{{lastCharMessage}}')
    .replace('{{user_instruction}}', '{{getvar::gg_rewrite_instruction}}') // Still use var for instruction
    .replace(/`/g, '\\`')
    .replace(/\|/g, '\\|'); // Escape the template itself for /inject command

  const injectionRole = extension_settings[extensionName]?.injectionEndRole || 'system';

  // STScript only stores instruction and injects the prompt
  const stscriptCommand =
    `/setvar key=gg_rewrite_instruction ${escapedInstruction} | ` + // Store instruction
    `/inject ${injectionPrompt} role=${injectionRole} |`; // Inject the combined prompt (NO /swipe)

  console.log(`[${extensionName}][RewriteLastAI via SwipeClick] Prepared STScript:`, stscriptCommand);

  // Clear the input field *after* getting the instruction
  textarea.value = '';

  // Execute command using SillyTavern context
  if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
    const context = SillyTavern.getContext();
    try {
      console.log(`[${extensionName}][RewriteLastAI via SwipeClick] Executing STScript part (/setvar, /inject)...`);
      await context.executeSlashCommandsWithOptions(stscriptCommand);
      console.log(`[${extensionName}][RewriteLastAI via SwipeClick] STScript part finished.`);

      // NOW, call the function to trigger the swipe via button click
      console.log(`[${extensionName}][RewriteLastAI via SwipeClick] Calling generateNewSwipe()...`);
      const swipeSuccess = await generateNewSwipe(); // Call the imported function

      if (swipeSuccess) {
        console.log(`[${extensionName}][RewriteLastAI via SwipeClick] Rewrite (Swipe) command finished successfully.`);
      } else {
        console.error(`[${extensionName}][RewriteLastAI via SwipeClick] generateNewSwipe() reported failure.`);
        // Error should have been alerted by generateNewSwipe itself
        // Restore input if swipe generation failed?
        // textarea.value = instructionInput;
        // textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (error) {
      console.error(`[${extensionName}][RewriteLastAI via SwipeClick] Error executing script or swipe: ${error}`);
      toastr.error(`指导当前消息重写失败: ${error.message}`);
      // Restore user instruction on error?
      // textarea.value = instructionInput;
      // textarea.dispatchEvent(new Event('input', { bubbles: true }));
    } finally {
      // Optional: Clean up the variable if needed, although it's script-scoped
      // await context.executeSlashCommandsWithOptions(`/setvar key=gg_rewrite_instruction |`);
    }
  } else {
    console.error(`[${extensionName}][RewriteLastAI via SwipeClick] SillyTavern context is not available.`);
    toastr.error('指导当前消息重写失败: SillyTavern context not found.');
  }
};

export { guidedRewrite };
