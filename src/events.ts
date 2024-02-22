const EVENT_KEY = "RenderFinished";

export const triggerRenderFinished = () => {
  const evt = new CustomEvent(EVENT_KEY);

  // set timeout ensures that the event is added to the queue instead
  // of handled in the same thread. Handling in the same thread causes
  // React to throw a "Maximum update depth exceeded" exception.
  setTimeout(() =>
    window.dispatchEvent(evt)
  , 0);
}

export const onRenderFinished = (callback) => {
  // make sure the event listener hasn't been attached more than once
  window.removeEventListener(EVENT_KEY, callback);

  window.addEventListener(EVENT_KEY, callback);
}
