// This script runs as early as possible to catch navigation events
if (typeof window !== 'undefined') {
  // Create a custom event to coordinate with the React component
  window.loadingEvents = {
    start: () => document.dispatchEvent(new CustomEvent('navigationStart')),
    end: () => document.dispatchEvent(new CustomEvent('navigationEnd'))
  };

  // Intercept all link clicks
  document.addEventListener('click', (event) => {
    const target = event.target;
    const anchor = target.closest('a');
    
    if (anchor) {
      const href = anchor.getAttribute('href');
      // Only handle internal links
      if (href && href.startsWith('/') && !href.startsWith('http')) {
        window.loadingEvents.start();
      }
    }
  }, true);

  // Listen for route changes
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function() {
    originalPushState.apply(this, arguments);
    window.loadingEvents.start();
  };

  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    window.loadingEvents.start();
  };

  window.addEventListener('popstate', () => {
    window.loadingEvents.start();
  });
}
