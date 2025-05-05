const extensionName = 'GuidedGenerations-Extension';

const editLastMessage = () => {
  console.log(`[${extensionName}] Edit Last Message button clicked`);
  const jQueryRef = typeof $ !== 'undefined' ? $ : jQuery;
  if (!jQueryRef) {
    console.error(`[${extensionName}][EditLast] jQuery not found.`);
    // Optionally alert the user
    // alert('编辑最后消息错误：无法访问 jQuery。');
    return;
  }

  // Selector for the edit button of the *last* message.
  // This usually targets the character's message. User messages might not have this button
  // or have different classes. This selector assumes standard ST structure.
  const editButtonSelector = '#chat .mes:not(.user_mes):last-child .mes_edit';
  const $editButton = jQueryRef(editButtonSelector);

  if ($editButton.length > 0) {
    console.log(`[${extensionName}][EditLast] Found edit button for last message. Simulating click...`);
    // Using .trigger('click') is generally safer for jQuery-bound events
    const messageElement = $editButton.closest('.mes').get(0); // Get the DOM element of the message bubble
    $editButton.first().trigger('click');

    // After triggering the click, scroll the message into view
    if (messageElement && typeof messageElement.scrollIntoView === 'function') {
      // Use setTimeout to allow the UI to update slightly before scrolling
      setTimeout(() => {
        messageElement.scrollIntoView({
          behavior: 'smooth', // Smooth scroll
          block: 'center', // Try to center the element vertically
        });
        console.log(`[${extensionName}][EditLast] Scrolled the edited message into view.`);
      }, 100); // Small delay (100ms)
    } else {
      console.warn(`[${extensionName}][EditLast] Could not get message element for scrolling.`);
    }
  } else {
    console.warn(
      `[${extensionName}][EditLast] Could not find the edit button for the last message (Selector: ${editButtonSelector}). It might be a user message, the message doesn't allow editing, or no messages exist.`,
    );
    // It might be better not to alert the user for this, just log it.
    // alert('无法编辑最后一条消息。它可能不存在、是您发送的消息或不可编辑。');
  }
};

export { editLastMessage };
