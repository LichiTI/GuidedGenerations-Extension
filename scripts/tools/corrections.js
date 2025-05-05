/**
 * @file Contains the logic for the Corrections tool.
 */
import { extension_settings, getContext } from '../../../../../extensions.js';
import { extensionName, setPreviousImpersonateInput } from '../../index.js'; // Import shared state function
import { generateNewSwipe } from '../guidedSwipe.js'; // Import the new function

// Helper function for delays (copied from guidedSwipe.js)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Provides a tool to modify the last message based on user's instructions
 *
 * @returns {Promise<void>}
 */
export default async function corrections() {
  console.log('[GuidedGenerations][Corrections] Tool activated.');
  const textarea = document.getElementById('send_textarea');
  if (!textarea) {
    console.error('[GuidedGenerations][Corrections] Textarea #send_textarea not found.');
    return;
  }
  const originalInput = textarea.value; // Get current input

  // Save the input state using the shared function
  setPreviousImpersonateInput(originalInput);
  console.log(`[GuidedGenerations][Corrections] Original input saved: "${originalInput}"`);

  // Use user-defined corrections prompt override
  const isRaw = extension_settings[extensionName]?.rawPromptCorrections ?? false;
  const promptTemplate = extension_settings[extensionName]?.promptCorrections ?? '';
  const filledPrompt = promptTemplate.replace('{{input}}', originalInput);

  // Determine target preset from settings
  const presetKey = 'presetCorrections';
  const targetPreset = extension_settings[extensionName]?.[presetKey];
  console.log(`[GuidedGenerations][Corrections] Using preset: ${targetPreset || 'none'}`);

  // --- Build Preset Switching Script Parts Conditionally ---
  let presetSwitchStartScript = '';
  let presetSwitchEndScript = '';

  if (targetPreset) {
    // Store old preset then switch to user-defined preset
    presetSwitchStartScript = `
// Get the currently active preset|
/preset|
/setvar key=oldPreset {{pipe}}|

// Switch to user preset|
/preset ${targetPreset}|
`;
    // Restore previous preset after execution
    presetSwitchEndScript = `
// Switch back to the original preset if it was stored|
/preset {{getvar::oldPreset}}|
`;
  }

  // --- Part 1: Execute STscript for Presets and Injections ---
  const instructionInjection = isRaw ? filledPrompt : `[${filledPrompt}]`;
  const stscriptPart1 = `
        ${presetSwitchStartScript}

        // Inject assistant message to rework and instructions|
        /inject id=msgtorework position=chat ephemeral=true depth=0 role=assistant {{lastMessage}}|
        // Inject instructions using user override prompt|
        /inject id=instruct position=chat ephemeral=true depth=0 ${instructionInjection}|
    `;

  try {
    console.log('[GuidedGenerations][Corrections] Executing STScript Part 1 (Presets/Injections)...');
    await executeSTScript(stscriptPart1); // Use the helper for STscript
    console.log('[GuidedGenerations][Corrections] STScript Part 1 executed.');

    // --- Part 2: Execute JS Swipe Logic ---
    console.log('[GuidedGenerations][Corrections] Starting JS Swipe Logic...');
    const jQueryRef = typeof $ !== 'undefined' ? $ : jQuery;
    if (!jQueryRef) {
      console.error('[GuidedGenerations][Corrections] jQuery not found.');
      alert('修正工具错误：找不到 jQuery。'); // Corrections Tool Error: jQuery not available.
      // Attempt to run preset end script even if swipe fails
      await executeSTScript(presetSwitchEndScript);
      return;
    }

    // Get Initial Swipe State
    let context = getContext();
    if (!context || !context.chat || context.chat.length === 0) {
      console.error('[GuidedGenerations][Corrections] Could not get initial chat context for swiping.');
      alert('修正工具错误：无法访问聊天上下文。'); // Corrections Tool Error: Cannot access chat context.
      await executeSTScript(presetSwitchEndScript);
      return;
    }
    let lastMessageIndex = context.chat.length - 1;
    let messageData = context.chat[lastMessageIndex];
    if (!messageData || typeof messageData.swipe_id === 'undefined' || !Array.isArray(messageData.swipes)) {
      console.error('[GuidedGenerations][Corrections] Invalid initial message data for swiping.', messageData);
      alert('修正工具错误：无法读取初始滑动数据。'); // Corrections Tool Error: Cannot read initial swipe data.
      await executeSTScript(presetSwitchEndScript);
      return;
    }
    let initialSwipeId = messageData.swipe_id;
    let initialTotalSwipes = messageData.swipes.length;
    console.log(
      `[GuidedGenerations][Corrections] Initial state: Message ${lastMessageIndex}, Swipe ID: ${initialSwipeId}, Total Swipes: ${initialTotalSwipes}`,
    );

    // Swipe to Last Existing Swipe
    const targetSwipeIndex = Math.max(0, initialTotalSwipes - 1);
    let clicksToReachLast = Math.max(0, targetSwipeIndex - initialSwipeId);
    console.log(
      `[GuidedGenerations][Corrections] Target swipe index: ${targetSwipeIndex}. Clicks needed to reach target: ${clicksToReachLast}`,
    );

    // Find the swipe button
    const selector1 = '#chat .mes:last-child .swipe_right:not(.stus--btn)';
    const selector2 = '#chat .mes:last-child .mes_img_swipe_right';
    let $button = jQueryRef(selector1);
    if ($button.length === 0) $button = jQueryRef(selector2);

    if ($button.length === 0) {
      console.error(`[GuidedGenerations][Corrections] Could not find swipe button.`);
      alert('修正工具错误：找不到滑动按钮。'); // Corrections Tool Error: Could not find the swipe button.
      await executeSTScript(presetSwitchEndScript);
      return;
    }

    if (clicksToReachLast > 0) {
      console.log(`[GuidedGenerations][Corrections] Performing ${clicksToReachLast} clicks to reach the last swipe...`);
      for (let i = 0; i < clicksToReachLast; i++) {
        console.log(`[GuidedGenerations][Corrections] Clicking swipe (${i + 1}/${clicksToReachLast})...`);
        $button.first().trigger('click');
        await delay(50); // Small delay
      }
      console.log('[GuidedGenerations][Corrections] Finished initial swiping.');
      await delay(150); // Longer delay after bulk swiping
    } else {
      console.log(
        '[GuidedGenerations][Corrections] Already at or beyond the target swipe index. No initial swiping needed.',
      );
    }

    // Verification Step (Optional but recommended)
    // Add verification logic here if needed, similar to guidedSwipe.js,
    // but maybe simpler if just ensuring we are ready for final click.
    console.log('[GuidedGenerations][Corrections] Skipping verification step for now.');

    // Final Click to Generate
    console.log('[GuidedGenerations][Corrections] Attempting to generate new swipe after correction...');
    const swipeSuccess = await generateNewSwipe(); // Call the imported function

    if (swipeSuccess) {
      console.log(
        '[GuidedGenerations][Corrections] New swipe generated successfully. Executing final click to trigger generation...',
      );
      $button.first().trigger('click');
      console.log('[GuidedGenerations][Corrections] Final click performed.');
    } else {
      console.error('[GuidedGenerations][Corrections] Failed to generate new swipe after correction.');
    }

    console.log('[GuidedGenerations][Corrections] JS Swipe Logic finished.');
  } catch (error) {
    console.error('[GuidedGenerations][Corrections] Error during Corrections tool execution:', error);
    alert(`修正工具错误：${error.message || '发生意外错误。'}`); // Corrections Tool Error: ... An unexpected error occurred.
  } finally {
    // --- Part 3: Execute STscript for Preset End ---
    console.log('[GuidedGenerations][Corrections] Executing STScript Part 2 (Preset End)...');
    await executeSTScript(presetSwitchEndScript); // Ensure presets are switched back
    console.log('[GuidedGenerations][Corrections] Corrections tool finished.');
  }
}

/**
 * Helper function to execute ST-Script commands
 * @param {string} stscript - The ST-Script command to execute
 */
async function executeSTScript(stscript) {
  // Make helper async
  if (!stscript || stscript.trim() === '') {
    console.log('[GuidedGenerations][Corrections] executeSTScript: No script provided, skipping.');
    return;
  }
  try {
    // Use the context executeSlashCommandsWithOptions method
    const context = getContext(); // Get context via imported function
    // Send the combined script via context
    console.log(`[GuidedGenerations][Corrections] Executing STScript: ${stscript}`);
    await context.executeSlashCommandsWithOptions(stscript);
    console.log(`${extensionName}: Corrections ST-Script executed successfully.`);
  } catch (error) {
    console.error(`${extensionName}: Corrections Error executing ST-Script:`, error);
    // Optional: Re-throw or handle differently if needed
  }
}
