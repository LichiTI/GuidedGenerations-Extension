/**
 * @file Contains the logic for the Guided Response button.
 */
import { isGroupChat, setPreviousImpersonateInput, getPreviousImpersonateInput } from '../index.js'; // Import group chat checker and shared state functions
import { getContext, extension_settings } from '../../../../extensions.js'; // Correct path to extensions.js

// Import the guide scripts for direct execution
import thinkingGuide from './persistentGuides/thinkingGuide.js'; // Correct relative path
import stateGuide from './persistentGuides/stateGuide.js'; // Correct relative path
import clothesGuide from './persistentGuides/clothesGuide.js'; // Correct relative path
import customAutoGuide from './persistentGuides/customAutoGuide.js'; // Import the new Custom Auto Guide

const extensionName = "GuidedGenerations-Extension";

const guidedResponse = async () => {
    const textarea = document.getElementById('send_textarea');
    if (!textarea) {
        console.error('[GuidedGenerations][Response] Textarea #send_textarea not found.');
        return;
    }
    const originalInput = textarea.value; // Get current input

    // --- Get Setting ---
    const injectionRole = extension_settings[extensionName]?.injectionEndRole ?? 'system'; // Get the role setting

    // Save the input state using the shared function
    setPreviousImpersonateInput(originalInput);

    let stscriptCommand;

    // Use user-defined guided response prompt override
    const promptTemplate = extension_settings[extensionName]?.promptGuidedResponse ?? '';
    const filledPrompt = promptTemplate.replace('{{input}}', originalInput);

    // Check if it's a group chat using the helper function
    if (isGroupChat()) {
        const context = getContext();
        let characterListJson = '[]'; // Default to empty JSON array

        try {
            // Execute STScript to get comma-separated group members
            const returnCommand = '/return {{group}}';
            const result = await context.executeSlashCommandsWithOptions(returnCommand, { showOutput: false });
            const memberString = result?.pipe?.trim();

            if (memberString) {
                // Split by comma, trim whitespace, and filter out empty strings
                const characterNames = memberString.split(',').map(name => name.trim()).filter(name => name);
                if (characterNames.length > 0) {
                    // Convert the array to a JSON string for the /buttons command
                    characterListJson = JSON.stringify(characterNames);
                    console.log(`[${extensionName}][Response] Generated character list for buttons:`, characterListJson);
                } else {
                    console.warn(`[${extensionName}][Response] Processed member string resulted in empty list.`);
                }
            } else {
                console.warn(`[${extensionName}][Response] /return {{group}} script returned empty or invalid result.`);
            }
        } catch (error) {
            console.error(`[${extensionName}][Response] Error executing /return {{group}} script or processing result:`, error);
        }

        if (characterListJson !== '[]') {
            // Pass the generated JSON string to the labels parameter
            stscriptCommand = 
                `// Group chat logic (JS handled selection list via /return)|
/buttons labels=${characterListJson} "Select member to respond as" |
/setglobalvar key=selection {{pipe}} |
/inject id=instruct position=chat ephemeral=true depth=0 role=${injectionRole} ${filledPrompt} |
/trigger await=true {{getglobalvar::selection}}|
`;
        } else {
            console.warn(`[${extensionName}][Response] Could not get character list for group chat selection. Falling back to single character logic.`);
            // Fallback to single character logic if character list is empty or invalid
            stscriptCommand = 
                `// Single character logic (fallback from group)|
/inject id=instruct position=chat ephemeral=true depth=0 role=${injectionRole} ${filledPrompt}|
/trigger await=true|
`;
        }
    } else {
        stscriptCommand = 
            `// Single character logic|
/inject id=instruct position=chat ephemeral=true depth=0 role=${injectionRole} ${filledPrompt}|
/trigger await=true|
`;
    }

    // Execute the main stscript command
    if (typeof SillyTavern !== 'undefined' && typeof SillyTavern.getContext === 'function') {
        const context = SillyTavern.getContext();
        try {
            // First check for auto-trigger settings and execute relevant guides
            const settings = extension_settings[extensionName];
            if (settings.autoTriggerThinking) await thinkingGuide(true); // Pass isAuto=true
            if (settings.autoTriggerState) await stateGuide(true); // Pass isAuto=true
            if (settings.autoTriggerClothes) await clothesGuide(true); // Pass isAuto=true
            if (settings.enableAutoCustomAutoGuide) await customAutoGuide(true); // Pass isAuto=true

            // Execute the main command
            await context.executeSlashCommandsWithOptions(stscriptCommand);

            console.log('[GuidedGenerations][Response] Executed Command:', stscriptCommand); // Log the command
            
        } catch (error) {
            console.error(`[GuidedGenerations][Response] Error executing Guided Response stscript: ${error}`);
        } finally {
            // Always restore the input field from the shared state
            const restoredInput = getPreviousImpersonateInput();
            textarea.value = restoredInput;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            if (typeof SillyTavern === 'undefined' || typeof SillyTavern.getContext !== 'function') {
                console.log(`[GuidedGenerations][Response] Restoring input field after context error: "${restoredInput}"`);
            }
        }
    } else {
        console.error('[GuidedGenerations][Response] SillyTavern context is not available.');
        // Even if context isn't available, attempt restore if textarea exists
        if (textarea) {
             const restoredInput = getPreviousImpersonateInput();
             console.log(`[GuidedGenerations][Response] Restoring input field after context error: "${restoredInput}"`);
             textarea.value = restoredInput;
             textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
};

// Export the function
export { guidedResponse };
