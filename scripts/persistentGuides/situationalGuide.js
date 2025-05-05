/**
 * @file Contains the logic for the Situational Guide option in the Persistent Guides menu.
 */
import { isGroupChat, extensionName } from '../../index.js'; // Import from two levels up
import { runGuideScript } from './runGuide.js';
import { getContext, extension_settings } from '../../../../../extensions.js'; 
/**
 * @param {boolean} isAuto - Whether this guide is auto-triggered (true) or manual (false)
 * @returns {Promise<string|null>}
 */
const situationalGuide = async (isAuto = false) => {
    const genCommandSuffix = `/setvar key=inp {{input}} |
[Analyze the chat history and provide a concise summary of:
1. Current location and setting (indoors/outdoors, time of day, weather if relevant)
2. Present characters and their current activities
3. Relevant objects, items, or environmental details that could influence interactions
4. Recent events or topics of conversation (last 10-20 messages)
Keep the overview factual and neutral without speculation. Format in clear paragraphs.] |`;
    const finalCommand = `/inject id=situation position=chat depth=3 [Current Situation: {{pipe}}] |`;
    return await runGuideScript({
        guideId: 'situational',
        genCommandSuffix,
        finalCommand,
        isAuto,
        previousInjectionAction: 'flush',
        raw: extension_settings[extensionName]?.rawPromptSituational ?? false
    });
};

export default situationalGuide;
