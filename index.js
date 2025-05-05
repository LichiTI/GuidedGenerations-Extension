import { saveSettingsDebounced } from '../../../../script.js'; // For event handling (will use later)
// Removed the incorrect SillyTavern import

// Import button logic from separate modules
import { guidedContinue } from './scripts/guidedContinue.js';
import { guidedImpersonate } from './scripts/guidedImpersonate.js';
import { guidedImpersonate2nd } from './scripts/guidedImpersonate2nd.js'; // Import 2nd
import { guidedImpersonate3rd } from './scripts/guidedImpersonate3rd.js'; // Import 3rd
import { guidedResponse } from './scripts/guidedResponse.js';
import { guidedSwipe } from './scripts/guidedSwipe.js';
import { recoverInput } from './scripts/inputRecovery.js';
import { simpleSend } from './scripts/simpleSend.js';
// Import the new Update Character function
// Import the new Custom Auto Guide
import { editLastMessage } from './scripts/editLastMessage.js'; // Import the new edit function
// Import necessary functions/objects from SillyTavern
import { extension_settings, getContext } from '../../../extensions.js';
// Import Preset Manager
import { getPresetManager } from '../../../../scripts/preset-manager.js';
import { guidedPartialRewrite } from './scripts/guidedPartialRewrite.js'; // NEW: Import partial rewrite
import { loadSettingsPanel } from './scripts/settingsPanel.js';

// --- Shared State for Impersonation Input Recovery ---
let previousImpersonateInput = ''; // Input before the last impersonation
let lastImpersonateResult = ''; // Input after the last impersonation

export function getPreviousImpersonateInput() {
  return previousImpersonateInput;
}
export function setPreviousImpersonateInput(value) {
  previousImpersonateInput = value;
}
export function getLastImpersonateResult() {
  return lastImpersonateResult;
}
export function setLastImpersonateResult(value) {
  lastImpersonateResult = value;
}
// --- End Shared State ---

export const extensionName = 'GuidedGenerations-Extension'; // Use the simple name as the internal identifier
// const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`; // No longer needed

let isSending = false;
// Removed storedInput as recovery now uses stscript global vars

export const defaultSettings = {
  // Button Visibility - Moved to top for clarity
  showGGToolsMenuButton: true, // NEW: Show the main GG Tools menu button (Bookmark icon)
  showPGMenuButton: true, // NEW: Show the Persistent Guides menu button (Book icon)
  showImpersonate1stPerson: true,
  showImpersonate2ndPerson: false,
  showImpersonate3rdPerson: false,
  showGuidedSwipeButton: true, // NEW: Show the Guided Swipe button
  showGuidedResponseButton: true, // NEW: Show the Guided Response button
  showGuidedContinue: false,
  showGuidedPartialRewriteButton: false, // NEW: Show the Guided Partial Rewrite button
  showEditLastMessageButton: false, // NEW: Setting for the Edit Last Message button

  // Auto Triggers
  autoTriggerClothes: false,
  autoTriggerState: false,
  autoTriggerThinking: false,
  enableAutoCustomAutoGuide: false,

  // Injection Settings
  injectionEndRole: 'system',

  // Presets
  presetClothes: 'GGSytemPrompt',
  presetState: 'GGSytemPrompt',
  presetThinking: 'GGSytemPrompt',
  presetSituational: 'GGSytemPrompt',
  presetRules: 'GGSytemPrompt',
  presetCustom: 'GGSytemPrompt',
  presetCorrections: 'GGSytemPrompt',
  presetSpellchecker: 'GGSytemPrompt',
  presetEditIntros: 'GGSytemPrompt',
  presetImpersonate1st: '',
  presetImpersonate2nd: '',
  presetImpersonate3rd: '',
  presetGuidedContinue: '', // NEW: Preset for Guided Continue (if needed, add default like 'GGSytemPrompt')
  presetGuidedSwipe: 'GGSytemPrompt', // Add preset setting for Guided Swipe
  presetGuidedPartialRewrite: 'GGSytemPrompt', // NEW: Preset for Partial Rewrite
  customAutoGuidePreset: '', // Default preset for Custom Auto Guide
  customAutoGuidePresetName: '', // Default preset name for Custom Auto Guide
  usePresetCustomAuto: false, // Default use preset toggle for Custom Auto Guide
  // Guide prompt overrides
  promptClothes:
    "[OOC: Answer me out of Character! Considering where we are currently in the story, write me a list entailing the clothes and look, what they are currently wearing of all participating characters, including {{user}}, that are present in the current scene. Don't mention people or clothing pieces no longer relevant to the ongoing scene.] ",
  promptState:
    "[OOC: Answer me out of Character! Considering the last response, write me a list entailing what state and position of all participating characters, including {{user}}, that are present in the current scene. Don't describe their clothes or how they are dressed. Don't mention people no longer relevant to the ongoing scene.] ",
  promptThinking:
    "[OOC: Answer me out of Character! Write what each characters in the current scene are currently thinking, pure thought only. Do NOT continue the story or include narration or dialogue. Do not include the{{user}}'s thoughts.] ",
  promptSituational:
    '[Analyze the chat history and provide a concise summary of current location, present characters, relevant objects, and recent events. Keep factual and neutral. Format in clear paragraphs.] ',
  promptRules:
    '[Create a list of explicit rules that {{char}} has learned and follows from the story and their character description. Only include rules explicitly established in chat history or character info. Format as a numbered list.] ',
  promptCorrections:
    "Without any intro or outro correct the grammar, punctuation, and improve the paragraph's flow of: {{input}}",
  promptSpellchecker:
    "Without any intro or outro correct the grammar, punctuation, and improve the paragraph's flow of: {{input}}",
  promptImpersonate1st: 'Write in first Person perspective from {{user}}. {{input}}',
  promptImpersonate2nd: 'Write in second Person perspective from {{user}}, using you/yours for {{user}}. {{input}}',
  promptImpersonate3rd:
    'Write in third Person perspective from {{user}} using third-person pronouns for {{user}}. {{input}}',
  promptGuidedResponse: '[Take the following into special consideration for your next message: {{input}}]',
  promptGuidedSwipe: '[Modify the {{lastCharMessage}} based on the following input: {{input}}]', // MODIFIED Default prompt for Guided Swipe
  promptGuidedContinue: '[Continue the story based on the following input: {{input}}]', // Default prompt override for Guided Continue
  promptGuidedPartialRewrite: '[Rewrite the story based on the following input: {{input}}]', // NEW: Default prompt for Partial Rewrite
  customAutoGuidePrompt: '', // Default empty prompt for Custom Auto Guide
  // Raw flags for prompt overrides
  rawPromptClothes: false,
  rawPromptState: false,
  rawPromptThinking: false,
  rawPromptSituational: false,
  rawPromptRules: false,
  rawPromptCorrections: false,
  rawPromptSpellchecker: false,
  rawPromptGuidedContinue: false, // NEW: Raw flag for Guided Continue
  rawPromptGuidedSwipe: false, // Add raw flag setting for Guided Swipe
  rawPromptGuidedPartialRewrite: false, // NEW: Raw flag for Partial Rewrite
  rawPromptCustomAuto: false, // Default raw prompt setting for Custom Auto Guide
};

/**
 * Checks if the current chat context is a group chat.
 * @returns {boolean} True if it is a group chat, false otherwise.
 */
export function isGroupChat() {
  try {
    const context = getContext(); // Use imported getContext
    return !!context.groupId; // groupId will be a string ID if group, otherwise null/undefined
  } catch (error) {
    console.error(`${extensionName}: Error checking group chat status:`, error);
    return false; // Assume not a group chat on error
  }
}

async function loadSettings() {
  extension_settings[extensionName] = extension_settings[extensionName] || {};

  // Check if settings are empty and initialize with defaults
  // This simplified approach assumes defaults are complete.
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    console.log(`${extensionName}: Initializing settings with defaults.`);
    Object.assign(extension_settings[extensionName], defaultSettings);
  } else {
    console.log(`${extensionName}: Settings already loaded, ensuring all keys exist.`);
    // Ensure all default keys exist (migration / update handling)
    for (const key in defaultSettings) {
      if (extension_settings[extensionName][key] === undefined) {
        console.warn(`${extensionName}: Setting key "${key}" missing, adding default value: ${defaultSettings[key]}`);
        extension_settings[extensionName][key] = defaultSettings[key];
      }
    }
  }

  console.log(`${extensionName}: Current settings:`, extension_settings[extensionName]);

  // No need to update UI here, updateSettingsUI will be called separately after template render
}

function updateSettingsUI() {
  const settingsPanelId = `extension_settings_${extensionName}`;
  const container = document.getElementById(settingsPanelId);
  if (container) {
    console.log(`${extensionName}: Updating UI elements from settings.`);
    Object.keys(defaultSettings).forEach(key => {
      const checkbox = container.querySelector(`input[name="${key}"]`);
      if (checkbox) {
        // Check if the setting exists before trying to access it
        if (extension_settings[extensionName] && extension_settings[extensionName].hasOwnProperty(key)) {
          checkbox.checked = extension_settings[extensionName][key];
        } else {
          console.warn(
            `${extensionName}: Setting key "${key}" not found in loaded settings during UI update. Using default: ${defaultSettings[key]}`,
          );
          checkbox.checked = defaultSettings[key]; // Use default if missing
        }
      } else {
        // Allow this warning during initial load before template might be ready
        // console.warn(`${extensionName}: Could not find checkbox for setting "${key}" during updateSettingsUI.`);
      }
    });

    // Update checkboxes
    document.querySelectorAll('.gg-setting-input[type="checkbox"]').forEach(checkbox => {
      const settingName = checkbox.name;
      if (settingName in extension_settings[extensionName]) {
        checkbox.checked = extension_settings[extensionName][settingName];
      }
    });

    // Update the new dropdown
    const injectionRoleSelect = document.getElementById('gg_injectionEndRole');
    if (injectionRoleSelect && extension_settings[extensionName].injectionEndRole) {
      injectionRoleSelect.value = extension_settings[extensionName].injectionEndRole;
    }

    // Populate preset text fields
    [
      'presetClothes',
      'presetState',
      'presetThinking',
      'presetSituational',
      'presetRules',
      'presetCustom',
      'presetCorrections',
      'presetSpellchecker',
      'presetEditIntros',
      'presetImpersonate1st',
      'presetImpersonate2nd',
      'presetImpersonate3rd',
      'presetGuidedContinue',
      'presetGuidedSwipe',
      'presetGuidedPartialRewrite',
      'customAutoGuidePreset',
      'customAutoGuidePresetName',
    ].forEach(key => {
      const input = document.getElementById(`gg_${key}`);
      if (input) {
        input.value = extension_settings[extensionName][key] ?? defaultSettings[key] ?? '';
      }
    });

    // Populate guide prompt override textareas
    [
      'promptClothes',
      'promptState',
      'promptThinking',
      'promptSituational',
      'promptRules',
      'promptCorrections',
      'promptSpellchecker',
      'promptImpersonate1st',
      'promptImpersonate2nd',
      'promptImpersonate3rd',
      'promptGuidedResponse',
      'promptGuidedSwipe',
      'promptGuidedContinue',
      'promptGuidedPartialRewrite',
      'customAutoGuidePrompt',
    ].forEach(key => {
      const textarea = document.getElementById(`gg_${key}`);
      if (textarea) {
        textarea.value = extension_settings[extensionName][key] ?? defaultSettings[key] ?? '';
      }
    });

    console.log(`${extensionName}: Settings UI updated.`);
  } else {
    console.warn(`${extensionName}: Settings container #${settingsPanelId} not found during updateSettingsUI.`);
  }
}

/**
 * Adds event listeners to the settings panel elements after they are loaded.
 * Uses event delegation on the container.
 */
const addSettingsEventListeners = () => {
  // Get the specific container for this extension's settings
  const containerId = `extension_settings_${extensionName}`;
  const settingsContainer = document.getElementById(containerId);

  if (settingsContainer) {
    console.log(`[${extensionName}] Adding delegated event listener to #${containerId}`);
    // Remove any potentially existing listener first to avoid duplicates on reload
    settingsContainer.removeEventListener('change', handleSettingsChangeDelegated);
    // Add the delegated listener
    settingsContainer.addEventListener('change', handleSettingsChangeDelegated);
  } else {
    console.error(`[${extensionName}] Could not find settings container #${containerId} to attach listeners.`);
  }
};

/**
 * Delegated event handler for settings changes within the container.
 * @param {Event} event The event object
 */
const handleSettingsChangeDelegated = event => {
  // Check if the changed element has the correct class
  if (event.target.classList.contains('gg-setting-input')) {
    console.log(`[${extensionName}] Delegated change event detected on:`, event.target);
    handleSettingChange(event); // Call the original handler

    // Special handling for button visibility settings after change
    if (event.target.name === 'showImpersonateButton') {
      updateImpersonateButtonVisibility();
    }
    if (event.target.name === 'showPersistentGuidesMenu') {
      const menu = document.getElementById('persistent_guides_menu');
      if (menu) menu.style.display = event.target.checked ? '' : 'none';
    }
    if (event.target.name === 'showSwipeButton') {
      const button = document.getElementById('guided_swipe_button');
      if (button) button.style.display = event.target.checked ? '' : 'none';
    }
    if (event.target.name === 'showResponseButton') {
      const button = document.getElementById('guided_response_button');
      if (button) button.style.display = event.target.checked ? '' : 'none';
    }
    if (event.target.name === 'showGuidedContinue') {
      const button = document.getElementById('gg_continue_button');
      if (button) button.style.display = event.target.checked ? '' : 'none';
    }
  }
};

// Separate handler function for clarity
function handleSettingChange(event) {
  const target = event.target;
  const settingName = target.name;
  let settingValue;

  if (target.type === 'checkbox') {
    settingValue = target.checked;
  } else if (target.tagName === 'SELECT') {
    // Handle dropdowns
    settingValue = target.value;
  } else if (target.tagName === 'INPUT' && target.type === 'text') {
    settingValue = target.value;
  } else if (target.tagName === 'TEXTAREA') {
    settingValue = target.value;
  } else {
    console.warn(`${extensionName}: Unhandled setting type: ${target.type}`);
    return; // Don't save if it's not a recognized type
  }

  console.log(`[${extensionName}] Setting Changed: ${settingName} = ${settingValue} (Type: ${typeof settingValue})`);

  if (extension_settings[extensionName]) {
    extension_settings[extensionName][settingName] = settingValue;
    console.log(`[${extensionName}] > Updated setting: Key='${settingName}', New Value='${settingValue}'`);
    console.log(
      `[${extensionName}] > Current extension_settings[${extensionName}]:`,
      JSON.stringify(extension_settings[extensionName]),
    );
    saveSettingsDebounced(); // Save after updating the specific key

    // *** ADDED: Refresh buttons after setting change ***
    updateExtensionButtons();
  } else {
    console.error(`[${extensionName}] Error: extension_settings[${extensionName}] is undefined.`);
  }
}

// Function to create and add buttons based on settings
function updateExtensionButtons() {
  const settings = extension_settings[extensionName];
  if (!settings) {
    console.error(`${extensionName}: Settings not loaded, cannot update buttons.`);
    return;
  }
  console.log(`${extensionName}: Updating extension buttons based on settings...`, settings);

  // --- Right Side: Action Buttons (Now in Container Below Input) ---
  const sendForm = document.getElementById('send_form');
  const nonQRFormItems = document.getElementById('nonQRFormItems');

  if (!sendForm || !nonQRFormItems) {
    console.error(`${extensionName}: Could not find #send_form or #nonQRFormItems. Cannot add button container.`);
    return;
  }

  // --- Get or Create the Action Button Container ---
  let buttonContainer = document.getElementById('gg-action-button-container');
  if (!buttonContainer) {
    buttonContainer = document.createElement('div');
    buttonContainer.id = 'gg-action-button-container';
    buttonContainer.className = 'gg-action-buttons-container'; // Add class for styling
    // Insert the container AFTER nonQRFormItems within send_form
    nonQRFormItems.parentNode.insertBefore(buttonContainer, nonQRFormItems.nextSibling);
    console.log(`${extensionName}: Created action button container below input area.`);
  }

  // Clear the container before adding/arranging buttons
  buttonContainer.innerHTML = '';

  // Create a separate container for menu buttons (left side)
  const menuButtonsContainer = document.createElement('div');
  menuButtonsContainer.id = 'gg-menu-buttons-container';
  menuButtonsContainer.className = 'gg-menu-buttons-container';

  // Create a separate container for action buttons (right side)
  const actionButtonsContainer = document.createElement('div');
  actionButtonsContainer.id = 'gg-regular-buttons-container';
  actionButtonsContainer.className = 'gg-regular-buttons-container';

  // Add both containers to the main button container
  buttonContainer.appendChild(menuButtonsContainer);
  buttonContainer.appendChild(actionButtonsContainer);

  // --- Create GG Tools Menu Button (Wand) ---
  let ggMenuButton = document.getElementById('gg_menu_button');
  if (settings.showGGToolsMenuButton) {
    if (!ggMenuButton) {
      // Create it for the first time
      ggMenuButton = document.createElement('div');
      ggMenuButton.id = 'gg_menu_button';
      ggMenuButton.className = 'gg-menu-button fa-solid fa-bookmark'; // Base classes
      ggMenuButton.classList.add('interactable'); // Make sure it has interactable styles
      ggMenuButton.title = '指导生成工具'; // Guided Generations Tools -> Instructed Generations Tools

      const ggToolsMenu = document.createElement('div');
      ggToolsMenu.id = 'gg_tools_menu';
      ggToolsMenu.className = 'gg-tools-menu'; // Dropdown menu styling

      // Add menu items (Simple Send, Recover Input)
      const simpleSendMenuItem = document.createElement('a');
      simpleSendMenuItem.href = '#';
      simpleSendMenuItem.className = 'interactable'; // Use interactable class
      simpleSendMenuItem.innerHTML =
        '<i class="fa-solid fa-paper-plane fa-fw"></i><span data-i18n="Simple Send">简单发送</span>'; // Add icon + span
      simpleSendMenuItem.addEventListener('click', event => {
        console.log(`${extensionName}: Simple Send action clicked.`);
        simpleSend();
        ggToolsMenu.classList.remove('shown');
        event.stopPropagation();
      });

      const recoverInputMenuItem = document.createElement('a');
      recoverInputMenuItem.href = '#';
      recoverInputMenuItem.className = 'interactable'; // Use interactable class
      recoverInputMenuItem.innerHTML =
        '<i class="fa-solid fa-arrow-rotate-left fa-fw"></i><span data-i18n="Recover Input">恢复输入</span>'; // Add icon + span
      recoverInputMenuItem.addEventListener('click', event => {
        console.log(`${extensionName}: Recover Input action clicked.`);
        recoverInput();
        ggToolsMenu.classList.remove('shown');
        event.stopPropagation();
      });

      // Add new menu items from the JSON file
      // 1. Edit Intros
      const editIntrosMenuItem = document.createElement('a');
      editIntrosMenuItem.href = '#';
      editIntrosMenuItem.className = 'interactable';
      editIntrosMenuItem.innerHTML =
        '<i class="fa-solid fa-user-edit fa-fw"></i><span data-i18n="Edit Intros">编辑介绍</span>';
      editIntrosMenuItem.addEventListener('click', async event => {
        console.log(`${extensionName}: Edit Intros action clicked.`);
        const { default: editIntros } = await import('./scripts/tools/editIntros.js');
        await editIntros();
        ggToolsMenu.classList.remove('shown');
        event.stopPropagation();
      });

      // 2. Corrections
      const correctionsMenuItem = document.createElement('a');
      correctionsMenuItem.href = '#';
      correctionsMenuItem.className = 'interactable';
      correctionsMenuItem.innerHTML =
        '<i class="fa-solid fa-file-alt fa-fw"></i><span data-i18n="Corrections">修正内容</span>';
      correctionsMenuItem.addEventListener('click', async event => {
        console.log(`${extensionName}: Corrections action clicked.`);
        const { default: corrections } = await import('./scripts/tools/corrections.js');
        await corrections();
        ggToolsMenu.classList.remove('shown');
        event.stopPropagation();
      });

      // 3. Spellchecker
      const spellcheckerMenuItem = document.createElement('a');
      spellcheckerMenuItem.href = '#';
      spellcheckerMenuItem.className = 'interactable';
      spellcheckerMenuItem.innerHTML =
        '<i class="fa-solid fa-spell-check fa-fw"></i><span data-i18n="Spellchecker">拼写检查</span>';
      spellcheckerMenuItem.addEventListener('click', async event => {
        console.log(`${extensionName}: Spellchecker action clicked.`);
        const { default: spellchecker } = await import('./scripts/tools/spellchecker.js');
        await spellchecker();
        ggToolsMenu.classList.remove('shown');
        event.stopPropagation();
      });

      // 4. Clear Input
      const clearInputMenuItem = document.createElement('a');
      clearInputMenuItem.href = '#';
      clearInputMenuItem.className = 'interactable';
      clearInputMenuItem.innerHTML =
        '<i class="fa-solid fa-trash fa-fw"></i><span data-i18n="Clear Input">清除输入</span>';
      clearInputMenuItem.addEventListener('click', async event => {
        console.log(`${extensionName}: Clear Input action clicked.`);
        const { default: clearInput } = await import('./scripts/tools/clearInput.js');
        await clearInput();
        ggToolsMenu.classList.remove('shown');
        event.stopPropagation();
      });

      // Add original items first
      ggToolsMenu.appendChild(simpleSendMenuItem);
      ggToolsMenu.appendChild(recoverInputMenuItem);

      // Add a separator
      const separator = document.createElement('hr');
      separator.className = 'pg-separator';
      ggToolsMenu.appendChild(separator);

      // Add new items after the separator
      ggToolsMenu.appendChild(editIntrosMenuItem);
      ggToolsMenu.appendChild(correctionsMenuItem);
      ggToolsMenu.appendChild(spellcheckerMenuItem);
      ggToolsMenu.appendChild(clearInputMenuItem);

      // Add Update Character item
      /*const updateCharacterMenuItem = document.createElement('a');
          updateCharacterMenuItem.href = '#';
          updateCharacterMenuItem.className = 'interactable';
          updateCharacterMenuItem.innerHTML = '<i class="fa-solid fa-user-pen fa-fw"></i><span data-i18n="Update Character">Update Character</span>';
          updateCharacterMenuItem.addEventListener('click', (event) => {
              console.log(`${extensionName}: Update Character action clicked.`);
              updateCharacter();
              ggToolsMenu.classList.remove('shown');
              event.stopPropagation();
          });
          ggToolsMenu.appendChild(updateCharacterMenuItem);*/

      // Append the menu itself to the body, not the button
      document.body.appendChild(ggToolsMenu);

      // Event Handlers for Menu Toggle and Close
      ggMenuButton.addEventListener('click', event => {
        console.log(`${extensionName}: ggMenuButton clicked.`);

        // --- Measure Height Correctly ---
        // Temporarily show the menu off-screen to measure its height
        ggToolsMenu.style.visibility = 'hidden';
        ggToolsMenu.style.display = 'block'; // Or the display type it uses when shown
        const menuHeight = ggToolsMenu.offsetHeight;
        ggToolsMenu.style.display = ''; // Reset display before final positioning
        ggToolsMenu.style.visibility = ''; // Reset visibility
        // ---------------------------------

        // Calculate position before showing
        const buttonRect = ggMenuButton.getBoundingClientRect();
        const gap = 5; // Add a 5px gap above the button

        // Calculate Y so the *bottom* of the menu is 'gap' pixels above the button's top
        const targetMenuBottomY = buttonRect.top - gap + window.scrollY;
        const targetMenuTopY = targetMenuBottomY - menuHeight; // This is the final top coordinate
        const targetMenuLeftX = buttonRect.left + window.scrollX;

        // Apply top/left instead of transform
        ggToolsMenu.style.top = `${targetMenuTopY}px`;
        ggToolsMenu.style.left = `${targetMenuLeftX}px`;

        ggToolsMenu.classList.toggle('shown');
        event.stopPropagation();
      });

      document.addEventListener('click', event => {
        if (ggToolsMenu.classList.contains('shown') && !ggMenuButton.contains(event.target)) {
          console.log(`${extensionName}: Click outside detected, hiding menu.`);
          ggToolsMenu.classList.remove('shown');
        }
      });
      console.log(`${extensionName}: Created GG Tools menu button.`);
    }
    // Add menu button to the menu buttons container
    menuButtonsContainer.appendChild(ggMenuButton);
  } else if (ggMenuButton) {
    // Remove button and its menu if setting is off and button exists
    const menu = document.getElementById('gg_tools_menu');
    if (menu) menu.remove();
    ggMenuButton.remove();
    console.log(`${extensionName}: Removed GG Tools menu button.`);
  }

  // --- Create Persistent Guides Menu Button ---
  let pgMenuButton = document.getElementById('pg_menu_button');
  if (settings.showPGMenuButton) {
    if (!pgMenuButton) {
      // Create it for the first time
      pgMenuButton = document.createElement('div');
      pgMenuButton.id = 'pg_menu_button';
      pgMenuButton.className = 'gg-menu-button fa-solid fa-book-open-reader'; // Thinking icon
      pgMenuButton.classList.add('interactable'); // Make sure it has interactable styles
      pgMenuButton.title = '持久化指导'; // Persistent Guides -> Persistent Instructions
      pgMenuButton.style.marginLeft = '5px'; // Add some spacing from the GG Tools button

      const pgToolsMenu = document.createElement('div');
      pgToolsMenu.id = 'pg_tools_menu';
      pgToolsMenu.className = 'gg-tools-menu'; // Use same dropdown menu styling

      // Add menu items for each persistent guide
      const createGuideItem = (name, icon, action) => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'interactable'; // Use interactable class
        item.innerHTML = `<i class="fa-solid ${icon} fa-fw"></i><span data-i18n="${name}">${name}</span>`; // Add icon + span
        // Add specific translations based on name after creating the element
        if (name === 'Situational') item.querySelector('span').textContent = '情景';
        else if (name === 'Thinking') item.querySelector('span').textContent = '思考';
        else if (name === 'Clothes') item.querySelector('span').textContent = '衣物';
        else if (name === 'State') item.querySelector('span').textContent = '状态';
        else if (name === 'Rules') item.querySelector('span').textContent = '规则';
        else if (name === 'Custom') item.querySelector('span').textContent = '自定义';
        else if (name === 'Custom Auto') item.querySelector('span').textContent = '自定义自动';
        else if (name === 'Show Guides')
          item.querySelector('span').textContent = '显示指导'; // Show Guides -> Show Instructions
        else if (name === 'Edit Guides')
          item.querySelector('span').textContent = '编辑指导'; // Edit Guides -> Edit Instructions
        else if (name === 'Flush Guides') item.querySelector('span').textContent = '清除指导'; // Flush Guides -> Flush Instructions

        item.addEventListener('click', event => {
          console.log(`${extensionName}: ${name} Guide clicked.`);
          action();
          pgToolsMenu.classList.remove('shown');
          event.stopPropagation();
        });
        return item;
      };

      // Define the order and details for content guides
      const contentGuides = [
        { name: 'Situational', icon: 'fa-location-dot', path: './scripts/persistentGuides/situationalGuide.js' },
        { name: 'Thinking', icon: 'fa-brain', path: './scripts/persistentGuides/thinkingGuide.js' },
        { name: 'Clothes', icon: 'fa-shirt', path: './scripts/persistentGuides/clothesGuide.js' },
        { name: 'State', icon: 'fa-face-smile', path: './scripts/persistentGuides/stateGuide.js' },
        { name: 'Rules', icon: 'fa-list-ol', path: './scripts/persistentGuides/rulesGuide.js' },
        { name: 'Custom', icon: 'fa-pen-to-square', path: './scripts/persistentGuides/customGuide.js' },
        { name: 'Custom Auto', icon: 'fa-robot', path: './scripts/persistentGuides/customAutoGuide.js' },
      ];

      // Define the order and details for tool guides
      const toolGuides = [
        { name: 'Show Guides', icon: 'fa-eye', path: './scripts/persistentGuides/showGuides.js' },
        { name: 'Edit Guides', icon: 'fa-edit', path: './scripts/persistentGuides/editGuides.js' },
        { name: 'Flush Guides', icon: 'fa-trash', path: './scripts/persistentGuides/flushGuides.js' },
      ];

      // Load the content guides in sequence
      Promise.all(
        contentGuides.map(guide => {
          return import(guide.path)
            .then(module => {
              const guideItem = createGuideItem(guide.name, guide.icon, module.default);
              pgToolsMenu.appendChild(guideItem);
              console.log(`${extensionName}: Added ${guide.name} guide to menu`);
            })
            .catch(error => console.error(`${extensionName}: Error importing ${guide.name} guide:`, error));
        }),
      )
        .then(() => {
          // After all content guides, add the separator
          const separator = document.createElement('hr');
          separator.className = 'pg-separator';
          pgToolsMenu.appendChild(separator);
          console.log(`${extensionName}: Added separator to menu`);

          // Then load the tool guides
          return Promise.all(
            toolGuides.map(guide => {
              return import(guide.path)
                .then(module => {
                  const guideItem = createGuideItem(guide.name, guide.icon, module.default);
                  pgToolsMenu.appendChild(guideItem);
                  console.log(`${extensionName}: Added ${guide.name} tool to menu`);
                })
                .catch(error => console.error(`${extensionName}: Error importing ${guide.name} tool:`, error));
            }),
          );
        })
        .catch(error => console.error(`${extensionName}: Error setting up persistent guides menu:`, error));

      // Append the menu itself to the body
      document.body.appendChild(pgToolsMenu);

      // Event Handlers for Menu Toggle and Close
      pgMenuButton.addEventListener('click', event => {
        console.log(`${extensionName}: pgMenuButton clicked.`);

        // Temporarily show the menu off-screen to measure its height
        pgToolsMenu.style.visibility = 'hidden';
        pgToolsMenu.style.display = 'block';
        const menuHeight = pgToolsMenu.offsetHeight;
        pgToolsMenu.style.display = '';
        pgToolsMenu.style.visibility = '';

        // Calculate position before showing
        const buttonRect = pgMenuButton.getBoundingClientRect();
        const gap = 5; // Add a 5px gap above the button

        // Calculate Y so the *bottom* of the menu is 'gap' pixels above the button's top
        const targetMenuBottomY = buttonRect.top - gap + window.scrollY;
        const targetMenuTopY = targetMenuBottomY - menuHeight; // This is the final top coordinate
        const targetMenuLeftX = buttonRect.left + window.scrollX;

        // Apply top/left instead of transform
        pgToolsMenu.style.top = `${targetMenuTopY}px`;
        pgToolsMenu.style.left = `${targetMenuLeftX}px`;

        pgToolsMenu.classList.toggle('shown');
        event.stopPropagation();
      });

      document.addEventListener('click', event => {
        if (pgToolsMenu.classList.contains('shown') && !pgMenuButton.contains(event.target)) {
          console.log(`${extensionName}: Click outside detected, hiding persistent guides menu.`);
          pgToolsMenu.classList.remove('shown');
        }
      });
      console.log(`${extensionName}: Created Persistent Guides menu button.`);
    }
    // Add Persistent Guides menu button to the menu buttons container
    menuButtonsContainer.appendChild(pgMenuButton);
  } else if (pgMenuButton) {
    // Remove button and its menu if setting is off and button exists
    const menu = document.getElementById('pg_tools_menu');
    if (menu) menu.remove();
    pgMenuButton.remove();
    console.log(`${extensionName}: Removed Persistent Guides menu button.`);
  }

  // --- Create Action Buttons ---
  // Helper function to create buttons
  const createActionButton = (id, title, iconClass, actionFunc) => {
    const button = document.createElement('div');
    button.id = id;
    button.className = `gg-action-button ${iconClass}`;
    button.title = title;
    button.classList.add('interactable'); // Add interactable class for consistent styling/behavior
    button.addEventListener('click', actionFunc);
    return button;
  };

  // Conditionally create and add buttons
  if (settings.showImpersonate1stPerson) {
    const btn1 = createActionButton(
      'gg_impersonate_button',
      '指导扮演 (第一人称)',
      'fa-solid fa-user',
      guidedImpersonate,
    ); // Guided Impersonate (1st Person) -> Instructed Impersonate
    actionButtonsContainer.appendChild(btn1); // Add directly to action buttons container
  }
  if (settings.showImpersonate2ndPerson) {
    const btn2 = createActionButton(
      'gg_impersonate_button_2nd',
      '指导扮演 (第二人称)',
      'fa-solid fa-user-group',
      guidedImpersonate2nd,
    ); // Guided Impersonate (2nd Person) -> Instructed Impersonate
    actionButtonsContainer.appendChild(btn2);
  }
  if (settings.showImpersonate3rdPerson) {
    const btn3 = createActionButton(
      'gg_impersonate_button_3rd',
      '指导扮演 (第三人称)',
      'fa-solid fa-users',
      guidedImpersonate3rd,
    ); // Guided Impersonate (3rd Person) -> Instructed Impersonate
    actionButtonsContainer.appendChild(btn3);
  }

  // Guided Swipe Button (Restore correct icon)
  if (settings.showGuidedSwipeButton) {
    const guidedSwipeButton = createActionButton(
      'gg_swipe_button',
      '指导重写最后消息',
      'fa-solid fa-forward',
      guidedSwipe,
    ); // Rename: 指导完全重写 -> 指导重写最后消息
    actionButtonsContainer.appendChild(guidedSwipeButton);
  }

  // Guided Response Button (Restore correct icon)
  if (settings.showGuidedResponseButton) {
    const guidedResponseButton = createActionButton(
      'gg_response_button',
      '指导下次响应',
      'fa-solid fa-dog',
      guidedResponse,
    ); // Rename: 指导响应 -> 指导下次响应...
    actionButtonsContainer.appendChild(guidedResponseButton);
  }

  if (settings.showGuidedContinue) {
    const guidedContinueButton = createActionButton(
      'gg_continue_button',
      '指导当前消息续写',
      'fa-solid fa-arrow-right',
      guidedContinue,
    ); // Rename: 指导继续 -> 指导当前消息续写
    actionButtonsContainer.appendChild(guidedContinueButton);
  }

  // NEW: Guided Partial Rewrite Button
  if (settings.showGuidedPartialRewriteButton) {
    const guidedPartialRewriteButton = createActionButton(
      'gg_partial_rewrite_button',
      '指导部分重写',
      'fa-solid fa-sync-alt',
      guidedPartialRewrite,
    ); // Change Icon: ✒️ -> 🔄
    actionButtonsContainer.appendChild(guidedPartialRewriteButton);
  }

  // NEW: Edit Last Message Button
  if (settings.showEditLastMessageButton) {
    const editLastMessageButton = createActionButton(
      'gg_edit_last_message_button', // New unique ID
      '编辑最后消息', // Tooltip text
      'fa-solid fa-pencil-alt', // FontAwesome icon class (fa-pencil-alt is common)
      editLastMessage, // Function to call on click
    );
    actionButtonsContainer.appendChild(editLastMessageButton);
  }
}

// Initial setup function
function setup() {
  // No need to call loadSettings here, loadSettingsPanel handles it

  // Add Guide Buttons
  updateExtensionButtons(); // Initial button creation/update
}

// --- Preset Installation ---
// Installs the text completion preset defined within GGSytemPrompt.json if it doesn't exist.
// This file should be a full preset object exported from SillyTavern.
async function installPreset() {
  const presetFileName = 'GGSytemPrompt.json';
  // Derive the preset name from the filename (matching manual import behavior)
  const presetName = presetFileName.replace(/\.json$/i, ''); // Remove .json extension case-insensitively
  // Preset type for Chat Completion parameters (OpenAI/ChatGPT style models)
  const presetApiId = 'openai';
  // Construct the path relative to the SillyTavern root
  const presetPath = `scripts/extensions/third-party/${extensionName}/${presetFileName}`;
  console.log(`${extensionName}: Attempting to install ${presetApiId} preset "${presetName}" from ${presetPath}`);

  try {
    const response = await fetch(presetPath);

    if (!response.ok) {
      console.error(`${extensionName}: Failed to fetch ${presetFileName}. Status: ${response.status}`);
      if (response.status === 404) {
        console.error(
          `${extensionName}: Make sure '${presetFileName}' exists in the '${extensionName}' extension folder.`,
        );
      }
      return;
    }

    // Read the full preset data from the JSON file
    const presetData = await response.json();

    // Validate internal structure: Must have a prompts array with at least one entry containing name and content.
    // Keep this validation even for chat completion presets to ensure the file has the right structure
    if (
      !presetData ||
      typeof presetData !== 'object' ||
      !Array.isArray(presetData.prompts) ||
      presetData.prompts.length === 0 ||
      !presetData.prompts[0].name ||
      typeof presetData.prompts[0].content !== 'string'
    ) {
      console.error(
        `${extensionName}: Invalid internal structure in ${presetFileName}. It must be an object containing a 'prompts' array, where the first element has 'name' and 'content' properties. Received structure:`,
        presetData,
      );
      return;
    }

    // Use the filename-derived name for checking and saving.
    console.log(`${extensionName}: Validated internal structure of ${presetFileName} for preset "${presetName}"`);

    const presetManager = getPresetManager(presetApiId);

    if (!presetManager) {
      console.error(`${extensionName}: Could not get Preset Manager for apiId '${presetApiId}'.`);
      return;
    }

    // Store the currently selected preset name/value before we install ours
    let currentPresetName = null;
    try {
      // Get the currently selected option
      const $select = $(presetManager.select);
      const currentValue = $select.val();

      if (presetManager.isKeyedApi()) {
        // For keyed APIs (like 'openai'), the value is the name
        currentPresetName = currentValue;
      } else {
        // For indexed APIs, we need to get the text of the selected option
        currentPresetName = $select.find('option:selected').text();
      }

      console.log(`${extensionName}: Current ${presetApiId} preset: "${currentPresetName}"`);
    } catch (err) {
      console.warn(`${extensionName}: Could not determine current preset: ${err}`);
    }

    // Check if preset already exists using the filename-derived name
    const existingPreset = presetManager.findPreset(presetName);

    if (existingPreset !== undefined && existingPreset !== null) {
      console.log(`${extensionName}: Preset "${presetName}" (${presetApiId}) already exists. Skipping installation.`);
    } else {
      console.log(`${extensionName}: Preset "${presetName}" (${presetApiId}) not found. Attempting to save...`);
      // Save the entire original presetData object, using the filename-derived name.
      // This matches how performMasterImport handles chat completion presets.
      await presetManager.savePreset(presetName, presetData);
      console.log(
        `${extensionName}: Preset "${presetName}" (${presetApiId}) successfully saved (using full data structure and filename).`,
      );

      // If we had a previously selected preset, switch back to it
      if (currentPresetName && currentPresetName !== presetName) {
        try {
          // This uses jQuery to select the option and trigger the change event
          // This is the same way PresetManager does it internally
          setTimeout(() => {
            const $select = $(presetManager.select);
            if (presetManager.isKeyedApi()) {
              $select.val(currentPresetName).trigger('change');
            } else {
              // For indexed APIs, find the option with the matching text
              const $option = $select.find(`option:contains("${currentPresetName}")`);
              if ($option.length > 0) {
                $select.val($option.val()).trigger('change');
              }
            }
            console.log(`${extensionName}: Restored previous ${presetApiId} preset: "${currentPresetName}"`);
          }, 100); // Small delay to ensure the DOM has updated
        } catch (err) {
          console.warn(`${extensionName}: Could not restore previous preset: ${err}`);
        }
      }
    }
  } catch (error) {
    console.error(`${extensionName}: Error during preset installation:`, error);
    if (error instanceof SyntaxError) {
      console.error(`${extensionName}: Check if ${presetFileName} contains valid JSON.`);
    }
  }
}

// Run setup after page load
$(document).ready(function () {
  setup();
  // Settings Panel Setup (runs with delay to allow main UI to render)
  setTimeout(() => {
    console.log(`[${extensionName}] Delay finished, initiating settings panel load...`);
    loadSettingsPanel();
  }, 1000);
  // Attempt to install the preset (can run relatively early)
  installPreset();
});

// Export settings helpers for settingsPanel.js import
export { addSettingsEventListeners, loadSettings, updateSettingsUI };
